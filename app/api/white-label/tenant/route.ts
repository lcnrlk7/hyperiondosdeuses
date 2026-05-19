import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const sql = neon(process.env.DATABASE_URL!)
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

// GET - Buscar tenant do usuario
export async function GET() {
  const userId = await getUserId()
  
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const result = await sql`
      SELECT * FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    const tenant = result[0] || null
    
    return NextResponse.json({ 
      success: true,
      tenant
    })
  } catch (error: any) {
    console.error("[White Label] Erro ao buscar tenant:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar tenant
export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { name, slug } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug sao obrigatorios" }, { status: 400 })
    }
    
    // Verificar se usuario ja tem tenant
    const existing = await sql`
      SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (existing.length > 0) {
      return NextResponse.json({ error: "Voce ja possui um tenant" }, { status: 400 })
    }
    
    // Verificar se slug ja existe
    const slugExists = await sql`
      SELECT id FROM white_label_tenants WHERE slug = ${slug}
    `
    
    if (slugExists.length > 0) {
      return NextResponse.json({ error: "Slug ja existe" }, { status: 400 })
    }
    
    await sql`
      INSERT INTO white_label_tenants (user_id, name, slug)
      VALUES (${userId}, ${name}, ${slug})
    `
    
    return NextResponse.json({ success: true, message: "Tenant criado" })
  } catch (error: any) {
    console.error("[White Label] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Atualizar tenant
export async function PUT(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    
    // Verificar se usuario tem tenant
    const existing = await sql`
      SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }
    
    const tenantId = existing[0].id
    
    // Atualizar campos
    await sql`
      UPDATE white_label_tenants
      SET
        name = COALESCE(${body.name}, name),
        slug = COALESCE(${body.slug}, slug),
        domain_app = ${body.domain_app || null},
        domain_admin = ${body.domain_admin || null},
        database_url = ${body.database_url || null},
        logo_url = ${body.logo_url || null},
        mascot_url = ${body.mascot_url || null},
        favicon_url = ${body.favicon_url || null},
        badge_url = ${body.badge_url || null},
        banner_url = ${body.banner_url || null},
        login_bg_url = ${body.login_bg_url || null},
        primary_color = COALESCE(${body.primary_color}, primary_color),
        secondary_color = COALESCE(${body.secondary_color}, secondary_color),
        text_color = COALESCE(${body.text_color}, text_color),
        accent_color = COALESCE(${body.accent_color}, accent_color),
        success_color = COALESCE(${body.success_color}, success_color),
        warning_color = COALESCE(${body.warning_color}, warning_color),
        error_color = COALESCE(${body.error_color}, error_color),
        use_hyperion_gateway = COALESCE(${body.use_hyperion_gateway}, use_hyperion_gateway),
        gateway_provider = ${body.gateway_provider || null},
        gateway_client_id = ${body.gateway_client_id || null},
        gateway_client_secret = ${body.gateway_client_secret || null},
        transaction_fee = COALESCE(${body.transaction_fee}, transaction_fee),
        withdraw_fee = COALESCE(${body.withdraw_fee}, withdraw_fee),
        min_withdraw = COALESCE(${body.min_withdraw}, min_withdraw),
        modules_config = COALESCE(${body.modules_config ? JSON.stringify(body.modules_config) : null}::jsonb, modules_config),
        ceo_modules_config = COALESCE(${body.ceo_modules_config ? JSON.stringify(body.ceo_modules_config) : null}::jsonb, ceo_modules_config),
        custom_texts = COALESCE(${body.custom_texts ? JSON.stringify(body.custom_texts) : null}::jsonb, custom_texts),
        features_config = COALESCE(${body.features_config ? JSON.stringify(body.features_config) : null}::jsonb, features_config),
        seo_config = COALESCE(${body.seo_config ? JSON.stringify(body.seo_config) : null}::jsonb, seo_config),
        email_config = COALESCE(${body.email_config ? JSON.stringify(body.email_config) : null}::jsonb, email_config),
        system_config = COALESCE(${body.system_config ? JSON.stringify(body.system_config) : null}::jsonb, system_config),
        telegram_config = COALESCE(${body.telegram_config ? JSON.stringify(body.telegram_config) : null}::jsonb, telegram_config),
        updated_at = NOW()
      WHERE id = ${tenantId}
    `
    
    return NextResponse.json({ success: true, message: "Tenant atualizado" })
  } catch (error: any) {
    console.error("[White Label] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remover tenant
export async function DELETE() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const result = await sql`
      SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }
    
    const tenantId = result[0].id
    
    // Remover pagamentos
    await sql`DELETE FROM white_label_payments WHERE tenant_id = ${tenantId}`
    
    // Remover logs
    await sql`DELETE FROM white_label_logs WHERE tenant_id = ${tenantId}`
    
    // Remover tenant
    await sql`DELETE FROM white_label_tenants WHERE id = ${tenantId}`
    
    return NextResponse.json({ success: true, message: "Tenant removido" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
