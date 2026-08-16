import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { createHash, randomBytes } from "crypto";

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'live',
      key_masked TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      scopes JSONB DEFAULT '[]'::jsonb,
      last_used_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    )
  `;
  tableReady = true;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const keys = await sql`
      SELECT id, name, environment, key_masked, scopes, last_used_at, is_active, created_by, created_at, revoked_at
      FROM api_keys ORDER BY created_at DESC
    `;
    return NextResponse.json({ keys }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[API Keys] erro GET:", error);
    return NextResponse.json({ error: "Erro ao listar chaves" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  try {
    await ensureTable();
    const { name, environment } = await request.json();
    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

    const env = environment === "test" ? "test" : "live";
    const raw = `sk_${env}_${randomBytes(24).toString("hex")}`;
    const masked = `${raw.slice(0, 10)}...${raw.slice(-4)}`;
    const hash = createHash("sha256").update(raw).digest("hex");

    const result = await sql`
      INSERT INTO api_keys (name, environment, key_masked, key_hash, created_by)
      VALUES (${name}, ${env}, ${masked}, ${hash}, ${admin.email})
      RETURNING id, name, environment, key_masked, is_active, created_at
    `;

    // A chave crua so e retornada nesta unica resposta.
    return NextResponse.json({ success: true, key: result[0], secret: raw });
  } catch (error) {
    console.error("[API Keys] erro POST:", error);
    return NextResponse.json({ error: "Erro ao criar chave" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  try {
    await sql`UPDATE api_keys SET is_active = false, revoked_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Keys] erro DELETE:", error);
    return NextResponse.json({ error: "Erro ao revogar chave" }, { status: 500 });
  }
}
