import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CustomersContent, Customer } from "@/components/dashboard/customers-content";

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    return <CustomersContent customers={[]} />;
  }

  let rows: any[] = [];
  try {
    rows = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(payer_name), ''), 'Cliente sem nome') AS name,
        payer_document AS document,
        MAX(payer_email) AS email,
        SUM(amount) AS total_spent,
        COUNT(*) AS payments,
        MAX(created_at) AS last_payment
      FROM transactions
      WHERE user_id = ${session.userId}
        AND status = 'completed'
        AND type IN ('pix_in', 'received', 'deposit', 'sale', 'transfer_in')
        AND (payer_name IS NOT NULL OR payer_document IS NOT NULL)
      GROUP BY COALESCE(NULLIF(TRIM(payer_name), ''), 'Cliente sem nome'), payer_document
      ORDER BY total_spent DESC
      LIMIT 500
    `;
  } catch (e) {
    console.error("[v0] Error fetching customers:", e);
  }

  return <CustomersContent customers={(rows || []) as Customer[]} />;
}
