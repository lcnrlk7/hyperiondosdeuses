import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

function htmlRedirect(to: string) {
  return `<!doctype html><meta charset="utf-8"><title>...</title><script>location.replace(${JSON.stringify(to)})</script><p>Redirecting to ${to}...</p>`
}

// TEMP dev-only route to preview authenticated dashboards. Blocked in production.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not available' }, { status: 404 })
  }

  const type = request.nextUrl.searchParams.get('type') || 'user'

  if (type === 'admin') {
    const rows = await sql`SELECT id, name, email, role, permissions FROM team_members WHERE email = 'elicecontadodiscord@gmail.com' LIMIT 1`
    if (rows.length === 0) return NextResponse.json({ error: 'admin not found' }, { status: 404 })
    const m = rows[0]
    const token = await new SignJWT({ id: m.id, email: m.email, name: m.name, role: m.role, permissions: m.permissions, isTeamMember: true })
      .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(JWT_SECRET)
    const res = new NextResponse(htmlRedirect('/lp-x7k9m2-internal/ceo'), { headers: { 'content-type': 'text/html; charset=utf-8' } })
    res.cookies.set('team_session', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 86400, path: '/' })
    return res
  }

  const rows = await sql`
    SELECT id, email, name, CASE WHEN is_admin THEN 'admin' ELSE 'user' END as role, kyc_status
    FROM profiles
    WHERE is_active = true AND is_blocked = false AND kyc_status = 'approved'
    ORDER BY created_at DESC LIMIT 1
  `
  const pick = rows[0] || (await sql`SELECT id, email, name, CASE WHEN is_admin THEN 'admin' ELSE 'user' END as role, kyc_status FROM profiles WHERE is_active = true LIMIT 1`)[0]
  if (!pick) return NextResponse.json({ error: 'no user' }, { status: 404 })
  const token = await new SignJWT({ id: pick.id, email: pick.email, name: pick.name, role: pick.role, kyc_status: pick.kyc_status })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(JWT_SECRET)
  const res = new NextResponse(htmlRedirect('/dashboard'), { headers: { 'content-type': 'text/html; charset=utf-8' } })
  res.cookies.set('auth-token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800, path: '/' })
  return res
}
