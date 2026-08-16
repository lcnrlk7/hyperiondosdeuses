import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic';

// Formatar valor em BRL
const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatar tempo relativo
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const transactionDate = new Date(date);
  const diffMs = now.getTime() - transactionDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "Ontem";
  return `${diffDays} dias atrás`;
};

export async function GET() {
  // Verificar se e admin FORA do try/catch para garantir que retorna 403
  const admin = await verifyAdmin();
  if (!admin) {
    console.log("[v0] admin/stats - acesso negado");
    return accessDeniedResponse();
  }
  
  try {
    const [
      totalUsersResult,
      pendingKYCResult,
      pendingWithdrawalsResult,
      revenueResult,
      feesResult,
      transactionsCountResult,
      completedTransactionsResult,
      pendingTransactionsResult,
      failedTransactionsResult,
      activeTodayResult,
      recentTransactions,
      recentUsers,
      timeSeriesResult,
      typeDistributionResult,
      // Periodo atual (ultimos 7 dias) vs periodo anterior (7 dias antes)
      volumeCurrentResult,
      volumePreviousResult,
      feesCurrentResult,
      feesPreviousResult,
      usersCurrentResult,
      usersPreviousResult,
      txCurrentResult,
      txPreviousResult,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM profiles`,
      sql`SELECT COUNT(*) as count FROM profiles WHERE kyc_status = 'pending'`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE type IN ('withdrawal', 'pix_out') AND status IN ('pending', 'processing')`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND type IN ('pix_in', 'deposit')`,
      sql`SELECT COALESCE(SUM(fee), 0) as total FROM transactions WHERE status = 'completed'`,
      sql`SELECT COUNT(*) as count FROM transactions`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE status IN ('pending', 'processing')`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE status IN ('failed', 'cancelled')`,
      sql`SELECT COUNT(DISTINCT user_id) as count FROM transactions WHERE created_at >= CURRENT_DATE`,
      sql`
        SELECT 
          t.id,
          t.user_id,
          t.type,
          t.amount,
          t.fee,
          t.net_amount,
          t.status,
          t.payer_name,
          t.created_at,
          p.name as user_name,
          p.email as user_email
        FROM transactions t
        LEFT JOIN profiles p ON t.user_id = p.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT id, name, email, kyc_status, created_at
        FROM profiles
        ORDER BY created_at DESC
        LIMIT 5
      `,
      // Serie temporal: volume, taxas e transacoes aprovadas por dia.
      // A janela de 7 dias e ancorada na data da transacao mais recente (nao em CURRENT_DATE),
      // garantindo que o grafico sempre mostre a atividade real mesmo que a ultima
      // transacao tenha sido ha alguns dias.
      sql`
        WITH anchor AS (
          SELECT COALESCE(MAX(created_at)::date, CURRENT_DATE) AS ref FROM transactions
        )
        SELECT 
          d.day::date as day,
          COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed' AND t.type IN ('pix_in', 'deposit')), 0) as volume,
          COALESCE(SUM(t.fee) FILTER (WHERE t.status = 'completed'), 0) as fees,
          COUNT(t.id) FILTER (WHERE t.status = 'completed') as approved
        FROM anchor a
        CROSS JOIN generate_series(a.ref - INTERVAL '6 days', a.ref, INTERVAL '1 day') d(day)
        LEFT JOIN transactions t ON t.created_at::date = d.day::date
        GROUP BY d.day
        ORDER BY d.day ASC
      `,
      // Distribuicao por tipo de operacao
      sql`
        SELECT type, COUNT(*) as count
        FROM transactions
        GROUP BY type
        ORDER BY count DESC
      `,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND type IN ('pix_in', 'deposit') AND created_at >= CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND type IN ('pix_in', 'deposit') AND created_at >= CURRENT_DATE - INTERVAL '13 days' AND created_at < CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COALESCE(SUM(fee), 0) as total FROM transactions WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COALESCE(SUM(fee), 0) as total FROM transactions WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '13 days' AND created_at < CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COUNT(*) as count FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COUNT(*) as count FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '13 days' AND created_at < CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '6 days'`,
      sql`SELECT COUNT(*) as count FROM transactions WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '13 days' AND created_at < CURRENT_DATE - INTERVAL '6 days'`,
    ])

    const totalFees = Number(feesResult[0]?.total) || 0;
    const totalVolume = Number(revenueResult[0]?.total) || 0;
    const completedTxCount = Number(completedTransactionsResult[0]?.count) || 0;

    // Calcular crescimento percentual (periodo atual vs anterior)
    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const growth = {
      volume: calcGrowth(Number(volumeCurrentResult[0]?.total) || 0, Number(volumePreviousResult[0]?.total) || 0),
      fees: calcGrowth(Number(feesCurrentResult[0]?.total) || 0, Number(feesPreviousResult[0]?.total) || 0),
      users: calcGrowth(Number(usersCurrentResult[0]?.count) || 0, Number(usersPreviousResult[0]?.count) || 0),
      transactions: calcGrowth(Number(txCurrentResult[0]?.count) || 0, Number(txPreviousResult[0]?.count) || 0),
    };

    // Labels amigaveis para tipos de operacao
    const typeLabels: Record<string, string> = {
      pix_in: "PIX Recebido",
      deposit: "Depósito",
      pix_out: "PIX Enviado",
      withdrawal: "Saque",
      transfer_in: "Transf. Entrada",
      transfer_out: "Transf. Saída",
    };

    const timeSeries = (timeSeriesResult as { day: string; volume: string; fees: string; approved: string }[]).map((row) => ({
      date: new Date(row.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      volume: Number(row.volume) || 0,
      fees: Number(row.fees) || 0,
      approved: Number(row.approved) || 0,
    }));

    const methodDistribution = (typeDistributionResult as { type: string; count: string }[]).map((row) => ({
      name: typeLabels[row.type] || row.type,
      value: Number(row.count) || 0,
    }));

    return NextResponse.json({
      stats: {
        totalRevenue: formatBRL(totalVolume),
        totalFees: formatBRL(totalFees),
        totalFeesRaw: totalFees,
        totalVolumeRaw: totalVolume,
        totalUsers: Number(totalUsersResult[0]?.count || 0),
        totalTransactions: Number(transactionsCountResult[0]?.count || 0),
        completedTransactions: completedTxCount,
        pendingTransactions: Number(pendingTransactionsResult[0]?.count || 0),
        failedTransactions: Number(failedTransactionsResult[0]?.count || 0),
        pendingKyc: Number(pendingKYCResult[0]?.count || 0),
        pendingWithdrawals: Number(pendingWithdrawalsResult[0]?.count || 0),
        activeToday: Number(activeTodayResult[0]?.count || 0),
        averageFeePercentage: totalVolume > 0 ? ((totalFees / totalVolume) * 100).toFixed(2) : "0.00",
        growth,
        growthRevenue: "+0%",
        growthUsers: "+0%",
        growthTransactions: "+0%"
      },
      timeSeries,
      methodDistribution,
      recentTransactions: recentTransactions.map((tx: { id: string; user_name: string | null; payer_name: string | null; user_email: string | null; amount: string; type: string; status: string; created_at: string }) => ({
        id: tx.id,
        user: tx.user_name || tx.payer_name || "Usuário",
        email: tx.user_email || "N/A",
        amount: formatBRL(Number(tx.amount)),
        type: tx.type === 'pix_in' || tx.type === 'deposit' ? 'deposit' : 'withdrawal',
        status: tx.status,
        time: formatRelativeTime(tx.created_at)
      })),
      recentUsers: recentUsers.map((user: { id: string; name: string | null; email: string; kyc_status: string; created_at: string }) => ({
        id: user.id,
        name: user.name || "Sem nome",
        email: user.email,
        status: user.kyc_status === 'approved' ? 'active' : 'pending_kyc',
        joined: formatRelativeTime(user.created_at)
      })),
      // Legacy fields for compatibility
      totalUsers: Number(totalUsersResult[0]?.count || 0),
      pendingKYC: Number(pendingKYCResult[0]?.count || 0),
      todayNotes: 0,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      stats: {
        totalRevenue: "R$ 0,00",
        totalUsers: 0,
        totalTransactions: 0,
        activeToday: 0,
        growthRevenue: "+0%",
        growthUsers: "+0%",
        growthTransactions: "+0%"
      },
      recentTransactions: [],
      recentUsers: [],
      totalUsers: 0, 
      pendingKYC: 0, 
      todayNotes: 0 
    })
  }
}
