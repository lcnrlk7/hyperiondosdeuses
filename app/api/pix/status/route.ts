import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { MedusaPayments, MEDUSA_STATUS_MAP } from "@/lib/acquirers/medusa";
import { notifyPixPaid } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId") || searchParams.get("id");
    const apiKey = request.headers.get("x-api-key");

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transação é obrigatório" },
        { status: 400 }
      );
    }

    let userId: string | null = null;

    if (apiKey) {
      const result = await sql`SELECT id FROM profiles WHERE api_key = ${apiKey}`;
      if (result.length > 0) {
        userId = result[0].id;
      }
    }

    if (!userId) {
      const sessionUser = await getCurrentUser();
      if (sessionUser) {
        userId = sessionUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const txResult = await sql`
      SELECT * FROM transactions WHERE id = ${transactionId} AND user_id = ${userId}
    `;

    if (txResult.length === 0) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    const transaction = txResult[0];

    if (transaction.status === "completed" || transaction.status === "paid") {
      return NextResponse.json({
        id: transaction.id,
        transactionId: transaction.id,
        externalId: transaction.external_id,
        status: transaction.status,
        amount: transaction.amount,
        netAmount: transaction.net_amount,
        fee: transaction.fee,
        paidAt: transaction.paid_at,
        expiresAt: transaction.expires_at,
        createdAt: transaction.created_at,
      });
    }

    // Extrair acquirer_id do metadata para saber qual adquirente verificar
    let acquirerId: string | null = null;
    let acquirerCode: string | null = null;
    
    if (transaction.metadata) {
      const metadata = typeof transaction.metadata === 'string' 
        ? JSON.parse(transaction.metadata) 
        : transaction.metadata;
      acquirerId = metadata.acquirer_id;
      // Também verificar se o acquirer code foi salvo diretamente
      if (metadata.acquirer_code) {
        acquirerCode = metadata.acquirer_code;
      }
    }

    // Buscar adquirente pelo ID
    if (!acquirerCode && acquirerId) {
      const acqResult = await sql`SELECT code FROM acquirers WHERE id = ${acquirerId}`;
      if (acqResult.length > 0) {
        acquirerCode = acqResult[0].code;
      }
    }

    // Se não encontrou, verificar pelo acquirer_transaction_id
    // IDs numéricos geralmente são da Medusa
    if (!acquirerCode && transaction.acquirer_transaction_id) {
      const txnId = String(transaction.acquirer_transaction_id);
      const isNumericId = /^\d+$/.test(txnId);
      acquirerCode = isNumericId ? 'medusa' : 'misticpay';
    }

    // Fallback: verificar pelo external_id
    if (!acquirerCode && transaction.external_id) {
      acquirerCode = 'medusa';
    }

    // Último fallback: buscar adquirente ativa padrão
    if (!acquirerCode) {
      const defaultAcq = await sql`
        SELECT code FROM acquirers WHERE is_active = true ORDER BY created_at DESC LIMIT 1
      `;
      if (defaultAcq.length > 0) {
        acquirerCode = defaultAcq[0].code;
      }
    }



    if (transaction.acquirer_transaction_id || transaction.external_id) {
      try {
        let newStatus = transaction.status;
        let paidAt: string | null = null;

        // Verificar com Medusa
        if (acquirerCode === 'medusa' || acquirerCode === 'medusa_white') {
          const acquirerResult = await sql`
            SELECT api_key, api_secret FROM acquirers WHERE code = 'medusa' AND is_active = true LIMIT 1
          `;
          
          if (acquirerResult.length > 0) {
            const medusa = new MedusaPayments({
              secretKey: acquirerResult[0].api_key,
              licenseKey: acquirerResult[0].api_secret,
            });

            const checkResult = await medusa.getTransaction(
              transaction.acquirer_transaction_id || transaction.external_id
            );

            if (checkResult) {
              const medusaStatus = checkResult.status || (checkResult.transaction as { status?: string })?.status;
              if (medusaStatus) {
                newStatus = MEDUSA_STATUS_MAP[medusaStatus] || transaction.status;
                if (checkResult.paidAt || (checkResult.transaction as { paidAt?: string })?.paidAt) {
                  paidAt = checkResult.paidAt || (checkResult.transaction as { paidAt?: string })?.paidAt || null;
                }
              }
            }
          }
        }

        // Se o status mudou, atualizar
        if (newStatus !== transaction.status) {
          paidAt = paidAt || (newStatus === "completed" ? new Date().toISOString() : null);

          await sql`
            UPDATE transactions SET status = ${newStatus}, paid_at = ${paidAt}, updated_at = NOW()
            WHERE id = ${transactionId}
          `;

          if (newStatus === "completed") {
            const profileResult = await sql`SELECT balance FROM profiles WHERE id = ${userId}`;
            const currentBalance = Number(profileResult[0]?.balance) || 0;
            const netAmount = Number(transaction.net_amount) || Number(transaction.amount);
            const feeAmount = Number(transaction.fee) || 0;

            await sql`UPDATE profiles SET balance = ${currentBalance + netAmount} WHERE id = ${userId}`;

            // Notificacao (sino + push) idempotente por transacao - evita duplicidade
            // caso o webhook tambem detecte este pagamento.
            try {
              const grossAmount = Number(transaction.amount) || netAmount;
              await notifyPixPaid(userId, grossAmount, netAmount, transaction.payer_name || undefined, transactionId);
            } catch (notifError) {
              console.error("Error creating notification:", notifError);
            }

            // Log da transação completada
            try {
              await sql`
                INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
                VALUES (
                  ${crypto.randomUUID()}, 
                  ${userId}, 
                  ${'PIX_COMPLETED'}, 
                  ${'transaction'}, 
                  ${transaction.id},
                  ${JSON.stringify({ 
                    transaction_id: transaction.id, 
                    amount: Number(transaction.amount),
                    fee: feeAmount,
                    net_amount: netAmount,
                    acquirer: acquirerCode,
                    description: `PIX de R$ ${Number(transaction.amount).toFixed(2)} recebido (Taxa: R$ ${feeAmount.toFixed(2)} | Líquido: R$ ${netAmount.toFixed(2)})`
                  })}, 
                  NOW()
                )
              `;
            } catch (logError) {
              console.error("Error creating audit log:", logError);
            }
          }

          return NextResponse.json({
            id: transaction.id,
            transactionId: transaction.id,
            externalId: transaction.external_id,
            status: newStatus,
            amount: transaction.amount,
            netAmount: transaction.net_amount,
            fee: transaction.fee,
            paidAt,
            expiresAt: transaction.expires_at,
            createdAt: transaction.created_at,
          });
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    }

    return NextResponse.json({
      id: transaction.id,
      transactionId: transaction.id,
      externalId: transaction.external_id,
      status: transaction.status,
      amount: transaction.amount,
      netAmount: transaction.net_amount,
      fee: transaction.fee,
      paidAt: transaction.paid_at,
      expiresAt: transaction.expires_at,
      createdAt: transaction.created_at,
    });
  } catch (error) {
    console.error("Error getting PIX status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao consultar status" },
      { status: 500 }
    );
  }
}
