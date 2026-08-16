import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

const SETTING_KEY = "platform_limits";

const DEFAULT_LIMITS = {
  minDeposit: 5,
  maxDepositPerTx: 5000,
  minWithdrawal: 20,
  maxWithdrawalPerTx: 10000,
  dailyWithdrawalLimit: 50000,
  maxTxPerDay: 200,
  autoApproveWithdrawalUnder: 500,
  holdNewAccountDays: 3,
};

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT UNIQUE NOT NULL,
      value JSONB,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const rows = await sql`SELECT value FROM system_settings WHERE key = ${SETTING_KEY}`;
    const limits = rows.length ? { ...DEFAULT_LIMITS, ...(rows[0].value as object) } : DEFAULT_LIMITS;
    return NextResponse.json({ limits }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Limits] erro GET:", error);
    return NextResponse.json({ error: "Erro ao carregar limites" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const body = await request.json();

    // Sanitiza: apenas chaves conhecidas, valores numericos nao-negativos
    const clean: Record<string, number> = {};
    for (const key of Object.keys(DEFAULT_LIMITS)) {
      const v = Number(body[key]);
      clean[key] = Number.isFinite(v) && v >= 0 ? v : DEFAULT_LIMITS[key as keyof typeof DEFAULT_LIMITS];
    }

    const existing = await sql`SELECT id FROM system_settings WHERE key = ${SETTING_KEY}`;
    if (existing.length) {
      await sql`UPDATE system_settings SET value = ${JSON.stringify(clean)}, updated_at = NOW() WHERE key = ${SETTING_KEY}`;
    } else {
      await sql`
        INSERT INTO system_settings (key, value, description, updated_at)
        VALUES (${SETTING_KEY}, ${JSON.stringify(clean)}, 'Limites globais da plataforma', NOW())
      `;
    }

    // Auditoria
    try {
      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
        VALUES (${crypto.randomUUID()}, ${admin.userId}, 'update_platform_limits', 'settings', ${SETTING_KEY}, ${JSON.stringify(clean)}, NOW())
      `;
    } catch {}

    return NextResponse.json({ success: true, limits: clean });
  } catch (error) {
    console.error("[Limits] erro PUT:", error);
    return NextResponse.json({ error: "Erro ao salvar limites" }, { status: 500 });
  }
}
