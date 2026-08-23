import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireKycReviewer } from "@/lib/kyc-reviewer-auth";
import { logKYCStatusUpdate, logAdminAction } from "@/lib/discord-webhook";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const reviewer = await requireKycReviewer();
  if (reviewer instanceof NextResponse) return reviewer;
  const admin = reviewer;
  
  try {

    const { userId } = await params;
    const requiredTypes = ["document_front", "document_back", "selfie_with_document"];

    // Verificar se usuario existe
    const userCheck = await sql`
      SELECT id, name, email, kyc_status FROM profiles WHERE id = ${userId}
    `;

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const documentRows = await sql`
      SELECT DISTINCT document_type
      FROM kyc_documents
      WHERE user_id = ${userId} AND status = 'pending'
    `;
    const submittedTypes = new Set(documentRows.map((row) => String(row.document_type)));
    if (!requiredTypes.every((type) => submittedTypes.has(type))) {
      return NextResponse.json(
        { error: "Os três documentos obrigatórios devem estar pendentes para revisão." },
        { status: 409 },
      );
    }

    await sql`
      UPDATE profiles
      SET kyc_status = 'approved', kyc_rejection_reason = NULL, updated_at = NOW()
      WHERE id = ${userId} AND kyc_status = 'pending'
    `;

    await sql`
      UPDATE kyc_documents
      SET status = 'approved', reviewed_by = ${admin.id}, reviewed_at = NOW(), rejection_reason = NULL
      WHERE user_id = ${userId} AND status = 'pending'
    `;

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${admin.id},
        'KYC_APPROVED',
        'kyc',
        ${userId},
        ${JSON.stringify({ documents: requiredTypes, approvedBy: admin.id })},
        NOW()
      )
    `;
    
    // Log para Discord
    logKYCStatusUpdate({
      userId: userId,
      userName: userCheck[0].name as string,
      userEmail: userCheck[0].email as string,
      oldStatus: userCheck[0].kyc_status as string,
      newStatus: "approved",
      adminName: admin.name || "Admin",
    });
    
    logAdminAction({
      adminName: admin.name || "Admin",
      adminEmail: admin.email || "",
      action: "KYC Aprovado",
      target: `${userCheck[0].name} (${userCheck[0].email})`,
      details: "Aprovado após revisão dos três documentos obrigatórios",
    });

    return NextResponse.json({
      success: true,
      message: "KYC aprovado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao aprovar KYC:", error);
    return NextResponse.json(
      { error: "Erro ao aprovar KYC" },
      { status: 500 }
    );
  }
}
