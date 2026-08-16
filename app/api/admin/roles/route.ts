import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import {
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  ROLE_DEFS,
} from "@/lib/permissions-catalog";

const SETTING_KEY = "rbac_roles";

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
    const stored = rows.length ? (rows[0].value as Record<string, Record<string, boolean>>) : null;

    // Mescla defaults + armazenados (garante que cargos/permissoes novos aparecam)
    const roles: Record<string, Record<string, boolean>> = {};
    for (const def of ROLE_DEFS) {
      const base = DEFAULT_ROLE_PERMISSIONS[def.key] || {};
      const saved = stored?.[def.key] || {};
      roles[def.key] = Object.fromEntries(
        ALL_PERMISSION_KEYS.map((k) => [k, def.editable ? (saved[k] ?? base[k] ?? false) : true])
      );
    }

    // Contagem de membros por cargo (dados reais)
    let counts: Record<string, number> = {};
    try {
      const rc = await sql`SELECT role, COUNT(*) AS c FROM team_members WHERE is_active = true GROUP BY role`;
      counts = Object.fromEntries(rc.map((r) => [String(r.role), Number(r.c)]));
    } catch {}

    return NextResponse.json({ roles, counts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Roles] erro GET:", error);
    return NextResponse.json({ error: "Erro ao carregar cargos" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const { roleKey, permissions } = await request.json();

    const def = ROLE_DEFS.find((r) => r.key === roleKey);
    if (!def) return NextResponse.json({ error: "Cargo inválido" }, { status: 400 });
    if (!def.editable) return NextResponse.json({ error: "Este cargo não pode ser editado" }, { status: 400 });

    // Carrega o estado atual e atualiza apenas o cargo enviado
    const rows = await sql`SELECT value FROM system_settings WHERE key = ${SETTING_KEY}`;
    const current = rows.length ? (rows[0].value as Record<string, Record<string, boolean>>) : {};

    const clean: Record<string, boolean> = {};
    for (const k of ALL_PERMISSION_KEYS) clean[k] = !!permissions?.[k];
    current[roleKey] = clean;

    if (rows.length) {
      await sql`UPDATE system_settings SET value = ${JSON.stringify(current)}, updated_at = NOW() WHERE key = ${SETTING_KEY}`;
    } else {
      await sql`
        INSERT INTO system_settings (key, value, description, updated_at)
        VALUES (${SETTING_KEY}, ${JSON.stringify(current)}, 'Permissões por cargo (RBAC)', NOW())
      `;
    }

    // Propaga as novas permissoes aos membros ativos deste cargo
    try {
      await sql`
        UPDATE team_members SET permissions = ${JSON.stringify(clean)}, updated_at = NOW()
        WHERE role = ${roleKey}
      `;
    } catch {}

    // Auditoria
    try {
      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
        VALUES (${crypto.randomUUID()}, ${admin.userId}, 'update_role_permissions', 'role', ${roleKey}, ${JSON.stringify(clean)}, NOW())
      `;
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Roles] erro PUT:", error);
    return NextResponse.json({ error: "Erro ao salvar permissões" }, { status: 500 });
  }
}
