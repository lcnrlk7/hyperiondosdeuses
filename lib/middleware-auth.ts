import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const AUTH_COOKIE_NAME = 'auth-token'
const TEAM_COOKIE_NAME = 'team_session'

interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  kyc_status: string
}

// Verificar token de usuário normal
async function verifyUserToken(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
      kyc_status: payload.kyc_status as string,
    }
  } catch {
    return null
  }
}

// Verificar token de equipe interna (CEO, manager, etc)
async function verifyTeamToken(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(TEAM_COOKIE_NAME)?.value
  
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
      kyc_status: 'approved', // Team members don't have KYC
    }
  } catch {
    return null
  }
}

// Verificar qualquer token válido (usuário ou equipe)
async function verifyAnyToken(request: NextRequest): Promise<SessionUser | null> {
  // Primeiro tenta token de equipe
  const teamUser = await verifyTeamToken(request)
  if (teamUser) return teamUser
  
  // Depois tenta token de usuário normal
  return verifyUserToken(request)
}

export async function handleAuth(request: NextRequest) {
  const response = NextResponse.next({ request })
  
  const pathname = request.nextUrl.pathname

  // Public routes - no auth required
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/docs',
    '/status',
    '/blocked',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send-code',
    '/api/auth/verify-code',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/password-reset',
    '/api/auth/team/login',
    '/api/webhooks',
  ]
  
  // Public API prefixes - qualquer rota que comece com esses prefixos é pública
  const publicApiPrefixes = [
    '/api/v1/',
    '/api/webhooks/',
    '/api/setup/',
    '/api/cron/',
    '/api/migrations',
    '/api/push/debug',
    '/api/push/test',
    '/api/public/',
    '/api/admin/update-white-route',
    '/api/admin/all-routes',
    '/api/admin/update-routes-fees',
    '/api/admin/remove-venopag',
    '/api/admin/investigate-withdrawal',
    '/api/admin/block-user',
    '/api/emergency-block',
    '/api/admin/blacklist/setup',
    '/api/admin/status',
    '/api/health',
  ]

  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/')) ||
    publicApiPrefixes.some(prefix => pathname.startsWith(prefix))

  // Static files and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') // files with extensions
  ) {
    return response
  }

  // Public paths don't need auth
  if (isPublicPath) {
    return response
  }

  // Protected paths
  const protectedPaths = ['/dashboard', '/admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  // Rotas internas protegidas (exceto a página de login)
  const isInternalProtectedPath = pathname.startsWith('/lp-x7k9m2-internal/') && pathname !== '/lp-x7k9m2-internal'

  // Página de login do admin é pública
  if (pathname === '/lp-x7k9m2-internal') {
    return response
  }

  if (isProtectedPath || isInternalProtectedPath) {
    // Para rotas do painel interno, verificar primeiro token de equipe
    if (pathname.startsWith('/admin') || isInternalProtectedPath) {
      const teamUser = await verifyTeamToken(request)
      
      if (!teamUser) {
        // Se não tem token de equipe, redireciona para login interno
        const url = request.nextUrl.clone()
        url.pathname = '/lp-x7k9m2-internal'
        return NextResponse.redirect(url)
      }
      
      const allowedRoles = ['admin', 'ceo', 'manager', 'attendant', 'finance']
      if (!allowedRoles.includes(teamUser.role.toLowerCase())) {
        const url = request.nextUrl.clone()
        url.pathname = '/lp-x7k9m2-internal'
        return NextResponse.redirect(url)
      }
    } else {
      // Para rotas normais do dashboard, verificar token de usuário
      const user = await verifyUserToken(request)

      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  // Protected API routes (not public v1 API)
  if (pathname.startsWith('/api/') && !isPublicPath) {
    // Para APIs admin, verificar token de equipe
    if (pathname.startsWith('/api/admin/')) {
      const teamUser = await verifyTeamToken(request)
      
      if (!teamUser) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }
    } else {
      // Para outras APIs protegidas, verificar qualquer token válido
      const user = await verifyAnyToken(request)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }
    }
  }

  return response
}
