import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { MedusaOnline, isMedusaOnline } from "@/lib/acquirers/medusa-online";

/**
 * Consulta o saldo (disponível/bloqueado) das adquirentes Medusa Online.
 * GET  -> consulta todas as adquirentes Medusa Online
 * POST -> consulta uma adquirente específica { acquirerId }
 */
async function fetchBalance(acquirer: Record<string, any>) {
  if (!isMedusaOnline(acquirer) || !acquirer.api_key) {
    return { id: acquirer.id, supported: false as const };
  }
  try {
    const client = new MedusaOnline({ apiKey: acquirer.api_key, baseUrl: acquirer.api_url });
    const result = await client.getBalance();
    if (!result.success) {
      return { id: acquirer.id, supported: true as const, ok: false as const, error: result.error };
    }
    return {
      id: acquirer.id,
      supported: true as const,
      ok: true as const,
      available: result.available ?? 0,
      blocked: result.blocked ?? 0,
    };
  } catch (error) {
    return {
      id: acquirer.id,
      supported: true as const,
      ok: false as const,
      error: error instanceof Error ? error.message : "Erro ao consultar saldo",
    };
  }
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const acquirers = await sql`
      SELECT id, name, code, api_url, api_key
      FROM acquirers
      WHERE api_url ILIKE '%medusapayments.online%'
      ORDER BY priority ASC
    `;

    const balances = await Promise.all(acquirers.map((a) => fetchBalance(a as Record<string, any>)));
    return NextResponse.json({ success: true, balances });
  } catch (error) {
    console.error("[admin/acquirers/balance] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const { acquirerId } = await request.json();
    if (!acquirerId) {
      return NextResponse.json({ success: false, error: "acquirerId obrigatório" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM acquirers WHERE id = ${acquirerId} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Adquirente não encontrada" }, { status: 404 });
    }

    const balance = await fetchBalance(rows[0] as Record<string, any>);
    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error("[admin/acquirers/balance] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 },
    );
  }
}
