import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// Verificar se e admin
async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team_session")?.value
    if (!teamSession) return false
    
    const sessionData = JSON.parse(teamSession)
    return sessionData.role === "ceo" || sessionData.role === "admin"
  } catch {
    return false
  }
}

// GET - Listar todos os tenants
export async function GET() {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = getDb()
    
    // Buscar tenants com info do usuario
    const tenants = await sql`
      SELECT 
        wl.*,
        p.email as user_email,
        p.name as user_name
      FROM white_label_tenants wl
      LEFT JOIN profiles p ON wl.user_id = p.id
      ORDER BY wl.created_at DESC
    `

    // Calcular stats
    const total = tenants.length
    const active = tenants.filter(t => t.is_active && t.subscription_status === "active").length
    const pending = tenants.filter(t => !t.setup_paid || t.subscription_status === "pending").length
    const expired = tenants.filter(t => t.subscription_status === "expired").length

    // Calcular receita
    const payments = await sql`
      SELECT SUM(amount) as total FROM white_label_payments WHERE status = 'paid'
    `
    const totalRevenue = payments[0]?.total || 0

    const monthlyRevenue = tenants
      .filter(t => t.subscription_status === "active")
      .reduce((sum, t) => sum + (t.monthly_fee || 50), 0)

    return NextResponse.json({
      success: true,
      tenants,
      stats: {
        total,
        active,
        pending,
        expired,
        totalRevenue,
        monthlyRevenue,
      },
    })
  } catch (error: any) {
    console.error("[Admin White Label] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Ativar/Desativar/Renovar tenant
export async function PUT(request: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = getDb()
    const { tenantId, action } = await request.json()

    if (!tenantId || !action) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    if (action === "activate") {
      await sql`
        UPDATE white_label_tenants 
        SET is_active = true, updated_at = NOW()
        WHERE id = ${tenantId}
      `
    } else if (action === "deactivate") {
      await sql`
        UPDATE white_label_tenants 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${tenantId}
      `
    } else if (action === "renew") {
      await sql`
        UPDATE white_label_tenants 
        SET 
          subscription_status = 'active',
          subscription_expires_at = COALESCE(subscription_expires_at, NOW()) + INTERVAL '30 days',
          is_active = true,
          updated_at = NOW()
        WHERE id = ${tenantId}
      `
    } else if (action === "approve_setup") {
      await sql`
        UPDATE white_label_tenants 
        SET 
          setup_paid = true,
          subscription_status = 'active',
          subscription_expires_at = NOW() + INTERVAL '30 days',
          is_active = true,
          updated_at = NOW()
        WHERE id = ${tenantId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Admin White Label] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Excluir tenant
export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = getDb()
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json({ error: "ID do tenant obrigatorio" }, { status: 400 })
    }

    // Deletar pagamentos primeiro
    await sql`DELETE FROM white_label_payments WHERE tenant_id = ${tenantId}`
    
    // Deletar logs
    await sql`DELETE FROM white_label_logs WHERE tenant_id = ${tenantId}`
    
    // Deletar tenant
    await sql`DELETE FROM white_label_tenants WHERE id = ${tenantId}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Admin White Label] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
