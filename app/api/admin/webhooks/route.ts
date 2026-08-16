import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { randomBytes } from "crypto";

const n = (v: unknown) => Number(v) || 0;

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      url TEXT NOT NULL,
      description TEXT,
      events JSONB DEFAULT '[]'::jsonb,
      secret TEXT,
      is_active BOOLEAN DEFAULT true,
      failure_count INTEGER DEFAULT 0,
      last_delivery_at TIMESTAMPTZ,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  tableReady = true;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const endpoints = await sql`
      SELECT id, url, description, events, is_active, failure_count, last_delivery_at, created_at
      FROM webhook_endpoints ORDER BY created_at DESC
    `;

    // Entregas reais recentes vindas de webhook_logs
    let deliveries: Record<string, unknown>[] = [];
    let stats = { total: 0, success: 0, failed: 0 };
    try {
      deliveries = await sql`
        SELECT id, url, response_status, success, attempts, created_at
        FROM webhook_logs
        ORDER BY created_at DESC
        LIMIT 30
      `;
      const s = await sql`
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE success = true) AS success,
               COUNT(*) FILTER (WHERE success = false) AS failed
        FROM webhook_logs
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;
      stats = { total: n(s[0].total), success: n(s[0].success), failed: n(s[0].failed) };
    } catch {
      deliveries = [];
    }

    return NextResponse.json({ endpoints, deliveries, stats }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Webhooks] erro GET:", error);
    return NextResponse.json({ error: "Erro ao listar webhooks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const { url, description, events } = await request.json();
    if (!url || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "URL válida é obrigatória" }, { status: 400 });
    }
    const secret = `whsec_${randomBytes(20).toString("hex")}`;
    const result = await sql`
      INSERT INTO webhook_endpoints (url, description, events, secret, created_by)
      VALUES (${url}, ${description || null}, ${JSON.stringify(events || [])}, ${secret}, ${admin.email})
      RETURNING id, url, description, events, is_active, created_at
    `;
    return NextResponse.json({ success: true, endpoint: result[0], secret });
  } catch (error) {
    console.error("[Webhooks] erro POST:", error);
    return NextResponse.json({ error: "Erro ao criar webhook" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    const { id, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    await sql`UPDATE webhook_endpoints SET is_active = ${!!is_active} WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhooks] erro PATCH:", error);
    return NextResponse.json({ error: "Erro ao atualizar webhook" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  try {
    await sql`DELETE FROM webhook_endpoints WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhooks] erro DELETE:", error);
    return NextResponse.json({ error: "Erro ao remover webhook" }, { status: 500 });
  }
}
