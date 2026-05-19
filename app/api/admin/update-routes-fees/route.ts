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
    const sql = getDb();
    const results: string[] = [];

    // Atualizar todas as rotas BLACK para 5% deposito + 5% saque
    const black = await sql`
      UPDATE acquirers 
      SET fee_percentage = 5, 
          fixed_fee = 0,
          fee_is_percentage = true,
          withdrawal_fee = 5,
          withdrawal_fee_is_percentage = true,
          updated_at = NOW()
      WHERE LOWER(route_type) = 'black'
      RETURNING name, route_type, fee_percentage, fixed_fee, withdrawal_fee, withdrawal_fee_is_percentage
    `;
    results.push(`Rotas BLACK atualizadas: ${black.length}`);

    // Atualizar todas as rotas WHITE para 2% + R$0.70 fixo deposito + 2% saque
    const white = await sql`
      UPDATE acquirers 
      SET fee_percentage = 2, 
          fixed_fee = 0.70,
          fee_is_percentage = true,
          withdrawal_fee = 2,
          withdrawal_fee_is_percentage = true,
          updated_at = NOW()
      WHERE LOWER(route_type) = 'white'
      RETURNING name, route_type, fee_percentage, fixed_fee, withdrawal_fee, withdrawal_fee_is_percentage
    `;
    results.push(`Rotas WHITE atualizadas: ${white.length}`);

    // Verificar usuarios por rota
    const usersBlack = await sql`
      SELECT email FROM profiles WHERE LOWER(route_type) = 'black'
    `;
    results.push(`Usuarios na rota BLACK: ${usersBlack.length}`);

    const usersWhite = await sql`
      SELECT email FROM profiles WHERE LOWER(route_type) = 'white'
    `;
    results.push(`Usuarios na rota WHITE: ${usersWhite.length}`);

    // Verificar resultado final
    const allRoutes = await sql`
      SELECT name, route_type, fee_percentage, fixed_fee, withdrawal_fee, withdrawal_fee_is_percentage 
      FROM acquirers 
      ORDER BY route_type, name
    `;

    return NextResponse.json({
      success: true,
      results,
      routes: allRoutes,
      blackRoutes: black,
      whiteRoutes: white
    });
  } catch (error) {
    console.error("Erro ao atualizar taxas:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
