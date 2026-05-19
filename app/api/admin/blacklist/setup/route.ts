import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// Rota para criar as tabelas de blacklist (execute uma vez)
export async function POST() {
  try {
    const sql = getDb()

    // Tabela principal de blacklist
    await sql`
      CREATE TABLE IF NOT EXISTS blacklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL CHECK (type IN ('cpf', 'ip', 'email', 'device', 'phone')),
        value VARCHAR(255) NOT NULL,
        reason VARCHAR(500) NOT NULL,
        notes TEXT,
        user_id UUID,
        blocked_by UUID,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Indices
    await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_type_value ON blacklist(type, value)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_active ON blacklist(is_active) WHERE is_active = true`

    // Tabela de hits
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

    // Garante que a tabela blocked_ips existe (compatibilidade)
    await sql`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address VARCHAR(45) UNIQUE NOT NULL,
        reason VARCHAR(500),
        blocked_at TIMESTAMP DEFAULT NOW()
      )
    `

    return NextResponse.json({ success: true, message: "Tabelas criadas com sucesso" })
  } catch (error) {
    console.error("[Setup Blacklist] Erro:", error)
    return NextResponse.json(
      { error: "Erro ao criar tabelas", details: String(error) },
      { status: 500 }
    )
  }
}

// GET para verificar status
export async function GET() {
  try {
    const sql = getDb()
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('blacklist', 'blacklist_hits', 'blocked_ips')
    `

    return NextResponse.json({
      tables: tables.map(t => t.table_name),
      configured: tables.length === 3,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao verificar tabelas", details: String(error) },
      { status: 500 }
    )
  }
}
