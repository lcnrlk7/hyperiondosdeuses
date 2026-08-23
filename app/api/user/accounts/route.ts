import { NextRequest, NextResponse } from "next/server"
import { getPrincipalUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { ensureMultiAccountSchema, MAX_SUBACCOUNTS } from "@/lib/multi-account"

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : ""
}

export async function GET() {
  const principal = await getPrincipalUser()
  if (!principal) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  await ensureMultiAccountSchema()
  const accounts = await sql`
    SELECT p.id,
           COALESCE(p.account_name, p.name, 'Conta principal') as account_name,
           p.parent_profile_id,
           p.account_type,
           p.balance,
           p.is_active,
           p.created_at,
           COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = p.id AND t.status IN ('paid', 'approved', 'completed')), 0) as total_sales
    FROM profiles p
    WHERE p.id = ${principal.id} OR p.parent_profile_id = ${principal.id}
    ORDER BY CASE WHEN p.id = ${principal.id} THEN 0 ELSE 1 END, p.created_at ASC
  `

  return NextResponse.json({
    accounts: accounts.map((account) => ({ ...account, is_primary: account.id === principal.id })),
    limit: MAX_SUBACCOUNTS,
  })
}

export async function POST(request: NextRequest) {
  const principal = await getPrincipalUser()
  if (!principal) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  await ensureMultiAccountSchema()
  const body = await request.json().catch(() => ({}))
  const accountName = cleanName(body.account_name)
  if (accountName.length < 3) {
    return NextResponse.json({ error: "Informe um nome com pelo menos 3 caracteres" }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const clientId = `lp_${crypto.randomUUID().replace(/-/g, "")}`
  const clientSecret = `sk_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`
  const syntheticEmail = `sub-${id}@accounts.hyperion.internal`

  try {
    const created = await sql`
      INSERT INTO profiles (
        id, email, password_hash, name, account_name, parent_profile_id, account_type, login_disabled,
        phone, cpf_cnpj, kyc_status, api_key, client_id, client_secret, is_admin, is_active,
        balance, route_type, fee_percentage, withdrawal_fee, acquirer_id, avatar_url, created_at, updated_at
      )
      SELECT
        ${id}, ${syntheticEmail}, password_hash, ${accountName}, ${accountName}, id, 'subaccount', true,
        phone, cpf_cnpj, kyc_status, ${clientId}, ${clientId}, ${clientSecret}, false, true,
        0, route_type, fee_percentage, withdrawal_fee, acquirer_id, avatar_url, NOW(), NOW()
      FROM profiles
      WHERE id = ${principal.id} AND parent_profile_id IS NULL
      RETURNING id, account_name, parent_profile_id, account_type, balance, is_active, created_at
    `

    if (!created[0]) return NextResponse.json({ error: "Conta principal invalida" }, { status: 400 })
    return NextResponse.json({ account: created[0] }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.includes("SUBACCOUNT_LIMIT_REACHED")) {
      return NextResponse.json({ error: `Limite de ${MAX_SUBACCOUNTS} subcontas atingido` }, { status: 409 })
    }
    if (message.includes("idx_profiles_parent_account_name")) {
      return NextResponse.json({ error: "Ja existe uma subconta com este nome" }, { status: 409 })
    }
    console.error("Erro ao criar subconta:", error)
    return NextResponse.json({ error: "Nao foi possivel criar a subconta" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const principal = await getPrincipalUser()
  if (!principal) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  await ensureMultiAccountSchema()
  const body = await request.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : ""
  const accountName = cleanName(body.account_name)
  if (!id || accountName.length < 3) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 })

  const updated = await sql`
    UPDATE profiles SET account_name = ${accountName}, name = ${accountName}, updated_at = NOW()
    WHERE id = ${id} AND parent_profile_id = ${principal.id}
    RETURNING id, account_name
  `
  if (!updated[0]) return NextResponse.json({ error: "Subconta nao encontrada" }, { status: 404 })
  return NextResponse.json({ account: updated[0] })
}
