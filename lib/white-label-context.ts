// Context Provider para White Label
// Detecta o tenant pelo dominio e fornece configuracoes para toda a aplicacao

import { neon } from "@neondatabase/serverless"
import { WhiteLabelTenant } from "./white-label"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// Cache simples em memoria para evitar consultas repetidas
const tenantCache = new Map<string, { tenant: WhiteLabelTenant | null; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minuto

export async function getTenantFromDomain(domain: string): Promise<WhiteLabelTenant | null> {
  // Verificar cache
  const cached = tenantCache.get(domain)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tenant
  }
  
  try {
    const sql = getDb()
    const result = await sql`
      SELECT * FROM white_label_tenants 
      WHERE (domain_app = ${domain} OR domain_admin = ${domain})
      AND is_active = true
      LIMIT 1
    `
    
    const tenant = result[0] as WhiteLabelTenant || null
    
    // Salvar no cache
    tenantCache.set(domain, { tenant, timestamp: Date.now() })
    
    return tenant
  } catch (error) {
    console.error("[White Label Context] Erro ao buscar tenant:", error)
    return null
  }
}

// Verificar se dominio e um dominio White Label
export async function isWhiteLabelDomain(domain: string): Promise<boolean> {
  const tenant = await getTenantFromDomain(domain)
  return tenant !== null
}

// Verificar se e dominio de admin
export async function isAdminDomain(domain: string): Promise<boolean> {
  const tenant = await getTenantFromDomain(domain)
  return tenant?.domain_admin === domain
}

// Limpar cache (chamar quando tenant for atualizado)
export function clearTenantCache(domain?: string) {
  if (domain) {
    tenantCache.delete(domain)
  } else {
    tenantCache.clear()
  }
}
