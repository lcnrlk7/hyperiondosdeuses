import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MedusaPayments } from "@/lib/acquirers/medusa";
import { confirmPaymentAtomically } from "@/lib/payment-confirmation";
import { isCronAuthorized } from "@/lib/cron-auth";

// API para sincronizar status das transações pendentes com a Medusa
// Pode ser chamada manualmente ou via cron job

export async function GET(request: NextRequest) {
  try {
    // Verificar secret para segurança (opcional para cron)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Permitir acesso sem auth para testes (remover em produção)
      console.log("[Sync Medusa] Acesso sem autenticação");
    }

    // Buscar chave da Medusa
    const acquirerResult = await sql`
      SELECT api_key, api_secret FROM acquirers WHERE code = 'medusa' AND is_active = true LIMIT 1
    `;

    if (acquirerResult.length === 0) {
      return NextResponse.json({ error: "Medusa não configurada" }, { status: 400 });
    }

    const client = new MedusaPayments({
      secretKey: acquirerResult[0].api_key,
      licenseKey: acquirerResult[0].api_secret,
    });

    // Buscar transações pendentes com ID da Medusa (últimas 24h)
    const pendingTxs = await sql`
      SELECT id, user_id, external_id, acquirer_transaction_id, amount, fee, net_amount, metadata
      FROM transactions 
      WHERE status = 'pending' 
        AND type = 'pix_in'
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    console.log(`[Sync Medusa] Verificando ${pendingTxs.length} transações pendentes`);

    let updated = 0;
    let errors = 0;

    for (const tx of pendingTxs) {
      // Extrair ID da Medusa do metadata ou acquirer_transaction_id
      let medusaId = tx.acquirer_transaction_id;
      
      if (!medusaId && tx.metadata?.acquirer_transaction_id) {
        medusaId = String(tx.metadata.acquirer_transaction_id);
      }

      // Se não tem ID numérico da Medusa, pular
      if (!medusaId || !/^\d+$/.test(medusaId)) {
        continue;
      }

      try {
        // Consultar status na Medusa usando o método getTransaction
        const status = await client.getTransaction(medusaId);
        
        if (!status) continue;

        // A resposta pode ter { transaction: {...} } ou direto {...}
        const txData = status.transaction || status;
        const medusaStatus = txData.status?.toLowerCase();
        
        // Se pagamento foi confirmado
        if (medusaStatus === "paid" || medusaStatus === "approved" || medusaStatus === "completed") {
          // Atualizar transação
          await sql`
            UPDATE transactions 
            SET status = 'completed',
                acquirer_transaction_id = ${medusaId},
                updated_at = NOW()
            WHERE id = ${tx.id}
          `;

          // Creditar saldo do usuário
          const netAmount = parseFloat(tx.net_amount);
          await sql`
            UPDATE profiles 
            SET balance = balance + ${netAmount}
            WHERE id = ${tx.user_id}
          `;

          console.log(`[Sync Medusa] TX ${tx.id} atualizada para completed, creditado R$${netAmount}`);
          updated++;
        } 
        // Se pagamento foi cancelado/expirado
        else if (medusaStatus === "cancelled" || medusaStatus === "expired" || medusaStatus === "failed") {
          await sql`
            UPDATE transactions 
            SET status = 'failed',
                acquirer_transaction_id = ${medusaId},
                updated_at = NOW()
            WHERE id = ${tx.id}
          `;
          console.log(`[Sync Medusa] TX ${tx.id} atualizada para failed`);
          updated++;
        }
      } catch (err) {
        console.error(`[Sync Medusa] Erro ao verificar TX ${tx.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: pendingTxs.length,
      updated,
      errors,
    });
  } catch (error) {
    console.error("[Sync Medusa] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar" },
      { status: 500 }
    );
  }
}

// POST para forçar sincronização de uma transação específica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, medusa_id } = body;

    if (!transaction_id && !medusa_id) {
      return NextResponse.json({ error: "transaction_id ou medusa_id obrigatório" }, { status: 400 });
    }

    // Buscar chave da Medusa
    const acquirerResult = await sql`
      SELECT api_key, api_secret FROM acquirers WHERE code = 'medusa' AND is_active = true LIMIT 1
    `;

    if (acquirerResult.length === 0) {
      return NextResponse.json({ error: "Medusa não configurada" }, { status: 400 });
    }

    const client = new MedusaPayments({
      secretKey: acquirerResult[0].api_key,
      licenseKey: acquirerResult[0].api_secret,
    });

    // Buscar transação
    let tx;
    if (transaction_id) {
      const result = await sql`
        SELECT id, user_id, external_id, acquirer_transaction_id, net_amount, status, metadata
        FROM transactions WHERE id = ${transaction_id} OR external_id = ${transaction_id}
      `;
      tx = result[0];
    }

    if (!tx) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Extrair ID da Medusa
    const txMedusaId = medusa_id || tx.acquirer_transaction_id || tx.metadata?.acquirer_transaction_id;

    if (!txMedusaId) {
      return NextResponse.json({ error: "ID da Medusa não encontrado" }, { status: 400 });
    }

    // Consultar status na Medusa
    const status = await client.getTransaction(String(txMedusaId));

    if (!status) {
      return NextResponse.json({ error: "Não foi possível consultar Medusa" }, { status: 500 });
    }

    // A resposta pode ter { transaction: {...} } ou direto {...}
    const txData = status.transaction || status;
    const medusaStatus = txData.status?.toLowerCase();

    // Atualizar se necessário
    if (medusaStatus === "paid" || medusaStatus === "approved" || medusaStatus === "completed") {
      if (tx.status !== "completed") {
        await sql`
          UPDATE transactions
          SET acquirer_transaction_id = ${String(txMedusaId)}, updated_at = NOW()
          WHERE id = ${tx.id}
        `;
        const confirmation = await confirmPaymentAtomically(tx.id, "cron_sync_medusa");

        return NextResponse.json({
          success: true,
          message: confirmation.credited ? "Transação atualizada para completed" : "Transação já processada",
          credited: confirmation.credited ? confirmation.netAmount : 0,
          medusa_status: medusaStatus,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Status verificado",
      current_status: tx.status,
      medusa_status: medusaStatus,
    });
  } catch (error) {
    console.error("[Sync Medusa POST] Erro:", error);
    return NextResponse.json({ error: "Erro ao sincronizar" }, { status: 500 });
  }
}
