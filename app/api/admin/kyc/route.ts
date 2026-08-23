import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureKycStorageSchema } from "@/lib/kyc-storage";
import { verifyKycReviewer } from "@/lib/kyc-reviewer-auth";

export async function GET() {
  const reviewer = await verifyKycReviewer();
  if (!reviewer) return NextResponse.json({ error: "Acesso restrito a CEO e Manager" }, { status: 403 });
  await ensureKycStorageSchema();
  const users = await sql`
    SELECT p.id, p.name, p.email, p.phone, p.cpf_cnpj,
           p.kyc_status, p.kyc_rejection_reason, p.created_at,
           COALESCE(json_agg(json_build_object(
             'id', d.id, 'document_type', d.document_type, 'file_name', d.file_name,
             'status', d.status, 'created_at', d.created_at
           )) FILTER (WHERE d.id IS NOT NULL), '[]') AS documents
    FROM profiles p
    LEFT JOIN kyc_documents d ON d.user_id = p.id
    WHERE p.parent_profile_id IS NULL
    GROUP BY p.id
    ORDER BY CASE WHEN p.kyc_status = 'pending' THEN 0 ELSE 1 END, p.created_at DESC
  `;
  return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: NextRequest) {
  const reviewer = await verifyKycReviewer();
  if (!reviewer) return NextResponse.json({ error: "Acesso restrito a CEO e Manager" }, { status: 403 });
  await ensureKycStorageSchema();
  const { userId, action, rejectionReason } = await request.json();
  if (!userId || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "Decisão inválida" }, { status: 400 });
  if (action === "reject" && (!rejectionReason || rejectionReason.trim().length < 5)) return NextResponse.json({ error: "Informe um motivo com ao menos 5 caracteres" }, { status: 400 });

  const docs = await sql`SELECT COUNT(DISTINCT document_type)::int AS count FROM kyc_documents WHERE user_id = ${userId} AND document_type IN ('document_front', 'document_back', 'selfie_with_document') AND encrypted_data IS NOT NULL`;
  if (action === "approve" && docs[0]?.count !== 3) return NextResponse.json({ error: "Os três documentos são obrigatórios" }, { status: 409 });
  const status = action === "approve" ? "approved" : "rejected";
  await sql`UPDATE kyc_documents SET status = ${status}, rejection_reason = ${action === "reject" ? rejectionReason.trim() : null}, reviewed_by = NULL, reviewed_at = NOW(), updated_at = NOW() WHERE user_id = ${userId}`;
  await sql`UPDATE profiles SET kyc_status = ${status}, kyc_rejection_reason = ${action === "reject" ? rejectionReason.trim() : null}, kyc_reviewed_by = ${reviewer.id}, kyc_reviewed_at = NOW(), liveness_status = ${action === "approve" ? "approved" : "declined"}, updated_at = NOW() WHERE id = ${userId}`;
  return NextResponse.json({ success: true, status });
}
