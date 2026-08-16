import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { notifyPixPaid } from "@/lib/notifications";

// Mapeamento de status da Medusa para status interno
const MEDUSA_STATUS_MAP: Record<string, string> = {
  // Status de sucesso -> completed
  approved: "completed",
  paid: "completed",
  
  // Status de falha -> failed
  refused: "failed",
  cancelled: "failed",
  chargeback: "failed",
  
  // Status pendentes -> mantém pending
  waiting_payment: "pending",
  pending: "pending",
  processing: "pending",
  in_protest: "pending",
  refunded: "refunded",
};

interface MedusaTransaction {
  id: number;
  status: string;
  amount?: number;
  createdAt?: string;
  created_at?: string;
}

interface MedusaListResponse {
  vendas?: MedusaTransaction[];
  transactions?: MedusaTransaction[];
  data?: MedusaTransaction[];
  total?: number;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  const dbSql = sql;
  
  try {
    // Verificar se é uma requisição interna ou do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const url = new URL(request.url);
    const isInternal = url.searchParams.get("internal") === "true";
    
    if (!isInternal && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Sync Transactions] Iniciando sincronização...");

    // Buscar transações pendentes que têm acquirer_transaction_id da Medusa (numérico)
    const pendingTransactions = await sql`
      SELECT t.id, t.user_id, t.amount, t.fee, t.net_amount, t.acquirer_transaction_id, t.status,
             p.balance as user_balance
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.status = 'pending' 
        AND t.acquirer_transaction_id IS NOT NULL
        AND t.acquirer_transaction_id ~ '^[0-9]+$'
        AND t.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY t.created_at DESC
      LIMIT 100
    `;

    if (pendingTransactions.length === 0) {
      console.log("[Sync Transactions] Nenhuma transação pendente");
      return NextResponse.json({ success: true, message: "Nenhuma transação pendente", synced: 0 });
    }

    console.log(`[Sync Transactions] ${pendingTransactions.length} transações pendentes`);

    // Buscar configuração da Medusa
    const acquirers = await sql`
      SELECT api_key, api_secret FROM acquirers WHERE code = 'medusa' AND is_active = true
    `;

    if (acquirers.length === 0) {
      return NextResponse.json({ error: "Medusa não configurada" }, { status: 500 });
    }

    const secretKey = acquirers[0].api_key;
    
    // Listar transações da Medusa usando o endpoint /v1/all/transactions
    const authString = Buffer.from(`x:${secretKey}`).toString("base64");
    
    const response = await fetch(
      `https://api.medusapayments.com/v1/all/transactions?page=1&pageSize=50`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Sync Transactions] Erro ao listar transações Medusa:", response.status, errorText);
      return NextResponse.json({ error: "Erro ao consultar Medusa" }, { status: 500 });
    }

    const medusaData: MedusaListResponse = await response.json();
    console.log("[Sync Transactions] Resposta Medusa:", JSON.stringify(medusaData).substring(0, 500));
    
    // A resposta vem como { vendas: [...] } conforme documentação da Medusa
    const medusaTransactions: MedusaTransaction[] = 
      medusaData.vendas || 
      medusaData.transactions || 
      medusaData.data || 
      (Array.isArray(medusaData) ? medusaData : []);

    if (!Array.isArray(medusaTransactions) || medusaTransactions.length === 0) {
      console.log("[Sync Transactions] Nenhuma transação retornada da Medusa");
      return NextResponse.json({ success: true, message: "Nenhuma transação na Medusa", synced: 0 });
    }

    console.log(`[Sync Transactions] ${medusaTransactions.length} transações da Medusa`);

    // Criar mapa de transações Medusa por valor (em centavos)
    // Como os IDs podem ser diferentes, fazemos matching por valor + proximidade de tempo
    const medusaByAmount = new Map<number, MedusaTransaction[]>();
    for (const tx of medusaTransactions) {
      const amount = tx.amount || 0;
      if (!medusaByAmount.has(amount)) {
        medusaByAmount.set(amount, []);
      }
      medusaByAmount.get(amount)!.push(tx);
    }

    let syncedCount = 0;
    const results: Array<{ id: string; medusaId: string; oldStatus: string; newStatus: string }> = [];

    for (const transaction of pendingTransactions) {
      // Converter nosso valor para centavos (Medusa usa centavos)
      const ourAmountCents = Math.round(Number(transaction.amount) * 100);
      const candidates = medusaByAmount.get(ourAmountCents) || [];
      
      if (candidates.length === 0) {
        continue;
      }

      // Encontrar a transação Medusa com data mais próxima
      const ourDate = new Date(transaction.created_at).getTime();
      let bestMatch: MedusaTransaction | null = null;
      let bestTimeDiff = Infinity;

      for (const medusaTx of candidates) {
        // Só considerar se status mudou (paid, approved, cancelled, etc)
        const status = (medusaTx.status || "").toLowerCase();
        if (status === "waiting_payment" || status === "pending") {
          continue;
        }

        const medusaDate = new Date(medusaTx.createdAt || medusaTx.created_at || "").getTime();
        const timeDiff = Math.abs(ourDate - medusaDate);
        
        // Aceitar se a diferença for menor que 5 minutos
        if (timeDiff < 5 * 60 * 1000 && timeDiff < bestTimeDiff) {
          bestTimeDiff = timeDiff;
          bestMatch = medusaTx;
        }
      }

      if (!bestMatch) {
        continue;
      }

      const medusaTx = bestMatch;

      const medusaStatus = (medusaTx.status || "").toLowerCase();
      const internalStatus = MEDUSA_STATUS_MAP[medusaStatus] || "pending";

      console.log(`[Sync Transactions] Match encontrado! Nosso ID: ${transaction.id}, Valor: R$ ${transaction.amount}, Medusa ID: ${medusaTx.id}, Status Medusa: ${medusaStatus}, Status interno: ${internalStatus}`);

      // Se o status mudou para algo diferente de pending, atualizar
      if (internalStatus !== "pending" && internalStatus !== transaction.status) {
        try {
          if (internalStatus === "completed") {
            // Atualizar transação
            await sql`
              UPDATE transactions 
              SET status = 'completed', paid_at = NOW()
              WHERE id = ${transaction.id}
            `;

            // Creditar saldo ao usuário
            const netAmount = Number(transaction.net_amount) || 0;
            const currentBalance = Number(transaction.user_balance) || 0;
            const newBalance = currentBalance + netAmount;

            await sql`
              UPDATE profiles SET balance = ${newBalance}
              WHERE id = ${transaction.user_id}
            `;

            // Notificacao (sino + push) idempotente por transacao - evita duplicidade
            // caso o webhook ou o polling tambem detectem este pagamento.
            const grossAmount = Number(transaction.amount) || netAmount;
            await notifyPixPaid(transaction.user_id, grossAmount, netAmount, transaction.payer_name || undefined, transaction.id);

            console.log(`[Sync Transactions] Creditado R$ ${netAmount.toFixed(2)} para usuário ${transaction.user_id}`);
          } else if (internalStatus === "failed" || internalStatus === "refunded") {
            await sql`
              UPDATE transactions SET status = ${internalStatus} WHERE id = ${transaction.id}
            `;

            await sql`
              INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
              VALUES (
                ${crypto.randomUUID()},
                ${transaction.user_id},
                'Pagamento não confirmado',
                ${`Seu depósito de R$ ${Number(transaction.amount).toFixed(2)} não foi confirmado.`},
                'error',
                NOW()
              )
            `;
          }

          results.push({
            id: transaction.id,
            medusaId: transaction.acquirer_transaction_id,
            oldStatus: transaction.status,
            newStatus: internalStatus,
          });
          syncedCount++;
        } catch (updateError) {
          console.error(`[Sync Transactions] Erro ao atualizar ${transaction.id}:`, updateError);
        }
      }
    }

    console.log(`[Sync Transactions] Concluído. ${syncedCount} transações sincronizadas.`);

    return NextResponse.json({
      success: true,
      checked: pendingTransactions.length,
      synced: syncedCount,
      results,
    });
  } catch (error) {
    console.error("[Sync Transactions] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
