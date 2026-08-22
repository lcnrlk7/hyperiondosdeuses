import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getJwtSecret } from "@/lib/jwt-secret"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

const JWT_SECRET = getJwtSecret()

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

// POST - Gerar pagamento (setup ou mensalidade)
export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = getDb()
    const { type } = await request.json() // "setup" ou "monthly"
    
    const tenants = await sql`
      SELECT * FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (tenants.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }

    const tenant = tenants[0]
    const amount = type === "setup" ? tenant.setup_fee : tenant.monthly_fee

    // Gerar codigo PIX
    const pixCode = `00020126580014br.gov.bcb.pix0136${tenant.id}5204000053039865404${Number(amount).toFixed(2)}5802BR5913HyperionPay6009SAO PAULO62070503***6304`
    
    await sql`
      INSERT INTO white_label_payments (tenant_id, user_id, type, amount, status, pix_code, expires_at)
      VALUES (${tenant.id}, ${userId}, ${type}, ${amount}, 'pending', ${pixCode}, NOW() + INTERVAL '30 minutes')
    `

    return NextResponse.json({
      success: true,
      pixCode,
      amount,
      message: "Pagamento gerado. Copie o codigo PIX e pague.",
    })
  } catch (error: any) {
    console.error("[White Label Payment] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Verificar status do pagamento
export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = getDb()
    const payments = await sql`
      SELECT * FROM white_label_payments 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({ success: true, payments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
