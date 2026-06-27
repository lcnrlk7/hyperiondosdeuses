import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { checkLoginAttempts, getClientIP, logSuspiciousActivity } from "@/lib/security";
import { logLogin } from "@/lib/discord-webhook";
import { detectAttack } from "@/lib/sanitize";
import { logAttack } from "@/lib/attack-logger";
import { trackLogin, checkNewDevice } from "@/lib/login-tracker";
import { is2FAEnabled, getUserSecret, verifyTOTP, verifyBackupCode } from "@/lib/two-factor";
import {
  isTrustedDevice,
  createFaceChallenge,
  createLoginTicket,
  trustDevice,
  setDeviceCookie,
} from "@/lib/face-auth";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, twoFactorCode, isBackupCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    // SEGURANCA: Rate limiting de login
    let ip = "127.0.0.1";
    try {
      ip = await getClientIP();
    } catch (e) {
      console.error("[v0] Error getting client IP:", e);
    }
    
    // SEGURANCA: Verificar ataques nos campos
    try {
      for (const [field, value] of Object.entries({ email, password })) {
        if (typeof value === "string") {
          const attack = detectAttack(value);
          if (attack.detected) {
            try {
              await logAttack({
                attackType: attack.attackType!,
                ipAddress: ip,
                userEmail: email,
                payload: value.substring(0, 100),
                endpoint: "/api/auth/login",
                severity: attack.severity || "high",
                blocked: true,
              });
            } catch (e) {
              console.error("[v0] Error logging attack:", e);
            }
            
            // Bloquear IP para ataques criticos
            if (attack.severity === "critical" || attack.severity === "high") {
              try {
                await sql`
                  INSERT INTO blocked_ips (ip_address, reason)
                  VALUES (${ip}, ${`${attack.attackType} no login - campo ${field}`})
                  ON CONFLICT (ip_address) DO NOTHING
                `;
              } catch {
                // Ignora
              }
            }
            
            return NextResponse.json(
              { error: "Conteúdo não permitido" },
              { status: 400 }
            );
          }
        }
      }
    } catch (e) {
      console.error("[v0] Error detecting attacks:", e);
    }
    
    // Verificar se IP esta bloqueado
    try {
      const blockedIp = await sql`SELECT id FROM blocked_ips WHERE ip_address = ${ip}`;
      if (blockedIp.length > 0) {
        return NextResponse.json(
          { error: "Acesso negado" },
          { status: 403 }
        );
      }
    } catch (e) {
      console.error("[v0] Error checking blocked IP:", e);
      // Continua mesmo se der erro (tabela pode nao existir)
    }
    
    // Rate limiting
    try {
      const loginCheck = await checkLoginAttempts(email, ip);
      
      if (!loginCheck.allowed) {
        try {
          await logSuspiciousActivity(null, "LOGIN_BLOCKED", `IP: ${ip}, Email: ${email}, Reason: ${loginCheck.reason}`, ip);
        } catch (e) {
          console.error("[v0] Error logging suspicious activity:", e);
        }
        return NextResponse.json(
          { error: loginCheck.reason || "Muitas tentativas. Aguarde alguns minutos." },
          { status: 429 }
        );
      }
    } catch (e) {
      console.error("[v0] Error checking login attempts:", e);
      // Continua mesmo se der erro
    }

    const { user, error } = await loginUser(email, password);

    if (error || !user) {
      // Registrar tentativa de login falha (sem bloquear)
      try {
        await sql`
          INSERT INTO audit_logs (action, entity_type, new_value, created_at)
          VALUES ('LOGIN_FAILED', 'auth', ${JSON.stringify({ email, error })}, NOW())
        `;
        
        // Buscar user_id se existir para registrar tentativa
        const existingUser = await sql`SELECT id FROM profiles WHERE email = ${email} LIMIT 1`;
        if (existingUser.length > 0) {
          trackLogin({ userId: existingUser[0].id, success: false });
        }
      } catch (logError) {
        console.error("[v0] Error logging failed login:", logError);
      }

      return NextResponse.json(
        { error: error || "Credenciais invalidas" },
        { status: 401 }
      );
    }

    // Verificar se usuario tem 2FA ativado
    let has2FA = false;
    try {
      has2FA = await is2FAEnabled(user.id);
    } catch (e) {
      console.error("[v0] Error checking 2FA:", e);
      // Continua sem 2FA se der erro
    }
    
    if (has2FA) {
      // Se nao forneceu codigo 2FA, retornar que precisa
      if (!twoFactorCode) {
        return NextResponse.json({
          requires2FA: true,
          message: "Digite o codigo de autenticacao de dois fatores",
        });
      }
      
      // Verificar codigo 2FA
      let isValidCode = false;
      
      if (isBackupCode) {
        // Verificar codigo de backup
        isValidCode = await verifyBackupCode(user.id, twoFactorCode);
      } else {
        // Verificar codigo TOTP
        const secret = await getUserSecret(user.id);
        if (secret) {
          isValidCode = verifyTOTP(secret, twoFactorCode);
        }
      }
      
      if (!isValidCode) {
        return NextResponse.json(
          { error: "Codigo de autenticacao invalido", requires2FA: true },
          { status: 401 }
        );
      }
    }

    // SEGURANCA: Reconhecimento facial em dispositivo novo.
    // So exige o rosto se o usuario ja tem rosto cadastrado (liveness aprovado).
    // Quem ainda nao verificou loga normalmente e e forcado a verificar pelo
    // bloqueio obrigatorio do dashboard. Fail-open em erros para nao travar logins.
    try {
      const trusted = await isTrustedDevice(user.id);
      if (!trusted) {
        let faceEnrolled = false;
        try {
          const r = await sql`SELECT liveness_status FROM profiles WHERE id = ${user.id}`;
          faceEnrolled = r[0]?.liveness_status === "approved";
        } catch (e) {
          console.error("[v0] Erro ao checar liveness no login:", e);
        }

        if (faceEnrolled) {
          const { challengeId, url, deviceId } = await createFaceChallenge({
            userId: user.id,
            purpose: "login",
          });
          const ticket = await createLoginTicket(user.id);

          const faceResponse = NextResponse.json({
            requiresFaceAuth: true,
            challengeId,
            faceUrl: url,
            ticket,
            message: "Verificacao facial necessaria para este dispositivo",
          });
          setDeviceCookie(faceResponse, deviceId);
          return faceResponse;
        }
      }
    } catch (e) {
      // Nunca bloqueia o login por falha na verificacao facial (ex.: Didit fora).
      console.error("[v0] Falha no step-up facial (login liberado):", e);
    }

    // Create JWT token
    const token = await createToken(user);

    // Registrar login bem-sucedido (sem bloquear)
    try {
      await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, new_value, created_at)
        VALUES (${user.id}, 'LOGIN', 'auth', ${JSON.stringify({ email: user.email })}, NOW())
      `;
      
      // Registrar no historico de logins
      trackLogin({ userId: user.id, success: true });
      
      // Verificar se e dispositivo novo
      const isNewDevice = await checkNewDevice(user.id);
      
      // Log para Discord
      logLogin({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        ip: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        isAdmin: user.role === "admin" || user.role === "ceo",
        isNewDevice,
      });
    } catch (logError) {
      console.error("[v0] Error logging successful login:", logError);
    }

    // Atualizar updated_at e last_ip (sem bloquear)
    try {
      await sql`UPDATE profiles SET updated_at = NOW(), last_ip = ${ip} WHERE id = ${user.id}`;
    } catch (updateError) {
      console.error("[v0] Error updating profile:", updateError);
    }

    // Criar response com token no body E no cookie (não httpOnly para funcionar no v0)
    const response = NextResponse.json({
      success: true,
      token, // Retornar token para o cliente salvar
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        kyc_status: user.kyc_status,
      },
    });

    // Cookie HTTPOnly em producao para proteger contra XSS (roubo de cookies)
    const isProduction = process.env.NODE_ENV === "production" && !process.env.VERCEL_URL?.includes('v0.dev');
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: isProduction, // HTTPOnly em producao para seguranca contra XSS
      secure: isProduction,
      sameSite: "strict", // Strict para maior seguranca
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    // Marca este dispositivo como confiavel (nao pedira rosto nos proximos logins)
    await trustDevice(user.id, response);

    return response;
  } catch (error) {
    console.error("[v0] Error in login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
