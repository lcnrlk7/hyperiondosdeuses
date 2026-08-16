import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const INCOMING = ["pix_in", "deposit", "transfer_in"];
const APPROVED = ["completed", "approved", "paid"];

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    // Recebido hoje
    const today = await sql`
      SELECT COALESCE(SUM(amount),0) AS gross, COALESCE(SUM(net_amount),0) AS net,
             COALESCE(SUM(fee),0) AS fees, COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING}) AND status = ANY(${APPROVED})
        AND COALESCE(paid_at, created_at) >= date_trunc('day', now())
    `;

    // Recebido ontem
    const yesterday = await sql`
      SELECT COALESCE(SUM(amount),0) AS gross, COALESCE(SUM(net_amount),0) AS net,
             COALESCE(SUM(fee),0) AS fees, COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING}) AND status = ANY(${APPROVED})
        AND COALESCE(paid_at, created_at) >= date_trunc('day', now()) - interval '1 day'
        AND COALESCE(paid_at, created_at) < date_trunc('day', now())
    `;

    // Recebido no mes
    const month = await sql`
      SELECT COALESCE(SUM(amount),0) AS gross, COALESCE(SUM(net_amount),0) AS net,
             COALESCE(SUM(fee),0) AS fees, COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING}) AND status = ANY(${APPROVED})
        AND COALESCE(paid_at, created_at) >= date_trunc('month', now())
    `;

    // A receber (pendentes de entrada)
    const pending = await sql`
      SELECT COALESCE(SUM(amount),0) AS gross, COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING}) AND status IN ('pending','processing','created')
    `;

    // Breakdown por status (entradas)
    const byStatus = await sql`
      SELECT status, COALESCE(SUM(amount),0) AS gross, COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING})
      GROUP BY status
      ORDER BY gross DESC
    `;

    // Serie diaria dos ultimos 14 dias
    const daily = await sql`
      SELECT to_char(date_trunc('day', COALESCE(paid_at, created_at)), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(amount),0) AS gross, COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING}) AND status = ANY(${APPROVED})
        AND COALESCE(paid_at, created_at) >= date_trunc('day', now()) - interval '13 days'
      GROUP BY day
      ORDER BY day ASC
    `;

    // Ultimos recebimentos aprovados
    const recent = await sql`
      SELECT t.id, t.amount, t.net_amount, t.fee, t.status, t.type,
             t.created_at, t.paid_at,
             p.name AS user_name, p.email AS user_email
      FROM transactions t
      LEFT JOIN profiles p ON p.id = t.user_id
      WHERE t.type = ANY(${INCOMING}) AND t.status = ANY(${APPROVED})
      ORDER BY COALESCE(t.paid_at, t.created_at) DESC
      LIMIT 15
    `;

    const n = (v: unknown) => Number(v) || 0;

    return NextResponse.json(
      {
        summary: {
          today: {
            count: n(today[0].count),
            gross: n(today[0].gross),
            net: n(today[0].net),
            fees: n(today[0].fees),
          },
          yesterday: {
            count: n(yesterday[0].count),
            gross: n(yesterday[0].gross),
            net: n(yesterday[0].net),
            fees: n(yesterday[0].fees),
          },
          month: {
            count: n(month[0].count),
            gross: n(month[0].gross),
            net: n(month[0].net),
            fees: n(month[0].fees),
          },
          pending: {
            count: n(pending[0].count),
            amount: n(pending[0].gross),
          },
        },
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: n(s.count),
          amount: n(s.gross),
        })),
        daily,
        recent,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Error fetching receivables:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
