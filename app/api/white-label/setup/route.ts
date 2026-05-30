import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// POST - Criar tabela de tenants White Label
export async function POST() {
  try {
    const sql = getDb()
    // Criar tabela principal de tenants
    await sql`
      CREATE TABLE IF NOT EXISTS white_label_tenants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        domain_app TEXT UNIQUE,
        domain_admin TEXT UNIQUE,
        database_url TEXT,
        
        -- Visual
        logo_url TEXT,
        mascot_url TEXT,
        favicon_url TEXT,
        primary_color TEXT DEFAULT '#FF5500',
        secondary_color TEXT DEFAULT '#1A1A1A',
        text_color TEXT DEFAULT '#FFFFFF',
        
        -- Imagens extras (placas, banners)
        badge_url TEXT,
        banner_url TEXT,
        login_bg_url TEXT,
        
        -- Textos personalizados
        custom_texts JSONB DEFAULT '{}',
        
        -- Modulos ativos (o que aparece no sistema)
        modules_config JSONB DEFAULT '{"dashboard":true,"wallet":true,"transactions":true,"checkout":true,"products":true,"clients":true,"api":true,"settings":true,"support":true,"reports":true}',
        
        -- Modulos CEO ativos
        ceo_modules_config JSONB DEFAULT '{"dashboard":true,"users":true,"transactions":true,"withdrawals":true,"kyc":true,"fees":true,"support":true,"settings":true}',
        
        -- Gateway
        use_hyperion_gateway BOOLEAN DEFAULT true,
        gateway_provider TEXT,
        gateway_client_id TEXT,
        gateway_client_secret TEXT,
        
        -- Taxas
        transaction_fee DECIMAL(5, 2) DEFAULT 2.50,
        withdraw_fee DECIMAL(10, 2) DEFAULT 3.00,
        min_withdraw DECIMAL(10, 2) DEFAULT 10.00,
        
        -- Status
        is_active BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        dns_configured BOOLEAN DEFAULT false,
        database_configured BOOLEAN DEFAULT false,
        
        -- Assinatura
        plan TEXT DEFAULT 'pending',
        setup_fee DECIMAL(10, 2) DEFAULT 350.00,
        monthly_fee DECIMAL(10, 2) DEFAULT 50.00,
        setup_paid BOOLEAN DEFAULT false,
        subscription_status TEXT DEFAULT 'pending',
        subscription_expires_at TIMESTAMP,
        last_payment_at TIMESTAMP,
        next_payment_at TIMESTAMP,
        
        -- Contrato
        contract_accepted BOOLEAN DEFAULT false,
        contract_accepted_at TIMESTAMP,
        contract_ip TEXT,
        
        -- Configuracoes extras (JSONB)
        features_config JSONB DEFAULT '{}',
        seo_config JSONB DEFAULT '{}',
        email_config JSONB DEFAULT '{}',
        system_config JSONB DEFAULT '{}',
        telegram_config JSONB DEFAULT '{}',
        
        -- Cores extras
        accent_color TEXT DEFAULT '#FF5500',
        success_color TEXT DEFAULT '#22C55E',
        warning_color TEXT DEFAULT '#F59E0B',
        error_color TEXT DEFAULT '#EF4444',
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Adicionar colunas que podem estar faltando em tabelas existentes
    const alterColumns = [
      { name: 'features_config', type: 'JSONB', default: "'{}'" },
      { name: 'seo_config', type: 'JSONB', default: "'{}'" },
      { name: 'email_config', type: 'JSONB', default: "'{}'" },
      { name: 'system_config', type: 'JSONB', default: "'{}'" },
      { name: 'telegram_config', type: 'JSONB', default: "'{}'" },
      { name: 'accent_color', type: 'TEXT', default: "'#FF5500'" },
      { name: 'success_color', type: 'TEXT', default: "'#22C55E'" },
      { name: 'warning_color', type: 'TEXT', default: "'#F59E0B'" },
      { name: 'error_color', type: 'TEXT', default: "'#EF4444'" },
    ]
    
    for (const col of alterColumns) {
      try {
        await sql`
          ALTER TABLE white_label_tenants 
          ADD COLUMN IF NOT EXISTS ${sql.unsafe(col.name)} ${sql.unsafe(col.type)} DEFAULT ${sql.unsafe(col.default)}
        `
      } catch (e) {
        // Coluna ja existe, ignorar
      }
    }
    
    // Indices
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_user ON white_label_tenants(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_domain_app ON white_label_tenants(domain_app)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_domain_admin ON white_label_tenants(domain_admin)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_slug ON white_label_tenants(slug)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_subscription ON white_label_tenants(subscription_status)`
    
    // Tabela de pagamentos White Label
    await sql`
      CREATE TABLE IF NOT EXISTS white_label_payments (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT REFERENCES white_label_tenants(id),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        external_id TEXT,
        pix_code TEXT,
        pix_qrcode TEXT,
        paid_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de logs de atividade White Label
    await sql`
      CREATE TABLE IF NOT EXISTS white_label_logs (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT REFERENCES white_label_tenants(id),
        action TEXT NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    return NextResponse.json({
      success: true,
      message: "Tabelas White Label criadas com sucesso",
    })
  } catch (error: any) {
    console.error("[White Label Setup] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET - Verificar se tabelas existem
export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'white_label_tenants'
      )
    `
    
    return NextResponse.json({
      success: true,
      exists: result[0]?.exists || false,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
