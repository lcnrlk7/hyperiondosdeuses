import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

const n = (v: unknown) => Number(v) || 0;

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    let integrations: Record<string, unknown>[] = [];
    let stats = { total: 0, active: 0 };
    try {
      integrations = await sql`
        SELECT ui.id, ui.name, ui.description, ui.website_url, ui.client_id,
               ui.webhook_url, ui.is_active, ui.created_at,
               p.name AS owner_name, p.email AS owner_email
        FROM user_integrations ui
        LEFT JOIN profiles p ON p.id::text = ui.user_id
        ORDER BY ui.created_at DESC
        LIMIT 100
      `;
      const s = await sql`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active = true) AS active
        FROM user_integrations
      `;
      stats = { total: n(s[0].total), active: n(s[0].active) };
    } catch {
      integrations = [];
    }

    // Adquirentes conectados (integracoes de gateway reais)
    let acquirers: Record<string, unknown>[] = [];
    try {
      acquirers = await sql`
        SELECT id, name, code, is_active, health_status, priority, route_type
        FROM acquirers ORDER BY priority ASC NULLS LAST, name ASC
      `;
    } catch {
      acquirers = [];
    }

    return NextResponse.json({ integrations, acquirers, stats }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Integrations] erro GET:", error);
    return NextResponse.json({ error: "Erro ao listar integrações" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    const { id, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    await sql`UPDATE user_integrations SET is_active = ${!!is_active}, updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Integrations] erro PATCH:", error);
    return NextResponse.json({ error: "Erro ao atualizar integração" }, { status: 500 });
  }
}
