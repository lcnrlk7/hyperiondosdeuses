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
    const body = await request.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 5 || reason.length > 500) {
      return NextResponse.json(
        { error: "Informe um motivo de reprovação entre 5 e 500 caracteres." },
        { status: 400 },
      );
    }

    // Verificar se usuario existe
    const userCheck = await sql`
      SELECT id, name, email FROM profiles WHERE id = ${userId}
    `;

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Atualizar status KYC para rejeitado
    await sql`
      UPDATE profiles 
      SET kyc_status = 'rejected', kyc_rejection_reason = ${reason}, updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Atualizar documentos para rejeitado
    await sql`
      UPDATE kyc_documents
      SET status = 'rejected', rejection_reason = ${reason || 'Documentos invalidos'}
      WHERE user_id = ${userId} AND status = 'pending'
    `;

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${admin.id},
        'KYC_REJECTED',
        'kyc',
        ${userId},
        ${JSON.stringify({ reason, rejectedBy: admin.id })},
        NOW()
      )
    `;
    
    // Log para Discord
    logKYCStatusUpdate({
      userId: userId,
      userName: userCheck[0].name as string,
      userEmail: userCheck[0].email as string,
      oldStatus: "pending",
      newStatus: "rejected",
      adminName: admin.name || "Admin",
      reason: reason || "Documentos invalidos",
    });
    
    logAdminAction({
      adminName: admin.name || "Admin",
      adminEmail: admin.email || "",
      action: "KYC Rejeitado",
      target: `${userCheck[0].name} (${userCheck[0].email})`,
      details: reason || "Documentos invalidos",
    });

    return NextResponse.json({ 
      success: true, 
      message: "KYC rejeitado" 
    });
  } catch (error) {
    console.error("Erro ao rejeitar KYC:", error);
    return NextResponse.json(
      { error: "Erro ao rejeitar KYC" },
      { status: 500 }
    );
  }
}
