import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { notifyPixPaid } from "@/lib/notifications";
import { notifyDeposit, notifyWithdrawal, notifyUserTransaction } from "@/lib/telegram/notify";

// Comparacao de strings em tempo constante para evitar timing attacks.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(request: NextRequest) {
  try {
    // SEGURANCA: este endpoint NAO e a URL registrada no adquirente (essa e
    // /api/webhooks/medusa). Antes creditava saldo sem NENHUMA autenticacao, o
    // que permitia forjar "charge.paid" e adicionar saldo. Agora exige um
    // segredo compartilhado e falha fechado se ele nao estiver configurado.
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const provided =
      request.headers.get("x-webhook-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";
    if (!secret || !provided || !safeEqual(provided, secret)) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.text();
    const payload = JSON.parse(body);
    const event = payload.event || payload.type;
    const data = payload.data || payload;

    console.log("[Payment Webhook] Event received:", event, "| Transaction ID:", data?.id || data?.transactionId);

    switch (event) {
      case "pix.charge.paid":
      case "charge.paid":
      case "COMPLETO": {
        const transactionId = data.id || data.transactionId || data.transaction_id;
        
        // Buscar transação
        let txResult = await sql`
          SELECT t.*, p.id as profile_id, p.email as profile_email, p.name as profile_name, p.balance as profile_balance
          FROM transactions t
          LEFT JOIN profiles p ON t.user_id = p.id
          WHERE t.acquirer_transaction_id = ${String(transactionId)}
        `;

        if (txResult.length === 0) {
          txResult = await sql`
            SELECT t.*, p.id as profile_id, p.email as profile_email, p.name as profile_name, p.balance as profile_balance
            FROM transactions t
            LEFT JOIN profiles p ON t.user_id = p.id
            WHERE t.external_id = ${String(transactionId)}
          `;
        }

        if (txResult.length > 0) {
          const transaction = txResult[0];

          await sql`
            UPDATE transactions
            SET status = 'completed', paid_at = ${data.paid_at || new Date().toISOString()}, payer_name = ${data.payer?.name}, payer_document = ${data.payer?.document}
            WHERE id = ${transaction.id}
          `;

          const newBalance = (Number(transaction.profile_balance) || 0) + Number(transaction.net_amount);
          await sql`
            UPDATE profiles SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${transaction.user_id}
          `;

          await sql`
            INSERT INTO audit_logs (id, user_id, action, entity_id, entity_type, description, metadata, created_at)
            VALUES (${crypto.randomUUID()}, ${transaction.user_id}, 'PAYMENT_CONFIRMED', ${transaction.id}, 'transaction', ${`Pagamento de R$ ${transaction.amount.toFixed(2)} confirmado`}, ${JSON.stringify({ transaction_id: transaction.id, payer: data.payer })}, NOW())
          `;

          // Notificacao (sino + push) idempotente por transacao - evita duplicidade
          // caso o webhook Medusa, o polling ou o cron tambem detectem este pagamento.
          await notifyPixPaid(transaction.user_id, Number(transaction.amount), Number(transaction.net_amount), data.payer?.name || undefined, transaction.id);
          
          // Notificar no Telegram
          const fee = Number(transaction.amount) - Number(transaction.net_amount);
          await notifyDeposit(transaction.user_id, Number(transaction.amount), fee);
          await notifyUserTransaction(transaction.user_id, "deposit", Number(transaction.net_amount), "completed");
        }
        break;
      }

      case "pix.charge.expired":
      case "charge.expired":
      case "EXPIRADO": {
        const expiredId = data.id || data.transactionId;
        await sql`
          UPDATE transactions SET status = 'expired'
          WHERE acquirer_transaction_id = ${String(expiredId)} OR external_id = ${String(expiredId)}
        `;
        break;
      }

      case "pix.charge.cancelled":
      case "charge.cancelled":
      case "CANCELADO":
      case "FALHA": {
        const cancelledId = data.id || data.transactionId;
        await sql`
          UPDATE transactions SET status = 'failed'
          WHERE acquirer_transaction_id = ${String(cancelledId)} OR external_id = ${String(cancelledId)}
        `;
        break;
      }

      case "pix.withdrawal.completed":
      case "withdrawal.completed": {
        const withdrawalId = data.id || data.transactionId;
        
        // Buscar o saque
        const completedWdResult = await sql`
          SELECT w.*, p.name as profile_name
          FROM withdrawals w
          LEFT JOIN profiles p ON w.user_id = p.id
          WHERE w.acquirer_withdrawal_id = ${String(withdrawalId)}
        `;

        if (completedWdResult.length > 0) {
          const withdrawal = completedWdResult[0];
          
          await sql`
            UPDATE withdrawals SET status = 'completed', processed_at = NOW()
            WHERE id = ${withdrawal.id}
          `;

          // Notificar usuário
          await sql`
            INSERT INTO user_notifications (user_id, title, message, type)
            VALUES (${withdrawal.user_id}, 'Saque Concluído!', ${`Seu saque de R$ ${withdrawal.net_amount.toFixed(2)} foi processado e enviado para sua conta PIX.`}, 'success')
          `;

          // Log de auditoria
          await sql`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
            VALUES (${withdrawal.user_id}, 'WITHDRAWAL_COMPLETED', 'withdrawal', ${withdrawal.id}, ${JSON.stringify({ amount: withdrawal.net_amount, status: 'completed' })})
          `;
          
          // Notificar no Telegram
          const wdFee = Number(withdrawal.amount) - Number(withdrawal.net_amount);
          await notifyWithdrawal(withdrawal.user_id, Number(withdrawal.amount), wdFee, "completed");
          await notifyUserTransaction(withdrawal.user_id, "withdrawal", Number(withdrawal.net_amount), "completed");
        }
        break;
      }

      case "pix.withdrawal.failed":
      case "withdrawal.failed": {
        const failedWithdrawalId = data.id || data.transactionId;
        const wdResult = await sql`
          SELECT w.*, p.balance as profile_balance
          FROM withdrawals w
          LEFT JOIN profiles p ON w.user_id = p.id
          WHERE w.acquirer_withdrawal_id = ${String(failedWithdrawalId)}
        `;

        if (wdResult.length > 0) {
          const withdrawal = wdResult[0];
          await sql`
            UPDATE withdrawals SET status = 'failed', admin_notes = ${data.failure_reason || 'Falha no processamento'}
            WHERE id = ${withdrawal.id}
          `;

          // Devolver saldo ao usuário
          const newBalance = (Number(withdrawal.profile_balance) || 0) + Number(withdrawal.amount);
          await sql`
            UPDATE profiles SET balance = ${newBalance} WHERE id = ${withdrawal.user_id}
          `;

          // Notificar usuário
          await sql`
            INSERT INTO user_notifications (user_id, title, message, type)
            VALUES (${withdrawal.user_id}, 'Saque Falhou', ${`Seu saque de R$ ${withdrawal.amount.toFixed(2)} falhou. O valor foi devolvido ao seu saldo.`}, 'error')
          `;
          
          // Notificar no Telegram
          await notifyUserTransaction(withdrawal.user_id, "withdrawal", Number(withdrawal.amount), "rejected");
        }
        break;
      }

      default:
        console.log("[Payment Webhook] Unknown event:", event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
