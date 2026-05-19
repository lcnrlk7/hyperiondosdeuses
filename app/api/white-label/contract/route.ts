import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.id as string
  } catch {
    return null
  }
}

// POST - Aceitar contrato
export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = getDb()
    const { accepted } = await request.json()
    
    if (!accepted) {
      return NextResponse.json({ error: "Voce precisa aceitar o contrato" }, { status: 400 })
    }

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Verificar se ja tem tenant
    const existing = await sql`
      SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `

    if (existing.length > 0) {
      await sql`
        UPDATE white_label_tenants 
        SET contract_accepted = true, contract_accepted_at = NOW(), contract_ip = ${clientIp}
        WHERE user_id = ${userId}
      `
    } else {
      await sql`
        INSERT INTO white_label_tenants (
          user_id, name, slug, contract_accepted, contract_accepted_at, contract_ip,
          setup_fee, monthly_fee, setup_paid, subscription_status
        )
        VALUES (
          ${userId}, 'Nova Plataforma', ${`plataforma-${Date.now()}`}, true, NOW(), ${clientIp},
          350.00, 50.00, false, 'pending'
        )
      `
    }

    return NextResponse.json({ success: true, message: "Contrato aceito" })
  } catch (error: any) {
    console.error("[White Label Contract] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
