import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email"
import { isValidEmailStrict } from "@/lib/sanitize"
import { rateLimit, getClientIP, logSuspiciousActivity } from "@/lib/security"

export async function POST(request: Request) {
  try {
    const { email, name, cpf } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // SEGURANCA: rate limiting para impedir flood de emails / enumeracao.
    const ip = await getClientIP()
    const ipLimit = rateLimit(`sendcode_ip_${ip}`, 8, 3600000) // 8 por hora por IP
    if (!ipLimit.allowed) {
      await logSuspiciousActivity(null, "SENDCODE_RATE_LIMITED", `IP: ${ip}`, ip)
      return NextResponse.json(
        { error: "Muitas solicitações. Aguarde alguns minutos e tente novamente." },
        { status: 429 }
      )
    }
    const emailLimit = rateLimit(`sendcode_email_${email.toLowerCase()}`, 5, 3600000) // 5 por hora por email
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "Muitos códigos enviados para este email. Aguarde antes de tentar novamente." },
        { status: 429 }
      )
    }

    // SEGURANCA: valida o email E bloqueia dominios temporarios/descartaveis.
    // Mesma regra usada no /register, garantindo que apenas emails reais entrem.
    const emailValidation = isValidEmailStrict(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || "Email inválido" },
        { status: 400 }
      )
    }

    // Verificar se email já está cadastrado
    const existingUsers = await sql`
      SELECT id FROM profiles WHERE email = ${email.toLowerCase()}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Verificar se CPF já está cadastrado
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "")
      const existingCpf = await sql`
        SELECT id FROM profiles WHERE cpf = ${cleanCpf}
      `

      if (existingCpf.length > 0) {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado" },
          { status: 400 }
        )
      }
    }

    // Invalidar códigos anteriores
    await sql`
      UPDATE email_verification_codes 
      SET used = true 
      WHERE email = ${email.toLowerCase()} AND used = false
    `

    // Gerar novo código
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Salvar código no banco
    await sql`
      INSERT INTO email_verification_codes (email, code, expires_at)
      VALUES (${email.toLowerCase()}, ${code}, ${expiresAt.toISOString()})
    `

    // Enviar email
    const sent = await sendVerificationEmail(email, code, name)

    if (!sent) {
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado para seu email",
    })
  } catch (error) {
    console.error("Erro ao enviar código:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
