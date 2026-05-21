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
    
    console.log("[v0] CEO Login attempt for email:", email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha sao obrigatorios' },
        { status: 400 }
      )
    }

    // Primeiro verificar se a tabela admin_team existe
    let tableExists = false
    try {
      await sql`SELECT 1 FROM admin_team LIMIT 1`
      tableExists = true
      console.log("[v0] admin_team table exists")
    } catch {
      // Tabela nao existe, vamos criar
      console.log("[v0] admin_team table does not exist, creating...")
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS admin_team (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES profiles(id),
            role TEXT NOT NULL DEFAULT 'support',
            permissions JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
        tableExists = true
      } catch (e) {
        console.error("[v0] Error creating admin_team table:", e)
      }
    }

    // Buscar membro da equipe - busca na tabela admin_team vinculada a profiles
    let result: any[] = []
    
    if (tableExists) {
      try {
        result = await sql`
          SELECT at.id, p.name, p.email, p.password_hash, at.role, at.permissions, at.is_active
          FROM admin_team at
          INNER JOIN profiles p ON p.id = at.user_id
          WHERE p.email = ${email}
        `
        console.log("[v0] admin_team query result count:", result.length)
      } catch (e) {
        console.error("[v0] Error querying admin_team:", e)
      }
    }

    // Se nao encontrou na admin_team, verificar se e um admin na tabela profiles
    if (result.length === 0) {
      console.log("[v0] Not found in admin_team, checking profiles...")
      try {
        // Busca qualquer usuario com esse email
        const profileResult = await sql`
          SELECT id, name, email, password_hash, role, is_active, is_blocked
          FROM profiles 
          WHERE email = ${email}
        `
        
        console.log("[v0] profiles query result count:", profileResult.length)
        
        if (profileResult.length > 0) {
          const profile = profileResult[0]
          
          console.log("[v0] Profile found:", { 
            id: profile.id, 
            email: profile.email, 
            role: profile.role,
            is_active: profile.is_active, 
            is_blocked: profile.is_blocked,
            hasPasswordHash: !!profile.password_hash
          })
          
          // Verificar se conta esta ativa
          if (!profile.is_active) {
            return NextResponse.json(
              { error: 'Conta desativada' },
              { status: 403 }
            )
          }
          
          if (profile.is_blocked) {
            return NextResponse.json(
              { error: 'Conta bloqueada' },
              { status: 403 }
            )
          }
          
          // Verificar senha
          if (!profile.password_hash) {
            console.log("[v0] No password_hash for profile")
            return NextResponse.json(
              { error: 'Erro na conta. Contate o suporte.' },
              { status: 500 }
            )
          }
          
          const isValid = await bcrypt.compare(password, profile.password_hash)
          console.log("[v0] Password verification result:", isValid)
          
          if (!isValid) {
            return NextResponse.json(
              { error: 'Email ou senha incorretos' },
              { status: 401 }
            )
          }
          
          // Login bem-sucedido - criar token JWT
          console.log("[v0] CEO Login successful for:", email)
          
          const token = await new SignJWT({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: 'ceo',
            permissions: ['all'],
            isTeamMember: true,
          })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(JWT_SECRET)

          const response = NextResponse.json({
            success: true,
            member: {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: 'ceo',
              permissions: ['all'],
            },
            redirectUrl: '/lp-x7k9m2-internal/ceo',
            loginTime: Date.now(),
          })

          response.cookies.set(TEAM_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
            path: '/',
          })

          return response
        }
      } catch (e) {
        console.error("[v0] Error checking profiles for admin:", e)
      }
      
      console.log("[v0] No user found with email:", email)
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const member = result[0]
    console.log("[v0] admin_team member found:", { id: member.id, email: member.email, role: member.role })

    // Verificar se esta ativo
    if (!member.is_active) {
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 }
      )
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, member.password_hash)
    console.log("[v0] admin_team password verification:", isValid)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Atualizar ultimo login
    try {
      await sql`
        UPDATE admin_team 
        SET updated_at = NOW() 
        WHERE id = ${member.id}
      `
    } catch {
      // Ignora erro de update
    }

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
        permissions: member.permissions,
      },
      redirectUrl: getRedirectUrl(member.role),
      loginTime: Date.now(),
    })

    // Definir cookie diretamente na response
    response.cookies.set(TEAM_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
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

// Redirecionar baseado no role
function getRedirectUrl(role: string): string {
  switch (role) {
    case 'ceo':
      return '/lp-x7k9m2-internal/ceo'
    case 'manager':
      return '/lp-x7k9m2-internal/manager'
    case 'finance':
      return '/lp-x7k9m2-internal/finance'
    case 'support':
    default:
      return '/lp-x7k9m2-internal/support'
  }
}
