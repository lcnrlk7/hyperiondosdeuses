import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  createDiditSession,
  getAppBaseUrl,
  getDiditSessionDecision,
} from "@/lib/didit";

async function resolveUser(request: NextRequest) {
  // Prefer the browser session because it resolves the currently selected
  // account. Bearer auth remains available for non-browser API clients.
  let user = await getCurrentUser();
  const authHeader = request.headers.get("authorization");
  if (!user && authHeader?.startsWith("Bearer ")) {
    user = await verifyToken(authHeader.slice(7));
  }
  return user;
}

// Retorna o status atual da verificacao de prova de vida do usuario
export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await sql`
      SELECT principal.id,
             principal.liveness_status,
             principal.liveness_verified_at,
             principal.liveness_updated_at,
             principal.liveness_session_id
      FROM profiles selected
      JOIN profiles principal
        ON principal.id = COALESCE(selected.parent_profile_id, selected.id)
      WHERE selected.id = ${user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const profile = result[0];
    let status = profile.liveness_status || "not_started";
    let verifiedAt = profile.liveness_verified_at;
    const callbackSessionId = request.nextUrl.searchParams.get("sessionId");
    const callbackStatus = request.nextUrl.searchParams
      .get("callbackStatus")
      ?.trim()
      .toLowerCase()
      .replaceAll(" ", "_");
    const sessionId = callbackSessionId || profile.liveness_session_id;

    // Um retorno "In Review" apenas mantém a conta bloqueada e pode ser salvo
    // imediatamente. Aprovação nunca é confiada à URL: exige decisão oficial ou webhook.
    if (
      status !== "approved" &&
      callbackSessionId &&
      callbackStatus === "in_review"
    ) {
      await sql`
        UPDATE profiles
        SET liveness_session_id = ${callbackSessionId},
            liveness_status = 'in_review',
            liveness_updated_at = NOW()
        WHERE id = ${profile.id}
      `;
      status = "in_review";
    }

    // O callback da Didit informa a sessão que acabou de ser analisada. Consultar
    // exatamente essa sessão evita depender de um webhook atrasado ou de um ID antigo.
    if (status !== "approved" && sessionId) {
      try {
        const decision = await getDiditSessionDecision(sessionId);
        const diditStatus = decision?.status?.trim().toLowerCase().replaceAll(" ", "_");
        const belongsToUser =
          sessionId === profile.liveness_session_id || decision?.vendor_data === profile.id;

        if (decision && belongsToUser && diditStatus) {
          const allowedStatuses = new Set([
            "not_started",
            "in_progress",
            "in_review",
            "approved",
            "declined",
            "resubmitted",
            "abandoned",
            "expired",
            "kyc_expired",
          ]);
          const normalizedStatus = allowedStatuses.has(diditStatus)
            ? diditStatus
            : status;
          const updated = await sql`
            UPDATE profiles
            SET liveness_session_id = ${sessionId},
                liveness_status = ${normalizedStatus},
                liveness_verified_at = CASE
                  WHEN ${normalizedStatus} = 'approved'
                  THEN COALESCE(liveness_verified_at, NOW())
                  ELSE liveness_verified_at
                END,
                liveness_updated_at = NOW(),
                kyc_status = CASE
                  WHEN ${normalizedStatus} = 'approved' THEN 'approved'
                  ELSE kyc_status
                END
            WHERE id = ${profile.id}
            RETURNING liveness_status, liveness_verified_at
          `;
          status = updated[0]?.liveness_status || normalizedStatus;
          verifiedAt = updated[0]?.liveness_verified_at || verifiedAt;
        }
      } catch (error) {
        console.error("Erro ao reconciliar status com a Didit:", error);
      }
    }

    return NextResponse.json({
      status,
      verified_at: verifiedAt,
      updated_at: profile.liveness_updated_at,
    });
  } catch (error) {
    console.error("Erro ao buscar status de liveness:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Cria uma sessao de verificacao de prova de vida na Didit e retorna a URL
export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!process.env.DIDIT_API_KEY || !process.env.DIDIT_WORKFLOW_ID) {
      return NextResponse.json(
        {
          error: !process.env.DIDIT_API_KEY
            ? "A chave da integração Didit não está configurada."
            : "O workflow da Didit não está configurado.",
          code: !process.env.DIDIT_API_KEY
            ? "DIDIT_API_KEY_MISSING"
            : "DIDIT_WORKFLOW_ID_MISSING",
        },
        { status: 503 },
      );
    }

    // Permite que o chamador defina para onde a Didit deve redirecionar apos a
    // verificacao (ex.: a pagina de KYC). So aceitamos caminhos internos.
    let returnPath = "/dashboard/profile?liveness=done";
    try {
      const body = await request.json();
      if (typeof body?.returnPath === "string" && body.returnPath.startsWith("/")) {
        returnPath = body.returnPath;
      }
    } catch {
      // sem corpo — usa o padrao
    }
    const callback = `${getAppBaseUrl()}${returnPath}`;

    // KYC e identidade pertencem à conta principal e são compartilhados pelas
    // subcontas. Também evita criar outra sessão quando a Didit já foi aprovada.
    const profile = await sql`
      SELECT principal.id, principal.name, principal.email, principal.phone,
             principal.cpf_cnpj, principal.liveness_status
      FROM profiles selected
      JOIN profiles principal
        ON principal.id = COALESCE(selected.parent_profile_id, selected.id)
      WHERE selected.id = ${user.id}
    `;
    const p = profile[0] || {};

    if (p.liveness_status === "approved") {
      return NextResponse.json({ status: "approved", already_verified: true });
    }
    if (["in_review", "in_progress"].includes(p.liveness_status)) {
      return NextResponse.json({
        status: p.liveness_status,
        verification_pending: true,
      });
    }

    const documentNumber = p.cpf_cnpj || null;

    const session = await createDiditSession({
      vendorData: p.id,
      callback,
      user: {
        fullName: p.name,
        email: p.email,
        phone: p.phone,
        documentNumber,
      },
    });

    // Guarda o session_id e marca como em progresso
    await sql`
      UPDATE profiles
      SET
        liveness_session_id = ${session.session_id},
        liveness_status = 'in_progress',
        liveness_updated_at = NOW()
      WHERE id = ${p.id}
    `;

    return NextResponse.json({
      url: session.url,
      session_id: session.session_id,
    });
  } catch (error) {
    console.error("Erro ao criar sessão de liveness:", error);
    const message = error instanceof Error ? error.message : "";
    const permissionDenied =
      message.includes("(403)") || message.includes("permission to perform this action");
    const workflowMissing = message.includes("DIDIT_WORKFLOW_ID nao configurado");

    return NextResponse.json(
      {
        error: workflowMissing
          ? "O workflow da Didit não está configurado."
          : permissionDenied
            ? "A chave da Didit não tem acesso ao workflow configurado. Confirme que DIDIT_API_KEY e DIDIT_WORKFLOW_ID pertencem à mesma organização e ambiente."
            : "Não foi possível iniciar a verificação. Tente novamente.",
        code: workflowMissing
          ? "DIDIT_WORKFLOW_ID_MISSING"
          : permissionDenied
            ? "DIDIT_WORKFLOW_ACCESS_DENIED"
            : "DIDIT_SESSION_ERROR",
      },
      { status: permissionDenied || workflowMissing ? 503 : 502 },
    );
  }
}
