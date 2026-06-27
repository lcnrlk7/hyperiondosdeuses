import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createFaceChallenge,
  getChallengeStatus,
  setDeviceCookie,
  type FacePurpose,
} from "@/lib/face-auth";

// POST: cria um desafio facial para o usuario logado (ex.: saque).
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const purpose: FacePurpose =
      body?.purpose === "withdrawal" ? "withdrawal" : "withdrawal";

    const { challengeId, url, deviceId } = await createFaceChallenge({
      userId: user.id,
      purpose,
    });

    const response = NextResponse.json({ challengeId, url });
    setDeviceCookie(response, deviceId);
    return response;
  } catch (error) {
    console.error("[v0] Erro ao criar desafio facial:", error);
    return NextResponse.json(
      { error: "Nao foi possivel iniciar a verificacao facial." },
      { status: 500 },
    );
  }
}

// GET: consulta o status de um desafio (apenas status; challengeId e um UUID
// aleatorio). Usado tanto no login (sem sessao) quanto em acoes autenticadas.
export async function GET(request: NextRequest) {
  const challengeId = request.nextUrl.searchParams.get("challengeId");
  if (!challengeId) {
    return NextResponse.json({ error: "challengeId ausente" }, { status: 400 });
  }

  const challenge = await getChallengeStatus(challengeId);
  if (!challenge) {
    return NextResponse.json({ error: "Desafio nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    status: challenge.status,
    purpose: challenge.purpose,
  });
}
