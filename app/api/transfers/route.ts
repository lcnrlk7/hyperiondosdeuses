import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { assertUserVerified } from "@/lib/kyc-guard";

// GET - Listar transferencias do usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Buscar transferencias enviadas e recebidas
    const transfers = await sql`
      SELECT 
        t.id,
        t.amount,
        t.fee,
        t.description,
        t.status,
        t.created_at,
        t.sender_id,
        t.receiver_id,
        sender.name as sender_name,
        sender.email as sender_email,
        receiver.name as receiver_name,
        receiver.email as receiver_email,
        CASE 
          WHEN t.sender_id = ${user.id} THEN 'sent'
          ELSE 'received'
        END as direction
      FROM internal_transfers t
      JOIN profiles sender ON t.sender_id = sender.id
      JOIN profiles receiver ON t.receiver_id = receiver.id
      WHERE t.sender_id = ${user.id} OR t.receiver_id = ${user.id}
      ORDER BY t.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Totais
    const totals = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN sender_id = ${user.id} THEN amount ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN receiver_id = ${user.id} THEN amount ELSE 0 END), 0) as total_received,
        COUNT(*) as total_count
      FROM internal_transfers
      WHERE sender_id = ${user.id} OR receiver_id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      transfers,
      totals: {
        sent: Number(totals[0].total_sent) || 0,
        received: Number(totals[0].total_received) || 0,
        count: Number(totals[0].total_count) || 0,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar transferencias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar transferencias" },
      { status: 500 }
    );
  }
}

// POST - Criar nova transferencia
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const denied = await assertUserVerified(user.id);
    if (denied) return denied;

    const body = await request.json();
    const { receiver_identifier, amount, description } = body;

    // Validacoes
    if (!receiver_identifier || !receiver_identifier.includes("@")) {
      return NextResponse.json(
        { error: "Informe o email do destinatario" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor invalido" },
        { status: 400 }
      );
    }

    const transferAmount = Number(amount);

    if (transferAmount < 1) {
      return NextResponse.json(
        { error: "Valor minimo para transferencia e R$ 1,00" },
        { status: 400 }
      );
    }

    // Buscar dados do remetente
    const senderResult = await sql`
      SELECT id, name, email, balance, is_active
      FROM profiles WHERE id = ${user.id}
    `;

    if (senderResult.length === 0) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    const sender = senderResult[0];

    if (!sender.is_active) {
      return NextResponse.json(
        { error: "Sua conta esta inativa" },
        { status: 403 }
      );
    }

    const senderBalance = Number(sender.balance) || 0;

    if (senderBalance < transferAmount) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Seu saldo: R$ ${senderBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Buscar destinatario por email
    const email = receiver_identifier.trim().toLowerCase();
    
    const receiverResult = await sql`
      SELECT id, name, email, is_active
      FROM profiles 
      WHERE LOWER(email) = ${email}
      AND id != ${user.id}
      LIMIT 1
    `;

    if (receiverResult.length === 0) {
      return NextResponse.json(
        { error: "Destinatario nao encontrado. Verifique se o email esta correto." },
        { status: 404 }
      );
    }

    const receiver = receiverResult[0];

    if (!receiver.is_active) {
      return NextResponse.json(
        { error: "A conta do destinatario esta inativa" },
        { status: 403 }
      );
    }

    // Nao pode transferir para si mesmo
    if (receiver.id === user.id) {
      return NextResponse.json(
        { error: "Voce nao pode transferir para si mesmo" },
        { status: 400 }
      );
    }

    // Taxa = 0 (transferencia interna gratuita)
    const fee = 0;

    // Iniciar transacao
    // Debitar do remetente
    await sql`
      UPDATE profiles 
      SET balance = balance - ${transferAmount}, 
          updated_at = NOW()
      WHERE id = ${user.id} AND balance >= ${transferAmount}
    `;

    // Creditar no destinatario
    await sql`
      UPDATE profiles 
      SET balance = balance + ${transferAmount}, 
          updated_at = NOW()
      WHERE id = ${receiver.id}
    `;

    // Registrar transferencia
    const transferResult = await sql`
      INSERT INTO internal_transfers (
        sender_id, receiver_id, amount, fee, description, status, created_at
      ) VALUES (
        ${user.id}, ${receiver.id}, ${transferAmount}, ${fee}, 
        ${description || 'Transferencia interna'}, 'completed', NOW()
      )
      RETURNING id, amount, fee, status, created_at
    `;

    const transfer = transferResult[0];

    // Buscar saldo atualizado
    const newBalanceResult = await sql`
      SELECT balance FROM profiles WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      message: "Transferencia realizada com sucesso!",
      transfer: {
        id: transfer.id,
        amount: transferAmount,
        fee: 0,
        receiver_name: receiver.name,
        receiver_email: receiver.email,
        status: "completed",
        created_at: transfer.created_at,
      },
      new_balance: Number(newBalanceResult[0].balance) || 0,
    });
  } catch (error) {
    console.error("Erro ao realizar transferencia:", error);
    return NextResponse.json(
      { error: "Erro ao realizar transferencia. Tente novamente." },
      { status: 500 }
    );
  }
}
