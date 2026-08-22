import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getJwtSecret } from "@/lib/jwt-secret"
import { testDatabaseConnection, setupTenantDatabase } from "@/lib/white-label"

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

// POST - Testar conexao com banco
export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const sql = getDb()
    const { database_url, action } = await request.json()
    
    if (!database_url) {
      return NextResponse.json({ error: "URL do banco e obrigatoria" }, { status: 400 })
    }
    
    // Testar conexao
    const testResult = await testDatabaseConnection(database_url)
    
    if (!testResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: `Falha ao conectar: ${testResult.error}` 
      }, { status: 400 })
    }
    
    // Se action = setup, criar tabelas
    if (action === "setup") {
      const setupResult = await setupTenantDatabase(database_url)
      
      if (!setupResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: `Falha ao criar tabelas: ${setupResult.error}` 
        }, { status: 400 })
      }
      
      // Atualizar tenant
      await sql`
        UPDATE white_label_tenants
        SET database_configured = true, database_url = ${database_url}, updated_at = NOW()
        WHERE user_id = ${userId}
      `
      
      return NextResponse.json({ 
        success: true, 
        message: "Banco conectado e tabelas criadas com sucesso" 
      })
    }
    
    return NextResponse.json({ success: true, message: "Conexao bem sucedida" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
