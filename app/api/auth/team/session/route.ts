import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const TEAM_COOKIE_NAME = 'team_session'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TEAM_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return NextResponse.json({
      authenticated: true,
      member: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        isTeamMember: true,
      },
    })
  } catch (error) {
    console.error('Team session error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
