import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit, getClientIP, logSuspiciousActivity } from "@/lib/security";
import { logNewUser } from "@/lib/discord-webhook";
import { detectAttack, sanitizeName, isValidName, isValidEmailStrict, isValidPhone, isValidCPFStrict } from "@/lib/sanitize";
import { logAttack } from "@/lib/attack-logger";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Funcao auxiliar para verificar e bloquear ataques
async function checkAndBlockAttack(
  field: string,
  value: string,
  ip: string,
  email: string,
  sqlClient: typeof sql
): Promise<{ blocked: boolean; error?: string }> {
  const attack = detectAttack(value);
  
  if (attack.detected) {
    // Registrar ataque com webhook Discord
    await logAttack({
      attackType: attack.attackType!,
      ipAddress: ip,
      userEmail: email,
      payload: value.substring(0, 200),
      endpoint: "/api/auth/register",
      severity: attack.severity || "high",
      blocked: true,
    });
    
    // Bloquear IP para ataques criticos
    if (attack.severity === "critical" || attack.severity === "high") {
      try {
        await sqlClient`
          INSERT INTO blocked_ips (ip_address, reason)
          VALUES (${ip}, ${`Tentativa de ${attack.attackType} no campo ${field}`})
          ON CONFLICT (ip_address) DO NOTHING
        `;
      } catch {
        // Ignora erro se tabela nao existir
      }
    }
    
    return { blocked: true, error: "Conteúdo não permitido detectado" };
  }
  
  return { blocked: false };
}

export async function POST(request: NextRequest) {
  try {
    // SEGURANCA: Rate limiting de registro por IP
    const ip = await getClientIP();
    const registerRateLimit = rateLimit(`register_${ip}`, 3, 3600000); // 3 registros por hora por IP
    
    if (!registerRateLimit.allowed) {
      await logSuspiciousActivity(null, "REGISTER_RATE_LIMITED", `IP: ${ip}`, ip);
      return NextResponse.json(
        { error: "Muitos registros deste IP. Aguarde 1 hora." },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { name, email, password, cpf, phone, referralCode } = body;

    // SEGURANCA: Verificar ataques em todos os campos
    const fieldsToCheck = [
      { field: "nome", value: name },
      { field: "email", value: email },
      { field: "telefone", value: phone },
      { field: "cpf", value: cpf },
      { field: "senha", value: password },
      { field: "referralCode", value: referralCode },
    ];

    for (const { field, value } of fieldsToCheck) {
      if (value) {
        const attackCheck = await checkAndBlockAttack(field, value, ip, email || "unknown", sql);
        if (attackCheck.blocked) {
          return NextResponse.json(
            { error: attackCheck.error },
            { status: 400 }
          );
        }
      }
    }

    // SEGURANCA: Validar nome (apenas letras, espacos e hifens)
    const nameValidation = isValidName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error || "Nome inválido" },
        { status: 400 }
      );
    }
    const sanitizedName = sanitizeName(name);

    // SEGURANCA: Validar email (sem caracteres perigosos)
    const emailValidation = isValidEmailStrict(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || "Email inválido" },
        { status: 400 }
      );
    }

    // SEGURANCA: Validar telefone (apenas numeros)
    if (phone) {
      const phoneValidation = isValidPhone(phone);
      if (!phoneValidation.valid) {
        return NextResponse.json(
          { error: phoneValidation.error || "Telefone inválido" },
          { status: 400 }
        );
      }
    }
    
    // SEGURANCA: Validar CPF (apenas numeros)
    if (cpf) {
      const cpfValidation = isValidCPFStrict(cpf);
      if (!cpfValidation.valid) {
        return NextResponse.json(
          { error: cpfValidation.error || "CPF inválido" },
          { status: 400 }
        );
      }
    }

    if (!password) {
      return NextResponse.json(
        { error: "Senha é obrigatória" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se CPF ja existe no banco
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      const existingCpf = await sql`
        SELECT id FROM profiles WHERE cpf_cnpj = ${cleanCpf}
      `;

      if (existingCpf.length > 0) {
        return NextResponse.json(
          { error: "CPF já cadastrado" },
          { status: 400 }
        );
      }
    }

    // Registrar usuario (usando nome sanitizado)
    const { user, error } = await registerUser(
      email, 
      password, 
      sanitizedName,
      phone?.replace(/\D/g, ""),
      cpf?.replace(/\D/g, ""),
      cpf ? 'cpf' : undefined
    );

    if (error || !user) {
      return NextResponse.json(
        { error: error || "Erro ao criar conta" },
        { status: 400 }
      );
    }

    // Create token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      kyc_status: user.kyc_status,
    });

    // Processar codigo de referencia
    if (referralCode) {
      try {
        const referrer = await sql`
          SELECT id FROM profiles WHERE referral_code = ${referralCode.toUpperCase()}
        `;
        
        if (referrer.length > 0) {
          await sql`
            UPDATE profiles SET referred_by = ${referrer[0].id} WHERE id = ${user.id}
          `;
          console.log(`[v0] Usuario ${user.id} indicado por ${referrer[0].id}`);
        }
      } catch (refError) {
        console.error("[v0] Error processing referral:", refError);
      }
    }

    // Registrar log de cadastro
    try {
      await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, new_value, created_at)
        VALUES (${user.id}, 'REGISTER', 'auth', ${JSON.stringify({ email, name, referralCode })}, NOW())
      `;
      
      // Buscar referral_code do usuario recem criado
      const userProfile = await sql`SELECT referral_code FROM profiles WHERE id = ${user.id}`;
      const userReferralCode = userProfile[0]?.referral_code;
      
      // Log para Discord
      logNewUser({
        userId: user.id,
        name: name,
        email: email,
        document: cpf?.replace(/\D/g, ""),
        phone: phone?.replace(/\D/g, ""),
        referralCode: userReferralCode,
        referredBy: referralCode,
      });
    } catch (logError) {
      console.error("[v0] Error logging registration:", logError);
    }

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error("[v0] Error sending welcome email:", emailError);
    }

    // Criar response com token no body E no cookie
    const response = NextResponse.json({
      success: true,
      token, // Retornar token para o cliente salvar
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
    console.error("[v0] Error in register:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
