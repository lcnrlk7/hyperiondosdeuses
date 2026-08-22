import { sql } from "@/lib/db";
import { notifyWithdrawalRequested } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { getSystemFeesForUser, createWithdrawal } from "@/lib/acquirers";
import { validateWithdrawal, getClientIP, logSuspiciousActivity, rateLimit, isValidPixKey } from "@/lib/security";
import crypto from "crypto";

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

// Autenticar usuario via credenciais
async function authenticateUser(clientId: string, clientSecret: string) {
  // Tentar buscar na tabela user_integrations (cli_/sec_)
  const integrationResult = await sql`
    SELECT ui.id as integration_id, ui.user_id, ui.name as integration_name, ui.is_active as integration_active,
           p.id as profile_id, p.name, p.kyc_status, p.route_type, p.balance, p.api_enabled, p.is_active,
           p.withdrawal_fee, p.acquirer_id
    FROM user_integrations ui
    INNER JOIN profiles p ON p.id::text = ui.user_id::text
    WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
  `;

  if (integrationResult.length > 0) {
    const integration = integrationResult[0];
    if (!integration.integration_active) {
      return { error: "Esta integracao esta desativada", code: "INTEGRATION_DISABLED" };
    }
    return {
      profile: {
        id: integration.user_id as string,
        name: integration.name as string,
        kyc_status: integration.kyc_status as string,
        route_type: integration.route_type as string,
        balance: Number(integration.balance) || 0,
        api_enabled: integration.api_enabled as boolean,
        is_active: integration.is_active as boolean,
        withdrawal_fee: Number(integration.withdrawal_fee) || 0,
        acquirer_id: integration.acquirer_id as string,
      },
      integration: integration
    };
  }

  // Se nao encontrou em user_integrations, tentar na tabela profiles (lp_/sk_)
  const profileResult = await sql`
    SELECT id, name, kyc_status, route_type, balance, api_enabled, is_active, api_key, client_secret,
           withdrawal_fee, acquirer_id
    FROM profiles
    WHERE (api_key = ${clientId} OR client_id = ${clientId})
      AND (client_secret = ${clientSecret} OR api_key = ${clientId})
  `;

  if (profileResult.length > 0) {
    const p = profileResult[0];
    return {
      profile: {
        id: p.id as string,
        name: p.name as string,
        kyc_status: p.kyc_status as string,
        route_type: p.route_type as string,
        balance: Number(p.balance) || 0,
        api_enabled: p.api_enabled as boolean,
        is_active: p.is_active as boolean,
        withdrawal_fee: Number(p.withdrawal_fee) || 0,
        acquirer_id: p.acquirer_id as string,
      },
      integration: null
    };
  }

  return { error: "Credenciais invalidas", code: "UNAUTHORIZED" };
}

// POST - Criar saque via API
export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = extractCredentials(request);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais nao fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const authResult = await authenticateUser(clientId, clientSecret);
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: authResult.code === "INTEGRATION_DISABLED" ? 403 : 401 }
      );
    }

    const { profile } = authResult;

    // Verificar se usuario esta ativo
    if (!profile.is_active) {
      return NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // NOTA: a verificacao de identidade (Didit) e feita na liberacao da conta,
    // NAO a cada saque. A conta ja foi validada como ativa acima.

    const body = await request.json();
    const { amount, pix_key, pix_key_type, external_id, description } = body;

    // Validacoes
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor invalido", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { success: false, error: "Valor minimo para saque e R$ 10,00", code: "MIN_AMOUNT" },
        { status: 400 }
      );
    }

    if (!pix_key || !pix_key_type) {
      return NextResponse.json(
        { success: false, error: "Chave PIX e tipo sao obrigatorios", code: "INVALID_PIX_KEY" },
        { status: 400 }
      );
    }

    const validKeyTypes = ["cpf", "cnpj", "email", "phone", "random"];
    if (!validKeyTypes.includes(pix_key_type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Tipo de chave PIX invalido. Use: cpf, cnpj, email, phone ou random", code: "INVALID_KEY_TYPE" },
        { status: 400 }
      );
    }

    // SEGURANCA: valida o formato da chave PIX (mesma regra da rota do painel)
    if (!isValidPixKey(pix_key)) {
      return NextResponse.json(
        { success: false, error: "Chave PIX invalida", code: "INVALID_PIX_KEY" },
        { status: 400 }
      );
    }

    // SEGURANCA: busca dados autoritativos e ATUAIS do perfil (o objeto vindo da
    // autenticacao pode estar defasado). Aqui checamos bloqueio, KYC e prova de vida.
    const ip = await getClientIP();
    const secRows = await sql`
      SELECT balance, is_blocked, is_active, kyc_status, liveness_status, created_at
      FROM profiles WHERE id = ${profile.id}
    `;
    const sec = secRows[0];

    if (!sec || sec.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // SEGURANCA: conta bloqueada nao movimenta dinheiro (faltava nesta rota de API)
    if (sec.is_blocked) {
      await logSuspiciousActivity(profile.id, "API_WITHDRAWAL_BLOCKED_ACCOUNT", `IP: ${ip}, Amount: ${amount}`, ip);
      return NextResponse.json(
        { success: false, error: "Conta bloqueada. Entre em contato com o suporte.", code: "ACCOUNT_BLOCKED" },
        { status: 403 }
      );
    }

    // SEGURANCA: KYC e prova de vida obrigatorios para sacar (faltava nesta rota)
    if (sec.kyc_status !== "approved") {
      return NextResponse.json(
        { success: false, error: "KYC nao aprovado. Complete a verificacao para sacar.", code: "KYC_REQUIRED" },
        { status: 403 }
      );
    }
    if (sec.liveness_status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Verificacao de identidade obrigatoria para sacar.", code: "LIVENESS_REQUIRED" },
        { status: 403 }
      );
    }

    // SEGURANCA: rate limit por usuario (5 saques/hora via API)
    const apiWithdrawalRateLimit = rateLimit(`api_withdrawal_${profile.id}`, 5, 3600000);
    if (!apiWithdrawalRateLimit.allowed) {
      await logSuspiciousActivity(profile.id, "API_WITHDRAWAL_RATE_LIMITED", `IP: ${ip}`, ip);
      return NextResponse.json(
        { success: false, error: "Limite de solicitacoes de saque atingido. Aguarde 1 hora.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    // SEGURANCA: validacao anti-fraude (velocidade, chave PIX suspeita, etc.)
    const fraudCheck = await validateWithdrawal(profile.id, amount, pix_key);
    if (!fraudCheck.valid) {
      await logSuspiciousActivity(profile.id, "API_WITHDRAWAL_FRAUD_BLOCKED", `Reason: ${fraudCheck.reason}, Amount: ${amount}`, ip);
      return NextResponse.json(
        { success: false, error: fraudCheck.reason || "Saque nao autorizado", code: "FRAUD_BLOCKED" },
        { status: 403 }
      );
    }

    // Buscar taxas do usuario
    const userFees = await getSystemFeesForUser(profile.id);
    
    // Calcular taxa de saque
    let withdrawalFee = 0;
    if (userFees.withdrawalFeeIsPercentage) {
      withdrawalFee = (amount * userFees.withdrawalFee) / 100;
    } else {
      withdrawalFee = userFees.withdrawalFee;
    }

    const totalDebit = amount + withdrawalFee;
    const currentBalance = Number(sec.balance) || 0;

    // Verificacao previa (mensagem amigavel)
    if (currentBalance < totalDebit) {
      return NextResponse.json(
        { success: false, error: `Saldo insuficiente. Necessario: R$ ${totalDebit.toFixed(2)}, Disponivel: R$ ${currentBalance.toFixed(2)}`, code: "INSUFFICIENT_BALANCE" },
        { status: 400 }
      );
    }

    // Criar ID do saque
    const withdrawalId = `wd_${crypto.randomUUID()}`;

    // Reserva o saldo e persiste a intencao em uma unica instrucao atomica.
    const reservation = await sql`
      WITH debited AS (
        UPDATE profiles
        SET balance = balance - ${totalDebit}, updated_at = NOW()
        WHERE id = ${profile.id} AND balance >= ${totalDebit}
        RETURNING id
      )
      INSERT INTO withdrawals (
        id, user_id, amount, fee, pix_key, pix_key_type,
        external_id, description, status, created_at
      )
      SELECT
        ${withdrawalId}, ${profile.id}, ${amount}, ${withdrawalFee}, ${pix_key},
        ${pix_key_type.toLowerCase()}, ${external_id || null}, ${description || null},
        'reserved', NOW()
      FROM debited
      RETURNING id
    `;

    if (reservation.length === 0) {
      await logSuspiciousActivity(profile.id, "API_WITHDRAWAL_RACE_BLOCKED", `Débito concorrente/saldo insuficiente. TotalDebit: ${totalDebit}`, ip);
      return NextResponse.json(
        { success: false, error: "Saldo insuficiente ou operacao concorrente detectada.", code: "INSUFFICIENT_BALANCE" },
        { status: 400 }
      );
    }

    // Processar saque automaticamente se valor <= R$ 500
    let status = 'reserved';

    if (amount <= 500) {
      try {
        const result = await createWithdrawal(
          amount,
          pix_key,
          profile.id,
          pix_key_type.toLowerCase(),
          description || "Saque via API"
        );

        if (result.success) {
          status = result.status || 'processing';

          await sql`
            UPDATE withdrawals 
            SET status = ${status}, 
                acquirer_withdrawal_id = ${result.withdrawalId || null},
                updated_at = NOW()
            WHERE id = ${withdrawalId}
          `;
        }
      } catch (error) {
        console.error("Erro ao processar saque automatico:", error);
        // Saque fica pendente para aprovacao manual
      }
    }

    // Notificar usuario que o saque via integracao foi solicitado.
    await notifyWithdrawalRequested(profile.id, amount, pix_key);

    return NextResponse.json({
      success: true,
      data: {
        withdrawal_id: withdrawalId,
        external_id: external_id || null,
        amount: amount,
        fee: withdrawalFee,
        net_amount: amount,
        pix_key: pix_key,
        pix_key_type: pix_key_type.toLowerCase(),
        status: status,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Erro na API de saque:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET - Consultar status do saque
export async function GET(request: NextRequest) {
  try {
    const { clientId, clientSecret } = extractCredentials(request);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais nao fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const authResult = await authenticateUser(clientId, clientSecret);
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: authResult.code === "INTEGRATION_DISABLED" ? 403 : 401 }
      );
    }

    const { profile } = authResult;

    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get("withdrawal_id");
    const externalId = searchParams.get("external_id");

    if (!withdrawalId && !externalId) {
      return NextResponse.json(
        { success: false, error: "Informe withdrawal_id ou external_id", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    let withdrawal;
    if (withdrawalId) {
      const result = await sql`
        SELECT * FROM withdrawals WHERE id = ${withdrawalId} AND user_id = ${profile.id}
      `;
      withdrawal = result[0];
    } else {
      const result = await sql`
        SELECT * FROM withdrawals WHERE external_id = ${externalId} AND user_id = ${profile.id}
      `;
      withdrawal = result[0];
    }

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: "Saque nao encontrado", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        withdrawal_id: withdrawal.id,
        external_id: withdrawal.external_id,
        status: withdrawal.status,
        amount: Number(withdrawal.amount),
        fee: Number(withdrawal.fee),
        net_amount: Number(withdrawal.amount),
        pix_key: withdrawal.pix_key,
        pix_key_type: withdrawal.pix_key_type,
        recipient_name: withdrawal.recipient_name,
        recipient_bank: withdrawal.recipient_bank,
        description: withdrawal.description,
        created_at: withdrawal.created_at,
        completed_at: withdrawal.completed_at || null,
        failed_reason: withdrawal.failed_reason || null
      }
    });

  } catch (error) {
    console.error("Erro ao consultar saque:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
