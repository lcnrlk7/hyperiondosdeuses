import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const TEAM_COOKIE_NAME = 'team_session'

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

    // Atualizar ultimo login
    await sql`
      UPDATE team_members 
      SET last_login = NOW(), updated_at = NOW() 
      WHERE id = ${member.id}
    `

    // Criar token JWT
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

    // Criar response com dados do membro
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

    // Definir cookie
    response.cookies.set(TEAM_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Team login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
