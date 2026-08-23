import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth"
import { sql } from "@/lib/db"
import { ensureMultiAccountSchema } from "@/lib/multi-account"

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return accessDeniedResponse()

  try {
    await ensureMultiAccountSchema()
    const search = request.nextUrl.searchParams.get("search")?.trim() || ""
    const pattern = `%${search}%`
    const accounts = await sql`
    SELECT child.id,
           child.account_name,
           child.balance,
           child.is_active,
           child.created_at,
           child.api_key,
           parent.id as parent_id,
           parent.name as parent_name,
           parent.email as parent_email,
           parent.cpf_cnpj as parent_document,
           parent.kyc_status,
           COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = child.id AND t.status IN ('paid', 'approved', 'completed')), 0) as total_sales,
           COALESCE((SELECT COUNT(*) FROM transactions t WHERE t.user_id = child.id), 0) as transaction_count,
           COALESCE((SELECT COUNT(*) FROM withdrawals w WHERE w.user_id = child.id), 0) as withdrawal_count
    FROM profiles child
    JOIN profiles parent ON parent.id::text = child.parent_profile_id
    WHERE child.parent_profile_id IS NOT NULL
      AND (${search} = '' OR child.account_name ILIKE ${pattern} OR parent.name ILIKE ${pattern} OR parent.email ILIKE ${pattern})
    ORDER BY parent.name ASC, child.created_at ASC
    `

    return NextResponse.json({ subaccounts: accounts })
  } catch (error) {
    console.error("[admin/subaccounts] Falha ao listar subcontas:", error)
    return NextResponse.json(
      { error: "Não foi possível carregar as subcontas." },
      { status: 500 },
    )
  }
}
