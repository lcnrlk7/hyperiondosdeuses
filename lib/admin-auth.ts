import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getJwtSecret } from "./jwt-secret";

const JWT_SECRET = getJwtSecret();

const TEAM_COOKIE_NAME = 'team_session';

/**
 * Unico email autorizado a ter acesso administrativo.
 * Qualquer outra conta e bloqueada, mesmo que exista na tabela team_members
 * ou admin_team com role de admin/ceo. Fonte unica da verdade para o admin.
 */
export const ADMIN_EMAIL = 'elicecontadodiscord@gmail.com';

export function isAllowedAdmin(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}

export interface AdminSession {
  userId: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isTeamMember?: boolean;
}

/**
 * Verifica se o usuario atual e admin
 * Verifica em duas formas:
 * 1. Cookie team_session (login via /lp-x7k9m2-internal)
 * 2. Cookie auth-token (login via /login) + is_admin em profiles
 * Retorna a sessao do admin ou null se nao for admin
 */
export async function verifyAdmin(): Promise<AdminSession | null> {
  try {
    // PRIMEIRO: Verificar cookie team_session (CEOs logados via painel interno)
    const cookieStore = await cookies();
    const teamToken = cookieStore.get(TEAM_COOKIE_NAME);
    
    if (teamToken?.value) {
      try {
        const { payload } = await jwtVerify(teamToken.value, JWT_SECRET);

        // O login da equipe (/api/auth/team/login) emite o token com o id da
        // tabela team_members. Verificamos primeiro nela.
        const memberCheck = await sql`
          SELECT id, email, name, role, is_active
          FROM team_members
          WHERE id = ${payload.id as string} AND is_active = true
          AND LOWER(role) IN ('ceo', 'admin', 'superadmin', 'manager', 'finance', 'attendant', 'support', 'tech')
        `;

        if (memberCheck.length > 0 && isAllowedAdmin(memberCheck[0].email)) {
          return {
            userId: memberCheck[0].id,
            email: memberCheck[0].email,
            name: memberCheck[0].name,
            isAdmin: true,
            isTeamMember: true
          };
        }

        // Compatibilidade: tokens emitidos pelo sistema admin_team (+ profiles).
        const teamCheck = await sql`
          SELECT at.id as team_id, at.user_id, p.email, p.name, at.role, at.is_active
          FROM admin_team at
          INNER JOIN profiles p ON p.id = at.user_id
          WHERE at.id = ${payload.id as string} AND at.is_active = true
          AND LOWER(at.role) IN ('ceo', 'admin', 'superadmin', 'manager', 'finance', 'attendant')
        `;
        
        if (teamCheck.length > 0 && isAllowedAdmin(teamCheck[0].email)) {
          return {
            userId: teamCheck[0].user_id,
            email: teamCheck[0].email,
            name: teamCheck[0].name,
            isAdmin: true,
            isTeamMember: true
          };
        }
      } catch {
        // Token invalido ou expirado, continuar para verificar auth-token
      }
    }
    
    // SEGUNDO: Verificar sessao normal (auth-token)
    const session = await getSession();
    if (!session || !session.user) return null;
    
    const userEmail = session.user.email;
    
    // Verificar na tabela profiles se e admin
    const profileResult = await sql`
      SELECT id, email, name, is_admin 
      FROM profiles 
      WHERE id = ${session.userId} AND is_admin = true AND is_active = true
    `;
    
    if (profileResult.length > 0 && isAllowedAdmin(profileResult[0].email)) {
      return {
        userId: profileResult[0].id,
        email: profileResult[0].email,
        name: profileResult[0].name,
        isAdmin: profileResult[0].is_admin
      };
    }
    
    // Verificar na tabela admin_team pelo email
    const teamResult = await sql`
      SELECT at.id, p.email, p.name, at.role, at.is_active
      FROM admin_team at
      INNER JOIN profiles p ON p.id = at.user_id
      WHERE p.email = ${userEmail} AND at.is_active = true
      AND LOWER(at.role) IN ('ceo', 'admin', 'superadmin', 'manager', 'finance', 'attendant')
    `;
    
    if (teamResult.length > 0 && isAllowedAdmin(teamResult[0].email)) {
      return {
        userId: session.userId,
        email: teamResult[0].email,
        name: teamResult[0].name,
        isAdmin: true,
        isTeamMember: true
      };
    }
    
    return null;
  } catch (error) {
    console.error("[Admin Auth] Error verifying admin:", error);
    return null;
  }
}

/**
 * Resposta padrao para acesso negado
 */
export function accessDeniedResponse() {
  return NextResponse.json(
    { error: "Acesso negado. Voce precisa ser administrador." },
    { status: 403 }
  );
}

/**
 * Wrapper para proteger rotas admin
 * Uso: const admin = await requireAdmin(); if (!admin) return accessDeniedResponse();
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  return verifyAdmin();
}
