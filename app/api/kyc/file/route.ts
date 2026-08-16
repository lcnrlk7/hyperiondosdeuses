import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'
import { getJwtSecret } from '@/lib/jwt-secret'

const JWT_SECRET = getJwtSecret()

// Verificar se é membro da equipe interna
async function getTeamSession(): Promise<{ id: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('team_session')?.value
    if (!token) {
      console.log("[KYC File] No team_session cookie found")
      return null
    }
    const { payload } = await jwtVerify(token, JWT_SECRET)
    console.log("[KYC File] Team session verified:", payload.role)
    return { id: payload.id as string, role: payload.role as string }
  } catch (err) {
    console.log("[KYC File] Team session verification failed:", err)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação - usuário normal ou membro da equipe
    const session = await getSession()
    const teamSession = await getTeamSession()

    console.log("[KYC File] Auth check - session:", !!session, "teamSession:", !!teamSession)

    // Precisa estar autenticado como usuário ou como membro da equipe
    if (!session && !teamSession) {
      // Verificar se existe cookie de sessão da equipe para debug
      const cookieStore = await cookies()
      const hasTeamCookie = !!cookieStore.get('team_session')?.value
      console.log("[KYC File] No valid session found. Has team cookie:", hasTeamCookie)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const pathname = request.nextUrl.searchParams.get('pathname')

    if (!pathname) {
      return NextResponse.json({ error: 'Pathname não informado' }, { status: 400 })
    }

    // Se o pathname é uma URL completa (blob público), redirecionar
    if (pathname.startsWith('http')) {
      return NextResponse.redirect(pathname)
    }

    // Team members têm acesso total a todos os arquivos KYC
    if (teamSession) {
      console.log("[KYC File] Team member accessing file:", pathname)
    } else if (session) {
      // Verificar permissões para usuários normais
      const profiles = await sql`
        SELECT is_admin FROM profiles WHERE id = ${session.userId}
      `
      const isAdmin = profiles[0]?.is_admin || false
      
      // Se não for admin, verificar se o arquivo pertence ao usuário
      if (!isAdmin && !pathname.includes(session.userId)) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Buscar a URL completa do documento no banco de dados
    const docs = await sql`
      SELECT file_url FROM kyc_documents WHERE file_url LIKE ${'%' + pathname + '%'} OR file_url = ${pathname}
      LIMIT 1
    `
    
    if (docs.length > 0 && docs[0].file_url.startsWith('http')) {
      // Se temos a URL completa no banco, redirecionar
      return NextResponse.redirect(docs[0].file_url)
    }

    // Caso contrário, tentar montar a URL (para compatibilidade com dados antigos)
    // Isso vai falhar se o arquivo não existir com essa estrutura
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return NextResponse.json({ error: 'Falha ao servir arquivo' }, { status: 500 })
  }
}
