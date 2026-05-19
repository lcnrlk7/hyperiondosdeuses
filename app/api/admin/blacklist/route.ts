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

// Flag para evitar criar tabelas multiplas vezes
let tablesCreated = false

// Cria as tabelas automaticamente se nao existirem
async function ensureTablesExist() {
  if (tablesCreated) return
  
  try {
    const sql = getDb()
    
    // Criar tabela blacklist
    await sql`
      CREATE TABLE IF NOT EXISTS blacklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL CHECK (type IN ('cpf', 'email', 'ip', 'device', 'phone')),
        value VARCHAR(255) NOT NULL,
        reason VARCHAR(500) NOT NULL,
        notes TEXT,
        blocked_by VARCHAR(100),
        user_id UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(type, value)
      )
    `
    
    // Criar tabela de historico de hits
    await sql`
      CREATE TABLE IF NOT EXISTS blacklist_hits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blacklist_id UUID REFERENCES blacklist(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        path VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Criar tabela de historico de status
    await sql`
      CREATE TABLE IF NOT EXISTS status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        latency INTEGER,
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Criar indices
    await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_active ON blacklist(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_hits_created ON blacklist_hits(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_status_history_service ON status_history(service_id)`
    
    tablesCreated = true
  } catch (error) {
    console.error("Erro ao criar tabelas:", error)
  }
}

// Verifica se e admin/CEO
async function verifyAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("team_session")?.value

  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.role === "ceo" || payload.role === "admin" || payload.role === "manager"
  } catch {
    return false
  }
}

// GET - Lista todos os bloqueios
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  // Garante que as tabelas existem
  await ensureTablesExist()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // cpf, ip, email, device, phone
  const status = searchParams.get("status") // active, expired, all
  const search = searchParams.get("search")
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")

  try {
    const sql = getDb()

    // Query baseada nos filtros usando template literals
    let blocks
    
    if (type && type !== "all" && search) {
      // Filtro por tipo E busca
      const searchPattern = `%${search}%`
      if (status === "active") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.type = ${type}
          AND b.is_active = true AND (b.expires_at IS NULL OR b.expires_at > NOW())
          AND (b.value ILIKE ${searchPattern} OR b.reason ILIKE ${searchPattern})
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (status === "expired") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.type = ${type}
          AND (b.is_active = false OR (b.expires_at IS NOT NULL AND b.expires_at <= NOW()))
          AND (b.value ILIKE ${searchPattern} OR b.reason ILIKE ${searchPattern})
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.type = ${type}
          AND (b.value ILIKE ${searchPattern} OR b.reason ILIKE ${searchPattern})
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    } else if (type && type !== "all") {
      // Apenas filtro por tipo
      if (status === "active") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.type = ${type}
          AND b.is_active = true AND (b.expires_at IS NULL OR b.expires_at > NOW())
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (status === "expired") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.type = ${type}
          AND (b.is_active = false OR (b.expires_at IS NOT NULL AND b.expires_at <= NOW()))
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.type = ${type}
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    } else if (search) {
      // Apenas busca
      const searchPattern = `%${search}%`
      if (status === "active") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.is_active = true AND (b.expires_at IS NULL OR b.expires_at > NOW())
          AND (b.value ILIKE ${searchPattern} OR b.reason ILIKE ${searchPattern})
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (status === "expired") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE (b.is_active = false OR (b.expires_at IS NOT NULL AND b.expires_at <= NOW()))
          AND (b.value ILIKE ${searchPattern} OR b.reason ILIKE ${searchPattern})
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE (b.value ILIKE ${searchPattern} OR b.reason ILIKE ${searchPattern})
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    } else {
      // Sem filtros especificos
      if (status === "active") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE b.is_active = true AND (b.expires_at IS NULL OR b.expires_at > NOW())
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (status === "expired") {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          WHERE (b.is_active = false OR (b.expires_at IS NOT NULL AND b.expires_at <= NOW()))
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        blocks = await sql`
          SELECT 
            b.*,
            u.name as blocked_user_name,
            u.email as blocked_user_email,
            admin.name as blocked_by_name
          FROM blacklist b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN team_members admin ON b.blocked_by = admin.id
          ORDER BY b.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    }

    // Conta total
    const countResult = await sql`SELECT COUNT(*) as total FROM blacklist`
    const total = parseInt(countResult[0]?.total || "0")

    // Estatisticas
    const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())) as active_blocks,
        COUNT(*) FILTER (WHERE type = 'cpf') as cpf_blocks,
        COUNT(*) FILTER (WHERE type = 'ip') as ip_blocks,
        COUNT(*) FILTER (WHERE type = 'email') as email_blocks,
        COUNT(*) FILTER (WHERE type = 'device') as device_blocks,
        COUNT(*) FILTER (WHERE type = 'phone') as phone_blocks,
        COUNT(*) as total_blocks
      FROM blacklist
    `

    // Historico de hits (ultimos 7 dias)
    let hits: { date: string; hits: number }[] = []
    try {
      const hitsResult = await sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as hits
        FROM blacklist_hits
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `
      hits = hitsResult.map((row) => ({
        date: String(row.date),
        hits: Number(row.hits),
      }))
    } catch {
      // Tabela pode nao existir ainda
    }

    return NextResponse.json({
      blocks,
      total,
      stats: stats[0],
      hits,
    })
  } catch (error) {
    console.error("[Blacklist API] Erro ao listar:", error)
    return NextResponse.json(
      { error: "Erro ao buscar blacklist" },
      { status: 500 }
    )
  }
}

// POST - Adiciona novo bloqueio
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, value, reason, notes, expires_at, user_id, blocked_by } = body

    if (!type || !value || !reason) {
      return NextResponse.json(
        { error: "Tipo, valor e motivo sao obrigatorios" },
        { status: 400 }
      )
    }

    const validTypes = ["cpf", "ip", "email", "device", "phone"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo invalido. Use: cpf, ip, email, device, phone" },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Verifica se ja existe bloqueio ativo para este valor
    const existing = await sql`
      SELECT id FROM blacklist 
      WHERE type = ${type} 
      AND value = ${value} 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ja existe um bloqueio ativo para este valor" },
        { status: 409 }
      )
    }

    // Insere o bloqueio
    const result = await sql`
      INSERT INTO blacklist (type, value, reason, notes, expires_at, user_id, blocked_by, is_active, created_at)
      VALUES (${type}, ${value}, ${reason}, ${notes || null}, ${expires_at || null}, ${user_id || null}, ${blocked_by}, true, NOW())
      RETURNING *
    `

    // Se for bloqueio de usuario, marca o usuario como bloqueado
    if (user_id) {
      await sql`UPDATE users SET is_blocked = true, blocked_at = NOW(), blocked_reason = ${reason} WHERE id = ${user_id}`
    }

    // Se for IP, atualiza a tabela legada blocked_ips tambem
    if (type === "ip") {
      try {
        await sql`
          INSERT INTO blocked_ips (ip_address, reason, blocked_at)
          VALUES (${value}, ${reason}, NOW())
          ON CONFLICT (ip_address) DO UPDATE SET reason = ${reason}, blocked_at = NOW()
        `
      } catch {
        // Tabela pode nao existir
      }
    }

    return NextResponse.json({ success: true, block: result[0] })
  } catch (error) {
    console.error("[Blacklist API] Erro ao adicionar:", error)
    return NextResponse.json(
      { error: "Erro ao adicionar bloqueio" },
      { status: 500 }
    )
  }
}

// DELETE - Remove/desativa bloqueio
export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do bloqueio e obrigatorio" },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Busca o bloqueio antes de desativar
    const block = await sql`SELECT * FROM blacklist WHERE id = ${id}`

    if (block.length === 0) {
      return NextResponse.json(
        { error: "Bloqueio nao encontrado" },
        { status: 404 }
      )
    }

    // Desativa o bloqueio
    await sql`UPDATE blacklist SET is_active = false, updated_at = NOW() WHERE id = ${id}`

    // Se tinha usuario vinculado, verifica se pode desbloquear
    if (block[0].user_id) {
      // Verifica se tem outros bloqueios ativos para este usuario
      const otherBlocks = await sql`
        SELECT id FROM blacklist 
        WHERE user_id = ${block[0].user_id} 
        AND id != ${id}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      `

      if (otherBlocks.length === 0) {
        await sql`UPDATE users SET is_blocked = false, blocked_at = NULL, blocked_reason = NULL WHERE id = ${block[0].user_id}`
      }
    }

    // Se for IP, remove da tabela legada tambem
    if (block[0].type === "ip") {
      try {
        await sql`DELETE FROM blocked_ips WHERE ip_address = ${block[0].value}`
      } catch {
        // Tabela pode nao existir
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Blacklist API] Erro ao remover:", error)
    return NextResponse.json(
      { error: "Erro ao remover bloqueio" },
      { status: 500 }
    )
  }
}
