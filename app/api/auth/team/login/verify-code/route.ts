import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { isAllowedAdmin } from '@/lib/admin-auth'
import { verifyLoginCode, createLoginCode } from '@/lib/login-code'
import { sendLoginCodeEmail } from '@/lib/email'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const TEAM_COOKIE_NAME = 'team_session'

/**
 * Etapa 2 do login do painel interno: valida o codigo de acesso enviado por
 * email e SO ENTAO emite o cookie de sessao. Revalida email + senha e a
 * allowlist do admin no servidor para impedir chamadas diretas.
 *
 * Aceita { resend: true } para reenviar o codigo (respeitando cooldown).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, code, resend } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Sessao de login invalida. Faca login novamente.' },
        { status: 400 }
      )
    }

    if (!isAllowedAdmin(email)) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

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

    if (!member.is_active) {
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 }
      )
    }

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

    // Reenvio de codigo
    if (resend) {
      const { code: newCode, cooldown } = await createLoginCode(member.email)
      if (cooldown) {
        return NextResponse.json(
          { error: 'Aguarde alguns segundos antes de reenviar o codigo.' },
          { status: 429 }
        )
      }
      if (!newCode) {
        return NextResponse.json(
          { error: 'Nao foi possivel gerar o codigo. Tente novamente.' },
          { status: 500 }
        )
      }
      const sent = await sendLoginCodeEmail(member.email, newCode, member.name || undefined)
      if (!sent) {
        return NextResponse.json(
          { error: 'Erro ao reenviar o codigo. Tente novamente.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, resent: true })
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Digite o codigo de acesso.' },
        { status: 400 }
      )
    }

    // Validacao do codigo (server-side, uso unico, com limite de tentativas)
    const codeResult = await verifyLoginCode(member.email, code)
    if (!codeResult.valid) {
      return NextResponse.json(
        { error: codeResult.error || 'Codigo invalido ou expirado' },
        { status: 401 }
      )
    }

    // Codigo valido: atualizar ultimo login e emitir a sessao
    await sql`
      UPDATE team_members
      SET last_login = NOW(), updated_at = NOW()
      WHERE id = ${member.id}
    `

    const token = await new SignJWT({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      permissions: member.permissions,
      isTeamMember: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: member.permissions || {},
      },
      redirectUrl: '/lp-x7k9m2-internal/ceo',
      loginTime: Date.now(),
    })

    response.cookies.set(TEAM_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Team login verify-code error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
