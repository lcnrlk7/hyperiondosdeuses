import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SEGURANCA: exige o admin autorizado (antes aceitava qualquer header nao-vazio).
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validar status
    const validStatuses = ["pending", "processing", "completed", "cancelled", "failed", "rejected", "nao_autorizado"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status invalido" },
        { status: 400 }
      );
    }

    // Buscar saque atual
    const withdrawals = await sql`
      SELECT w.*, p.balance, p.email
      FROM withdrawals w
      JOIN profiles p ON p.id = w.user_id
      WHERE w.id = ${id}
    `;

    if (withdrawals.length === 0) {
      return NextResponse.json(
        { error: "Saque nao encontrado" },
        { status: 404 }
      );
    }

    const withdrawal = withdrawals[0];
    const oldStatus = withdrawal.status;

    // Status que devolvem saldo ao usuario
    const refundStatuses = ["cancelled", "failed", "rejected", "nao_autorizado"];
    
    // Se estiver alterando para um status de devolucao e o status anterior nao era de devolucao
    if (
      refundStatuses.includes(status) && 
      !refundStatuses.includes(oldStatus)
    ) {
      const newBalance = Number(withdrawal.balance) + Number(withdrawal.amount);
      
      await sql`
        UPDATE profiles 
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${withdrawal.user_id}
      `;

      // Mensagem baseada no status
      const statusMessages: Record<string, { title: string; message: string }> = {
        cancelled: { 
          title: "Saque Cancelado", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} foi cancelado e o valor foi devolvido ao seu saldo.` 
        },
        failed: { 
          title: "Saque Falhou", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} falhou no processamento e o valor foi devolvido ao seu saldo.` 
        },
        rejected: { 
          title: "Saque Rejeitado", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} foi rejeitado e o valor foi devolvido ao seu saldo.` 
        },
        nao_autorizado: { 
          title: "Saque Nao Autorizado", 
          message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} nao foi autorizado e o valor foi devolvido ao seu saldo.` 
        },
      };

      const notification = statusMessages[status] || statusMessages.cancelled;

      await sql`
        INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${withdrawal.user_id},
          ${notification.title},
          ${notification.message},
          'warning',
          NOW()
        )
      `;
    }

    // Status que marcam como processado
    const processedStatuses = ["completed", "cancelled", "failed", "rejected", "nao_autorizado"];
    
    // Atualizar status
    await sql`
      UPDATE withdrawals 
      SET status = ${status}, 
          processed_at = ${processedStatuses.includes(status) ? new Date() : null}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: `Status alterado de "${oldStatus}" para "${status}"`,
      refunded: refundStatuses.includes(status) && !refundStatuses.includes(oldStatus),
    });
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return NextResponse.json(
      { error: "Erro interno ao alterar status" },
      { status: 500 }
    );
  }
}
