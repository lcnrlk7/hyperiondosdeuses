import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin, accessDeniedResponse } from "@/lib/admin-auth";

/**
 * Analytics de adquirentes (global da plataforma).
 * Retorna, por adquirente Medusa Online:
 *  - total de transações PIX de entrada
 *  - aprovadas (completed) e taxa de conversão
 *  - volume aprovado (R$)
 * E uma série diária dos últimos 14 dias por adquirente para o gráfico de linha.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return accessDeniedResponse();

  // Adquirentes Medusa Online (selecionáveis)
  const acquirers = await sql`
    SELECT id, name, badge, max_ticket
    FROM acquirers
    WHERE code LIKE 'medusa_online%' OR api_url LIKE '%medusapayments.online%'
    ORDER BY priority ASC
  `;
  const idList = acquirers.map((a) => a.id);

  // Resumo por adquirente (30 dias) — usa acquirer_id gravado no metadata da transação
  const summary = idList.length
    ? await sql`
        SELECT
          (t.metadata->>'acquirer_id') AS acquirer_id,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE t.status = 'completed')::int AS approved,
          COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed'), 0)::float AS volume
        FROM transactions t
        WHERE t.type = 'pix_in'
          AND t.created_at > NOW() - INTERVAL '30 days'
          AND (t.metadata->>'acquirer_id') = ANY(${idList})
        GROUP BY t.metadata->>'acquirer_id'
      `
    : [];

  const summaryMap = new Map(summary.map((s) => [s.acquirer_id, s]));

  const byAcquirer = acquirers.map((a) => {
    const s = summaryMap.get(a.id) as { total?: number; approved?: number; volume?: number } | undefined;
    const total = Number(s?.total || 0);
    const approved = Number(s?.approved || 0);
    return {
      id: a.id,
      name: a.name,
      badge: a.badge,
      maxTicket: Number(a.max_ticket) || 0,
      total,
      approved,
      volume: Number(s?.volume || 0),
      conversion: total > 0 ? Math.round((approved / total) * 1000) / 10 : 0,
    };
  });

  // Série diária (14 dias) por adquirente — total de transações por dia
  const daily = idList.length
    ? await sql`
        SELECT
          to_char(date_trunc('day', t.created_at), 'YYYY-MM-DD') AS day,
          (t.metadata->>'acquirer_id') AS acquirer_id,
          COUNT(*)::int AS total
        FROM transactions t
        WHERE t.type = 'pix_in'
          AND t.created_at > NOW() - INTERVAL '14 days'
          AND (t.metadata->>'acquirer_id') = ANY(${idList})
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `
    : [];

  // Monta série contínua de 14 dias com uma coluna por adquirente
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const nameById = new Map(acquirers.map((a) => [a.id, a.name]));
  const series = days.map((day) => {
    const row: Record<string, string | number> = { day };
    for (const a of acquirers) row[a.name] = 0;
    for (const d of daily) {
      if (d.day === day) {
        const name = nameById.get(d.acquirer_id);
        if (name) row[name] = Number(d.total);
      }
    }
    return row;
  });

  const totals = {
    transactions: byAcquirer.reduce((s, a) => s + a.total, 0),
    approved: byAcquirer.reduce((s, a) => s + a.approved, 0),
    volume: byAcquirer.reduce((s, a) => s + a.volume, 0),
  };

  return NextResponse.json({
    success: true,
    byAcquirer,
    series,
    acquirerNames: acquirers.map((a) => a.name),
    totals,
    mostUsed: [...byAcquirer].sort((a, b) => b.total - a.total)[0]?.name || null,
    bestConversion: [...byAcquirer].filter((a) => a.total > 0).sort((a, b) => b.conversion - a.conversion)[0]?.name || null,
  });
}
