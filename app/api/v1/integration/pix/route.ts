import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createPixPayment, getSystemFeesForUser } from "@/lib/acquirers";
import crypto from "crypto";
import { logNewTransaction, logAPIUsage } from "@/lib/discord-webhook";

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

// POST - Criar cobrança PIX via integração externa
export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = extractCredentials(request);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    let integration: Record<string, unknown> | null = null;
    let profile: { id: string; name: string; kyc_status: string; route_type: string; balance: number; api_enabled: boolean; is_active: boolean } | null = null;

    // Primeiro, tentar buscar na tabela user_integrations (cli_/sec_)
    const integrationResult = await sql`
      SELECT ui.id as integration_id, ui.user_id, ui.name as integration_name, ui.is_active as integration_active,
             ui.webhook_url, ui.webhook_secret,
             p.id as profile_id, p.name, p.kyc_status, p.route_type, p.balance, p.api_enabled, p.is_active
      FROM user_integrations ui
      INNER JOIN profiles p ON p.id::text = ui.user_id::text
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `;

    if (integrationResult.length > 0) {
      integration = integrationResult[0];
      profile = {
        id: integration.user_id as string,
        name: integration.name as string,
        kyc_status: integration.kyc_status as string,
        route_type: integration.route_type as string,
        balance: integration.balance as number,
        api_enabled: integration.api_enabled as boolean,
        is_active: integration.is_active as boolean
      };

      // Verificar se a integração específica está ativa
      if (!integration.integration_active) {
        return NextResponse.json(
          { success: false, error: "Esta integração está desativada", code: "INTEGRATION_DISABLED" },
          { status: 403 }
        );
      }
    } else {
      // Se não encontrou em user_integrations, tentar na tabela profiles (lp_/sk_)
      const profileResult = await sql`
        SELECT id, name, kyc_status, route_type, balance, api_enabled, is_active
        FROM profiles
        WHERE (client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret})
      `;

      if (profileResult.length > 0) {
        const p = profileResult[0];
        integration = { 
          integration_id: p.id, 
          user_id: p.id, 
          integration_name: p.name,
          integration_active: p.api_enabled 
        };
        profile = {
          id: p.id as string,
          name: p.name as string,
          kyc_status: p.kyc_status as string,
          route_type: p.route_type as string,
          balance: p.balance as number,
          api_enabled: p.api_enabled as boolean,
          is_active: p.is_active as boolean
        };

        // Verificar se a API está habilitada
        if (!p.api_enabled) {
          return NextResponse.json(
            { success: false, error: "API não está habilitada para esta conta", code: "API_DISABLED" },
            { status: 403 }
          );
        }
      }
    }

    if (!integration || !profile) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Verificar se o usuário está ativo
    if (!profile.is_active) {
      return NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // Verificar KYC do proprietário
    if (profile.kyc_status !== "approved") {
      return NextResponse.json(
        { success: false, error: "KYC não aprovado. Complete a verificação de identidade no dashboard.", code: "KYC_REQUIRED" },
        { status: 403 }
      );
    }

    // Parsear body
    const body = await request.json();
    const { amount, external_id, description, payer } = body;

    // Validar campos obrigatórios
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor inválido", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Valor mínimo: R$ 1,00
    const minAmount = 1;
    if (amount < minAmount) {
      return NextResponse.json(
        { success: false, error: `Valor mínimo é R$ ${minAmount.toFixed(2).replace('.', ',')}`, code: "MIN_AMOUNT" },
        { status: 400 }
      );
    }

    if (amount > 50000) {
      return NextResponse.json(
        { success: false, error: "Valor máximo é R$ 50.000,00", code: "MAX_AMOUNT" },
        { status: 400 }
      );
    }

    // Buscar taxas baseadas na rota do usuário (considera taxas personalizadas)
    let systemFees;
    try {
      systemFees = await getSystemFeesForUser(profile.id);
    } catch {
      // Usar taxas padrão se falhar
      systemFees = profile.route_type === 'white' 
        ? { pixFixedFee: 1.50, pixPercentageFee: 0, withdrawalFee: 2.00 }
        : { pixFixedFee: 0, pixPercentageFee: 4.00, withdrawalFee: 5.00 };
    }

    // Calcular taxa (usar taxa personalizada do usuario ou padrao da rota)
    const feePercentage = systemFees.pixPercentageFee;
    const fixedFee = systemFees.pixFixedFee;
    const percentageFee = (amount * feePercentage) / 100;
    const fee = percentageFee + fixedFee;
    const netAmount = amount - fee;

    const transactionId = external_id || `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Criar cobrança PIX - garantir que os dados do pagador nunca sejam undefined
    const safePayerName = (payer?.name && String(payer.name).trim()) ? String(payer.name).trim() : "Cliente";
    const safePayerDocument = (payer?.document && String(payer.document).trim()) ? String(payer.document).replace(/\D/g, "") : "00000000000";
    
    const pixResponse = await createPixPayment(
      amount,
      transactionId,
      profile.id,
      description || `Pagamento via ${profile.name}`,
      safePayerName,
      safePayerDocument
    );

    if (!pixResponse.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: pixResponse.error || "Erro ao criar cobrança", 
          code: "ACQUIRER_ERROR"
        },
        { status: 500 }
      );
    }

    // Extrair dados do PIX - pode estar em data.* ou diretamente no objeto
    const acquirerTransactionId = pixResponse.transactionId || pixResponse.data?.transactionId || transactionId;
    const qrCode = pixResponse.qrCode || pixResponse.data?.qrCode || pixResponse.copyPaste || '';
    const qrCodeBase64 = pixResponse.qrCodeBase64 || pixResponse.data?.qrCodeBase64 || '';
    const copyPaste = pixResponse.copyPaste || pixResponse.data?.copyPaste || pixResponse.data?.pixCode || qrCode;

    // Salvar transação no banco (tabela transactions sem qr_code)
    const txId = crypto.randomUUID();
    const txResult = await sql`
      INSERT INTO transactions (
        id, user_id, external_id, acquirer_transaction_id, type, amount, fee, net_amount, 
        status, description, payer_name, payer_document, metadata, created_at
      )
      VALUES (
        ${txId}, ${profile.id}, ${transactionId}, ${acquirerTransactionId}, ${'pix_in'}, 
        ${amount}, ${fee}, ${netAmount}, ${'pending'}, 
        ${description || `Pagamento via ${profile.name}`},
        ${safePayerName}, ${safePayerDocument}, 
        ${JSON.stringify({ 
          integration_id: integration.integration_id, 
          integration_name: integration.integration_name,
          acquirer_transaction_id: acquirerTransactionId,
          payer: { name: safePayerName, document: safePayerDocument, email: payer?.email },
          route: profile.route_type
        })}, 
        NOW()
      )
      RETURNING id, external_id, amount, fee, net_amount, status, description, created_at
    `;

    // Salvar dados do QR Code na tabela pix_charges
    const chargeId = crypto.randomUUID();
    await sql`
      INSERT INTO pix_charges (
        id, user_id, transaction_id, amount, description, 
        qr_code, qr_code_base64, copy_paste, external_id,
        payer_name, payer_document, status, created_at
      )
      VALUES (
        ${chargeId}, ${profile.id}, ${txId}, ${amount}, 
        ${description || `Pagamento via ${profile.name}`},
        ${qrCode}, ${qrCodeBase64}, ${copyPaste}, ${transactionId},
        ${safePayerName}, ${safePayerDocument}, ${'active'}, NOW()
      )
    `;

    const transaction = txResult[0];

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${profile.id}, 
        'PIX_INTEGRATION_CREATED', 
        'transaction', 
        ${transaction.id}, 
        ${JSON.stringify({ 
          amount, 
          fee, 
          net_amount: netAmount, 
          integration_id: profile.id,
          integration_name: profile.name
        })}, 
        NOW()
      )
    `;
    
    // Log para Discord
    logNewTransaction({
      transactionId: transaction.id,
      userName: profile.name,
      userEmail: "", // API nao tem email
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      payerName: safePayerName,
      payerDocument: safePayerDocument,
      description: description || "Via API",
      route: profile.route_type,
      status: "pending",
    });
    
    logAPIUsage({
      userId: profile.id,
      userName: profile.name,
      endpoint: "/api/v1/integration/pix",
      method: "POST",
      statusCode: 200,
      amount: amount,
    });

    // Retornar resposta formatada
    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
        status: transaction.status,
        pix: {
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          copy_paste: copyPaste,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        created_at: transaction.created_at,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[v1/integration/pix] Error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET - Consultar status de transação
export async function GET(request: NextRequest) {
  try {
    const { clientId, clientSecret } = extractCredentials(request);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Tentar buscar na tabela user_integrations primeiro
    let userId: string | null = null;
    
    const integrationResult = await sql`
      SELECT ui.user_id, ui.is_active as integration_active
      FROM user_integrations ui
      INNER JOIN profiles p ON p.id::text = ui.user_id::text
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `;

    if (integrationResult.length > 0) {
      const integration = integrationResult[0];
      if (!integration.integration_active) {
        return NextResponse.json(
          { success: false, error: "Esta integração está desativada", code: "INTEGRATION_DISABLED" },
          { status: 403 }
        );
      }
      userId = integration.user_id as string;
    } else {
      // Tentar na tabela profiles (lp_/sk_)
      const profileResult = await sql`
        SELECT id, api_enabled FROM profiles
        WHERE (client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret})
      `;
      
      if (profileResult.length > 0) {
        const profile = profileResult[0];
        if (!profile.api_enabled) {
          return NextResponse.json(
            { success: false, error: "API não está habilitada para esta conta", code: "API_DISABLED" },
            { status: 403 }
          );
        }
        userId = profile.id as string;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Buscar transação
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");
    const externalId = searchParams.get("external_id");

    if (!transactionId && !externalId) {
      return NextResponse.json(
        { success: false, error: "Informe transaction_id ou external_id", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    let transaction;
    if (transactionId) {
      const result = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE id = ${transactionId} AND user_id = ${userId}
      `;
      transaction = result[0];
    } else {
      const result = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE external_id = ${externalId} AND user_id = ${userId}
      `;
      transaction = result[0];
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transação não encontrada", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
        status: transaction.status,
        description: transaction.description,
        payer: {
          name: transaction.payer_name,
          document: transaction.payer_document,
        },
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      },
    });
  } catch (error) {
    console.error("[v1/integration/pix] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
