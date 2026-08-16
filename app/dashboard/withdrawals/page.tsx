import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { WithdrawalsContent, Withdrawal } from "@/components/dashboard/withdrawals-content";

export default async function WithdrawalsPage() {
  const session = await getSession();

  if (!session) {
    return <WithdrawalsContent withdrawals={[]} />;
  }

  let withdrawals: any[] = [];
  try {
    withdrawals = await sql`
      SELECT id, amount, fee, net_amount, pix_key, pix_key_type, status, rejection_reason, created_at
      FROM withdrawals
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;
  } catch (e) {
    console.error("[v0] Error fetching withdrawals:", e);
  }

  return <WithdrawalsContent withdrawals={(withdrawals || []) as Withdrawal[]} />;
}
