import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureKycStorageSchema } from "@/lib/kyc-storage";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    await ensureKycStorageSchema();
    const principal = await sql`SELECT COALESCE(parent_profile_id, id) AS id FROM profiles WHERE id = ${user.id} LIMIT 1`;
    const userId = principal[0]?.id || user.id;
    const profile = await sql`SELECT kyc_status, kyc_rejection_reason FROM profiles WHERE id = ${userId} LIMIT 1`;
    const documents = await sql`
      SELECT document_type, file_name, status, rejection_reason, created_at, updated_at
      FROM kyc_documents WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json({
      kyc_status: profile[0]?.kyc_status || "not_started",
      rejection_reason: profile[0]?.kyc_rejection_reason || null,
      documents,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[KYC Documents]", error);
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 });
  }
}
