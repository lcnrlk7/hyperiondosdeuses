import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { requireAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { MedusaOnline } from "@/lib/acquirers/medusa-online";

/**
 * Monta a URL publica do webhook receptor da Medusa Online.
 * Prioriza o dominio de producao configurado; senao usa o host da requisicao.
 */
function buildWebhookUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const base = configured
    ? configured.replace(/\/+$/, "")
    : (() => {
        const proto = request.headers.get("x-forwarded-proto") || "https";
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
        return `${proto}://${host}`;
      })();
  return `${base}/api/webhooks/medusa-online`;
}

// GET: retorna o link do webhook e o status de registro por adquirente
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return accessDeniedResponse();

  const webhookUrl = buildWebhookUrl(request);

  const acquirers = await sql`
    SELECT id, name, code, webhook_registered_at, webhook_secret
    FROM acquirers
    WHERE code LIKE 'medusa_online%' OR api_url LIKE '%medusapayments.online%'
    ORDER BY priority ASC
  `;

  return NextResponse.json({
    success: true,
    webhookUrl,
    acquirers: acquirers.map((a) => ({
      id: a.id,
      name: a.name,
      registered: Boolean(a.webhook_registered_at),
      registeredAt: a.webhook_registered_at,
      hasSecret: Boolean(a.webhook_secret),
    })),
  });
}

// POST: registra a URL de webhook em todas (ou uma) adquirente(s) Medusa Online
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return accessDeniedResponse();

  const body = await request.json().catch(() => ({}));
  const { acquirerId } = body as { acquirerId?: string };
  const webhookUrl = buildWebhookUrl(request);

  const acquirers = acquirerId
    ? await sql`SELECT id, name, api_key, api_url, webhook_secret FROM acquirers WHERE id = ${acquirerId} LIMIT 1`
    : await sql`SELECT id, name, api_key, api_url, webhook_secret FROM acquirers WHERE code LIKE 'medusa_online%' OR api_url LIKE '%medusapayments.online%'`;

  const results: Array<{ id: string; name: string; ok: boolean; error?: string }> = [];

  for (const acq of acquirers) {
    const secret = acq.webhook_secret || crypto.randomBytes(32).toString("hex");
    const client = new MedusaOnline({ apiKey: acq.api_key, baseUrl: acq.api_url });
    const res = await client.registerWebhook(webhookUrl, secret);

    if (res.success) {
      await sql`
        UPDATE acquirers
        SET webhook_secret = ${secret}, webhook_registered_at = NOW(), updated_at = NOW()
        WHERE id = ${acq.id}
      `;
    }
    results.push({ id: acq.id, name: acq.name, ok: res.success, error: res.error });
  }

  return NextResponse.json({ success: results.every((r) => r.ok), webhookUrl, results });
}
