import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ChargesContent } from "@/components/dashboard/charges-content";

export const dynamic = "force-dynamic";

export default async function ChargesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const rows = await sql`
    SELECT id, external_id, amount, net_amount, fee, status,
           payer_name, description, created_at, metadata
    FROM transactions
    WHERE user_id = ${user.id} AND type = 'pix_in'
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const charges = rows.map((r) => ({
    id: String(r.id),
    externalId: r.external_id ? String(r.external_id) : null,
    amount: Number(r.amount) || 0,
    status: String(r.status || "pending"),
    payerName: r.payer_name ? String(r.payer_name) : null,
    description: r.description ? String(r.description) : null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
  }));

  return <ChargesContent charges={charges} />;
}
