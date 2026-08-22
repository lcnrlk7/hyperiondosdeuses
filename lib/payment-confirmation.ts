import { sql } from '@/lib/db'

export interface PaymentConfirmationResult {
  credited: boolean
  transactionId: string
  userId?: string
  grossAmount?: number
  netAmount?: number
  newBalance?: number
  previousStatus?: string
}

/**
 * Atomically transitions a payment and credits its owner exactly once.
 *
 * The conditional UPDATE is the idempotency gate. Status transition, balance
 * credit and audit record execute as one PostgreSQL statement, so concurrent
 * webhook, polling and cron requests cannot credit the same transaction twice.
 */
export async function confirmPaymentAtomically(
  transactionId: string,
  source: string,
  paidAt?: string | null,
): Promise<PaymentConfirmationResult> {
  const auditId = crypto.randomUUID()
  const rows = await sql`
    WITH transitioned AS (
      UPDATE transactions
      SET status = 'completed',
          paid_at = COALESCE(paid_at, ${paidAt || null}::timestamptz, NOW()),
          updated_at = NOW()
      WHERE id = ${transactionId}
        AND status IN ('pending', 'processing')
      RETURNING id, user_id, amount, fee, net_amount, status
    ), credited AS (
      UPDATE profiles p
      SET balance = p.balance + ROUND(COALESCE(t.net_amount, t.amount - COALESCE(t.fee, 0))::numeric, 2),
          updated_at = NOW()
      FROM transitioned t
      WHERE p.id = t.user_id
      RETURNING p.id AS user_id, p.balance AS new_balance
    ), audited AS (
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
      SELECT ${auditId}, t.user_id, 'PAYMENT_CONFIRMED', 'transaction', t.id,
             jsonb_build_object(
               'amount', t.amount,
               'net_amount', ROUND(COALESCE(t.net_amount, t.amount - COALESCE(t.fee, 0))::numeric, 2),
               'new_balance', c.new_balance,
               'source', ${source}
             ), NOW()
      FROM transitioned t
      JOIN credited c ON c.user_id = t.user_id
      RETURNING entity_id
    )
    SELECT t.id, t.user_id, t.amount,
           ROUND(COALESCE(t.net_amount, t.amount - COALESCE(t.fee, 0))::numeric, 2) AS net_amount,
           c.new_balance
    FROM transitioned t
    JOIN credited c ON c.user_id = t.user_id
    JOIN audited a ON a.entity_id = t.id
  `

  if (rows.length === 0) {
    const existing = await sql`
      SELECT id, user_id, amount, net_amount, status
      FROM transactions
      WHERE id = ${transactionId}
      LIMIT 1
    `
    return {
      credited: false,
      transactionId,
      userId: existing[0]?.user_id,
      grossAmount: existing[0] ? Number(existing[0].amount) : undefined,
      netAmount: existing[0] ? Number(existing[0].net_amount) : undefined,
      previousStatus: existing[0]?.status,
    }
  }

  return {
    credited: true,
    transactionId: rows[0].id as string,
    userId: rows[0].user_id as string,
    grossAmount: Number(rows[0].amount),
    netAmount: Number(rows[0].net_amount),
    newBalance: Number(rows[0].new_balance),
    previousStatus: 'pending',
  }
}
