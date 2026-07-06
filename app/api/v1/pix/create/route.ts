import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getAcquirerForUser, getSystemFeesForUser } from "@/lib/acquirers";
import { createPixPayment } from "@/lib/acquirers";
import { notifyNewTransaction } from "@/lib/push-notifications";

// Funcao para extrair credenciais do request
function extractCredentials(request: NextRequest): { clientId: string | null; clientSecret: string | null } {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [clientId, clientSecret] = credentials.split(":");
      if (clientId && clientSecret) return { clientId, clientSecret };
    } catch { /* ignorar */ }
  }
  
  const headerClientId = request.headers.get("x-client-id") || request.headers.get("client-id");
  const headerClientSecret = request.headers.get("x-client-secret") || request.headers.get("client-secret");
  if (headerClientId && headerClientSecret) return { clientId: headerClientId, clientSecret: headerClientSecret };
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [clientId, clientSecret] = decoded.split(":");
      if (clientId && clientSecret) return { clientId, clientSecret };
    } catch { /* ignorar */ }
  }
  
  return { clientId: null, clientSecret: null };
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = extractCredentials(request);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Buscar usuário pelas credenciais (client_id e client_secret)
    const userResult = await sql`
      SELECT * FROM profiles
      WHERE (client_id = ${clientId} AND client_secret = ${clientSecret})
         OR (api_key = ${clientId} AND client_secret = ${clientSecret})
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "Credenciais invalidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const user = userResult[0];
    
    console.log("[v0] User found:", { id: user.id, user_id: user.user_id, email: user.email });

    if (!user.api_enabled && user.api_enabled !== null) {
      return NextResponse.json(
        { error: "API desabilitada para esta conta", code: "API_DISABLED" },
        { status: 403 }
      );
    }

    if (user.kyc_status !== "approved") {
      return NextResponse.json(
        { error: "KYC nao aprovado. Complete a verificação de identidade.", code: "KYC_REQUIRED" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, external_id, description, payer } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Verificar limite diário
    const today = new Date().toISOString().split("T")[0];
    const dailyResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ${user.id}
        AND created_at >= ${`${today}T00:00:00`}
        AND status IN ('pending', 'completed')
    `;

    const dailyTotal = Number(dailyResult[0]?.total) || 0;
    if (dailyTotal + amount > (user.daily_limit || 50000)) {
      return NextResponse.json(
        { error: "Limite diário excedido", code: "DAILY_LIMIT_EXCEEDED" },
        { status: 400 }
      );
    }

    // Buscar adquirente correta baseada na rota do usuário (white/black)
    const acquirer = await getAcquirerForUser(user.id);
    
    if (!acquirer) {
      return NextResponse.json(
        { error: "Nenhum provedor de pagamento disponível", code: "NO_ACQUIRER" },
        { status: 503 }
      );
    }

    // Buscar taxas baseadas na rota do usuário (considera taxas personalizadas)
    const systemFees = await getSystemFeesForUser(user.id);
    
    console.log(`[PIX Create] Usuario ${user.email} - Taxas: ${systemFees.pixPercentageFee}% + R$${systemFees.pixFixedFee} (rota: ${user.route_type})`);

    // Calcular taxa (usar taxa personalizada do usuario ou padrao da rota)
    const feePercentage = systemFees.pixPercentageFee;
    const fixedFee = systemFees.pixFixedFee;
    const percentageFee = (amount * feePercentage) / 100;
    const fee = percentageFee + fixedFee;
    const netAmount = amount - fee;
    
    console.log(`[PIX Create] Valor: R$${amount}, Taxa: R$${fee.toFixed(2)} (${feePercentage}% + R$${fixedFee}), Liquido: R$${netAmount.toFixed(2)}`);

    const transactionId = external_id || `lp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Criar cobrança usando o sistema de adquirentes
    const pixResponse = await createPixPayment(
      amount,
      transactionId,
      user.id,
      description || "Pagamento Hyperion Pay",
      payer?.name || "Cliente",
      payer?.document || "00000000000"
    );

    if (!pixResponse.success) {
      return NextResponse.json(
        { error: pixResponse.error || "Erro ao criar cobrança", code: "ACQUIRER_ERROR" },
        { status: 500 }
      );
    }

    const txId = crypto.randomUUID();
    const result = await sql`
      INSERT INTO transactions (
        id, user_id, external_id, type,
        amount, fee, net_amount, status, description,
        payer_name, payer_document, metadata, created_at
      )
      VALUES (
        ${txId}, ${user.id}, ${transactionId},
        ${'pix_in'}, ${amount}, ${fee}, ${netAmount}, ${'pending'}, ${description},
        ${payer?.name}, ${payer?.document}, ${JSON.stringify({ qr_code: pixResponse.data?.qrCode, qr_code_base64: pixResponse.data?.qrCodeBase64, copy_paste: pixResponse.data?.copyPaste, payer_email: payer?.email, acquirer_id: acquirer.id, acquirer_transaction_id: pixResponse.data?.transactionId, route: user.route_type })}, NOW()
      )
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Erro ao salvar transação", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    const transaction = result[0];

    // Enviar notificacao push
    const userId = user.user_id;
    console.log("[v0] Sending push notification for PIX generated:", { userId, amount, transactionId: transaction.id });
    
    if (userId) {
      try {
        const pushResult = await notifyNewTransaction(userId, amount, transaction.id);
        console.log("[v0] Push notification result:", pushResult);
      } catch (err) {
        console.error("[v0] Error sending push notification:", err);
      }
    } else {
      console.error("[v0] Cannot send push notification - user_id is undefined");
    }

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        external_id: transaction.external_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
        status: transaction.status,
        qr_code: transaction.qr_code,
        qr_code_base64: transaction.qr_code_base64,
        copy_paste: transaction.copy_paste,
        expires_at: transaction.expires_at,
        created_at: transaction.created_at,
      },
    });
  } catch (error) {
    console.error("[v0] PIX create error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
