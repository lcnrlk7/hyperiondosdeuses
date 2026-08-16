import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

// GET para bloquear via URL simples (emergencia) - AGORA EXIGE ADMIN
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  const userId = request.nextUrl.searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
  }

  try {
    // Criar coluna se nao existir
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_reason TEXT`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP`;

    // Bloquear usuario
    await sql`
      UPDATE profiles 
      SET 
        is_blocked = true,
        block_reason = 'Bloqueado via API de emergencia',
        blocked_at = NOW(),
        balance = 0,
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Cancelar todos os saques pendentes
    await sql`
      UPDATE withdrawals 
      SET status = 'cancelled', notes = 'Cancelado - Usuario bloqueado'
      WHERE user_id = ${userId} AND status IN ('pending', 'processing', 'pending_approval')
    `;

    return NextResponse.json({
      success: true,
      message: `Usuario ${userId} bloqueado com sucesso. Saldo zerado e saques cancelados.`,
    });
  } catch (error) {
    console.error("Erro ao bloquear usuario:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    const { userId, reason, cancelPendingWithdrawals } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }

    const results: string[] = [];

    // 1. Bloquear usuario
    await sql`
      UPDATE profiles 
      SET 
        is_blocked = true,
        block_reason = ${reason || 'Atividade suspeita detectada'},
        blocked_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId}
    `;
    results.push("Usuario bloqueado");

    // 2. Cancelar saques pendentes se solicitado
    if (cancelPendingWithdrawals) {
      const pendingWithdrawals = await sql`
        SELECT id, amount, net_amount FROM withdrawals 
        WHERE user_id = ${userId} AND status IN ('pending', 'processing', 'pending_approval')
      `;

      for (const w of pendingWithdrawals) {
        // Devolver saldo ao usuario
        await sql`
          UPDATE profiles 
          SET balance = balance + ${w.amount}
          WHERE id = ${userId}
        `;
        
        // Cancelar saque
        await sql`
          UPDATE withdrawals 
          SET status = 'cancelled', notes = ${reason || 'Cancelado por atividade suspeita'}, updated_at = NOW()
          WHERE id = ${w.id}
        `;
        
        results.push(`Saque ${w.id} cancelado, R$${w.amount} devolvido`);
      }
    }

    // 3. Invalidar sessoes
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
    results.push("Sessoes invalidadas");

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Erro ao bloquear usuario:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
