import { sql } from "@/lib/db";

// Constantes de links
const SITE_URL = "https://www.hyperionpay.com.br";
const DISCORD_LINK = "https://discord.gg/sGmMSYjdnA";
const WHATSAPP_LINK = "https://wa.me/5534999353187";

// Enviar mensagem para um chat/canal
async function sendToChannel(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("[Telegram] Erro ao enviar mensagem:", error);
    return false;
  }
}

// Buscar configuracoes do Telegram
async function getSettings() {
  const result = await sql`SELECT * FROM telegram_settings LIMIT 1`;
  return result[0] || null;
}

// Notificar deposito confirmado no canal de vendas
export async function notifyDeposit(userId: string, amount: number, fee: number) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.notify_deposits || !settings?.sales_channel_id) {
    return;
  }
  
  // Buscar dados do usuario (mascara o email)
  const userResult = await sql`SELECT email, name FROM profiles WHERE id = ${userId}`;
  const user = userResult[0];
  
  if (!user) return;
  
  const emailParts = user.email.split("@");
  const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
  
  const netAmount = amount - fee;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>DEPOSITO CONFIRMADO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Usuario:</b> ${maskedEmail}

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
📊 <b>Taxa:</b> R$ ${fee.toFixed(2)}
✅ <b>Creditado:</b> R$ ${netAmount.toFixed(2)}

🕐 <b>Data:</b> ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Hyperion Pay</b> - Pagamentos Rapidos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await sendToChannel(settings.sales_channel_id, message);
}

// Notificar saque processado no canal de vendas
export async function notifyWithdrawal(userId: string, amount: number, fee: number, status: string) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.notify_withdrawals || !settings?.sales_channel_id) {
    return;
  }
  
  // Buscar dados do usuario (mascara o email)
  const userResult = await sql`SELECT email, name FROM profiles WHERE id = ${userId}`;
  const user = userResult[0];
  
  if (!user) return;
  
  const emailParts = user.email.split("@");
  const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
  
  const netAmount = amount - fee;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  let statusText = "";
  let emoji = "";
  
  if (status === "completed") {
    statusText = "SAQUE APROVADO";
    emoji = "💸";
  } else if (status === "pending") {
    statusText = "SAQUE EM PROCESSAMENTO";
    emoji = "⏳";
  } else {
    statusText = "SAQUE RECUSADO";
    emoji = "❌";
  }
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${emoji} <b>${statusText}</b> ${emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Usuario:</b> ${maskedEmail}

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
📊 <b>Taxa:</b> R$ ${fee.toFixed(2)}
✅ <b>Liquido:</b> R$ ${netAmount.toFixed(2)}

🕐 <b>Data:</b> ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Hyperion Pay</b> - Pagamentos Rapidos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await sendToChannel(settings.sales_channel_id, message);
}

// Notificar usuario vinculado ao Telegram sobre transacao
export async function notifyUserTransaction(userId: string, type: "deposit" | "withdrawal", amount: number, status: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  
  // Verificar se usuario tem Telegram vinculado
  const telegramUser = await sql`
    SELECT telegram_id FROM telegram_users 
    WHERE user_id = ${userId} AND is_active = true
  `;
  
  if (telegramUser.length === 0) return;
  
  const telegramId = telegramUser[0].telegram_id;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  let message = "";
  
  if (type === "deposit") {
    if (status === "completed") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>DEPOSITO CONFIRMADO!</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Seu deposito foi creditado!

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
🕐 <b>Data:</b> ${now}

📱 Acesse seu painel:
${SITE_URL}/dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (status === "pending") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ <b>DEPOSITO PENDENTE</b> ⏳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Aguardando confirmacao do pagamento.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

Voce sera notificado assim que for confirmado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
  } else {
    if (status === "completed") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 <b>SAQUE ENVIADO!</b> 💸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ O PIX foi enviado para sua conta!

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
🕐 <b>Data:</b> ${now}

Confira sua conta bancaria.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (status === "pending") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ <b>SAQUE EM PROCESSAMENTO</b> ⏳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Seu saque esta sendo processado.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

Voce sera notificado quando for enviado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (status === "rejected") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ <b>SAQUE RECUSADO</b> ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Seu saque foi recusado.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

O valor foi devolvido ao seu saldo.

📞 <b>Suporte:</b>
💬 Discord: ${DISCORD_LINK}
📱 WhatsApp: (34) 99935-3187

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
  }
  
  if (message) {
    await sendToChannel(telegramId.toString(), message);
  }
}

// Enviar aviso para o canal de anuncios
export async function sendAnnouncement(message: string) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.announcements_channel_id) {
    return false;
  }
  
  return await sendToChannel(settings.announcements_channel_id, message);
}

// Notificar novo usuario vinculado
export async function notifyNewUserLinked(email: string, telegramUsername: string | null) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.sales_channel_id) {
    return;
  }
  
  const emailParts = email.split("@");
  const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 <b>NOVO USUARIO TELEGRAM</b> 🆕
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Email:</b> ${maskedEmail}
📱 <b>Telegram:</b> ${telegramUsername ? "@" + telegramUsername : "Privado"}

🕐 <b>Data:</b> ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await sendToChannel(settings.sales_channel_id, message);
}

// ========================================
// SISTEMA DE LEMBRETES E NOTIFICACOES
// ========================================

// Enviar mensagem direta para usuario do bot
export async function sendBotUserMessage(telegramId: number, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("[Telegram] Erro ao enviar mensagem para usuario:", error);
    return false;
  }
}

// Lembrete de PIX pendente (nao pago)
export async function sendPendingPixReminder(telegramId: number, amount: number, pixCode: string, minutesPending: number) {
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>LEMBRETE: PIX PENDENTE</b> ⏰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ola! Notamos que voce ainda nao pagou seu PIX.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
⏳ <b>Tempo:</b> ${minutesPending} minutos

📋 <b>Codigo Copia e Cola:</b>
<code>${pixCode}</code>

⚠️ O PIX expira em breve!
Pague agora para garantir seu deposito.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Dica: Copie o codigo acima e cole no app do seu banco.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return await sendBotUserMessage(telegramId, message);
}

// Lembrete de inatividade
export async function sendInactivityReminder(telegramId: number, username: string, daysSinceLastActivity: number) {
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👋 <b>SENTIMOS SUA FALTA!</b> 👋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ola${username ? ", " + username : ""}! 

Faz <b>${daysSinceLastActivity} dias</b> que voce nao usa o Hyperion Pay.

🎁 Que tal fazer um deposito hoje?

✅ Depositos instantaneos
✅ Saques rapidos
✅ Taxas baixas
✅ Suporte 24/7

📱 Use /depositar para comecar!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Hyperion Pay</b> - Sempre aqui para voce!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return await sendBotUserMessage(telegramId, message);
}

// Alerta de saldo baixo
export async function sendLowBalanceAlert(telegramId: number, currentBalance: number, threshold: number) {
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>SALDO BAIXO</b> ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Seu saldo esta abaixo de R$ ${threshold.toFixed(2)}!

💰 <b>Saldo atual:</b> R$ ${currentBalance.toFixed(2)}

Faca um deposito para continuar usando todos os recursos.

📱 Use /depositar para adicionar saldo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return await sendBotUserMessage(telegramId, message);
}

// Notificacao de promocao
export async function sendPromoNotification(telegramId: number, promoTitle: string, promoDescription: string, promoCode?: string) {
  const codeSection = promoCode ? `\n🎟️ <b>Codigo:</b> <code>${promoCode}</code>\n` : "";
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 <b>${promoTitle}</b> 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${promoDescription}
${codeSection}
📱 Aproveite agora mesmo!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Hyperion Pay</b> - Oportunidade limitada!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return await sendBotUserMessage(telegramId, message);
}

// Lembrete de PIX expirando (ultimo aviso)
export async function sendPixExpiringWarning(telegramId: number, amount: number, pixCode: string, minutesLeft: number) {
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 <b>ULTIMO AVISO: PIX EXPIRANDO!</b> 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Seu PIX vai expirar em <b>${minutesLeft} minutos</b>!

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

📋 <b>Codigo Copia e Cola:</b>
<code>${pixCode}</code>

Pague AGORA ou sera necessario gerar um novo!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return await sendBotUserMessage(telegramId, message);
}

// Buscar transacoes pendentes do bot para enviar lembretes
export async function getPendingBotTransactions(minutesOld: number) {
  const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000);
  
  const result = await sql`
    SELECT bt.*, bu.telegram_id, bu.username, bu.first_name
    FROM bot_transactions bt
    JOIN bot_users bu ON bt.bot_user_id = bu.id
    WHERE bt.status = 'pending' 
      AND bt.type = 'deposit'
      AND bt.created_at <= ${cutoffTime.toISOString()}
      AND bt.created_at >= ${new Date(Date.now() - 60 * 60 * 1000).toISOString()}
      AND (bt.reminder_sent IS NULL OR bt.reminder_sent = false)
  `;
  
  return result;
}

// Marcar transacao como lembrete enviado
export async function markReminderSent(transactionId: string) {
  await sql`
    UPDATE bot_transactions 
    SET reminder_sent = true, reminder_sent_at = NOW()
    WHERE id = ${transactionId}
  `;
}

// Buscar usuarios inativos do bot
export async function getInactiveBotUsers(daysInactive: number) {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
  
  const result = await sql`
    SELECT bu.*
    FROM bot_users bu
    WHERE bu.is_active = true
      AND bu.updated_at <= ${cutoffDate.toISOString()}
      AND (bu.last_reminder_at IS NULL OR bu.last_reminder_at <= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})
  `;
  
  return result;
}

// Marcar usuario como lembrete de inatividade enviado
export async function markInactivityReminderSent(botUserId: string) {
  await sql`
    UPDATE bot_users 
    SET last_reminder_at = NOW()
    WHERE id = ${botUserId}
  `;
}

// Buscar usuarios com saldo baixo
export async function getLowBalanceUsers(threshold: number) {
  const result = await sql`
    SELECT bu.*
    FROM bot_users bu
    WHERE bu.is_active = true
      AND bu.balance > 0
      AND bu.balance <= ${threshold}
      AND (bu.low_balance_alert_at IS NULL OR bu.low_balance_alert_at <= ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})
  `;
  
  return result;
}

// Marcar alerta de saldo baixo enviado
export async function markLowBalanceAlertSent(botUserId: string) {
  await sql`
    UPDATE bot_users 
    SET low_balance_alert_at = NOW()
    WHERE id = ${botUserId}
  `;
}
