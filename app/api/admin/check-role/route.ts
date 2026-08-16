import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// SEGURANCA: usa a verificacao central verifyAdmin, que exige o email admin
// autorizado (fonte unica da verdade). Antes, qualquer linha em team_members ou
// qualquer profile com is_admin=true recebia role "ceo" — permitindo escalonar
// privilegios. Agora so o admin autorizado recebe um papel privilegiado.
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ role: null });
    }

    // Admin autorizado: retorna o papel real (padrao ceo).
    let role = "ceo";
    try {
      const tm = await sql`
        SELECT role FROM team_members
        WHERE email = ${admin.email} AND is_active = true
        LIMIT 1
      `;
      if (tm.length > 0 && tm[0].role) role = tm[0].role as string;
    } catch {
      // mantem ceo por padrao
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("[v0] Error checking role:", error);
    return NextResponse.json({ role: null });
  }
}
