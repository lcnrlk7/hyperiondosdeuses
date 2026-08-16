import { handleAuth } from '@/lib/middleware-auth'
import { type NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { jwtVerify } from 'jose'
import { getJwtSecret } from '@/lib/jwt-secret'

const JWT_SECRET = getJwtSecret()

// Cache de White Label tenants
interface WhiteLabelCache {
  domain: string
  tenant: any
  timestamp: number
}
const whiteLabelCache = new Map<string, WhiteLabelCache>()
const WL_CACHE_TTL = 60000 // 1 minuto

async function getWhiteLabelTenant(domain: string): Promise<any | null> {
  const cached = whiteLabelCache.get(domain)
  if (cached && Date.now() - cached.timestamp < WL_CACHE_TTL) {
    return cached.tenant
  }
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) return null
  
  try {
    const sql = neon(databaseUrl)
    const result = await sql`
      SELECT * FROM white_label_tenants 
      WHERE (domain_app = ${domain} OR domain_admin = ${domain})
      AND is_active = true
      LIMIT 1
    `
    
    const tenant = result[0] || null
    whiteLabelCache.set(domain, { domain, tenant, timestamp: Date.now() })
    return tenant
  } catch (error) {
    return null
  }
}

// Cache de bloqueios (atualiza a cada 60 segundos)
interface BlockCache {
  ips: Set<string>
  emails: Set<string>
  cpfs: Set<string>
  devices: Set<string>
  phones: Set<string>
  userIds: Set<string>
}

let blockedCache: BlockCache = {
  ips: new Set(),
  emails: new Set(),
  cpfs: new Set(),
  devices: new Set(),
  phones: new Set(),
  userIds: new Set(),
}
let lastCacheUpdate = 0
const CACHE_TTL = 60000 // 60 segundos

async function updateBlockedCache(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) return

  try {
    const sql = neon(databaseUrl)
    const blocks = await sql`
      SELECT type, value, user_id 
      FROM blacklist 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
    `

    const newCache: BlockCache = {
      ips: new Set(),
      emails: new Set(),
      cpfs: new Set(),
      devices: new Set(),
      phones: new Set(),
      userIds: new Set(),
    }

    for (const block of blocks) {
      switch (block.type) {
        case 'ip':
          newCache.ips.add(block.value)
          break
        case 'email':
          newCache.emails.add(block.value.toLowerCase())
          break
        case 'cpf':
          newCache.cpfs.add(block.value.replace(/\D/g, ''))
          break
        case 'device':
          newCache.devices.add(block.value)
          break
        case 'phone':
          newCache.phones.add(block.value.replace(/\D/g, ''))
          break
      }
      if (block.user_id) {
        newCache.userIds.add(block.user_id)
      }
    }

    blockedCache = newCache
    lastCacheUpdate = Date.now()
  } catch (error) {
    // Silencia erros de conexao
  }
}

async function isBlocked(request: NextRequest): Promise<{ blocked: boolean; reason?: string }> {
  const now = Date.now()
  
  // Atualiza cache se necessario
  if (now - lastCacheUpdate > CACHE_TTL) {
    await updateBlockedCache()
  }

  // Verifica IP
  const ip = getClientIp(request)
  if (ip && ip !== 'unknown' && blockedCache.ips.has(ip)) {
    return { blocked: true, reason: 'IP bloqueado' }
  }

  // Verifica device_id do cookie
  const deviceId = request.cookies.get('device_id')?.value
  if (deviceId && blockedCache.devices.has(deviceId)) {
    return { blocked: true, reason: 'Dispositivo bloqueado' }
  }

  // Verifica usuario logado
  const authToken = request.cookies.get('auth-token')?.value
  if (authToken) {
    try {
      const { payload } = await jwtVerify(authToken, JWT_SECRET)
      
      // Verifica user_id
      if (payload.id && blockedCache.userIds.has(payload.id as string)) {
        return { blocked: true, reason: 'Usuario bloqueado' }
      }
      
      // Verifica email
      if (payload.email && blockedCache.emails.has((payload.email as string).toLowerCase())) {
        return { blocked: true, reason: 'Email bloqueado' }
      }
      
      // Verifica CPF (se estiver no token)
      if (payload.cpf) {
        const cleanCpf = (payload.cpf as string).replace(/\D/g, '')
        if (blockedCache.cpfs.has(cleanCpf)) {
          return { blocked: true, reason: 'CPF bloqueado' }
        }
      }
    } catch {
      // Token invalido, continua sem verificar usuario
    }
  }

  return { blocked: false }
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') ||
         'unknown'
}

// SEGURANCA: unico email autorizado a acessar rotas administrativas.
// Deve ser identico a ADMIN_EMAIL em lib/admin-auth.ts (nao importamos de la
// para evitar puxar next/headers para o bundle do middleware/edge).
const ADMIN_API_EMAIL = 'elicecontadodiscord@gmail.com'

// Extrai o email do token da sessao (equipe ou usuario), validando a assinatura.
async function getTokenEmail(request: NextRequest): Promise<string | null> {
  const teamToken = request.cookies.get('team_session')?.value
  const authToken = request.cookies.get('auth-token')?.value
  for (const token of [teamToken, authToken]) {
    if (!token) continue
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload?.email) return (payload.email as string).toLowerCase()
    } catch {
      // token invalido, tenta o proximo
    }
  }
  return null
}

// Lista de dominios principais do sistema (nao sao checkouts)
const MAIN_DOMAINS = [
  'localhost',
  'hyperionpay.site',
  'hyperionpay.com.br',
  'vercel.app',
]

// Dominio dedicado para todos os checkouts
const CHECKOUT_DOMAIN = 'pay-checkout-pagamentoseguros.online'

// Dominio do app (dashboard de usuario)
const APP_DOMAIN = 'app.hyperionpay.com.br'

// Dominio do painel CEO/Admin
const CEO_DOMAIN = 'ceo.hyperionpay.com.br'

function isMainDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  
  // Exclui dominios especificos (app e ceo) da verificacao de dominio principal
  if (cleanHostname === APP_DOMAIN || cleanHostname === CEO_DOMAIN) {
    return false
  }
  
  return MAIN_DOMAINS.some(domain => 
    cleanHostname === domain || 
    cleanHostname === `www.${domain}` ||
    cleanHostname.endsWith(`.${domain}`) ||
    cleanHostname.includes('localhost')
  )
}

function isAppDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === APP_DOMAIN || cleanHostname === `www.${APP_DOMAIN}`
}

function isCeoDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === CEO_DOMAIN || cleanHostname === `www.${CEO_DOMAIN}`
}

function isCheckoutDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === CHECKOUT_DOMAIN || cleanHostname === `www.${CHECKOUT_DOMAIN}`
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // Ignorar a pagina de bloqueado para evitar loop
  if (pathname === '/blocked') {
    const response = NextResponse.next()
    // Adicionar headers de seguranca
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    return response
  }
  
  // Ignorar webhooks do Telegram, PIX do bot e Didit (nao precisa de auth)
  if (
    pathname.startsWith('/api/telegram') ||
    pathname.startsWith('/api/webhooks/telegram-pix') ||
    pathname.startsWith('/api/webhooks/didit')
  ) {
    return NextResponse.next()
  }
  
  // Verificar se esta bloqueado (IP, email, CPF, device, usuario)
  const blockCheck = await isBlocked(request)
  
  if (blockCheck.blocked) {
    const url = request.nextUrl.clone()
    url.pathname = '/blocked'
    return NextResponse.rewrite(url)
  }

  // DEFESA EM PROFUNDIDADE: todas as rotas /api/admin/* exigem o admin autorizado.
  // Mesmo que uma rota individual esqueca o guarda verifyAdmin, o middleware bloqueia.
  // check-role se auto-reporta com seguranca (retorna {isAdmin:false}), entao fica isento.
  if (
    pathname.startsWith('/api/admin') &&
    pathname !== '/api/admin/check-role'
  ) {
    const email = await getTokenEmail(request)
    if (email !== ADMIN_API_EMAIL) {
      return NextResponse.json(
        { error: 'Acesso negado. Requer permissao de administrador.' },
        { status: 403 }
      )
    }
  }
  
  // Dominio principal - serve TUDO no mesmo dominio (landing, auth, dashboard, admin).
  // Sem redirecionamento para subdominios app./ceo.
  if (isMainDomain(hostname)) {
    return await handleAuth(request)
  }
  
  // Se for dominio do CEO (ceo.hyperionpay.com.br) - painel admin exclusivo
  if (isCeoDomain(hostname)) {
    // Ignora arquivos estaticos
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return await handleAuth(request)
    }
    
    // Se acessar a raiz, redireciona para login da equipe ou painel CEO
    if (pathname === '/' || pathname === '') {
      const teamUser = request.cookies.get('team_session')?.value
      
      if (teamUser) {
        // Se tem sessao de equipe, vai para o painel CEO
        const url = request.nextUrl.clone()
        url.pathname = '/lp-x7k9m2-internal/ceo'
        return NextResponse.redirect(url)
      } else {
        // Se nao tem sessao, vai para login da equipe
        const url = request.nextUrl.clone()
        url.pathname = '/lp-x7k9m2-internal/team-login'
        return NextResponse.redirect(url)
      }
    }
    
    // Para outras rotas no CEO domain, segue fluxo normal de auth
    return await handleAuth(request)
  }
  
  // Se for dominio do app (app.hyperionpay.com.br) - dashboard de usuario
  if (isAppDomain(hostname)) {
    // Ignora arquivos estaticos
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return await handleAuth(request)
    }
    
    // Se acessar a raiz do app, redireciona para login ou dashboard
    if (pathname === '/' || pathname === '') {
      const user = request.cookies.get('auth-token')?.value
      
      if (user) {
        // Se tem sessao de usuario, vai para dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      } else {
        // Se nao tem sessao, vai para login
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }
    }
    
    // Para outras rotas no app domain, segue fluxo normal de auth
    return await handleAuth(request)
  }
  
  // Se for dominio de checkout (pay-checkout-pagamentoseguros.online)
  if (isCheckoutDomain(hostname)) {
    // Ignora arquivos estaticos e API
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return NextResponse.next()
    }
    
    // Se acessar a raiz, mostra pagina inicial do checkout
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/checkout-home'
      return NextResponse.rewrite(url)
    }
    
    // Pega o slug do path (ex: /meu-produto -> meu-produto)
    const slug = pathname.replace(/^\//, '').split('/')[0]
    
    if (slug) {
      // Reescreve para /pay/[slug]
      const url = request.nextUrl.clone()
      url.pathname = `/pay/${slug}`
      return NextResponse.rewrite(url)
    }
    
    return NextResponse.next()
  }
  
  // Outro dominio desconhecido - pode ser White Label
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  const whiteLabelTenant = await getWhiteLabelTenant(cleanHostname)
  
  if (whiteLabelTenant) {
    // E um dominio White Label
    const isAdminDomain = whiteLabelTenant.domain_admin === cleanHostname
    
    // Adicionar header com info do tenant para as APIs usarem
    const response = await handleAuth(request)
    response.headers.set('x-tenant-id', whiteLabelTenant.id)
    response.headers.set('x-tenant-database', whiteLabelTenant.database_url || '')
    response.headers.set('x-tenant-is-admin', isAdminDomain ? 'true' : 'false')
    
    // Se acessar a raiz
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      
      if (isAdminDomain) {
        // Admin domain - redireciona para painel CEO
        const teamUser = request.cookies.get('team_session')?.value
        if (teamUser) {
          url.pathname = '/lp-x7k9m2-internal/ceo'
        } else {
          url.pathname = '/lp-x7k9m2-internal/team-login'
        }
      } else {
        // App domain - redireciona para dashboard ou login
        const user = request.cookies.get('auth-token')?.value
        if (user) {
          url.pathname = '/dashboard'
        } else {
          url.pathname = '/auth/login'
        }
      }
      
      return NextResponse.redirect(url)
    }
    
    return response
  }
  
  // Outro dominio desconhecido - segue fluxo normal
  return await handleAuth(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
