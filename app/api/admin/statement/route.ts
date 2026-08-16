import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const INCOMING = ["pix_in", "deposit", "transfer_in"];
const APPROVED = ["completed", "approved", "paid"];

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10), 7), 90);

    // Entradas aprovadas por dia (bruto, taxa, liquido)
    const inflow = await sql`
      SELECT to_char(date_trunc('day', COALESCE(paid_at, created_at)), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(amount),0) AS gross,
             COALESCE(SUM(fee),0) AS fees,
             COALESCE(SUM(net_amount),0) AS net,
             COUNT(*) AS count
      FROM transactions
      WHERE type = ANY(${INCOMING}) AND status = ANY(${APPROVED})
        AND COALESCE(paid_at, created_at) >= date_trunc('day', now()) - (${days - 1} || ' days')::interval
      GROUP BY day
    `;

    // Estornos por dia
    const refunds = await sql`
      SELECT to_char(date_trunc('day', updated_at), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(net_amount),0) AS net, COUNT(*) AS count
      FROM transactions
      WHERE status IN ('refunded','chargeback','reversed')
        AND updated_at >= date_trunc('day', now()) - (${days - 1} || ' days')::interval
      GROUP BY day
    `;

    // Saques por dia
    let withdrawalsDaily: Record<string, unknown>[] = [];
    try {
      withdrawalsDaily = await sql`
        SELECT to_char(date_trunc('day', COALESCE(completed_at, created_at)), 'YYYY-MM-DD') AS day,
               COALESCE(SUM(net_amount),0) AS net, COUNT(*) AS count
        FROM withdrawals
        WHERE COALESCE(completed_at, created_at) >= date_trunc('day', now()) - (${days - 1} || ' days')::interval
        GROUP BY day
      `;
    } catch {
      withdrawalsDaily = [];
    }

    // Montar mapa de dias
    const map = new Map<string, {
      day: string; inGross: number; fees: number; inNet: number; inCount: number;
      refunds: number; refundCount: number; withdrawals: number; withdrawalCount: number;
    }>();

    const ensure = (day: string) => {
      if (!map.has(day)) {
        map.set(day, {
          day, inGross: 0, fees: 0, inNet: 0, inCount: 0,
          refunds: 0, refundCount: 0, withdrawals: 0, withdrawalCount: 0,
        });
      }
      return map.get(day)!;
    };

    for (const r of inflow as Record<string, unknown>[]) {
      const row = ensure(String(r.day));
      row.inGross = Number(r.gross);
      row.fees = Number(r.fees);
      row.inNet = Number(r.net);
      row.inCount = Number(r.count);
    }
    for (const r of refunds as Record<string, unknown>[]) {
      const row = ensure(String(r.day));
      row.refunds = Number(r.net);
      row.refundCount = Number(r.count);
    }
    for (const r of withdrawalsDaily) {
      const row = ensure(String(r.day));
      row.withdrawals = Number(r.net);
      row.withdrawalCount = Number(r.count);
    }

    const ledger = Array.from(map.values())
      .map((r) => ({
        ...r,
        // saldo do dia = entradas liquidas - taxas ja embutidas no net? net ja e liquido.
        net: r.inNet - r.refunds - r.withdrawals,
      }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));

    // Saldos consolidados
    const totals = await sql`
      SELECT
        COALESCE(SUM(net_amount) FILTER (WHERE type = ANY(${INCOMING}) AND status = ANY(${APPROVED})),0) AS received_net,
        COALESCE(SUM(net_amount) FILTER (WHERE type = ANY(${INCOMING}) AND status IN ('pending','processing','created')),0) AS pending_net,
        COALESCE(SUM(net_amount) FILTER (WHERE status IN ('refunded','chargeback','reversed')),0) AS refunded_net
      FROM transactions
    `;

    let withdrawnTotal = 0;
    try {
      const wd = await sql`SELECT COALESCE(SUM(net_amount),0) AS total FROM withdrawals WHERE status IN ('completed','approved','paid')`;
      withdrawnTotal = Number(wd[0]?.total || 0);
    } catch {
      withdrawnTotal = 0;
    }

    const receivedNet = Number(totals[0].received_net);
    const pendingNet = Number(totals[0].pending_net);
    const refundedNet = Number(totals[0].refunded_net);
    const available = receivedNet - refundedNet - withdrawnTotal;

    return NextResponse.json(
      {
        ledger,
        balances: {
          available,
          pending: pendingNet,
          total: available + pendingNet,
          received: receivedNet,
          refunded: refundedNet,
          withdrawn: withdrawnTotal,
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Error fetching statement:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
