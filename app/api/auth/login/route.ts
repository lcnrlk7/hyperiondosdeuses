import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { checkLoginAttempts, getClientIP, logSuspiciousActivity } from "@/lib/security";
import { detectAttack } from "@/lib/sanitize";
import { logAttack } from "@/lib/attack-logger";
import { trackLogin } from "@/lib/login-tracker";
import { is2FAEnabled, getUserSecret, verifyTOTP, verifyBackupCode } from "@/lib/two-factor";
import { createLoginCode } from "@/lib/login-code";
import { sendLoginCodeEmail } from "@/lib/email";

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

    // SEGURANCA: Codigo de acesso por email (login em 2 etapas OBRIGATORIO).
    // Email + senha corretos NAO emitem o token. Em vez disso, enviamos um
    // codigo de 6 digitos para o email cadastrado e retornamos requiresEmailCode.
    // O token so e criado em /api/auth/login/verify-code apos validar o codigo,
    // entao nao ha como burlar pulando essa etapa pelo cliente.
    const { code, cooldown } = await createLoginCode(user.email);

    if (!code && !cooldown) {
      return NextResponse.json(
        { error: "Nao foi possivel gerar o codigo de acesso. Tente novamente." },
        { status: 500 }
      );
    }

    // Envia o email apenas quando um novo codigo foi gerado (respeita cooldown).
    if (code) {
      const sent = await sendLoginCodeEmail(user.email, code, user.name || undefined);
      if (!sent) {
        return NextResponse.json(
          { error: "Erro ao enviar o codigo de acesso. Tente novamente." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      requiresEmailCode: true,
      email: user.email,
      message: "Enviamos um codigo de acesso para o seu email.",
    });
  } catch (error) {
    console.error("[v0] Error in login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
