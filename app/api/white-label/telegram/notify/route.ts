import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Tipos de notificacao
type NotificationType = 
  | "new_user" 
  | "new_transaction" 
  | "withdraw_request" 
  | "withdraw_approved"
  | "withdraw_rejected"
  | "kyc_pending"
  | "kyc_approved"
  | "kyc_rejected"
  | "payment_received"
  | "payment_failed"
  | "custom"

interface NotificationData {
  type: NotificationType
  title?: string
  message?: string
  data?: Record<string, any>
}

// Formatar mensagem baseada no tipo
function formatMessage(notification: NotificationData): string {
  const { type, data, title, message } = notification
  const now = new Date().toLocaleString("pt-BR")

  switch (type) {
    case "new_user":
      return `👤 *Novo Usuario Cadastrado*\n\n` +
        `📧 Email: ${data?.email || "N/A"}\n` +
        `👤 Nome: ${data?.name || "N/A"}\n` +
        `📅 Data: ${now}`

    case "new_transaction":
      return `💰 *Nova Transacao*\n\n` +
        `🔢 ID: #${data?.transaction_id || "N/A"}\n` +
        `💵 Valor: R$ ${data?.amount?.toFixed(2) || "0.00"}\n` +
        `📋 Status: ${data?.status || "Pendente"}\n` +
        `👤 Cliente: ${data?.customer_name || "N/A"}\n` +
        `📅 Data: ${now}`

    case "withdraw_request":
      return `🏦 *Solicitacao de Saque*\n\n` +
        `🔢 ID: #${data?.withdraw_id || "N/A"}\n` +
        `💵 Valor: R$ ${data?.amount?.toFixed(2) || "0.00"}\n` +
        `👤 Usuario: ${data?.user_name || "N/A"}\n` +
        `🔑 PIX: ${data?.pix_key || "N/A"}\n` +
        `📅 Data: ${now}\n\n` +
        `⚠️ _Aguardando aprovacao_`

    case "withdraw_approved":
      return `✅ *Saque Aprovado*\n\n` +
        `🔢 ID: #${data?.withdraw_id || "N/A"}\n` +
        `💵 Valor: R$ ${data?.amount?.toFixed(2) || "0.00"}\n` +
        `👤 Usuario: ${data?.user_name || "N/A"}\n` +
        `📅 Data: ${now}`

    case "withdraw_rejected":
      return `❌ *Saque Rejeitado*\n\n` +
        `🔢 ID: #${data?.withdraw_id || "N/A"}\n` +
        `💵 Valor: R$ ${data?.amount?.toFixed(2) || "0.00"}\n` +
        `👤 Usuario: ${data?.user_name || "N/A"}\n` +
        `📝 Motivo: ${data?.reason || "Nao informado"}\n` +
        `📅 Data: ${now}`

    case "kyc_pending":
      return `📋 *KYC Pendente*\n\n` +
        `👤 Usuario: ${data?.user_name || "N/A"}\n` +
        `📧 Email: ${data?.email || "N/A"}\n` +
        `📅 Data: ${now}\n\n` +
        `⚠️ _Aguardando verificacao_`

    case "kyc_approved":
      return `✅ *KYC Aprovado*\n\n` +
        `👤 Usuario: ${data?.user_name || "N/A"}\n` +
        `📧 Email: ${data?.email || "N/A"}\n` +
        `📅 Data: ${now}`

    case "kyc_rejected":
      return `❌ *KYC Rejeitado*\n\n` +
        `👤 Usuario: ${data?.user_name || "N/A"}\n` +
        `📧 Email: ${data?.email || "N/A"}\n` +
        `📝 Motivo: ${data?.reason || "Nao informado"}\n` +
        `📅 Data: ${now}`

    case "payment_received":
      return `💸 *Pagamento Recebido*\n\n` +
        `🔢 ID: #${data?.transaction_id || "N/A"}\n` +
        `💵 Valor: R$ ${data?.amount?.toFixed(2) || "0.00"}\n` +
        `👤 Cliente: ${data?.customer_name || "N/A"}\n` +
        `📅 Data: ${now}`

    case "payment_failed":
      return `❌ *Pagamento Falhou*\n\n` +
        `🔢 ID: #${data?.transaction_id || "N/A"}\n` +
        `💵 Valor: R$ ${data?.amount?.toFixed(2) || "0.00"}\n` +
        `📝 Motivo: ${data?.reason || "Erro desconhecido"}\n` +
        `📅 Data: ${now}`

    case "custom":
      return `📢 *${title || "Notificacao"}*\n\n${message || ""}\n\n📅 ${now}`

    default:
      return `📢 *Notificacao*\n\n${message || "Nova notificacao recebida"}\n\n📅 ${now}`
  }
}

// POST - Enviar notificacao
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenant_id, notification } = body as { tenant_id: string; notification: NotificationData }

    if (!tenant_id || !notification) {
      return NextResponse.json({ error: "tenant_id e notification obrigatorios" }, { status: 400 })
    }

    // Buscar configuracao do tenant
    const tenantResult = await sql`
      SELECT telegram_config, system_config FROM white_label_tenants WHERE id = ${tenant_id}
    `

    if (tenantResult.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }

    const telegramConfig = tenantResult[0].telegram_config || {}
    const systemConfig = tenantResult[0].system_config || {}

    // Verificar se notificacoes via Telegram estao habilitadas
    if (!systemConfig.notify_via_telegram) {
      return NextResponse.json({ 
        success: false, 
        skipped: true,
        reason: "Notificacoes via Telegram desabilitadas" 
      })
    }

    // Verificar se o bot esta configurado
    if (!telegramConfig.bot_token || !telegramConfig.chat_id) {
      return NextResponse.json({ 
        success: false, 
        skipped: true,
        reason: "Bot do Telegram nao configurado" 
      })
    }

    // Verificar se este tipo de notificacao esta habilitado
    const notificationTypes: Record<string, string> = {
      new_user: "notify_new_user",
      new_transaction: "notify_new_transaction",
      withdraw_request: "notify_withdraw_request",
      withdraw_approved: "notify_withdraw_request",
      withdraw_rejected: "notify_withdraw_request",
      kyc_pending: "notify_kyc_pending",
      kyc_approved: "notify_kyc_pending",
      kyc_rejected: "notify_kyc_pending",
    }

    const configKey = notificationTypes[notification.type]
    if (configKey && systemConfig[configKey] === false) {
      return NextResponse.json({ 
        success: false, 
        skipped: true,
        reason: `Notificacao do tipo ${notification.type} desabilitada` 
      })
    }

    // Formatar e enviar mensagem
    const formattedMessage = formatMessage(notification)
    
    const sendResponse = await fetch(
      `https://api.telegram.org/bot${telegramConfig.bot_token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramConfig.chat_id,
          text: formattedMessage,
          parse_mode: "Markdown",
          disable_web_page_preview: true
        })
      }
    )

    const sendResult = await sendResponse.json()

    if (!sendResult.ok) {
      console.error("Erro ao enviar notificacao Telegram:", sendResult)
      return NextResponse.json({ 
        success: false, 
        error: sendResult.description 
      }, { status: 500 })
    }

    // Salvar log da notificacao
    try {
      await sql`
        INSERT INTO notification_logs (tenant_id, channel, type, message, status, created_at)
        VALUES (${tenant_id}, 'telegram', ${notification.type}, ${formattedMessage}, 'sent', NOW())
      `
    } catch {
      // Tabela pode nao existir, ignorar erro de log
    }

    return NextResponse.json({ 
      success: true, 
      message_id: sendResult.result.message_id 
    })
  } catch (error: any) {
    console.error("Erro ao enviar notificacao:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
