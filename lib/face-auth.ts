import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { sql } from "./db";
import { createDiditSession, getAppBaseUrl } from "./didit";
import { getJwtSecret } from "./jwt-secret";

const DEVICE_COOKIE = "hp_device_id";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 anos
const SECRET = getJwtSecret();

export type FacePurpose = "login" | "withdrawal";

function isProd(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    !process.env.VERCEL_URL?.includes("v0.dev")
  );
}

// Le o identificador persistente do dispositivo (cookie).
export async function readDeviceId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(DEVICE_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

// Define o cookie de dispositivo numa resposta.
export function setDeviceCookie(response: NextResponse, deviceId: string) {
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: "/",
  });
}

// Verifica se o dispositivo atual ja e confiavel para o usuario.
// Fail-open: em caso de erro de infra, NAO bloqueia (retorna true).
export async function isTrustedDevice(userId: string): Promise<boolean> {
  try {
    const id = await readDeviceId();
    if (!id) return false; // sem cookie => dispositivo novo
    const rows = await sql`
      SELECT id FROM trusted_devices
      WHERE user_id = ${userId} AND fingerprint = ${id}
      LIMIT 1
    `;
    if (rows.length > 0) {
      await sql`
        UPDATE trusted_devices SET last_used_at = NOW()
        WHERE user_id = ${userId} AND fingerprint = ${id}
      `;
      return true;
    }
    return false;
  } catch (e) {
    console.error("[face-auth] isTrustedDevice erro (fail-open):", e);
    return true;
  }
}

async function clientContext(): Promise<{ ua: string; ip: string }> {
  try {
    const h = await headers();
    const ua = h.get("user-agent") || "";
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "";
    return { ua, ip };
  } catch {
    return { ua: "", ip: "" };
  }
}

// Marca o dispositivo atual como confiavel (gera cookie se nao existir).
export async function trustDevice(
  userId: string,
  response: NextResponse,
): Promise<void> {
  try {
    let id = await readDeviceId();
    if (!id) {
      id = crypto.randomUUID();
      setDeviceCookie(response, id);
    }
    const { ua, ip } = await clientContext();
    await sql`
      INSERT INTO trusted_devices (user_id, fingerprint, user_agent, ip_address)
      VALUES (${userId}, ${id}, ${ua}, ${ip})
      ON CONFLICT (user_id, fingerprint)
      DO UPDATE SET last_used_at = NOW()
    `;
  } catch (e) {
    console.error("[face-auth] trustDevice erro (nao bloqueia):", e);
  }
}

// Cria um desafio de verificacao facial (step-up) reaproveitando a Didit.
// Retorna a URL hospedada e o id do desafio. Tambem garante um deviceId.
export async function createFaceChallenge(params: {
  userId: string;
  purpose: FacePurpose;
}): Promise<{ challengeId: string; url: string; deviceId: string }> {
  // Garante um identificador de dispositivo para vincular ao desafio.
  let deviceId = await readDeviceId();
  if (!deviceId) deviceId = crypto.randomUUID();

  const ins = await sql`
    INSERT INTO face_challenges (user_id, purpose, device_fingerprint)
    VALUES (${params.userId}, ${params.purpose}, ${deviceId})
    RETURNING id
  `;
  const challengeId = ins[0].id as string;

  // Dados cadastrais para a Didit comparar com o rosto/documento do cadastro.
  const prof = await sql`
    SELECT name, email, phone, cpf_cnpj FROM profiles WHERE id = ${params.userId}
  `;
  const p = prof[0] || {};

  const callback = `${getAppBaseUrl()}/verify-face/return?challenge=${challengeId}`;

  const session = await createDiditSession({
    vendorData: `challenge:${challengeId}`,
    callback,
    user: {
      fullName: p.name,
      email: p.email,
      phone: p.phone,
      documentNumber: p.cpf_cnpj,
    },
  });

  await sql`
    UPDATE face_challenges SET session_id = ${session.session_id}
    WHERE id = ${challengeId}
  `;

  return { challengeId, url: session.url, deviceId };
}

// Retorna o status de um desafio (sem dados sensiveis).
export async function getChallengeStatus(
  challengeId: string,
): Promise<{ status: string; purpose: string; user_id: string } | null> {
  try {
    const rows = await sql`
      SELECT status, purpose, user_id FROM face_challenges WHERE id = ${challengeId}
    `;
    return (rows[0] as { status: string; purpose: string; user_id: string }) || null;
  } catch {
    return null;
  }
}

// Consome um desafio aprovado (uso unico) para uma acao sensivel, ex: saque.
export async function consumeApprovedChallenge(params: {
  userId: string;
  purpose: FacePurpose;
  challengeId?: string;
}): Promise<boolean> {
  try {
    const rows = params.challengeId
      ? await sql`
          SELECT id FROM face_challenges
          WHERE id = ${params.challengeId} AND user_id = ${params.userId}
            AND purpose = ${params.purpose} AND status = 'approved'
            AND consumed = false AND expires_at > NOW()
          LIMIT 1
        `
      : await sql`
          SELECT id FROM face_challenges
          WHERE user_id = ${params.userId} AND purpose = ${params.purpose}
            AND status = 'approved' AND consumed = false
            AND created_at > NOW() - interval '20 minutes'
          ORDER BY created_at DESC
          LIMIT 1
        `;
    if (rows.length === 0) return false;
    await sql`UPDATE face_challenges SET consumed = true WHERE id = ${rows[0].id}`;
    return true;
  } catch (e) {
    console.error("[face-auth] consumeApprovedChallenge erro:", e);
    return false;
  }
}

// Ticket de login de curta duracao: permite concluir o login apos o rosto
// ser aprovado, sem reenviar a senha.
export async function createLoginTicket(userId: string): Promise<string> {
  return new SignJWT({ uid: userId, t: "login_face" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(SECRET);
}

export async function verifyLoginTicket(ticket: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(ticket, SECRET);
    if (payload.t !== "login_face") return null;
    return payload.uid as string;
  } catch {
    return null;
  }
}
