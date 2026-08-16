import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { checkLoginAttempts, getClientIP, logSuspiciousActivity } from "@/lib/security";
import { logLogin } from "@/lib/discord-webhook";
import { trackLogin, checkNewDevice } from "@/lib/login-tracker";
import { verifyLoginCode, createLoginCode } from "@/lib/login-code";
import { sendLoginCodeEmail } from "@/lib/email";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Etapa 2 do login: valida o codigo de acesso enviado por email e SO ENTAO
 * emite o token de sessao. Revalida email + senha no servidor para impedir que
 * alguem chame direto este endpoint com apenas o email de outra pessoa.
 *
 * Aceita tambem { resend: true } para reenviar o codigo (respeitando cooldown).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, code, resend } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Sessao de login invalida. Faca login novamente." },
        { status: 400 }
      );
    }

    let ip = "127.0.0.1";
    try {
      ip = await getClientIP();
    } catch {
      // ignore
    }

    // Rate limiting tambem nesta etapa
    try {
      const loginCheck = await checkLoginAttempts(email, ip);
      if (!loginCheck.allowed) {
        return NextResponse.json(
          { error: loginCheck.reason || "Muitas tentativas. Aguarde alguns minutos." },
          { status: 429 }
        );
      }
    } catch {
      // continua
    }

    // Revalida credenciais no servidor (nunca confie so no email)
    const { user, error } = await loginUser(email, password);
    if (error || !user) {
      return NextResponse.json(
        { error: error || "Credenciais invalidas" },
        { status: 401 }
      );
    }

    // Reenvio de codigo
    if (resend) {
      const { code: newCode, cooldown } = await createLoginCode(user.email);
      if (cooldown) {
        return NextResponse.json(
          { error: "Aguarde alguns segundos antes de reenviar o codigo." },
          { status: 429 }
        );
      }
      if (!newCode) {
        return NextResponse.json(
          { error: "Nao foi possivel gerar o codigo. Tente novamente." },
          { status: 500 }
        );
      }
      const sent = await sendLoginCodeEmail(user.email, newCode, user.name || undefined);
      if (!sent) {
        return NextResponse.json(
          { error: "Erro ao reenviar o codigo. Tente novamente." },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, resent: true });
    }

    if (!code) {
      return NextResponse.json(
        { error: "Digite o codigo de acesso." },
        { status: 400 }
      );
    }

    // Validacao do codigo (server-side, uso unico, com limite de tentativas)
    const result = await verifyLoginCode(user.email, code);
    if (!result.valid) {
      try {
        await logSuspiciousActivity(
          user.id,
          "LOGIN_CODE_FAILED",
          `IP: ${ip}, Email: ${email}`,
          ip
        );
      } catch {
        // ignore
      }
      return NextResponse.json(
        { error: result.error || "Codigo invalido ou expirado" },
        { status: 401 }
      );
    }

    // Codigo valido: emite o token de sessao
    const token = await createToken(user);

    // Registrar login bem-sucedido (sem bloquear)
    try {
      await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, new_value, created_at)
        VALUES (${user.id}, 'LOGIN', 'auth', ${JSON.stringify({ email: user.email })}, NOW())
      `;
      trackLogin({ userId: user.id, success: true });
      const isNewDevice = await checkNewDevice(user.id);
      logLogin({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        ip,
        userAgent: request.headers.get("user-agent") || undefined,
        isAdmin: user.role === "admin" || user.role === "ceo",
        isNewDevice,
      });
    } catch (logError) {
      console.error("[v0] Error logging successful login:", logError);
    }

    try {
      await sql`UPDATE profiles SET updated_at = NOW(), last_ip = ${ip} WHERE id = ${user.id}`;
    } catch (updateError) {
      console.error("[v0] Error updating profile:", updateError);
    }

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        kyc_status: user.kyc_status,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[v0] Error in login verify-code:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
