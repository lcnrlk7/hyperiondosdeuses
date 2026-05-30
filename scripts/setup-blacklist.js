// Script para criar as tabelas de blacklist no banco de dados
// Execute com: node --env-file-if-exists=/vercel/share/.env.project scripts/setup-blacklist.js

const { neon } = require("@neondatabase/serverless")

async function setupBlacklist() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("Criando tabela blacklist...")

  // Tabela principal de blacklist
  await sql`
    CREATE TABLE IF NOT EXISTS blacklist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(20) NOT NULL CHECK (type IN ('cpf', 'ip', 'email', 'device', 'phone')),
      value VARCHAR(255) NOT NULL,
      reason VARCHAR(500) NOT NULL,
      notes TEXT,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      blocked_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT true,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Indice para buscas rapidas
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_type_value ON blacklist(type, value)`
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_active ON blacklist(is_active) WHERE is_active = true`
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_user ON blacklist(user_id) WHERE user_id IS NOT NULL`

  console.log("Criando tabela blacklist_hits...")

  // Tabela de hits (quando alguem bloqueado tenta acessar)
  await sql`
    CREATE TABLE IF NOT EXISTS blacklist_hits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      blacklist_id UUID REFERENCES blacklist(id) ON DELETE CASCADE,
      ip VARCHAR(45),
      user_agent TEXT,
      path VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_hits_date ON blacklist_hits(created_at)`
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_hits_block ON blacklist_hits(blacklist_id)`

  console.log("Adicionando colunas de bloqueio na tabela users...")

  // Adiciona colunas de bloqueio na tabela users (se nao existir)
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(500)
  `

  console.log("Verificando tabela blocked_ips existente...")

  // Garante que a tabela blocked_ips existe (compatibilidade)
  await sql`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_address VARCHAR(45) UNIQUE NOT NULL,
      reason VARCHAR(500),
      blocked_at TIMESTAMP DEFAULT NOW()
    )
  `

  console.log("Setup concluido com sucesso!")
}

setupBlacklist().catch(console.error)
