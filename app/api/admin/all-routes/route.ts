import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

export async function GET() {
  try {
    const sql = getDb()
    
    const routes = await sql`
      SELECT name, route_type, fee_percentage, fixed_fee, fee_is_percentage, 
             withdrawal_fee, withdrawal_fee_is_percentage, min_deposit, max_withdrawal
      FROM acquirers 
      ORDER BY route_type, name
    `
    
    return NextResponse.json({ routes })
  } catch (error) {
    console.error("Erro ao buscar rotas:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
