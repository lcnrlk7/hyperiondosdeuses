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
    const body = await request.json()
    const accepted = body.accepted || body.accept // Aceita ambos os formatos
    
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
      
      // Gerar pagamento do setup se ainda nao pagou
      const tenant = await sql`SELECT id, setup_paid, setup_fee FROM white_label_tenants WHERE user_id = ${userId}`
      if (tenant[0] && !tenant[0].setup_paid) {
        const amount = tenant[0].setup_fee || 350
        const pixCode = `00020126580014br.gov.bcb.pix0136${tenant[0].id}5204000053039865404${Number(amount).toFixed(2).replace('.', '')}5802BR5913HyperionPay6009SAO PAULO62070503***6304`
        
        await sql`
          INSERT INTO white_label_payments (tenant_id, user_id, type, amount, status, pix_code, expires_at)
          VALUES (${tenant[0].id}, ${userId}, 'setup', ${amount}, 'pending', ${pixCode}, NOW() + INTERVAL '30 minutes')
        `
        
        return NextResponse.json({ 
          success: true, 
          message: "Contrato aceito! Pagamento gerado.",
          pix_code: pixCode,
          amount: amount,
          tenant_id: tenant[0].id
        })
      } else {
        // Ja pagou setup - apenas retorna sucesso
        return NextResponse.json({ 
          success: true, 
          message: "Contrato ja aceito e setup ja pago.",
          setup_paid: true
        })
      }
    } else {
      // Criar novo tenant
      const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const slug = `plataforma-${Date.now()}`
      const amount = 350.00
      
      await sql`
        INSERT INTO white_label_tenants (
          id, user_id, name, slug, contract_accepted, contract_accepted_at, contract_ip,
          setup_fee, monthly_fee, setup_paid, subscription_status
        )
        VALUES (
          ${tenantId}, ${userId}, 'Nova Plataforma', ${slug}, true, NOW(), ${clientIp},
          350.00, 50.00, false, 'pending'
        )
      `
      
      // Gerar pagamento do setup
      const pixCode = `00020126580014br.gov.bcb.pix0136${tenantId}5204000053039865404${Number(amount).toFixed(2).replace('.', '')}5802BR5913HyperionPay6009SAO PAULO62070503***6304`
      
      await sql`
        INSERT INTO white_label_payments (tenant_id, user_id, type, amount, status, pix_code, expires_at)
        VALUES (${tenantId}, ${userId}, 'setup', ${amount}, 'pending', ${pixCode}, NOW() + INTERVAL '30 minutes')
      `
      
      return NextResponse.json({ 
        success: true, 
        message: "Contrato aceito! Pagamento gerado.",
        pix_code: pixCode,
        amount: amount,
        tenant_id: tenantId
      })
    }
  } catch (error: any) {
    console.error("[White Label Contract] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
