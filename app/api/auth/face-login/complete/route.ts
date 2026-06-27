import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  verifyLoginTicket,
  getChallengeStatus,
  trustDevice,
} from "@/lib/face-auth";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

// Conclui o login apos a verificacao facial ser aprovada. Recebe o ticket
// emitido pelo login (apos senha/2FA) e o id do desafio facial.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ticket, challengeId } = body;

    if (!ticket || !challengeId) {
      return NextResponse.json(
        { error: "Dados de verificacao ausentes" },
        { status: 400 },
      );
    }

    // 1. Valida o ticket de login (curta duracao)
    const userId = await verifyLoginTicket(ticket);
    if (!userId) {
      return NextResponse.json(
        { error: "Sessao de verificacao expirada. Faca login novamente." },
        { status: 401 },
      );
    }

    // 2. Valida o desafio facial: precisa estar aprovado e pertencer ao usuario
    const challenge = await getChallengeStatus(challengeId);
    if (!challenge || challenge.user_id !== userId || challenge.purpose !== "login") {
      return NextResponse.json(
        { error: "Verificacao invalida" },
        { status: 400 },
      );
    }
    if (challenge.status !== "approved") {
      return NextResponse.json(
        { error: "Verificacao facial nao aprovada", status: challenge.status },
        { status: 403 },
      );
    }

    // 3. Carrega o usuario e emite o token de sessao
    const rows = await sql`
      SELECT id, email, name, CASE WHEN is_admin THEN 'admin' ELSE 'user' END as role,
             kyc_status, is_active, is_blocked
      FROM profiles WHERE id = ${userId}
    `;
    const u = rows[0];
    if (!u || !u.is_active || u.is_blocked) {
      return NextResponse.json({ error: "Conta indisponivel" }, { status: 403 });
    }

    const sessionUser = {
      id: u.id as string,
      email: u.email as string,
      name: u.name as string | null,
      role: u.role as string,
      kyc_status: u.kyc_status as string,
    };
    const token = await createToken(sessionUser);

    // 4. Marca o desafio como consumido (uso unico)
    await sql`UPDATE face_challenges SET consumed = true WHERE id = ${challengeId}`;

    const response = NextResponse.json({
      success: true,
      token,
      user: sessionUser,
    });

    // 5. Confia neste dispositivo para nao pedir rosto nos proximos logins
    await trustDevice(userId, response);

    const isProduction =
      process.env.NODE_ENV === "production" &&
      !process.env.VERCEL_URL?.includes("v0.dev");
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: isProduction,
      secure: isProduction,
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[v0] Erro ao concluir login facial:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
