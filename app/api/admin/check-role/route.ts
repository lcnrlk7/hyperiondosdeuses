import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export async function GET() {
  try {
    // Primeiro verificar cookie team_session (CEOs)
    const cookieStore = await cookies();
    const teamToken = cookieStore.get('team_session');
    
    if (teamToken?.value) {
      try {
        const { payload } = await jwtVerify(teamToken.value, JWT_SECRET);
        
        const teamCheck = await sql`
          SELECT id, email, name, role, is_active
          FROM team_members
          WHERE id = ${payload.id as string} AND is_active = true
        `;
        
        if (teamCheck.length > 0) {
          return NextResponse.json({ role: teamCheck[0].role });
        }
      } catch {
        // Token invalido, continuar
      }
    }
    
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ role: null });
    }

    // Check team_members for role
    const teamMember = await sql`
      SELECT role FROM team_members 
      WHERE email = ${session.user.email} AND is_active = true
    `;

    if (teamMember.length > 0) {
      return NextResponse.json({ role: teamMember[0].role });
    }

    // Check if user is_admin in profiles
    const profiles = await sql`
      SELECT is_admin FROM profiles WHERE id = ${session.userId}
    `;

    if (profiles.length > 0 && profiles[0].is_admin) {
      return NextResponse.json({ role: "ceo" });
    }

    return NextResponse.json({ role: null });
  } catch (error) {
    console.error("[v0] Error checking role:", error);
    return NextResponse.json({ role: null });
  }
}
