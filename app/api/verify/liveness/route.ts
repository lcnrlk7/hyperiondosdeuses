import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createDiditSession, getAppBaseUrl } from "@/lib/didit";

async function resolveUser(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    user = await verifyToken(authHeader.slice(7));
  }
  if (!user) {
    user = await getCurrentUser();
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
      SELECT liveness_status, liveness_verified_at, liveness_updated_at
      FROM profiles
      WHERE id = ${user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      status: result[0].liveness_status || "not_started",
      verified_at: result[0].liveness_verified_at,
      updated_at: result[0].liveness_updated_at,
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

    // Busca TODOS os dados cadastrais disponiveis para enviar a Didit
    // (pre-preenche e compara com o documento durante a verificacao).
    const profile = await sql`
      SELECT name, email, phone, cpf_cnpj, cpf
      FROM profiles
      WHERE id = ${user.id}
    `;
    const p = profile[0] || {};

    // O documento pode estar em cpf_cnpj (padrao) ou, em cadastros antigos, em cpf.
    const documentNumber = p.cpf_cnpj || p.cpf || null;

    const session = await createDiditSession({
      vendorData: user.id,
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
      WHERE id = ${user.id}
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
