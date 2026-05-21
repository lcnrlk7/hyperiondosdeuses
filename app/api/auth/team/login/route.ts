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

    // Primeiro verificar se a tabela admin_team existe
    let tableExists = false
    try {
      await sql`SELECT 1 FROM admin_team LIMIT 1`
      tableExists = true
    } catch {
      // Tabela nao existe, vamos criar
      console.log("[v0] Creating admin_team table...")
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
      } catch (e) {
        console.error("[v0] Error querying admin_team:", e)
      }
    }

    // Se nao encontrou na admin_team, verificar se e um admin na tabela profiles
    if (result.length === 0) {
      try {
        // Primeiro tenta buscar com role admin/ceo/owner
        let profileResult = await sql`
          SELECT id, name, email, password_hash, role 
          FROM profiles 
          WHERE email = ${email} AND role IN ('admin', 'ceo', 'owner')
        `
        
        // Se nao encontrou, busca qualquer usuario com esse email (para permitir primeiro login)
        if (profileResult.length === 0) {
          profileResult = await sql`
            SELECT id, name, email, password_hash, role 
            FROM profiles 
            WHERE email = ${email}
          `
          
          // Se encontrou mas nao e admin, verificar se e o primeiro usuario (owner)
          if (profileResult.length > 0) {
            const countResult = await sql`SELECT COUNT(*) as total FROM profiles`
            const totalUsers = parseInt(countResult[0]?.total || '0')
            
            // Se e um dos primeiros usuarios ou tem role especial, permite
            if (totalUsers <= 5 || ['admin', 'ceo', 'owner', 'support'].includes(profileResult[0].role)) {
              // Atualiza para admin se ainda nao for
              if (!['admin', 'ceo', 'owner'].includes(profileResult[0].role)) {
                try {
                  await sql`UPDATE profiles SET role = 'admin' WHERE id = ${profileResult[0].id}`
                  profileResult[0].role = 'admin'
                } catch (e) {
                  console.error("[v0] Error updating role:", e)
                }
              }
            } else {
              profileResult = [] // Nao permite login
            }
          }
        }
        
        if (profileResult.length > 0) {
          const profile = profileResult[0]
          
          // Verificar senha
          const isValid = await bcrypt.compare(password, profile.password_hash)
          if (!isValid) {
            return NextResponse.json(
              { error: 'Credenciais invalidas' },
              { status: 401 }
            )
          }
          
          // Criar token JWT para admin
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
      
      return NextResponse.json(
        { error: 'Credenciais invalidas' },
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
    const isValid = await bcrypt.compare(password, member.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais invalidas' },
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
