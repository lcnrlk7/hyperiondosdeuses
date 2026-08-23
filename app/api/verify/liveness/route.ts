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

    // O webhook continua sendo o caminho principal. Se ele falhar ou atrasar,
    // reconciliamos a sessão salva diretamente com a decisão oficial da Didit.
    if (status !== "approved" && profile.liveness_session_id) {
      try {
        const decision = await getDiditSessionDecision(profile.liveness_session_id);
        const diditStatus = decision?.status?.trim().toLowerCase();

        if (diditStatus === "approved") {
          const updated = await sql`
            UPDATE profiles
            SET liveness_status = 'approved',
                liveness_verified_at = COALESCE(liveness_verified_at, NOW()),
                liveness_updated_at = NOW(),
                kyc_status = 'approved'
            WHERE id = ${profile.id}
            RETURNING liveness_verified_at
          `;
          status = "approved";
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

    if (!process.env.DIDIT_API_KEY) {
      return NextResponse.json(
        { error: "Integração de verificação não configurada" },
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
             principal.cpf_cnpj, principal.cpf, principal.liveness_status
      FROM profiles selected
      JOIN profiles principal
        ON principal.id = COALESCE(selected.parent_profile_id, selected.id)
      WHERE selected.id = ${user.id}
    `;
    const p = profile[0] || {};

    if (p.liveness_status === "approved") {
      return NextResponse.json({ status: "approved", already_verified: true });
    }

    // O documento pode estar em cpf_cnpj (padrao) ou, em cadastros antigos, em cpf.
    const documentNumber = p.cpf_cnpj || p.cpf || null;

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
    return NextResponse.json(
      { error: "Não foi possível iniciar a verificação" },
      { status: 502 },
    );
  }
}
