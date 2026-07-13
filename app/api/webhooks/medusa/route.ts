import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { 
  notifyWithdrawalCompleted, 
  notifyWithdrawalFailed, 
  notifyPixPaid,
  notifyDeposit 
} from "@/lib/notifications";
import { logTransactionStatusUpdate, logWithdrawalStatusUpdate, logWebhookReceived } from "@/lib/discord-webhook";
import { sendMerchantWebhook } from "@/lib/merchant-webhook";
  import { sendPixEventToUtmify } from "@/lib/utmify";

/**
 * Webhook para receber notificações da Medusa Payments
 * Formato do payload conforme documentação:
 * https://api.medusapayments.com
 */

/**
 * MEDUSA STATUS (conforme documentação oficial)
 * 
 * Status de TRANSFERENCIA (TRANSFER_UPDATE):
 * - LIQUIDATED: Transferência concluída com sucesso
 * - PENDING: Aguardando processamento
 * - FAILED: Falha na transferência
 * - CANCELLED: Transferência cancelada
 * 
 * Status de PAGAMENTO:
 * - waiting_payment: Pagamento ainda não realizado
 * - pending: Em processamento
 * - approved: Confirmado com sucesso
 * - refused: Pagamento negado
 * - paid: Pagamento efetivado
 * - cancelled: Operação encerrada sem sucesso
 */
const MEDUSA_STATUS_MAP: Record<string, string> = {
  // Status de transferência/saque (formato TRANSFER_UPDATE - legado)
  "LIQUIDATED": "completed",
  "liquidated": "completed",
  "PENDING": "pending",
  "FAILED": "failed",
  "CANCELLED": "failed",

  // Status de transferência/saque (formato oficial "withdraw")
  "COMPLETED": "completed",
  "PROCESSING": "pending",
  "REFUSED": "failed",
  "PENDING_ANALYSIS": "pending",
  "PENDING_QUEUE": "pending",
  
  // Status de pagamento
  waiting_payment: "pending",
  pending: "pending",
  processing: "pending",
  approved: "completed",
  paid: "completed",
  refused: "failed",
  cancelled: "failed",
  in_protest: "disputed",
  refunded: "refunded",
  chargeback: "chargeback",
  completed: "completed",
  failed: "failed",
  expired: "expired",
};

// Payload de VENDA (PIX/Depósito)
interface MedusaTransactionPayload {
  id: number;
  tenantId?: number;
  companyId?: number;
  amount: number;
  paymentMethod?: string;
  status: string;
  paidAt?: string;
  paidAmount?: number;
  refundedAt?: string;
  refundedAmount?: number;
  postbackUrl?: string;
  metadata?: unknown;
  ip?: string;
  externalRef?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: Array<{
    title: string;
    quantity: number;
    tangible: boolean;
  }>;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document?: {
      type: string;
      number: string;
    };
  };
  pix?: {
    qrcode: string;
    end2EndId?: string;
    receiptUrl?: string;
    expirationDate?: string;
  };
}

// Payload de SAQUE (Withdrawal/Cash-out) - formato antigo
interface MedusaWithdrawalPayload {
  id: number;
  status: string;
  message?: string; // "cash-out" indica que é um saque
  amount?: string | number;
  taxa?: string | number;
  pixKey?: string;
  created?: string;
  withdrawal_id?: number;
  transaction_id?: number;
}

// Payload de TRANSFERENCIA (TRANSFER_UPDATE) - formato novo/correto
interface MedusaTransferUpdatePayload {
  version: string; // "v1"
  event: string; // "TRANSFER_UPDATE"
  object: string; // "Transfer"
  date: string;
  transfer: {
    id_transaction: number;
    correlation_id: string; // Este é o nosso ID de referência
    status: string; // "LIQUIDATED", "PENDING", "FAILED", "CANCELLED"
    value: number; // Valor em centavos
    end_to_end: string;
  };
  destination: {
    name: string;
    document: string;
    pix_key: string;
    bank: {
      name: string;
      ispb: string;
    };
  };
}

// União dos tipos possíveis
type MedusaWebhookPayload = MedusaTransactionPayload | MedusaWithdrawalPayload | MedusaTransferUpdatePayload;

/**
 * Handler para o formato TRANSFER_UPDATE (saques)
 * Exemplo de payload:
 * {
 *   "version": "v1",
 *   "event": "TRANSFER_UPDATE",
 *   "object": "Transfer",
 *   "date": "2026-04-27T15:51:03.132+00:00",
 *   "transfer": {
 *     "id_transaction": 11506,
 *     "correlation_id": "610fb233-1071-4121-a152-0824c03dc29d",
 *     "status": "LIQUIDATED",
 *     "value": 999,
 *     "end_to_end": "E3729393020260427155045350ce7da7"
 *   },
 *   "destination": { ... }
 * }
 */
async function handleTransferUpdate(payload: MedusaTransferUpdatePayload) {
  const { transfer, destination, date } = payload;
  const { id_transaction, correlation_id, status, value, end_to_end } = transfer;

  console.log(`[Medusa Webhook] TRANSFER_UPDATE: id=${id_transaction}, correlation=${correlation_id}, status=${status}, value=${value}`);

  // Mapear status da Medusa para status interno
  const internalStatus = MEDUSA_STATUS_MAP[status] || status.toLowerCase();
  console.log(`[Medusa Webhook] Status mapeado: ${status} -> ${internalStatus}`);

  // O correlation_id so pode ser comparado com w.id (coluna UUID) se for um UUID valido,
  // senao o Postgres lanca "invalid input syntax for type uuid".
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const correlationUuid = uuidRegex.test(String(correlation_id)) ? String(correlation_id) : null;

  // Buscar saque pelo correlation_id (nosso ID de referencia) ou pelo acquirer_withdrawal_id
  const withdrawals = await sql`
    SELECT w.id, w.user_id, w.amount, w.fee, w.net_amount, w.status, w.pix_key,
           p.email as profile_email, p.name as profile_name, p.balance as profile_balance
    FROM withdrawals w
    LEFT JOIN profiles p ON w.user_id = p.id
    WHERE w.acquirer_withdrawal_id = ${String(id_transaction)}
       OR w.acquirer_withdrawal_id = ${String(correlation_id)}
       OR w.id = ${correlationUuid}
  `;

  if (withdrawals.length === 0) {
    console.log(`[Medusa Webhook] Saque não encontrado. id_transaction=${id_transaction}, correlation_id=${correlation_id}`);
    
    // Tentar buscar pelo valor e PIX key (fallback)
    const pixKey = destination?.pix_key;
    if (pixKey) {
      const fallbackSearch = await sql`
        SELECT w.id, w.user_id, w.amount, w.fee, w.net_amount, w.status, w.pix_key,
               p.email as profile_email, p.name as profile_name, p.balance as profile_balance
        FROM withdrawals w
        LEFT JOIN profiles p ON w.user_id = p.id
        WHERE w.pix_key = ${pixKey}
          AND w.status = 'processing'
        ORDER BY w.created_at DESC
        LIMIT 1
      `;
      
      if (fallbackSearch.length > 0) {
        console.log(`[Medusa Webhook] Encontrado saque por fallback (pix_key): ${fallbackSearch[0].id}`);
        return await updateWithdrawalStatus(fallbackSearch[0], internalStatus, {
          id_transaction,
          correlation_id,
          end_to_end,
          value,
          date
        });
      }
    }
    
    return NextResponse.json({ success: true, message: "Saque não encontrado no sistema" });
  }

  const withdrawal = withdrawals[0];
  return await updateWithdrawalStatus(withdrawal, internalStatus, {
    id_transaction,
    correlation_id,
    end_to_end,
    value,
    date
  });
}

/**
 * Atualiza o status de um saque
 */
async function updateWithdrawalStatus(
  withdrawal: Record<string, unknown>,
  internalStatus: string,
  metadata: { id_transaction: number; correlation_id: string; end_to_end: string; value: number; date: string }
) {
  // Se o status já é final, não atualizar
  if (withdrawal.status === "completed" || withdrawal.status === "failed" || withdrawal.status === "rejected") {
    console.log(`[Medusa Webhook] Saque ${withdrawal.id} já está em status final: ${withdrawal.status}`);
    return NextResponse.json({ success: true, message: "Saque já processado" });
  }

  // Determinar novo status
  let newStatus = withdrawal.status as string;
  const userId = withdrawal.user_id as string;
  const netAmount = Number(withdrawal.net_amount) || 0;
  const pixKey = withdrawal.pix_key as string;
  
  if (internalStatus === "completed") {
    newStatus = "completed";
    
    const grossAmount = Number(withdrawal.amount) || 0;
    const fee = Number(withdrawal.fee) || 0;
    
    // Atualizar status do saque
    await sql`
      UPDATE withdrawals 
      SET 
        status = 'completed', 
        processed_at = NOW(),
        acquirer_withdrawal_id = COALESCE(acquirer_withdrawal_id, ${String(metadata.id_transaction)})
      WHERE id = ${withdrawal.id}
    `;
    
        console.log(`[Medusa Webhook] Saque ${withdrawal.id} CONCLUIDO! Bruto: R$ ${grossAmount.toFixed(2)}, Taxa: R$ ${fee.toFixed(2)}, Liquido: R$ ${netAmount.toFixed(2)}`);
        
        // Notificar usuario usando a funcao de notificacao com valor bruto, liquido e taxa
        await notifyWithdrawalCompleted(userId, grossAmount, netAmount, fee, pixKey, metadata.end_to_end);
        
        // Log para Discord
        logWithdrawalStatusUpdate({
          withdrawalId: withdrawal.id as string,
          userName: withdrawal.profile_name as string || "N/A",
          userEmail: withdrawal.profile_email as string || "",
          amount: grossAmount,
          netAmount: netAmount,
          oldStatus: withdrawal.status as string,
          newStatus: "completed",
          pixKey: pixKey,
        });
    
  } else if (internalStatus === "failed" || internalStatus === "cancelled") {
    newStatus = "failed";
    
    // Se o saque falhou, devolver o saldo ao usuario
    const refundAmount = Number(withdrawal.amount) || 0;
    
    await sql`
      UPDATE profiles SET balance = balance + ${refundAmount}
      WHERE id = ${userId}
    `;
    
    // Atualizar status do saque
    await sql`
      UPDATE withdrawals 
      SET 
        status = 'failed', 
        processed_at = NOW()
      WHERE id = ${withdrawal.id}
    `;
    
    console.log(`[Medusa Webhook] Saque ${withdrawal.id} FALHOU. Devolvido R$ ${refundAmount.toFixed(2)} para usuario ${userId}`);
    
    // Notificar usuario sobre a falha
    await notifyWithdrawalFailed(userId, refundAmount, "Falha no processamento pela adquirente");
  } else {
    // Apenas atualizar status se mudou
    await sql`
      UPDATE withdrawals 
      SET 
        status = ${internalStatus}, 
        acquirer_withdrawal_id = COALESCE(acquirer_withdrawal_id, ${String(metadata.id_transaction)})
      WHERE id = ${withdrawal.id}
    `;
  }

  console.log(`[Medusa Webhook] Saque ${withdrawal.id} atualizado para status: ${newStatus}`);

  return NextResponse.json({ 
    success: true, 
    type: "withdrawal", 
    withdrawal_id: withdrawal.id,
    status: newStatus,
    end_to_end: metadata.end_to_end
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    console.log("[Medusa Webhook] Raw body recebido:", rawBody);
    
    let payload = JSON.parse(rawBody);

    console.log("[Medusa Webhook] Payload parseado:", JSON.stringify(payload, null, 2));

    // FORMATO OFICIAL MEDUSA (postback): { type, objectId, data: { ... } }
    // - type "transaction" = venda/deposito (PIX In)
    // - type "withdraw"    = transferencia/saque (PIX Out)
    // Todos os dados relevantes ficam ANINHADOS em "data". Aqui normalizamos.
    if (payload && typeof payload.data === "object" && payload.data !== null) {
      const d = payload.data;

      // Saque no formato oficial -> converter para o formato TRANSFER_UPDATE ja tratado.
      if (payload.type === "withdraw") {
        const normalizedTransfer: MedusaTransferUpdatePayload = {
          version: "v1",
          event: "TRANSFER_UPDATE",
          object: "Transfer",
          date: d.updatedAt || d.transferredAt || d.processedAt || new Date().toISOString(),
          transfer: {
            id_transaction: d.id,
            correlation_id: d.externalRef || String(d.id),
            status: d.status,
            value: d.amount,
            end_to_end: d.pixEnd2EndId || "",
          },
          destination: {
            name: "",
            document: d.pixKey || "",
            pix_key: d.pixKey || "",
            bank: { name: "", ispb: "" },
          },
        };
        console.log("[Medusa Webhook] Formato oficial 'withdraw' detectado. Normalizando.");
        return await handleTransferUpdate(normalizedTransfer);
      }

      // Venda/deposito no formato oficial -> achatar "data" para o nivel raiz,
      // pois o restante do handler le id/status/customer/paidAt na raiz.
      if (payload.type === "transaction" || d.paymentMethod || d.pix) {
        console.log("[Medusa Webhook] Formato oficial 'transaction' detectado. Achatando 'data'.");
        payload = {
          ...d,
          objectId: payload.objectId,
        };
      }
    }

    // Detectar formato TRANSFER_UPDATE (formato legado de saques)
    if (payload.event === "TRANSFER_UPDATE" && payload.transfer) {
      return await handleTransferUpdate(payload as MedusaTransferUpdatePayload);
    }

    // Identificar o ID - pode vir em diferentes campos dependendo se é venda ou saque
    const transactionId = payload.id || payload.objectId || payload.withdrawal_id || payload.transaction_id;
    const status = payload.status;
    
    // Detectar se é um callback de SAQUE (formato antigo)
    // Formato de saque: { id, status, message: "cash-out", amount, taxa, pixKey, created }
    const isWithdrawalCallback = payload.message === "cash-out" || payload.pixKey !== undefined || payload.taxa !== undefined;

    console.log(`[Medusa Webhook] Tipo: ${isWithdrawalCallback ? 'SAQUE' : 'VENDA'}, ID: ${transactionId}, Status: ${status}`);

    if (!transactionId) {
      console.log("[Medusa Webhook] Payload sem ID:", payload);
      return NextResponse.json(
        { error: "ID da transação não informado", received: payload },
        { status: 400 }
      );
    }

    // Mapear status da Medusa para status interno
    const internalStatus = MEDUSA_STATUS_MAP[status?.toLowerCase()] || MEDUSA_STATUS_MAP[status] || status;

    console.log(`[Medusa Webhook] Status original: ${status}, Status interno: ${internalStatus}`);

    // Se é callback de saque OU buscar pelo ID na tabela de saques
    const withdrawals = await sql`
      SELECT w.id, w.user_id, w.amount, w.fee, w.net_amount, w.status, w.pix_key,
             p.email as profile_email, p.name as profile_name, p.balance as profile_balance
      FROM withdrawals w
      LEFT JOIN profiles p ON w.user_id = p.id
      WHERE w.acquirer_withdrawal_id = ${String(transactionId)}
    `;

    if (withdrawals.length > 0) {
      // E um callback de saque
      const withdrawal = withdrawals[0];
      const userId = withdrawal.user_id as string;
      const netAmount = Number(withdrawal.net_amount) || 0;
      const pixKey = withdrawal.pix_key as string;
      
      // Se o status ja e final, nao atualizar
      if (withdrawal.status === "completed" || withdrawal.status === "failed" || withdrawal.status === "rejected") {
        console.log(`[Medusa Webhook] Saque ${transactionId} ja esta em status final: ${withdrawal.status}`);
        return NextResponse.json({ success: true, message: "Saque ja processado" });
      }

      // Mapear status para saque
      let withdrawalStatus = withdrawal.status;
      const grossAmount = Number(withdrawal.amount) || 0;
      const fee = Number(withdrawal.fee) || 0;
      
      if (internalStatus === "completed") {
        withdrawalStatus = "completed";
        
        await sql`
          UPDATE withdrawals 
          SET status = 'completed', processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;
        
        console.log(`[Medusa Webhook] Saque ${transactionId} CONCLUIDO! Bruto: R$ ${grossAmount.toFixed(2)}, Taxa: R$ ${fee.toFixed(2)}, Liquido: R$ ${netAmount.toFixed(2)}`);
        
        // Notificar usuario com valor bruto, liquido e taxa
        await notifyWithdrawalCompleted(userId, grossAmount, netAmount, fee, pixKey);
        
      } else if (internalStatus === "failed" || internalStatus === "cancelled") {
        withdrawalStatus = "failed";
        
        const refundAmount = Number(withdrawal.amount) || 0;
        
        await sql`
          UPDATE profiles SET balance = balance + ${refundAmount}
          WHERE id = ${userId}
        `;
        
        await sql`
          UPDATE withdrawals 
          SET status = 'failed', processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;
        
        console.log(`[Medusa Webhook] Saque ${transactionId} FALHOU. Devolvido R$ ${refundAmount.toFixed(2)}`);
        
        // Notificar usuario sobre a falha
        await notifyWithdrawalFailed(userId, refundAmount, "Falha no processamento");
      }

      return NextResponse.json({ success: true, type: "withdrawal", status: withdrawalStatus });
    }

    // Se não é saque, buscar transação de pagamento
    // Buscar por acquirer_transaction_id, external_id exato, ou external_id que contenha o ID da Medusa
    const transactions = await sql`
      SELECT t.id, t.user_id, t.amount, t.fee, t.net_amount, t.status,
             p.email as profile_email, p.name as profile_name, p.balance as profile_balance
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.acquirer_transaction_id = ${String(transactionId)} 
         OR t.external_id = ${String(transactionId)}
         OR t.external_id LIKE ${'%' + String(transactionId) + '%'}
         OR t.metadata::text LIKE ${'%' + String(transactionId) + '%'}
      ORDER BY t.created_at DESC
      LIMIT 1
    `;

    if (transactions.length === 0) {
      console.log(`[Medusa Webhook] Transação/Saque ${transactionId} não encontrado no sistema`);
      
      // Logar o webhook recebido para debug
      try {
        await sql`
          INSERT INTO webhook_logs (id, url, payload, response_status, success, created_at)
          VALUES (
            ${crypto.randomUUID()},
            'medusa-not-found',
            ${JSON.stringify(payload)},
            404,
            false,
            NOW()
          )
        `;
      } catch (logErr) {
        console.error("[Medusa Webhook] Erro ao logar webhook:", logErr);
      }
      
      return NextResponse.json({ success: true, message: "Transação não encontrada" });
    }

    const transaction = transactions[0];

    // Verificar se o saldo ja foi creditado para esta transacao
    const existingCredit = await sql`
      SELECT id FROM audit_logs 
      WHERE entity_id = ${transaction.id}
        AND action = 'PAYMENT_CONFIRMED'
      LIMIT 1
    `;
    const alreadyCredited = existingCredit.length > 0;

    // Se o status já é final E o saldo já foi creditado, não fazer nada
    if ((transaction.status === "completed" || transaction.status === "failed") && alreadyCredited) {
      console.log(`[Medusa Webhook] Transação ${transactionId} já processada e creditada. Skipping.`);
      return NextResponse.json({ success: true, message: "Transação já processada" });
    }

    // Extrair campos específicos de venda (podem não existir em callbacks de saque)
    const paidAt = payload.paidAt;
    const customer = payload.customer;
    const pixData = payload.pix;

    // Dados REAIS de quem pagou, retornados pela Medusa quando o PIX e liquidado.
    // Na criacao gravamos o nome do dono da conta como placeholder; agora que a
    // Medusa informou o pagador de fato, sobrescrevemos para exibir quem pagou.
    const realPayerName = customer?.name || null;
    const realPayerDocument = customer?.document?.number || null;
    const realPayerEmail = customer?.email || null;
    const realPayerPhone = customer?.phone || null;
    const endToEndId = pixData?.end2EndId || null;
    const receiptUrl = pixData?.receiptUrl || null;

    // Informacoes extras do pagamento (end-to-end, comprovante) guardadas no metadata.
    const paymentExtras = JSON.stringify({
      ...(endToEndId ? { end_to_end: endToEndId } : {}),
      ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
      ...(realPayerName ? { medusa_payer_name: realPayerName } : {}),
    });

    // Atualizar status da transação com os dados do pagador reais da Medusa.
    await sql`
      UPDATE transactions 
      SET 
        status = ${internalStatus},
        paid_at = COALESCE(paid_at, ${paidAt ? new Date(paidAt) : (internalStatus === 'completed' ? new Date() : null)}),
        payer_name = COALESCE(${realPayerName}, payer_name),
        payer_document = COALESCE(${realPayerDocument}, payer_document),
        payer_email = COALESCE(${realPayerEmail}, payer_email),
        payer_phone = COALESCE(${realPayerPhone}, payer_phone),
        metadata = COALESCE(metadata, '{}'::jsonb) || ${paymentExtras}::jsonb,
        updated_at = NOW()
      WHERE id = ${transaction.id}
    `;

    console.log(`[Medusa Webhook] Transação ${transactionId} atualizada para status: ${internalStatus}. Already credited: ${alreadyCredited}`);

    // Logar webhook recebido com sucesso
    try {
      await sql`
        INSERT INTO webhook_logs (id, transaction_id, url, payload, response_status, success, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${transaction.id},
          'medusa-success',
          ${JSON.stringify(payload)},
          200,
          true,
          NOW()
        )
      `;
    } catch (logErr) {
      console.error("[Medusa Webhook] Erro ao logar webhook:", logErr);
    }

    // Se pagamento confirmado E saldo ainda nao foi creditado, creditar saldo do usuario
    if (internalStatus === "completed" && transaction.user_id && !alreadyCredited) {
      const netAmount = Number(transaction.net_amount) || (Number(transaction.amount) - Number(transaction.fee || 0));
      const currentBalance = Number(transaction.profile_balance) || 0;
      const newBalance = currentBalance + netAmount;

      await sql`
        UPDATE profiles 
        SET 
          balance = ${newBalance},
          updated_at = NOW()
        WHERE id = ${transaction.user_id}
      `;

      console.log(`[Medusa Webhook] Creditado R$ ${netAmount.toFixed(2)} para usuario ${transaction.user_id}. Novo saldo: R$ ${newBalance.toFixed(2)}`);
      
      // Notificar usuario sobre o deposito/PIX recebido com valor bruto e liquido
      const grossAmount = Number(transaction.amount) || 0;
      const paidByName = (customer?.name as string) || (transaction.payer_name as string) || undefined;
      await notifyPixPaid(transaction.user_id as string, grossAmount, netAmount, paidByName);

      // Log para Discord - transacao confirmada
      logTransactionStatusUpdate({
        transactionId: transaction.id as string,
        userName: transaction.profile_name as string || "N/A",
        userEmail: transaction.profile_email as string || "",
        amount: grossAmount,
        oldStatus: "pending",
        newStatus: "completed",
        payerName: customer?.name,
      });

      // Registrar audit log
      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${transaction.user_id},
          'PAYMENT_CONFIRMED',
          'transaction',
          ${transaction.id},
          ${JSON.stringify({ 
            amount: Number(transaction.amount), 
            net_amount: netAmount, 
            new_balance: newBalance,
            payer: customer?.name || 'N/A'
          })},
          NOW()
        )
      `;

      // Notificacao (sino) e push ja foram criados por notifyPixPaid acima.
      // Nao inserir outra notificacao aqui para evitar duplicidade.

      // Enviar para UTMify se o usuario tiver a integracao configurada
      try {
        // Buscar dados UTM da transacao
        const transactionData = await sql`
          SELECT external_id, description, payer_name, payer_email, payer_document, created_at,
                 utm_source, utm_campaign, utm_medium, utm_content, utm_term, utm_src, utm_sck
          FROM transactions WHERE id = ${transaction.id}
        `;
        
        if (transactionData.length > 0) {
          const txData = transactionData[0];
          await sendPixEventToUtmify(transaction.user_id as string, {
            id: transaction.id as string,
            amount: Number(transaction.amount),
            fee: Number(transaction.fee || 0),
            status: "paid",
            payer_name: txData.payer_name as string,
            payer_email: txData.payer_email as string,
            payer_document: txData.payer_document as string,
            description: txData.description as string,
            external_id: txData.external_id as string,
            created_at: txData.created_at as string,
            paid_at: new Date().toISOString(),
            utm_source: txData.utm_source as string,
            utm_campaign: txData.utm_campaign as string,
            utm_medium: txData.utm_medium as string,
            utm_content: txData.utm_content as string,
            utm_term: txData.utm_term as string,
            src: txData.utm_src as string,
            sck: txData.utm_sck as string,
          });
          console.log(`[Medusa Webhook] Enviado evento para UTMify - Transacao ${transaction.id}`);
        }
      } catch (utmifyError) {
        console.error("[Medusa Webhook] Erro ao enviar para UTMify:", utmifyError);
        // Nao falhar o webhook por causa do UTMify
      }

      // Processar comissao de afiliado
      try {
        const referrer = await sql`
          SELECT referred_by FROM profiles WHERE id = ${transaction.user_id} AND referred_by IS NOT NULL
        `;
        
        if (referrer.length > 0 && referrer[0].referred_by) {
          const affiliateId = referrer[0].referred_by;
          const commissionAmount = 0.05; // R$ 0,05 por transacao
          
          // Criar registro de comissao
          await sql`
            INSERT INTO affiliate_commissions (id, affiliate_id, referred_user_id, transaction_id, amount, status, created_at)
            VALUES (
              ${crypto.randomUUID()},
              ${affiliateId},
              ${transaction.user_id},
              ${transaction.id},
              ${commissionAmount},
              'pending',
              NOW()
            )
          `;
          
          console.log(`[Medusa Webhook] Comissao de R$ ${commissionAmount.toFixed(2)} criada para afiliado ${affiliateId}`);
        }
      } catch (affiliateError) {
        console.error("[Medusa Webhook] Erro ao processar comissao de afiliado:", affiliateError);
      }

      // Enviar webhook para o cliente se configurado
      const userProfile = await sql`
        SELECT webhook_url, webhook_secret FROM profiles WHERE id = ${transaction.user_id}
      `;

      if (userProfile.length > 0 && userProfile[0].webhook_url) {
        try {
          const result = await sendMerchantWebhook({
            url: userProfile[0].webhook_url,
            secret: userProfile[0].webhook_secret,
            event: "charge.paid",
            data: {
              transaction_id: transaction.id,
              external_id: transaction.external_id ?? null,
              amount: Number(transaction.amount),
              net_amount: netAmount,
              status: "completed",
              payer_name: transaction.payer_name ?? null,
              paid_at: paidAt || new Date().toISOString(),
            },
          });

          // Registrar log do webhook
          await sql`
            INSERT INTO webhook_logs (id, user_id, transaction_id, url, payload, response_status, success, created_at)
            VALUES (
              ${crypto.randomUUID()},
              ${transaction.user_id},
              ${transaction.id},
              ${userProfile[0].webhook_url},
              ${JSON.stringify(result.payload)},
              ${result.status},
              ${result.ok},
              NOW()
            )
          `;
        } catch (webhookError) {
          console.error(`[Medusa Webhook] Erro ao enviar webhook:`, webhookError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Medusa Webhook] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Medusa Payments Webhook",
    timestamp: new Date().toISOString(),
  });
}
