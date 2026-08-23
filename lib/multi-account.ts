import { cookies } from "next/headers"
import { sql } from "@/lib/db"

export const ACTIVE_ACCOUNT_COOKIE = "active-account-id"
export const MAX_SUBACCOUNTS = 5

let schemaReady = false

export async function ensureMultiAccountSchema() {
  if (schemaReady) return

  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_profile_id text`
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type varchar(20) NOT NULL DEFAULT 'primary'`
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_name varchar(80)`
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_disabled boolean NOT NULL DEFAULT false`
  await sql`CREATE INDEX IF NOT EXISTS idx_profiles_parent_profile_id ON profiles(parent_profile_id)`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_parent_account_name ON profiles(parent_profile_id, lower(account_name)) WHERE parent_profile_id IS NOT NULL`
  await sql`CREATE OR REPLACE FUNCTION enforce_subaccount_limit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.parent_profile_id IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtext(NEW.parent_profile_id)); IF (SELECT count(*) FROM profiles WHERE parent_profile_id = NEW.parent_profile_id) >= 5 THEN RAISE EXCEPTION 'SUBACCOUNT_LIMIT_REACHED'; END IF; NEW.account_type := 'subaccount'; NEW.login_disabled := true; END IF; RETURN NEW; END; $$`
  await sql`DROP TRIGGER IF EXISTS profiles_subaccount_limit ON profiles`
  await sql`CREATE TRIGGER profiles_subaccount_limit BEFORE INSERT ON profiles FOR EACH ROW WHEN (NEW.parent_profile_id IS NOT NULL) EXECUTE FUNCTION enforce_subaccount_limit()`

  schemaReady = true
}

export async function resolveActiveAccountId(principalId: string) {
  await ensureMultiAccountSchema()
  const cookieStore = await cookies()
  const requestedId = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value
  if (!requestedId || requestedId === principalId) return principalId

  const owned = await sql`
    SELECT id FROM profiles
    WHERE id = ${requestedId}
      AND parent_profile_id = ${principalId}::text
      AND is_active = true
      AND login_disabled = true
    LIMIT 1
  `

  return owned[0]?.id ? String(owned[0].id) : principalId
}

export async function setActiveAccountCookie(accountId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ACCOUNT_COOKIE, accountId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
}

export async function clearActiveAccountCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_ACCOUNT_COOKIE)
}
