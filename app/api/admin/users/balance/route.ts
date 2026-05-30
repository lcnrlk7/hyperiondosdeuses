import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();
    
    const body = await request.json();
    const { userId, operation, amount, newBalance, reason } = body;

    if (!userId || !operation || amount === undefined || newBalance === undefined) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Buscar saldo atual do usuário
    const userResult = await sql`
      SELECT id, email, name, balance FROM profiles WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const user = userResult[0];
    const oldBalance = Number(user.balance) || 0;

    // Atualizar saldo
    await sql`
      UPDATE profiles 
      SET balance = ${newBalance}, updated_at = NOW() 
      WHERE id = ${userId}
    `;

    // Registrar log de auditoria
    const logId = crypto.randomUUID();
    try {
      await sql`
        INSERT INTO audit_logs (
          id, 
          user_id, 
          action, 
          entity_type, 
          entity_id, 
          old_value, 
          new_value, 
          created_at
        )
        VALUES (
          ${logId},
          ${userId},
          ${operation === 'add' ? 'BALANCE_CREDIT' : 'BALANCE_DEBIT'},
          'profile',
          ${userId},
          ${JSON.stringify({ 
            balance: oldBalance,
            email: user.email,
            name: user.name
          })},
          ${JSON.stringify({ 
            balance: newBalance, 
            amount: amount,
            operation: operation,
            reason: reason || (operation === 'add' ? 'Crédito manual pelo admin' : 'Débito manual pelo admin'),
            changed_at: new Date().toISOString()
          })},
          NOW()
        )
      `;
    } catch (logError) {
      console.error("Error creating audit log:", logError);
    }

    // Nota: Alteracoes de saldo pelo admin NAO geram notificacoes para o usuario
    // O registro fica apenas no audit_log para controle interno

    return NextResponse.json({ 
      success: true,
      oldBalance: Number(oldBalance),
      newBalance: Number(newBalance),
      auditLogId: logId
    });
  } catch (error) {
    console.error("Error updating user balance:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar saldo" },
      { status: 500 }
    );
  }
}

// GET para buscar historico de alteracoes de saldo de um usuario
export async function GET(request: NextRequest) {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const logs = await sql`
      SELECT * FROM audit_logs 
      WHERE entity_id = ${userId} 
        AND action IN ('BALANCE_CREDIT', 'BALANCE_DEBIT')
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching balance history:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}
