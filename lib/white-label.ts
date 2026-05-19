// Lib White Label - Gerenciamento de plataformas personalizadas
import { neon } from "@neondatabase/serverless"

// Conexao com banco central (seu banco) - lazy initialization
function getCentralDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// Interface do Tenant White Label
export interface WhiteLabelTenant {
  id: string
  user_id: string
  name: string
  slug: string
  domain_app: string | null
  domain_admin: string | null
  database_url: string | null
  logo_url: string | null
  mascot_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  text_color: string
  use_hyperion_gateway: boolean
  gateway_provider: string | null
  gateway_client_id: string | null
  gateway_client_secret: string | null
  transaction_fee: number
  withdraw_fee: number
  min_withdraw: number
  is_active: boolean
  is_verified: boolean
  created_at: Date
  updated_at: Date
}

// Buscar tenant pelo dominio
export async function getTenantByDomain(domain: string): Promise<WhiteLabelTenant | null> {
  try {
    const centralSql = getCentralDb()
    const result = await centralSql`
      SELECT * FROM white_label_tenants 
      WHERE (domain_app = ${domain} OR domain_admin = ${domain})
      AND is_active = true
      LIMIT 1
    `
    return result[0] as WhiteLabelTenant || null
  } catch (error) {
    console.error("[White Label] Erro ao buscar tenant:", error)
    return null
  }
}

// Buscar tenant pelo user_id
export async function getTenantByUserId(userId: string): Promise<WhiteLabelTenant | null> {
  try {
    const centralSql = getCentralDb()
    const result = await centralSql`
      SELECT * FROM white_label_tenants 
      WHERE user_id = ${userId}
      LIMIT 1
    `
    return result[0] as WhiteLabelTenant || null
  } catch (error) {
    console.error("[White Label] Erro ao buscar tenant por user:", error)
    return null
  }
}

// Conectar no banco do tenant
export function getTenantDatabase(databaseUrl: string) {
  return neon(databaseUrl)
}

// Criar tabelas no banco do tenant
export async function setupTenantDatabase(databaseUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = neon(databaseUrl)
    
    // Tabela de perfis/usuarios
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        document TEXT,
        document_type TEXT DEFAULT 'cpf',
        password_hash TEXT,
        balance DECIMAL(10, 2) DEFAULT 0,
        balance_blocked DECIMAL(10, 2) DEFAULT 0,
        is_admin BOOLEAN DEFAULT false,
        is_blocked BOOLEAN DEFAULT false,
        kyc_status TEXT DEFAULT 'pending',
        api_key TEXT UNIQUE,
        webhook_url TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de transacoes
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id),
        type TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        fee DECIMAL(10, 2) DEFAULT 0,
        net_amount DECIMAL(10, 2),
        status TEXT DEFAULT 'pending',
        description TEXT,
        external_id TEXT,
        pix_key TEXT,
        pix_key_type TEXT,
        qr_code TEXT,
        qr_code_base64 TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        paid_at TIMESTAMP,
        expires_at TIMESTAMP
      )
    `
    
    // Tabela de saques
    await sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id),
        amount DECIMAL(10, 2) NOT NULL,
        fee DECIMAL(10, 2) DEFAULT 0,
        net_amount DECIMAL(10, 2),
        pix_key TEXT NOT NULL,
        pix_key_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        reject_reason TEXT,
        external_id TEXT,
        processed_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `
    
    // Tabela de checkouts
    await sql`
      CREATE TABLE IF NOT EXISTS checkouts (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id),
        name TEXT NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT true,
        allow_custom_amount BOOLEAN DEFAULT false,
        min_amount DECIMAL(10, 2),
        max_amount DECIMAL(10, 2),
        success_url TEXT,
        webhook_url TEXT,
        expires_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de produtos
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id),
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        stock INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de pedidos
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id),
        checkout_id TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        customer_document TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        fee DECIMAL(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        external_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        paid_at TIMESTAMP
      )
    `
    
    // Tabela de tickets de suporte
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de mensagens de tickets
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id),
        user_id TEXT,
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de logs de atividade
    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Tabela de configuracoes
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Indices
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key)`
    
    return { success: true }
  } catch (error: any) {
    console.error("[White Label] Erro ao criar tabelas:", error)
    return { success: false, error: error.message }
  }
}

// Testar conexao com banco
export async function testDatabaseConnection(databaseUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = neon(databaseUrl)
    await sql`SELECT 1`
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Adicionar dominio na Vercel
export async function addDomainToVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || "prj_sqHXdQStluMWobPT50zDa3cHSVoJ"
  const teamId = process.env.VERCEL_TEAM_ID || "team_wYjYiRjSpU7ErBQSMNlXIefT"
  
  if (!token) {
    return { success: false, error: "Token Vercel nao configurado" }
  }
  
  try {
    const response = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${teamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      // Se dominio ja existe, considerar sucesso
      if (data.error?.code === "domain_already_in_use" || data.error?.code === "domain_already_exists") {
        return { success: true }
      }
      return { success: false, error: data.error?.message || "Erro ao adicionar dominio" }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Remover dominio da Vercel
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || "prj_sqHXdQStluMWobPT50zDa3cHSVoJ"
  const teamId = process.env.VERCEL_TEAM_ID || "team_wYjYiRjSpU7ErBQSMNlXIefT"
  
  if (!token) {
    return { success: false, error: "Token Vercel nao configurado" }
  }
  
  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    
    if (!response.ok && response.status !== 404) {
      const data = await response.json()
      return { success: false, error: data.error?.message || "Erro ao remover dominio" }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Verificar status do dominio na Vercel
export async function checkDomainStatus(domain: string): Promise<{ configured: boolean; verified: boolean; error?: string }> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || "prj_sqHXdQStluMWobPT50zDa3cHSVoJ"
  const teamId = process.env.VERCEL_TEAM_ID || "team_wYjYiRjSpU7ErBQSMNlXIefT"
  
  if (!token) {
    return { configured: false, verified: false, error: "Token Vercel nao configurado" }
  }
  
  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    
    if (!response.ok) {
      return { configured: false, verified: false }
    }
    
    const data = await response.json()
    return { 
      configured: true, 
      verified: data.verified === true 
    }
  } catch (error: any) {
    return { configured: false, verified: false, error: error.message }
  }
}

// Gerar CSS customizado para o tenant
export function generateTenantCSS(tenant: WhiteLabelTenant): string {
  return `
    :root {
      --primary: ${tenant.primary_color};
      --secondary: ${tenant.secondary_color};
      --text-color: ${tenant.text_color};
    }
  `
}
