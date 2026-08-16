import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { markEmailVerified } from "@/lib/email-verification"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar código válido
    const verificationCodes = await sql`
      SELECT * FROM email_verification_codes 
      WHERE email = ${email.toLowerCase()} 
        AND code = ${code} 
        AND used = false 
        AND expires_at >= NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (verificationCodes.length === 0) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      )
    }

    const verificationCode = verificationCodes[0]

    // Marcar código como usado
    await sql`
      UPDATE email_verification_codes SET used = true WHERE id = ${verificationCode.id}
    `

    // SEGURANCA: gravar prova server-side de que este email foi verificado.
    // O /api/auth/register exige essa prova, impedindo que alguem pule a
    // verificacao de email chamando a API de cadastro diretamente.
    await markEmailVerified(email)

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso",
      verified: true,
    })
  } catch (error) {
    console.error("Erro ao verificar código:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
