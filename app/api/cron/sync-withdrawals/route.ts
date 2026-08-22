import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cron-auth";
import { notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/notifications";

// Mapeamento de status da Medusa para status interno
const MEDUSA_STATUS_MAP: Record<string, string> = {
  // Status de sucesso
  approved: "completed",
  paid: "completed",
  completed: "completed",
  finalizado: "completed",
  
  // Status de falha
  refused: "failed",
  cancelled: "failed",
  failed: "failed",
  cancelado: "failed",
  
  // Status pendente
  pending: "processing",
  processing: "processing",
  waiting_payment: "processing",
};

interface MedusaWithdrawal {
  id: number;
  status: string;
  amount?: number | string;
  pixKey?: string;
  created?: string;
  createdAt?: string;
}

interface MedusaListResponse {
  withdrawals?: MedusaWithdrawal[];
  transfers?: MedusaWithdrawal[];
  data?: MedusaWithdrawal[];
  total?: number;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  const dbSql = sql;
  
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Sync Withdrawals] Iniciando sincronização de saques...");

    // Buscar saques em processamento com acquirer_withdrawal_id
    const pendingWithdrawals = await sql`
      SELECT id, user_id, amount, net_amount, fee, pix_key, acquirer_withdrawal_id, status, created_at
      FROM withdrawals
      WHERE status = 'processing'
        AND acquirer_withdrawal_id IS NOT NULL
        AND acquirer_withdrawal_id != ''
      ORDER BY created_at DESC
      LIMIT 50
    `;

    if (pendingWithdrawals.length === 0) {
      console.log("[Sync Withdrawals] Nenhum saque pendente para sincronizar");
      return NextResponse.json({ success: true, message: "Nenhum saque pendente", synced: 0 });
    }

    console.log(`[Sync Withdrawals] ${pendingWithdrawals.length} saques pendentes encontrados`);

    // Buscar configuração da Medusa (inclui medusa e medusa_white)
    const acquirers = await sql`
      SELECT code, api_key, api_secret FROM acquirers WHERE code IN ('medusa', 'medusa_white') AND is_active = true
    `;

    if (acquirers.length === 0) {
      console.log("[Sync Withdrawals] Nenhuma Medusa configurada");
      return NextResponse.json({ error: "Medusa não configurada" }, { status: 500 });
    }

    // Usar a primeira Medusa para listagem (todas usam a mesma API)
    const secretKey = acquirers[0].api_key;
    
    // Tentar listar transferências da Medusa
    // Endpoint: GET /v1/all/withdrawals ou /v1/all/transfers
    const authString = Buffer.from(`x:${secretKey}`).toString("base64");
    
    let medusaWithdrawals: MedusaWithdrawal[] = [];
    
    // Tentar diferentes endpoints
    const endpoints = [
      "/v1/all/withdrawals",
      "/v1/all/transfers", 
      "/v1/withdrawals",
      "/v1/transfers"
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://api.medusapayments.com${endpoint}?page=1&pageSize=100`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const data: MedusaListResponse = await response.json();
          console.log(`[Sync Withdrawals] Endpoint ${endpoint} retornou:`, JSON.stringify(data).substring(0, 200));
          
          medusaWithdrawals = data.withdrawals || data.transfers || data.data || 
            (Array.isArray(data) ? data : []);
          
          if (medusaWithdrawals.length > 0) {
            console.log(`[Sync Withdrawals] ${medusaWithdrawals.length} transferências encontradas na Medusa`);
            break;
          }
        } else {
          console.log(`[Sync Withdrawals] Endpoint ${endpoint} retornou ${response.status}`);
        }
      } catch (error) {
        console.log(`[Sync Withdrawals] Erro ao tentar ${endpoint}:`, error);
      }
    }

    let syncedCount = 0;
    const results: Array<{ id: string; medusaId: string; oldStatus: string; newStatus: string }> = [];

    // Se não conseguiu listar, aguardar webhook da Medusa
    if (medusaWithdrawals.length === 0) {
      console.log("[Sync Withdrawals] Não conseguiu listar transferências da Medusa, aguardando webhook...");
      console.log(`[Sync Withdrawals] ${pendingWithdrawals.length} saques pendentes aguardando confirmação`);
    } else {
      // Criar mapa por ID
      const medusaMap = new Map<string, MedusaWithdrawal>();
      for (const w of medusaWithdrawals) {
        if (w.id) {
          medusaMap.set(String(w.id), w);
        }
      }

      for (const withdrawal of pendingWithdrawals) {
        const medusaW = medusaMap.get(withdrawal.acquirer_withdrawal_id);
        
        if (!medusaW) continue;

        const medusaStatus = (medusaW.status || "").toLowerCase();
        const internalStatus = MEDUSA_STATUS_MAP[medusaStatus] || "processing";

        if (internalStatus === withdrawal.status) continue;

        console.log(`[Sync Withdrawals] Saque ${withdrawal.id}: Medusa=${medusaStatus}, interno=${internalStatus}`);

        // Atualizar status
        await sql`
          UPDATE withdrawals 
          SET status = ${internalStatus}, processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;

        if (internalStatus === "completed") {
          await notifyWithdrawalCompleted(
            withdrawal.user_id,
            Number(withdrawal.amount),
            Number(withdrawal.net_amount),
            Number(withdrawal.fee) || 0,
            withdrawal.pix_key || "",
            withdrawal.acquirer_withdrawal_id
          );
        } else if (internalStatus === "failed") {
          // Devolver saldo
          await sql`
            UPDATE profiles SET balance = balance + ${Number(withdrawal.amount)}
            WHERE id = ${withdrawal.user_id}
          `;

          await notifyWithdrawalFailed(
            withdrawal.user_id,
            Number(withdrawal.amount),
            "A adquirente recusou o saque"
          );
        }

        results.push({
          id: withdrawal.id,
          medusaId: withdrawal.acquirer_withdrawal_id,
          oldStatus: withdrawal.status,
          newStatus: internalStatus,
        });
        syncedCount++;
      }
    }

    console.log(`[Sync Withdrawals] Medusa: ${syncedCount} saques sincronizados.`);

    console.log(`[Sync Withdrawals] Concluído. Medusa: ${syncedCount}`);

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      results,
    });
  } catch (error) {
    console.error("[Sync Withdrawals] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar saques", details: String(error) },
      { status: 500 }
    );
  }
}
