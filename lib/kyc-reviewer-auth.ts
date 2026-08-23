import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";
import { getJwtSecret } from "@/lib/jwt-secret";

export interface KycReviewer {
  id: string;
  email: string;
  name: string | null;
  role: "ceo" | "manager";
}

export async function verifyKycReviewer(): Promise<KycReviewer | null> {
  try {
    const token = (await cookies()).get("team_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.id !== "string") return null;

    const rows = await sql`
      SELECT id, email, name, LOWER(role) AS role
      FROM team_members
      WHERE id = ${payload.id}
        AND is_active = true
        AND LOWER(role) IN ('ceo', 'manager')
      LIMIT 1
    `;
    if (!rows[0]) return null;
    return rows[0] as KycReviewer;
  } catch {
    return null;
  }
}
