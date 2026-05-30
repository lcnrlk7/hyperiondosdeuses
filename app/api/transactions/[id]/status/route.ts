import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET - Verificar status de uma transacao (publico para polling)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [transaction] = await sql`
      SELECT id, status, amount, net_amount, created_at, updated_at
      FROM transactions
      WHERE id = ${id}
    `;

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      net_amount: transaction.net_amount,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    });
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status" },
      { status: 500 }
    );
  }
}
