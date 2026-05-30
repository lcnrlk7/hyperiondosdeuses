import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { MedusaPayments } from "@/lib/acquirers/medusa";
import { getSystemFeesForUser } from "@/lib/acquirers";
import { logNewTransaction } from "@/lib/discord-webhook";
import { detectAttack } from "@/lib/sanitize";
import { logAttack } from "@/lib/attack-logger";
import { notifyPixCreated } from "@/lib/notifications";

// Sistema de codigos de erro - nunca expor erros internos ao usuario
function errorResponse(code: string, status: number, internalMsg?: string) {
  const messages: Record<string, string> = {
    "PIX-001": "Valor invalido. Informe um valor positivo.",
    "PIX-002": "Valor abaixo do minimo permitido.",
    "PIX-003": "Valor acima do limite por transacao. Use o Pagamento Dividido para valores maiores.",
    "PIX-004": "Sessao expirada. Faca login novamente.",
    "PIX-005": "Conta desativada. Entre em contato com o suporte.",
    "PIX-006": "Conta bloqueada. Entre em contato com o suporte.",
    "PIX-007": "Rota de pagamento nao configurada. Entre em contato com o suporte.",
    "PIX-008": "Conteudo nao permitido.",
    "PIX-009": "Falha ao gerar cobranca. Tente novamente em alguns segundos.",
    "PIX-010": "Erro ao registrar transacao. Tente novamente.",
    "PIX-500": "Erro interno. Entre em contato com o suporte informando o codigo PIX-500.",
  };

  if (internalMsg) {
    console.error(`[PIX Error ${code}]`, internalMsg);
  }

  return NextResponse.json(
    { error: messages[code] || messages["PIX-500"], code },
    { status }
  );
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      description, 
      externalId, 
      payerName, 
      payerDocument, 
      payerEmail,
      payerPhone,
      apiKey,
      // Parametros UTM para tracking
      utm_source,
      utm_campaign,
      utm_medium,
      utm_content,
      utm_term,
      src,
      sck,
    } = body;
    const ip = getClientIp(request);

    // SEGURANCA: Verificar ataques em campos de texto
    const textFields = { description, externalId, payerName, payerDocument };
    for (const [field, value] of Object.entries(textFields)) {
      if (typeof value === "string" && value.length > 0) {
        const attack = detectAttack(value);
        if (attack.detected) {
          await logAttack({
            attackType: attack.attackType!,
            ipAddress: ip,
            payload: value.substring(0, 100),
            endpoint: "/api/pix/create",
            severity: attack.severity || "high",
            blocked: true,
          });
          return errorResponse("PIX-008", 400, `Attack detected: ${attack.attackType} in ${field}`);
        }
      }
    }

    if (!amount || amount <= 0) {
      return errorResponse("PIX-001", 400);
    }

    // Buscar configurações
    const settingsResult = await sql`
      SELECT key, value FROM system_settings WHERE key IN ('min_deposit', 'max_deposit')
    `;

    const settings: Record<string, number> = { min_deposit: 5, max_deposit: 100000 };
    settingsResult.forEach((s: { key: string; value: string }) => {
      settings[s.key] = parseFloat(s.value) || settings[s.key];
    });

    // Nota: o minimo de deposito especifico da adquirente sera verificado depois de buscar o profile
    
    if (amount > settings.max_deposit) {
      return errorResponse("PIX-003", 400, `amount=${amount} > max=${settings.max_deposit}`);
    }

    let profile;

    // Autenticar via API Key ou sessão
    if (apiKey) {
      const result = await sql`
        SELECT id, name, email, cpf_cnpj, phone, is_active, is_blocked, kyc_status, balance, fee_percentage, route_type, acquirer_id, created_at
        FROM profiles WHERE api_key = ${apiKey}
      `;
      profile = result[0];
    } else {
      const sessionUser = await getCurrentUser();
      if (sessionUser) {
        const result = await sql`
          SELECT id, name, email, cpf_cnpj, phone, is_active, is_blocked, kyc_status, balance, fee_percentage, route_type, acquirer_id, created_at
          FROM profiles WHERE id = ${sessionUser.id}
        `;
        profile = result[0];
      }
    }

    if (!profile) {
      return errorResponse("PIX-004", 401);
    }

    if (!profile.is_active) {
      return errorResponse("PIX-005", 403);
    }

    // SEGURANCA: Verificar se usuario esta bloqueado
    if (profile.is_blocked) {
      return errorResponse("PIX-006", 403);
    }

    // Buscar minimo de deposito da adquirente especifica do usuario
    const userAcquirerResult = await sql`
      SELECT p.acquirer_id, a.min_deposit as acquirer_min_deposit
      FROM profiles p
      LEFT JOIN acquirers a ON a.id = p.acquirer_id AND a.is_active = true
      WHERE p.id = ${profile.id}
    `;
    
    const acquirerMinDeposit = userAcquirerResult[0]?.acquirer_min_deposit;
    const effectiveMinDeposit = acquirerMinDeposit ? Number(acquirerMinDeposit) : settings.min_deposit;

    if (amount < effectiveMinDeposit) {
      return errorResponse("PIX-002", 400, `amount=${amount} < min=${effectiveMinDeposit}`);
    }

    if (profile.kyc_status !== "approved") {
      return errorResponse("PIX-005", 403, "KYC not approved");
    }

    // Buscar adquirente configurada para o usuario (obrigatorio ter acquirer_id)
    if (!profile.acquirer_id) {
      return errorResponse("PIX-007", 400, `user ${profile.id} has no acquirer_id`);
    }
    
    const acquirerResult = await sql`
      SELECT * FROM acquirers WHERE id = ${profile.acquirer_id} AND is_active = true LIMIT 1
    `;

    if (acquirerResult.length === 0) {
      return errorResponse("PIX-007", 400, `acquirer ${profile.acquirer_id} not found or inactive`);
    }

    const acquirer = acquirerResult[0];
    const userRouteType = acquirer.route_type || 'black';
    const transactionId = externalId || `lp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    let pixResult: { success: boolean; data?: { qrCode?: string; qrCodeBase64?: string; copyPaste?: string; transactionId?: string; fee?: number }; error?: string };

    // Usar cliente correto baseado no adquirente selecionado
    if (acquirer.code === 'medusa' || acquirer.code === 'medusa_white') {
      try {
        const medusa = new MedusaPayments({
          secretKey: acquirer.api_key,
          licenseKey: acquirer.api_secret || undefined,
        });
        
        // Medusa usa valor em centavos
        const amountInCents = Math.round(amount * 100);
        
        // Usar nome e email do usuário + CPF fixo para Medusa
        const customerName = profile.name || "Cliente Hyperion Pay";
        const customerDocument = "36009722004"; // CPF fixo para todas as transações Medusa
        const customerEmail = profile.email || "cliente@hyperionpay.com";
        
        // URL do webhook Medusa - usar domínio de produção
        const medusaWebhookUrl = "https://www.hyperionpay.com.br/api/webhooks/medusa";
        
        const medusaResult = await medusa.createSimplePixPayment(
          amountInCents,
          customerName,
          customerDocument,
          customerEmail,
          description || "Depósito via PIX - Hyperion Pay",
          medusaWebhookUrl
        );
        
        if (!medusaResult.pix?.qrcode) {
          // Registrar erro
          try {
            await sql`
              INSERT INTO integration_errors (integration_name, error_code, error_message, request_data, response_data, user_id, created_at)
              VALUES (
                'medusa',
                'NO_PIX_CODE',
                'Medusa não retornou o código PIX',
                ${JSON.stringify({ amount: amountInCents, transactionId })},
                ${JSON.stringify(medusaResult)},
                ${profile.id},
                NOW()
              )
            `;
          } catch (logErr) {
            console.error("Error logging integration error:", logErr);
          }
          
          pixResult = {
            success: false,
            error: "Medusa não retornou o código PIX"
          };
        } else {
          pixResult = {
            success: true,
            data: {
              qrCode: medusaResult.pix.qrcode,
              qrCodeBase64: medusaResult.pix.qrcode,
              copyPaste: medusaResult.pix.qrcode,
              transactionId: String(medusaResult.id),
            }
          };
        }
      } catch (error) {
        console.error("Medusa error:", error);
        
        // Registrar erro na tabela de erros de integração
        try {
          await sql`
            INSERT INTO integration_errors (integration_name, error_code, error_message, request_data, user_id, created_at)
            VALUES (
              'medusa',
              'EXCEPTION',
              ${error instanceof Error ? error.message : 'Erro desconhecido'},
              ${JSON.stringify({ amount, transactionId })},
              ${profile.id},
              NOW()
            )
          `;
        } catch (logErr) {
          console.error("[v0] Error logging integration error:", logErr);
        }
        
        pixResult = {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar cobrança PIX com Medusa"
        };
      }
    } else {
      return errorResponse("PIX-007", 500, `Unsupported acquirer: ${acquirer.code}`);
    }

    if (!pixResult.success || !pixResult.data) {
      return errorResponse("PIX-009", 500, `PIX creation failed: ${pixResult.error}`);
    }

    // Buscar taxas personalizadas do usuario (ou padrao da rota se nao tiver)
    const userFees = await getSystemFeesForUser(profile.id);
    const feePercentage = userFees.pixPercentageFee;
    const fixedFee = userFees.pixFixedFee;
    
    // Calcular taxa total
    const fee = (amount * (feePercentage / 100)) + fixedFee;
    const netAmount = amount - fee;
    
    console.log(`[PIX Create] Usuario ${profile.email}: Taxa ${feePercentage}% + R$${fixedFee} = R$${fee.toFixed(2)} para R$${amount}`);

    const txId = crypto.randomUUID();
    const acquirerTxId = pixResult.data.transactionId || transactionId;
    
    // Inserir transação (fee_percentage guardado no metadata) com parametros UTM para tracking
    const txResult = await sql`
      INSERT INTO transactions (
        id, user_id, external_id, acquirer_transaction_id, type,
        amount, fee, net_amount, status,
        payer_name, payer_document, payer_email, description, metadata,
        utm_source, utm_campaign, utm_medium, utm_content, utm_term, utm_src, utm_sck,
        created_at
      )
      VALUES (
        ${txId}, ${profile.id}, ${transactionId}, ${acquirerTxId},
        ${'pix_in'}, ${amount}, ${fee}, ${netAmount}, ${'pending'},
        ${payerName || profile.name || ''}, ${payerDocument || ''}, ${payerEmail || ''}, ${description || 'Depósito via PIX'},
        ${JSON.stringify({ qr_code: pixResult.data.qrCode || '', qr_code_base64: pixResult.data.qrCodeBase64 || '', copy_paste: pixResult.data.copyPaste || '', acquirer_id: acquirer.id, acquirer_code: acquirer.code, acquirer_fee: pixResult.data.fee || 0, fee_percentage: feePercentage })},
        ${utm_source || null}, ${utm_campaign || null}, ${utm_medium || null}, ${utm_content || null}, ${utm_term || null}, ${src || null}, ${sck || null},
        NOW()
      )
      RETURNING *
    `;

    if (txResult.length === 0) {
      return NextResponse.json({
        success: true,
        transactionId,
        acquirerTransactionId: pixResult.data.transactionId,
        status: "pending",
        amount,
        qrCode: pixResult.data.qrCode,
        qrCodeBase64: pixResult.data.qrCodeBase64,
        copyPaste: pixResult.data.copyPaste,
        warning: "Transação criada mas houve erro ao salvar localmente",
      });
    }

    const transaction = txResult[0];

    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${profile.id}, 
        'PIX_CHARGE_CREATED', 
        'transaction', 
        ${transaction.id}, 
        ${JSON.stringify({ 
          amount, 
          fee, 
          net_amount: netAmount, 
          acquirer_transaction_id: pixResult.data.transactionId,
          description: description || 'Depósito via PIX'
        })}, 
        NOW()
      )
    `;
    
    // Log para Discord (usa waitUntil para garantir execucao)
    logNewTransaction({
      transactionId: transaction.id,
      userName: profile.name || "N/A",
      userEmail: profile.email || "",
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      payerName: payerName || profile.name || "Cliente",
      payerDocument: payerDocument,
      description: description || "Deposito via PIX",
      route: userRouteType,
      status: "pending",
    });

    // Notificar usuario que PIX foi criado
    notifyPixCreated(profile.id, amount, transactionId).catch(err => {
      console.error("[PIX Create] Erro ao enviar notificacao:", err);
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      acquirerTransactionId: pixResult.data.transactionId,
      status: "pending",
      amount,
      qrCode: pixResult.data.qrCode,
      qrCodeBase64: pixResult.data.qrCodeBase64,
      copyPaste: pixResult.data.copyPaste,
    });
  } catch (error) {
    return errorResponse("PIX-500", 500, error instanceof Error ? error.message : String(error));
  }
}
