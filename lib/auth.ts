import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { sql } from './db'
import bcrypt from 'bcryptjs'
import { getJwtSecret } from './jwt-secret'
import { ensureMultiAccountSchema, resolveActiveAccountId } from './multi-account'

const JWT_SECRET = getJwtSecret()

const COOKIE_NAME = 'auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  document: string | null
  document_type: string | null
  role: string
  kyc_status: string
  created_at: string
  api_key?: string
  api_secret?: string
  webhook_url?: string
}

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  kyc_status: string
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create JWT token
export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ 
    id: user.id, 
    email: user.email, 
    name: user.name,
    role: user.role,
    kyc_status: user.kyc_status
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<SessionUser | null> {
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

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  // Note: secure deve ser false no ambiente v0 preview para funcionar corretamente
  const isSecure = process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL?.includes('v0.dev')
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Get the authenticated principal encoded in the signed JWT.
export async function getPrincipalUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// Resolve the financial account selected by the authenticated principal.
// Ownership is checked server-side on every request, preventing account ID spoofing.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const principal = await getPrincipalUser()
  if (!principal) return null

  const activeId = await resolveActiveAccountId(principal.id)
  if (activeId === principal.id) return principal

  const result = await sql`
    SELECT child.id, child.email, child.account_name as name,
           CASE WHEN parent.is_admin THEN 'admin' ELSE 'user' END as role,
           parent.kyc_status
    FROM profiles child
    JOIN profiles parent ON parent.id = child.parent_profile_id
    WHERE child.id = ${activeId} AND parent.id = ${principal.id}
    LIMIT 1
  `

  return (result[0] as SessionUser) || principal
}

// Get session (alias for getCurrentUser with userId format)
export async function getSession(): Promise<{ userId: string; user: SessionUser } | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return { userId: user.id, user }
}

// Verify auth token and return session data (for layouts that receive token directly)
export async function verifyAuth(token: string): Promise<{ userId: string; email: string; name: string | null; role: string } | null> {
  const user = await verifyToken(token)
  if (!user) return null
  return { 
    userId: user.id, 
    email: user.email, 
    name: user.name,
    role: user.role
  }
}

// Get full user data from database
export async function getFullUser(userId: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT child.id,
             CASE WHEN child.parent_profile_id IS NOT NULL THEN parent.email ELSE child.email END as email,
             COALESCE(child.account_name, child.name) as name,
             COALESCE(parent.phone, child.phone) as phone,
             COALESCE(parent.cpf_cnpj, child.cpf_cnpj) as document,
             'cpf' as document_type,
             CASE WHEN COALESCE(parent.is_admin, child.is_admin) THEN 'admin' ELSE 'user' END as role,
             COALESCE(parent.kyc_status, child.kyc_status) as kyc_status,
             child.created_at, child.api_key, child.client_secret as api_secret, child.webhook_url
      FROM profiles child
      LEFT JOIN profiles parent ON parent.id = child.parent_profile_id
      WHERE child.id = ${userId}
    `
    return result[0] as User || null
  } catch {
    return null
  }
}

// Register new user
export async function registerUser(
  email: string, 
  password: string, 
  name: string,
  phone?: string,
  document?: string,
  documentType?: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if user exists
    const existing = await sql`SELECT id FROM profiles WHERE email = ${email}`
    if (existing.length > 0) {
      return { user: null, error: 'Email já cadastrado' }
    }

    const hashedPassword = await hashPassword(password)
    const id = crypto.randomUUID()
    const clientId = `lp_${crypto.randomUUID().replace(/-/g, '')}`
    const clientSecret = `sk_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`

    // Buscar adquirente padrao (Medusa - rota black) para novos usuarios
    const acquirerResult = await sql`
      SELECT id, fee_percentage, withdrawal_fee FROM acquirers 
      WHERE code = 'medusa' AND is_active = true 
      LIMIT 1
    `;
    
    // Se Medusa nao existir, busca qualquer black ativa
    let defaultAcquirer = acquirerResult[0];
    if (!defaultAcquirer) {
      const fallbackResult = await sql`
        SELECT id, fee_percentage, withdrawal_fee FROM acquirers 
        WHERE route_type = 'black' AND is_active = true 
        LIMIT 1
      `;
      defaultAcquirer = fallbackResult[0];
    }
    
    const defaultAcquirerId = defaultAcquirer?.id || null;
    const defaultFeePercentage = defaultAcquirer ? Number(defaultAcquirer.fee_percentage) : 4.00;
    const defaultWithdrawalFee = defaultAcquirer ? Number(defaultAcquirer.withdrawal_fee) : 5.00;

    // Avatar padrao aleatorio (1-8)
    const randomAvatar = `/avatars/avatar-${Math.floor(Math.random() * 8) + 1}.jpg`;

    const result = await sql`
      INSERT INTO profiles (id, email, password_hash, name, phone, cpf_cnpj, kyc_status, api_key, client_id, client_secret, is_admin, is_active, balance, route_type, fee_percentage, withdrawal_fee, acquirer_id, avatar_url, created_at, updated_at)
      VALUES (${id}, ${email}, ${hashedPassword}, ${name}, ${phone || null}, ${document || null}, 'pending', ${clientId}, ${clientId}, ${clientSecret}, false, true, 0, 'black', ${defaultFeePercentage}, ${defaultWithdrawalFee}, ${defaultAcquirerId}, ${randomAvatar}, NOW(), NOW())
      RETURNING id, email, name, phone, cpf_cnpj as document, 'cpf' as document_type, 'user' as role, kyc_status, created_at, api_key, client_secret as api_secret, webhook_url
    `

    return { user: result[0] as User, error: null }
  } catch (error) {
    console.error('Register error:', error)
    return { user: null, error: 'Erro ao criar conta' }
  }
}

// Login user
export async function loginUser(
  email: string, 
  password: string
): Promise<{ user: SessionUser | null; error: string | null }> {
  try {
    await ensureMultiAccountSchema()
    console.log("[v0] loginUser called with email:", email)
    
    const result = await sql`
      SELECT id, email, name, CASE WHEN is_admin THEN 'admin' ELSE 'user' END as role, kyc_status, password_hash, is_active, is_blocked, COALESCE(login_disabled, false) as login_disabled
      FROM profiles
      WHERE email = ${email}
    `
    
    console.log("[v0] Query result count:", result.length)

    if (result.length === 0) {
      console.log("[v0] No user found with email:", email)
      return { user: null, error: 'Email ou senha incorretos' }
    }

    const user = result[0] as User & { password_hash: string; is_active: boolean; is_blocked: boolean; login_disabled: boolean }

    if (user.login_disabled) {
      return { user: null, error: 'Esta conta vinculada deve ser acessada pelo seletor da conta principal.' }
    }
    
    console.log("[v0] User found:", { id: user.id, email: user.email, is_active: user.is_active, is_blocked: user.is_blocked, hasPasswordHash: !!user.password_hash })
    
    // Verificar se a conta está ativa
    if (!user.is_active) {
      console.log("[v0] User is not active")
      return { user: null, error: 'Conta desativada. Entre em contato com o suporte.' }
    }

    // SEGURANCA: Verificar se a conta está bloqueada
    if (user.is_blocked) {
      console.log("[v0] User is blocked")
      return { user: null, error: 'Conta bloqueada. Entre em contato com o suporte.' }
    }

    // Verificar se tem password_hash
    if (!user.password_hash) {
      console.log("[v0] User has no password_hash")
      return { user: null, error: 'Erro na conta. Entre em contato com o suporte.' }
    }

    const isValid = await verifyPassword(password, user.password_hash)
    
    console.log("[v0] Password verification result:", isValid)

    if (!isValid) {
      console.log("[v0] Invalid password for user:", email)
      return { user: null, error: 'Email ou senha incorretos' }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      kyc_status: user.kyc_status,
    }
    
    console.log("[v0] Login successful for user:", email)

    return { user: sessionUser, error: null }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return { user: null, error: 'Erro ao fazer login. Tente novamente.' }
  }
}

// Validate API key for external API access
export async function validateApiKey(apiKey: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, email, name, phone, cpf_cnpj as document, 'cpf' as document_type, 
             CASE WHEN is_admin THEN 'admin' ELSE 'user' END as role, kyc_status, 
             created_at, api_key, client_secret as api_secret, webhook_url
      FROM profiles
      WHERE api_key = ${apiKey} OR client_id = ${apiKey}
    `
    return result[0] as User || null
  } catch {
    return null
  }
}

// Get user from request headers (for API routes)
export async function getUserFromRequest(request: Request): Promise<SessionUser | null> {
  // Try cookie first
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...v] = c.split('=')
        return [key, v.join('=')]
      })
    )
    const token = cookies[COOKIE_NAME]
    if (token) {
      return verifyToken(token)
    }
  }

  // Try Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return verifyToken(token)
  }

  return null
}
