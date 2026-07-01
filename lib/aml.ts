import { after } from "next/server";
import { sql } from "@/lib/db";
import { createDiditTransaction } from "@/lib/didit";

/**
 * Monitoramento de transacoes (AML / KYT) via Didit.
 *
 * Politica do sistema: APENAS SINALIZAR (nao bloqueia o fluxo) e ASSINCRONO
 * (nao atrasa a transacao do usuario). A funcao registra a triagem no banco e
 * envia para a Didit em segundo plano; o webhook atualiza o status depois.
 */

interface ScreenParams {
  entity: "withdrawal" | "deposit";
  entityId: string;
  direction: "inbound" | "outbound";
  userId: string;
  userFullName: string;
  amount: number;
  currency?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
}

// Dispara a triagem AML em segundo plano. Nunca lanca erro para o chamador.
export function screenTransactionAsync(params: ScreenParams): void {
  // Em ambiente serverless (Vercel), um fire-and-forget cru (void promise) e
  // descartado assim que a resposta e enviada, entao o registro nunca era gravado.
  // after() garante que o trabalho rode APOS a resposta, sem atrasar o usuario.
  try {
    after(async () => {
      try {
        await runScreening(params);
      } catch (err) {
        console.error("[AML] Falha na triagem assincrona:", err);
      }
    });
  } catch {
    // Fora de um contexto de request (ex.: script), executa direto.
    void runScreening(params).catch((err) => {
      console.error("[AML] Falha na triagem assincrona (fallback):", err);
    });
  }
}

async function runScreening(params: ScreenParams): Promise<void> {
  // Prefixo curto + id interno como referencia unica na Didit (<=128 chars).
  const transactionRef = `${params.entity}_${params.entityId}`;

  // 1. Registra (ou ignora se ja existe) a triagem como PENDING.
  try {
    const existing = await sql`
      SELECT id FROM aml_screenings WHERE transaction_ref = ${transactionRef} LIMIT 1
    `;
    if (existing.length > 0) {
      // Ja triada anteriormente — evita duplicidade (idempotente).
      return;
    }

    await sql`
      INSERT INTO aml_screenings (
        transaction_ref, user_id, internal_entity, internal_entity_id,
        direction, amount, currency, status, created_at, updated_at
      )
      VALUES (
        ${transactionRef}, ${params.userId}, ${params.entity}, ${params.entityId},
        ${params.direction}, ${params.amount}, ${params.currency || "BRL"}, 'PENDING', NOW(), NOW()
      )
      ON CONFLICT (transaction_ref) DO NOTHING
    `;
  } catch (e) {
    console.error("[AML] Erro ao registrar triagem:", e);
    return;
  }

  // 2. Envia a transacao para a Didit.
  try {
    const result = await createDiditTransaction({
      transactionRef,
      direction: params.direction,
      amount: params.amount,
      currency: params.currency || "BRL",
      userId: params.userId,
      userFullName: params.userFullName,
      counterpartyName: params.counterpartyName,
      counterpartyAccount: params.counterpartyAccount,
    });

    // 3. Persiste o resultado imediato (o webhook pode atualizar depois).
    await sql`
      UPDATE aml_screenings
      SET
        didit_transaction_id = ${result.transaction_id || null},
        status = ${result.status || "PENDING"},
        risk_score = ${typeof result.risk_score === "number" ? result.risk_score : null},
        raw = ${JSON.stringify(result)},
        updated_at = NOW()
      WHERE transaction_ref = ${transactionRef}
    `;

    console.log(
      `[AML] Triagem enviada: ${transactionRef} -> status=${result.status || "PENDING"}`,
    );
  } catch (e) {
    console.error("[AML] Erro ao enviar transacao para a Didit:", e);
    // Marca como ERROR para visibilidade no painel, sem bloquear nada.
    try {
      await sql`
        UPDATE aml_screenings
        SET status = 'ERROR', raw = ${JSON.stringify({ error: String(e) })}, updated_at = NOW()
        WHERE transaction_ref = ${transactionRef}
      `;
    } catch {
      // silencioso
    }
  }
}
