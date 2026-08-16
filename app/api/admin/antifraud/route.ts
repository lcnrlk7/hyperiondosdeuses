import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

const n = (v: unknown) => Number(v) || 0;

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    // Estatisticas de ataques (tabela pode estar vazia)
    let stats = { total: 0, blocked: 0, last24h: 0, critical: 0 };
    let bySeverity: { severity: string; count: number }[] = [];
    let byType: { attack_type: string; count: number }[] = [];
    let recent: Record<string, unknown>[] = [];

    try {
      const s = await sql`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE blocked = true) AS blocked,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last24h,
          COUNT(*) FILTER (WHERE severity = 'critical') AS critical
        FROM attack_logs
      `;
      stats = {
        total: n(s[0].total),
        blocked: n(s[0].blocked),
        last24h: n(s[0].last24h),
        critical: n(s[0].critical),
      };

      bySeverity = (
        await sql`SELECT severity, COUNT(*) AS count FROM attack_logs GROUP BY severity ORDER BY count DESC`
      ).map((r) => ({ severity: String(r.severity || "desconhecida"), count: n(r.count) }));

      byType = (
        await sql`SELECT attack_type, COUNT(*) AS count FROM attack_logs GROUP BY attack_type ORDER BY count DESC LIMIT 8`
      ).map((r) => ({ attack_type: String(r.attack_type || "outro"), count: n(r.count) }));

      recent = await sql`
        SELECT id, attack_type, ip_address, user_email, endpoint, severity, blocked, created_at
        FROM attack_logs
        ORDER BY created_at DESC
        LIMIT 30
      `;
    } catch {
      // attack_logs pode nao existir; mantem zeros
    }

    // Sinais de risco derivados de transacoes reais (indicadores uteis mesmo sem attack_logs)
    const risk = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'refused') AS refused,
        COUNT(*) FILTER (WHERE status IN ('refunded','chargeback','reversed')) AS refunded,
        COUNT(*) AS total
      FROM transactions
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;

    // Documentos com mais transacoes recusadas (heuristica antifraude sobre dados reais)
    const suspiciousDocs = await sql`
      SELECT payer_document AS document, COUNT(*) AS refused_count
      FROM transactions
      WHERE status = 'refused' AND payer_document IS NOT NULL AND payer_document <> ''
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY payer_document
      HAVING COUNT(*) >= 2
      ORDER BY refused_count DESC
      LIMIT 10
    `;

    return NextResponse.json(
      {
        stats,
        bySeverity,
        byType,
        recent,
        risk: {
          refused: n(risk[0].refused),
          refunded: n(risk[0].refunded),
          total: n(risk[0].total),
        },
        suspiciousDocs: suspiciousDocs.map((r) => ({
          document: String(r.document),
          refusedCount: n(r.refused_count),
        })),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[Antifraud API] erro:", error);
    return NextResponse.json({ error: "Erro ao carregar antifraude" }, { status: 500 });
  }
}
