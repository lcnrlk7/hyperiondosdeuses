import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

const n = (v: unknown) => Number(v) || 0;

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    let active: Record<string, unknown>[] = [];
    let logins: Record<string, unknown>[] = [];
    let stats = { activeSessions: 0, logins24h: 0, failed24h: 0, uniqueUsers: 0 };

    // Sessoes ativas (expires_at e text no schema; comparamos de forma segura)
    try {
      active = await sql`
        SELECT s.id, s.user_id, s.ip_address, s.user_agent, s.created_at, s.updated_at, s.expires_at,
               p.name AS user_name, p.email AS user_email
        FROM sessions s
        LEFT JOIN profiles p ON p.id = s.user_id
        ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC
        LIMIT 50
      `;
    } catch {
      active = [];
    }

    // Historico de login
    try {
      logins = await sql`
        SELECT lh.id, lh.user_id, lh.ip_address, lh.device_type, lh.browser, lh.location,
               lh.success, lh.created_at, p.name AS user_name, p.email AS user_email
        FROM login_history lh
        LEFT JOIN profiles p ON p.id = lh.user_id
        ORDER BY lh.created_at DESC
        LIMIT 50
      `;

      const s = await sql`
        SELECT
          COUNT(*) FILTER (WHERE success = true AND created_at > NOW() - INTERVAL '24 hours') AS logins24h,
          COUNT(*) FILTER (WHERE success = false AND created_at > NOW() - INTERVAL '24 hours') AS failed24h,
          COUNT(DISTINCT user_id) AS unique_users
        FROM login_history
      `;
      stats.logins24h = n(s[0].logins24h);
      stats.failed24h = n(s[0].failed24h);
      stats.uniqueUsers = n(s[0].unique_users);
    } catch {
      logins = [];
    }

    stats.activeSessions = active.length;

    return NextResponse.json(
      { active, logins, stats },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[Sessions API] erro:", error);
    return NextResponse.json({ error: "Erro ao carregar sessões" }, { status: 500 });
  }
}

// Revoga uma sessao especifica
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  try {
    await sql`DELETE FROM sessions WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sessions API] erro ao revogar:", error);
    return NextResponse.json({ error: "Erro ao revogar sessão" }, { status: 500 });
  }
}
