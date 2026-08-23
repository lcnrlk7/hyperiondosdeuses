import { NextRequest, NextResponse } from "next/server"
import { getPrincipalUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { ensureMultiAccountSchema, setActiveAccountCookie } from "@/lib/multi-account"

export async function POST(request: NextRequest) {
  const principal = await getPrincipalUser()
  if (!principal) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  await ensureMultiAccountSchema()
  const body = await request.json().catch(() => ({}))
  const accountId = typeof body.account_id === "string" ? body.account_id : ""
  if (!accountId) return NextResponse.json({ error: "Conta invalida" }, { status: 400 })

  if (accountId !== principal.id) {
    const owned = await sql`
      SELECT id FROM profiles
      WHERE id = ${accountId} AND parent_profile_id = ${principal.id} AND is_active = true
      LIMIT 1
    `
    if (!owned[0]) return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 })
  }

  await setActiveAccountCookie(accountId)
  return NextResponse.json({ success: true, account_id: accountId })
}
