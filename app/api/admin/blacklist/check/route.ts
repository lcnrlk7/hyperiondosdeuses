import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// Verifica se um valor esta na blacklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ip, email, cpf, device_id, phone, user_id } = body

    if (!ip && !email && !cpf && !device_id && !phone && !user_id) {
      return NextResponse.json({ blocked: false })
    }

    const sql = getDb()

    // Verifica cada tipo separadamente para usar tagged template literals
    let blocked = false
    let blockInfo: { reason: string; type: string; blocked_at: string; id: string } | null = null

    // Verifica IP
    if (ip && !blocked) {
      const result = await sql`
        SELECT id, type, value, reason, created_at
        FROM blacklist
        WHERE type = 'ip' AND value = ${ip}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `
      if (result.length > 0) {
        blocked = true
        blockInfo = { 
          reason: result[0].reason, 
          type: result[0].type, 
          blocked_at: result[0].created_at,
          id: result[0].id 
        }
      }
    }

    // Verifica Email
    if (email && !blocked) {
      const cleanEmail = email.toLowerCase()
      const result = await sql`
        SELECT id, type, value, reason, created_at
        FROM blacklist
        WHERE type = 'email' AND value = ${cleanEmail}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `
      if (result.length > 0) {
        blocked = true
        blockInfo = { 
          reason: result[0].reason, 
          type: result[0].type, 
          blocked_at: result[0].created_at,
          id: result[0].id 
        }
      }
    }

    // Verifica CPF
    if (cpf && !blocked) {
      const cleanCpf = cpf.replace(/\D/g, "")
      const result = await sql`
        SELECT id, type, value, reason, created_at
        FROM blacklist
        WHERE type = 'cpf' AND value = ${cleanCpf}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `
      if (result.length > 0) {
        blocked = true
        blockInfo = { 
          reason: result[0].reason, 
          type: result[0].type, 
          blocked_at: result[0].created_at,
          id: result[0].id 
        }
      }
    }

    // Verifica Device ID
    if (device_id && !blocked) {
      const result = await sql`
        SELECT id, type, value, reason, created_at
        FROM blacklist
        WHERE type = 'device' AND value = ${device_id}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `
      if (result.length > 0) {
        blocked = true
        blockInfo = { 
          reason: result[0].reason, 
          type: result[0].type, 
          blocked_at: result[0].created_at,
          id: result[0].id 
        }
      }
    }

    // Verifica Phone
    if (phone && !blocked) {
      const cleanPhone = phone.replace(/\D/g, "")
      const result = await sql`
        SELECT id, type, value, reason, created_at
        FROM blacklist
        WHERE type = 'phone' AND value = ${cleanPhone}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `
      if (result.length > 0) {
        blocked = true
        blockInfo = { 
          reason: result[0].reason, 
          type: result[0].type, 
          blocked_at: result[0].created_at,
          id: result[0].id 
        }
      }
    }

    // Verifica User ID
    if (user_id && !blocked) {
      const result = await sql`
        SELECT id, type, value, reason, created_at
        FROM blacklist
        WHERE user_id = ${user_id}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `
      if (result.length > 0) {
        blocked = true
        blockInfo = { 
          reason: result[0].reason, 
          type: result[0].type, 
          blocked_at: result[0].created_at,
          id: result[0].id 
        }
      }
    }

    if (blocked && blockInfo) {
      // Registra o hit
      const userAgent = request.headers.get("user-agent") || null
      await sql`
        INSERT INTO blacklist_hits (blacklist_id, ip, user_agent, created_at)
        VALUES (${blockInfo.id}, ${ip || null}, ${userAgent}, NOW())
      `

      return NextResponse.json({
        blocked: true,
        reason: blockInfo.reason,
        type: blockInfo.type,
        blocked_at: blockInfo.blocked_at,
      })
    }

    return NextResponse.json({ blocked: false })
  } catch (error) {
    console.error("[Blacklist Check] Erro:", error)
    // Em caso de erro, nao bloqueia para nao afetar usuarios legitimos
    return NextResponse.json({ blocked: false })
  }
}
