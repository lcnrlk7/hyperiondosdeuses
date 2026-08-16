import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET: detalhe completo de uma transacao
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    const { id } = await params;

    const txResult = await sql`
      SELECT t.*, p.name as user_name, p.email as user_email, p.balance as user_balance,
             p.cpf_cnpj as user_document, p.phone as user_phone, p.is_blocked as user_blocked
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.id = ${id}
      LIMIT 1
    `;

    if (txResult.length === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    const transaction = txResult[0];

    // Historico real de eventos vindo de audit_logs
    let events: Record<string, unknown>[] = [];
    try {
      events = await sql`
        SELECT id, action, old_value, new_value, created_at
        FROM audit_logs
        WHERE entity_id = ${id} AND entity_type = 'transaction'
        ORDER BY created_at ASC
      `;
    } catch {
      events = [];
    }

    // Logs de webhook relacionados
    let webhooks: Record<string, unknown>[] = [];
    try {
      webhooks = await sql`
        SELECT id, url, response_status, success, attempts, created_at
        FROM webhook_logs
        WHERE transaction_id = ${id}
        ORDER BY created_at ASC
      `;
    } catch {
      webhooks = [];
    }

    return NextResponse.json(
      { transaction, events, webhooks },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Error fetching transaction detail:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// POST: acoes sobre a transacao (cancelar, estornar)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    const { id } = await params;
    const { action, reason } = await request.json();

    const txResult = await sql`SELECT * FROM transactions WHERE id = ${id} LIMIT 1`;
    if (txResult.length === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }
    const transaction = txResult[0];
    const status = String(transaction.status || "").toLowerCase();
    const netAmount = Number(transaction.net_amount) || Number(transaction.amount) || 0;
    const isIncoming =
      transaction.type === "pix_in" ||
      transaction.type === "deposit" ||
      transaction.type === "transfer_in";

    // CANCELAR: apenas transacoes pendentes
    if (action === "cancel") {
      if (status !== "pending" && status !== "processing" && status !== "created") {
        return NextResponse.json(
          { error: "Só é possível cancelar transações pendentes" },
          { status: 400 }
        );
      }

      await sql`
        UPDATE transactions
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${id}
      `;

      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_id, entity_type, old_value, new_value, created_at)
        VALUES (
          ${crypto.randomUUID()}, ${admin.userId}, 'transaction_cancel', ${id}, 'transaction',
          ${status}, ${`cancelled${reason ? ` — ${reason}` : ""}`}, NOW()
        )
      `;

      return NextResponse.json({ success: true, status: "cancelled" });
    }

    // ESTORNAR: apenas transacoes aprovadas/concluidas
    if (action === "refund") {
      if (status !== "completed" && status !== "approved" && status !== "paid") {
        return NextResponse.json(
          { error: "Só é possível estornar transações aprovadas" },
          { status: 400 }
        );
      }

      let previousBalance = 0;
      let newBalance = 0;

      // Se foi entrada creditada, debitar o valor liquido do saldo do usuario
      if (isIncoming) {
        const profileResult = await sql`SELECT balance FROM profiles WHERE id = ${transaction.user_id}`;
        previousBalance = Number(profileResult[0]?.balance) || 0;
        newBalance = previousBalance - netAmount;
        await sql`UPDATE profiles SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${transaction.user_id}`;
      }

      await sql`
        UPDATE transactions
        SET status = 'refunded', updated_at = NOW()
        WHERE id = ${id}
      `;

      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_id, entity_type, old_value, new_value, created_at)
        VALUES (
          ${crypto.randomUUID()}, ${admin.userId}, 'transaction_refund', ${id}, 'transaction',
          ${`saldo ${previousBalance.toFixed(2)} / status ${status}`},
          ${`saldo ${newBalance.toFixed(2)} / estornado R$ ${netAmount.toFixed(2)}${reason ? ` — ${reason}` : ""}`},
          NOW()
        )
      `;

      return NextResponse.json({ success: true, status: "refunded", previousBalance, newBalance });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Error processing transaction action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
