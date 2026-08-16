import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { isAllowedAdmin } from '@/lib/admin-auth'
import { createLoginCode } from '@/lib/login-code'
import { sendLoginCodeEmail } from '@/lib/email'
import { rateLimit, getClientIP, logSuspiciousActivity } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha sao obrigatorios' },
        { status: 400 }
      )
    }

    // SEGURANCA: rate limiting contra forca bruta no painel admin.
    // Limita tentativas por IP (independente do email informado).
    const ip = await getClientIP()
    const bruteLimit = rateLimit(`adminlogin_${ip}`, 5, 15 * 60 * 1000) // 5 tentativas / 15 min
    if (!bruteLimit.allowed) {
      await logSuspiciousActivity(null, 'ADMIN_LOGIN_RATE_LIMITED', `IP: ${ip}, email: ${email}`, ip)
      return NextResponse.json(
        { error: 'Muitas tentativas de acesso. Aguarde 15 minutos e tente novamente.' },
        { status: 429 }
      )
    }

    // SEGURANCA: apenas o admin autorizado pode acessar o painel interno.
    // Qualquer outro email e recusado com mensagem generica. Toda tentativa
    // com email diferente do dono e registrada como atividade suspeita.
    if (!isAllowedAdmin(email)) {
      await logSuspiciousActivity(null, 'ADMIN_LOGIN_FORBIDDEN_EMAIL', `IP: ${ip}, email: ${email}`, ip)
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Buscar membro da equipe na tabela team_members
    const result = await sql`
      SELECT id, name, email, password_hash, role, permissions, is_active
      FROM team_members
      WHERE email = ${email}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const member = result[0]

    // Verificar se esta ativo
    if (!member.is_active) {
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 }
      )
    }

    // Verificar senha
    if (!member.password_hash) {
      return NextResponse.json(
        { error: 'Erro na conta. Contate o suporte.' },
        { status: 500 }
      )
    }

    const isValid = await bcrypt.compare(password, member.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // SEGURANCA: codigo de acesso por email (login em 2 etapas OBRIGATORIO).
    // A sessao (cookie team_session) so e emitida em
    // /api/auth/team/login/verify-code apos validar o codigo.
    const { code, cooldown } = await createLoginCode(member.email)

    if (!code && !cooldown) {
      return NextResponse.json(
        { error: 'Nao foi possivel gerar o codigo de acesso. Tente novamente.' },
        { status: 500 }
      )
    }

    if (code) {
      const sent = await sendLoginCodeEmail(member.email, code, member.name || undefined)
      if (!sent) {
        return NextResponse.json(
          { error: 'Erro ao enviar o codigo de acesso. Tente novamente.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      requiresEmailCode: true,
      email: member.email,
      message: 'Enviamos um codigo de acesso para o seu email.',
    })
  } catch (error) {
    console.error('Team login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
