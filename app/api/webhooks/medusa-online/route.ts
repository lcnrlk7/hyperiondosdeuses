import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { notifyPixPaid } from "@/lib/notifications";
import { logTransactionStatusUpdate } from "@/lib/discord-webhook";
import { sendMerchantWebhook } from "@/lib/merchant-webhook";
import { MedusaOnline, MEDUSA_ONLINE_STATUS_MAP } from "@/lib/acquirers/medusa-online";
import { confirmPaymentAtomically } from "@/lib/payment-confirmation";

/**
 * Webhook receptor da liquidante Medusa Online (api.medusapayments.online)
 *
 * Eventos (doc oficial):
 *  - payment.approved  -> pagamento aprovado (credita saldo)
 *  - payment.refunded  -> estorno
 *  - transfer.updated  -> status de saque atualizado
 *
 * Payload:
 * {
 *   "evento": "payment.approved",
 *   "empresaId": "uuid-da-empresa",
 *   "timestamp": "...",
 *   "eventId": "uuid-do-evento",
 *   "dados": { "vendaId": "uuid", "valor": 299.90, "status": "aprovado", "simulada": false, ... }
 * }
 *
 * SEGURANCA: antes de creditar, reconfirmamos o pagamento server-to-server
 * com a propria adquirente (GET /api/pagamentos/:id). Assim, mesmo que um
 * webhook seja forjado, nenhum saldo e creditado sem o aval da adquirente.
 */

// Comparacao em tempo constante, tolerante a tamanhos diferentes.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifica a assinatura HMAC SHA-256 do evento.
 *
 * Retorna true quando nao ha assinatura ou secret configurado: nesse caso a
 * seguranca fica a cargo da reconfirmacao server-to-server com a adquirente.
 * Aceita digest em hex e base64, com ou sem o prefixo "sha256=", porque o
 * formato varia entre provedores.
 */
function verifyHmac(rawBody: string, secret: string | null, signature: string | null): boolean {
  if (!secret) return true; // reconfirmacao server-to-server permanece obrigatoria
  if (!signature) return false;
  try {
    const provided = signature.replace(/^sha256=/i, "").trim();
    // Um objeto Hmac nao pode ser reaproveitado apos digest(), por isso um por encoding.
    const hex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const base64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
    return safeEqual(hex, provided.toLowerCase()) || safeEqual(base64, provided);
  } catch {
    return false;
  }
}

async function confirmWithAcquirer(
  acquirerId: string | undefined,
  vendaId: string,
  empresaId?: string
): Promise<{ status: string | null; amount?: number; simulated?: boolean } | null> {
  // Prioriza a adquirente registrada na transacao; se ausente (ex.: transacoes
  // antigas), localiza pela empresa que assinou o evento.
  const rows = acquirerId
    ? await sql`SELECT api_key, api_url FROM acquirers WHERE id = ${acquirerId} LIMIT 1`
    : empresaId
      ? await sql`SELECT api_key, api_url FROM acquirers WHERE company_id = ${empresaId} AND is_active = true LIMIT 1`
      : [];
  if (rows.length === 0) return null;
  const client = new MedusaOnline({ apiKey: rows[0].api_key, baseUrl: rows[0].api_url });
  const result = await client.getPix(vendaId);
  return result.success
    ? { status: result.status || null, amount: result.amount, simulated: result.simulated }
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-signature") ||
      request.headers.get("x-medusa-signature") ||
      request.headers.get("x-hub-signature-256") ||
      request.headers.get("signature");

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const evento: string = payload.evento || payload.event || "";
    const dados = payload.dados || payload.data || {};
    const vendaId: string | undefined = dados.vendaId || dados.vendaID || dados.id;
    const eventId: string | undefined = payload.eventId || dados.eventId;
    const simulada: boolean = Boolean(dados.simulada ?? payload.simulada ?? false);

    console.log(`[Medusa Online Webhook] evento=${evento} vendaId=${vendaId} eventId=${eventId} simulada=${simulada}`);

    // Vendas simuladas (modo teste) nunca geram saldo — apenas confirmar recebimento.
    if (simulada) {
      return NextResponse.json({ success: true, message: "Venda simulada ignorada" });
    }

    if (!vendaId) {
      return NextResponse.json({ success: true, message: "Sem vendaId no payload" });
    }

    // Saques (transfer.updated) sao tratados pelo polling/tela de saques.
    if (evento === "transfer.updated") {
      return NextResponse.json({ success: true, message: "transfer.updated recebido" });
    }

    // Localizar a transacao pelo id da venda da Medusa
    const transactions = await sql`
      SELECT t.id, t.user_id, t.amount, t.fee, t.net_amount, t.status, t.external_id,
             t.acquirer_transaction_id, t.payer_name,
             (t.metadata->>'acquirer_id') AS acquirer_id,
             p.email AS profile_email, p.name AS profile_name, p.balance AS profile_balance,
             p.webhook_url, p.webhook_secret, p.referred_by
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.acquirer_transaction_id = ${String(vendaId)}
         OR t.external_id = ${String(vendaId)}
      ORDER BY t.created_at DESC
      LIMIT 1
    `;

    if (transactions.length === 0) {
      console.log(`[Medusa Online Webhook] Transação da venda ${vendaId} não encontrada`);
      return NextResponse.json({ success: true, message: "Transação não encontrada" });
    }

    const transaction = transactions[0];

    // Verifica HMAC usando o secret da adquirente (se configurado)
    // Prioriza a adquirente gravada na transacao; se ausente (transacoes antigas),
    // localiza pela empresa que assinou o evento.
    const empresaId: string | undefined = payload.empresaId || payload.companyId;
    const acqSecret = transaction.acquirer_id
      ? await sql`SELECT webhook_secret, company_id FROM acquirers WHERE id = ${transaction.acquirer_id} LIMIT 1`
      : empresaId
        ? await sql`SELECT webhook_secret, company_id FROM acquirers WHERE company_id = ${empresaId} LIMIT 1`
        : [];
    const secret = acqSecret.length > 0 ? acqSecret[0].webhook_secret : null;
    if (!verifyHmac(rawBody, secret, signature)) {
      console.warn(`[Medusa Online Webhook] Assinatura HMAC inválida para venda ${vendaId}`);
      try {
        await sql`
          INSERT INTO webhook_logs (id, url, payload, response_status, success, response_body, created_at)
          VALUES (${crypto.randomUUID()}, 'medusa-online', ${JSON.stringify(payload)}, 401, false,
                  'Assinatura HMAC invalida', NOW())
        `;
      } catch {}
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const configuredCompanyId = acqSecret[0]?.company_id as string | undefined;
    if (empresaId && configuredCompanyId && empresaId !== configuredCompanyId) {
      return NextResponse.json({ error: "Empresa divergente" }, { status: 400 });
    }

    // Timestamp e eventId sao controles adicionais; a transicao atomica continua
    // sendo a barreira final caso o provedor omita qualquer um deles.
    const eventTimestamp = payload.timestamp ? Date.parse(payload.timestamp) : NaN;
    if (Number.isFinite(eventTimestamp) && Math.abs(Date.now() - eventTimestamp) > 10 * 60 * 1000) {
      return NextResponse.json({ error: "Evento expirado" }, { status: 400 });
    }
    if (eventId) {
      const duplicate = await sql`
        SELECT id FROM webhook_logs
        WHERE url = 'medusa-online'
          AND success = true
          AND payload->>'eventId' = ${eventId}
        LIMIT 1
      `;
      if (duplicate.length > 0) {
        return NextResponse.json({ success: true, message: "Evento já processado" });
      }
    }

    // Já creditado?
    const existingCredit = await sql`
      SELECT id FROM audit_logs WHERE entity_id = ${transaction.id} AND action = 'PAYMENT_CONFIRMED' LIMIT 1
    `;
    const alreadyCredited = existingCredit.length > 0;

    // ESTORNO
    if (evento === "payment.refunded" || dados.status === "estornado") {
      await sql`UPDATE transactions SET status = 'refunded', updated_at = NOW() WHERE id = ${transaction.id}`;
      return NextResponse.json({ success: true, message: "Estorno registrado" });
    }

    // APROVACAO — reconfirmar com a adquirente antes de creditar
    const rawStatus = String(dados.status || "").toLowerCase();
    const claimsApproved = evento === "payment.approved" || rawStatus === "aprovado" || MEDUSA_ONLINE_STATUS_MAP[rawStatus] === "completed";

    if (!claimsApproved) {
      return NextResponse.json({ success: true, message: `Evento ${evento} sem ação` });
    }

    if (alreadyCredited || transaction.status === "completed") {
      return NextResponse.json({ success: true, message: "Transação já creditada" });
    }

    const confirmed = await confirmWithAcquirer(
      transaction.acquirer_id,
      String(vendaId),
      payload.empresaId || payload.companyId
    );
    if (confirmed?.status !== "completed" || confirmed.simulated) {
      console.warn(`[Medusa Online Webhook] Pagamento não confirmado pela adquirente para venda ${vendaId}`);
      return NextResponse.json({ success: true, message: "Pagamento não confirmado pela adquirente" });
    }

    const expectedAmount = Number(transaction.amount);
    if (!Number.isFinite(confirmed.amount) || Math.abs(Number(confirmed.amount) - expectedAmount) > 0.009) {
      console.warn(`[Medusa Online Webhook] Valor divergente para venda ${vendaId}`);
      return NextResponse.json({ error: "Valor divergente" }, { status: 400 });
    }

    // Transicao de status + credito + auditoria em uma unica operacao atomica.
    const confirmation = await confirmPaymentAtomically(
      transaction.id as string,
      "medusa_online_webhook",
      dados.paidAt || dados.paid_at || null,
    );
    if (!confirmation.credited) {
      return NextResponse.json({ success: true, message: "Transação já creditada" });
    }

    const netAmount = confirmation.netAmount || 0;
    const grossAmount = confirmation.grossAmount || 0;
    const newBalance = confirmation.newBalance || 0;
    await notifyPixPaid(transaction.user_id as string, grossAmount, netAmount, transaction.payer_name as string | undefined, transaction.id as string);

    logTransactionStatusUpdate({
      transactionId: transaction.id as string,
      userName: (transaction.profile_name as string) || "N/A",
      userEmail: (transaction.profile_email as string) || "",
      amount: grossAmount,
      oldStatus: "pending",
      newStatus: "completed",
    });

    // Comissao de afiliado (R$ 0,05 por transacao) — mesmo padrao do webhook legado
    try {
      if (transaction.referred_by) {
        await sql`
          INSERT INTO affiliate_commissions (id, affiliate_id, referred_user_id, transaction_id, amount, status, created_at)
          VALUES (${crypto.randomUUID()}, ${transaction.referred_by}, ${transaction.user_id}, ${transaction.id}, ${0.05}, 'pending', NOW())
        `;
      }
    } catch (e) {
      console.error("[Medusa Online Webhook] Erro comissão de afiliado:", e);
    }

    // Webhook do lojista (se configurado)
    if (transaction.webhook_url) {
      try {
        const result = await sendMerchantWebhook({
          url: transaction.webhook_url as string,
          secret: transaction.webhook_secret as string,
          event: "charge.paid",
          data: {
            transaction_id: transaction.id,
            external_id: transaction.external_id ?? null,
            amount: grossAmount,
            net_amount: netAmount,
            status: "completed",
            payer_name: transaction.payer_name ?? null,
            paid_at: new Date().toISOString(),
          },
        });
        await sql`
          INSERT INTO webhook_logs (id, user_id, transaction_id, url, payload, response_status, success, created_at)
          VALUES (${crypto.randomUUID()}, ${transaction.user_id}, ${transaction.id}, ${transaction.webhook_url}, ${JSON.stringify(result.payload)}, ${result.status}, ${result.ok}, NOW())
        `;
      } catch (e) {
        console.error("[Medusa Online Webhook] Erro webhook do lojista:", e);
      }
    }

    try {
      await sql`
        INSERT INTO webhook_logs (id, user_id, transaction_id, url, payload, response_status, success, created_at)
        VALUES (${crypto.randomUUID()}, ${transaction.user_id}, ${transaction.id}, 'medusa-online', ${JSON.stringify({
          eventId: eventId || null,
          evento,
          vendaId,
          empresaId: empresaId || null,
          timestamp: payload.timestamp || null,
        })}, 200, true, NOW())
      `;
    } catch {}

    console.log(`[Medusa Online Webhook] Pagamento ${transaction.id} confirmado e creditado`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Medusa Online Webhook] Erro:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Medusa Online Webhook",
    timestamp: new Date().toISOString(),
  });
}
