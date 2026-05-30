import { sql } from "@/lib/db";
import { sendMessage, sendPhoto, editMessageText, answerCallbackQuery, checkChannelMembership, deleteMessage } from "./bot";
import { logTelegramAction } from "./logs";
import { notifyDeposit, notifyWithdrawal } from "./notify";
import { MedusaPayments } from "@/lib/acquirers/medusa";

// IDs dos canais obrigatorios
const REQUIRED_CHANNELS = [
  { id: "@hyperionpaybot", name: "Vendas", link: "https://t.me/hyperionpaybot" },
  { id: "@hyperionpayavisos", name: "Avisos", link: "https://t.me/hyperionpayavisos" },
];

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACOES
// ══════════════════════════════════════════════════════════════════════════════

const BOT_NAME = "Hyperion Pay";
const SITE_URL = "https://www.hyperionpay.com.br";
const DISCORD_LINK = "https://discord.gg/sGmMSYjdnA";
const WHATSAPP = "(34) 99935-3187";
const WHATSAPP_LINK = "https://wa.me/5534999353187";
const SALES_CHANNEL = "https://t.me/hyperionpaybot";
const SALES_CHANNEL_ID = "@hyperionpaybot";
const ANNOUNCEMENTS_CHANNEL = "https://t.me/hyperionpayavisos";

// Taxas do Bot Telegram
const TELEGRAM_PIX_FEE_PERCENT = 5;
const TELEGRAM_WITHDRAWAL_FEE_FIXED = 7;
const MIN_DEPOSIT = 10;
const MIN_WITHDRAWAL = 20;

// Estado temporario
const userStates: Map<number, { step: string; data?: Record<string, unknown> }> = new Map();

// ══════════════════════════════════════════════════════════════════════════════
// VERIFICACAO DE CANAIS OBRIGATORIOS
// ══════════════════════════════════════════════════════════════════════════════

async function checkRequiredChannels(userId: number): Promise<{ isOk: boolean; missing: typeof REQUIRED_CHANNELS }> {
  const missing: typeof REQUIRED_CHANNELS = [];
  
  for (const channel of REQUIRED_CHANNELS) {
    const isMember = await checkChannelMembership(channel.id, userId);
    if (!isMember) {
      missing.push(channel);
    }
  }
  
  return {
    isOk: missing.length === 0,
    missing,
  };
}

function msgEntrarCanais(missing: typeof REQUIRED_CHANNELS) {
  const canaisList = missing.map(c => `   - <a href="${c.link}">${c.name}</a>`).join("\n");
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️ <b>ENTRE NOS CANAIS</b> ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para usar o bot, voce precisa
entrar nos nossos canais:

${canaisList}

Apos entrar, clique em
<b>Verificar</b> abaixo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

const BOTOES_CANAIS = (missing: typeof REQUIRED_CHANNELS) => ({
  inline_keyboard: [
    ...missing.map(c => [{ text: `📢 Entrar: ${c.name}`, url: c.link }]),
    [{ text: "✅ Verificar", callback_data: "verificar_canais" }],
  ],
});

// ══════════════════════════════════════════════════════════════════════════════
// FUNCOES DE BANCO DE DADOS
// ══════════════════════════════════════════════════════════════════════════════

async function getOrCreateBotUser(telegramId: number, firstName: string, username?: string) {
  // Buscar usuario existente
  const existing = await sql`
    SELECT * FROM bot_users WHERE telegram_id = ${telegramId}
  `;
  
  if (existing.length > 0) {
    // Atualizar informacoes
    await sql`
      UPDATE bot_users 
      SET first_name = ${firstName}, 
          telegram_username = ${username || null},
          updated_at = NOW()
      WHERE telegram_id = ${telegramId}
    `;
    return existing[0];
  }
  
  // Criar novo usuario
  const newUser = await sql`
    INSERT INTO bot_users (telegram_id, telegram_username, first_name, balance)
    VALUES (${telegramId}, ${username || null}, ${firstName}, 0)
    RETURNING *
  `;
  
  // Notificar novo usuario no canal
  await sendMessageToChannel(SALES_CHANNEL_ID, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🆕 <b>NOVO USUARIO BOT</b> 🆕
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 Nome: ${firstName}
   📱 @${username || "sem username"}
   
   🕐 ${new Date().toLocaleString("pt-BR")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  
  return newUser[0];
}

async function getBotUser(telegramId: number) {
  const users = await sql`SELECT * FROM bot_users WHERE telegram_id = ${telegramId}`;
  return users[0] || null;
}

async function updateBotUserBalance(telegramId: number, amount: number, operation: "add" | "subtract") {
  if (operation === "add") {
    await sql`
      UPDATE bot_users 
      SET balance = balance + ${amount},
          total_deposited = total_deposited + ${amount},
          updated_at = NOW()
      WHERE telegram_id = ${telegramId}
    `;
  } else {
    await sql`
      UPDATE bot_users 
      SET balance = balance - ${amount},
          total_withdrawn = total_withdrawn + ${amount},
          updated_at = NOW()
      WHERE telegram_id = ${telegramId}
    `;
  }
}

async function saveBotUserPixKey(telegramId: number, pixKey: string) {
  await sql`
    UPDATE bot_users SET pix_key = ${pixKey}, updated_at = NOW()
    WHERE telegram_id = ${telegramId}
  `;
}

async function createBotTransaction(
  telegramId: number,
  botUserId: string,
  type: string,
  amount: number,
  fee: number,
  netAmount: number,
  status: string,
  pixCode?: string,
  pixKey?: string,
  externalId?: string
) {
  const result = await sql`
    INSERT INTO bot_transactions (
      bot_user_id, telegram_id, type, amount, fee, net_amount, status, 
      pix_code, pix_key, external_id
    ) VALUES (
      ${botUserId}, ${telegramId}, ${type}, ${amount}, ${fee}, ${netAmount},
      ${status}, ${pixCode || null}, ${pixKey || null}, ${externalId || null}
    )
    RETURNING *
  `;
  return result[0];
}

async function getBotTransactions(telegramId: number, limit: number = 10) {
  return await sql`
    SELECT * FROM bot_transactions 
    WHERE telegram_id = ${telegramId}
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `;
}

async function sendMessageToChannel(channelId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: channelId, text, parse_mode: "HTML" }),
    });
  } catch (error) {
    console.error("[Telegram] Erro ao enviar para canal:", error);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMATACAO
// ══════════════════════════════════════════════════════════════════════════════

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// TECLADOS
// ══════════════════════════════════════════════════════════════════════════════

const MENU_PRINCIPAL = {
  inline_keyboard: [
    [
      { text: "💰 Saldo", callback_data: "saldo" },
      { text: "📋 Historico", callback_data: "historico" },
    ],
    [
      { text: "📥 Depositar", callback_data: "depositar" },
      { text: "📤 Sacar", callback_data: "sacar" },
    ],
    [
      { text: "📊 Taxas", callback_data: "taxas" },
      { text: "❓ Ajuda", callback_data: "ajuda" },
    ],
    [
      { text: "📢 Canal Vendas", url: SALES_CHANNEL },
      { text: "📣 Canal Avisos", url: ANNOUNCEMENTS_CHANNEL },
    ],
    [
      { text: "💬 Discord", url: DISCORD_LINK },
      { text: "📱 WhatsApp", url: WHATSAPP_LINK },
    ],
  ],
};

const VOLTAR_MENU = {
  inline_keyboard: [[{ text: "🔙 Voltar ao Menu", callback_data: "menu" }]],
};

const CANCELAR = {
  inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "menu" }]],
};

function menuDeposito() {
  return {
    inline_keyboard: [
      [
        { text: "R$ 20", callback_data: "dep_20" },
        { text: "R$ 50", callback_data: "dep_50" },
        { text: "R$ 100", callback_data: "dep_100" },
      ],
      [
        { text: "R$ 200", callback_data: "dep_200" },
        { text: "R$ 500", callback_data: "dep_500" },
        { text: "R$ 1000", callback_data: "dep_1000" },
      ],
      [{ text: "💵 Outro Valor", callback_data: "dep_custom" }],
      [{ text: "🔙 Voltar", callback_data: "menu" }],
    ],
  };
}

function menuSaque(balance: number) {
  const buttons = [];
  
  if (balance >= 50) buttons.push({ text: "R$ 50", callback_data: "saq_50" });
  if (balance >= 100) buttons.push({ text: "R$ 100", callback_data: "saq_100" });
  if (balance >= 200) buttons.push({ text: "R$ 200", callback_data: "saq_200" });
  if (balance >= 500) buttons.push({ text: "R$ 500", callback_data: "saq_500" });
  
  const keyboard = [];
  
  // Dividir em linhas de 3
  for (let i = 0; i < buttons.length; i += 3) {
    keyboard.push(buttons.slice(i, i + 3));
  }
  
  if (balance >= MIN_WITHDRAWAL) {
    keyboard.push([{ text: "💵 Sacar Tudo (R$ " + formatCurrency(balance) + ")", callback_data: "saq_all" }]);
  }
  
  keyboard.push([{ text: "🔙 Voltar", callback_data: "menu" }]);
  
  return { inline_keyboard: keyboard };
}

// ══════════════════════════════════════════════════════════════════════════════
// MENSAGENS
// ══════════════════════════════════════════════════════════════════════════════

function msgBoasVindas(firstName: string, balance: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⚡ <b>${BOT_NAME}</b> ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Ola, <b>${firstName}</b>! 👋

   💰 Seu saldo: <b>R$ ${formatCurrency(balance)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📱 <b>MENU PRINCIPAL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Selecione uma opcao:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgSaldo(firstName: string, balance: number, totalDeposited: number, totalWithdrawn: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         💰 <b>SEU SALDO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 <b>${firstName}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Saldo Disponivel:
   <b>R$ ${formatCurrency(balance)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📊 <b>RESUMO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📥 Total Depositado: R$ ${formatCurrency(totalDeposited)}
   📤 Total Sacado: R$ ${formatCurrency(totalWithdrawn)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgDepositar(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📥 <b>DEPOSITAR</b> 📥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Escolha o valor do deposito:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📊 <b>TAXA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>${TELEGRAM_PIX_FEE_PERCENT}%</b>
   Minimo: R$ ${formatCurrency(MIN_DEPOSIT)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ PIX instantaneo
   ✅ Credito automatico

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgSacar(balance: number): string {
  if (balance < MIN_WITHDRAWAL) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📤 <b>SACAR</b> 📤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ❌ Saldo insuficiente para saque.

   💰 Seu saldo: R$ ${formatCurrency(balance)}
   📌 Minimo: R$ ${formatCurrency(MIN_WITHDRAWAL)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📥 Deposite mais para poder sacar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📤 <b>SACAR</b> 📤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 Saldo: <b>R$ ${formatCurrency(balance)}</b>

   Escolha o valor do saque:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📊 <b>TAXA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}</b> fixo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ Processamento rapido
   ✅ PIX instantaneo

━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━
`;
}

function msgTaxas(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📊 <b>TAXAS</b> 📊
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         💰 <b>DEPOSITO PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>${TELEGRAM_PIX_FEE_PERCENT}%</b>
   Minimo: R$ ${formatCurrency(MIN_DEPOSIT)}

   R$ 100 → Recebe R$ ${formatCurrency(100 - (100 * TELEGRAM_PIX_FEE_PERCENT / 100))}
   R$ 500 → Recebe R$ ${formatCurrency(500 - (500 * TELEGRAM_PIX_FEE_PERCENT / 100))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         💸 <b>SAQUE PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}</b> fixo
   Minimo: R$ ${formatCurrency(MIN_WITHDRAWAL)}

   R$ 100 → Recebe R$ ${formatCurrency(100 - TELEGRAM_WITHDRAWAL_FEE_FIXED)}
   R$ 500 → Recebe R$ ${formatCurrency(500 - TELEGRAM_WITHDRAWAL_FEE_FIXED)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgAjuda(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ❓ <b>AJUDA</b> ❓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         🤖 <b>COMANDOS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   /start - Menu principal
   /saldo - Ver seu saldo
   /historico - Ver transacoes
   /depositar - Fazer deposito
   /sacar - Fazer saque
   /taxas - Ver taxas
   /ajuda - Esta mensagem

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📞 <b>SUPORTE 24H</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━�����

   ����� Discord: ${DISCORD_LINK}
   📱 WhatsApp: ${WHATSAPP}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgHistorico(transactions: Record<string, unknown>[]): string {
  let msg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📋 <b>HISTORICO</b> 📋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Ultimas 10 transacoes:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (transactions.length === 0) {
    msg += `
   Nenhuma transacao encontrada.
   
   📥 Faca seu primeiro deposito!
`;
  } else {
    for (const tx of transactions) {
      const icon = tx.type === "deposit" ? "📥" : "📤";
      const statusIcon = tx.status === "completed" ? "✅" : tx.status === "pending" ? "⏳" : "❌";
      const typeText = tx.type === "deposit" ? "Deposito" : "Saque";
      
      msg += `
   ${icon} ${typeText} ${statusIcon}
   💵 R$ ${formatCurrency(Number(tx.amount))}
   🕐 ${formatDate(tx.created_at as string)}
`;
    }
  }

  msg += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return msg;
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export async function handleMessage(
  chatId: number,
  telegramId: number,
  text: string,
  firstName: string,
  username?: string
) {
  // Verificar se usuario esta nos canais obrigatorios
  const { isOk, missing } = await checkRequiredChannels(telegramId);
  
  if (!isOk) {
    await sendMessage(chatId, msgEntrarCanais(missing), { reply_markup: BOTOES_CANAIS(missing) });
    return;
  }
  
  // Criar/buscar usuario do bot
  const user = await getOrCreateBotUser(telegramId, firstName, username);
  const balance = Number(user.balance);
  
  const trimmedText = text.trim();
  const command = trimmedText.toLowerCase();
  
  // Verificar estado pendente
  const state = userStates.get(telegramId);
  
  if (state) {
    await handleStateInput(chatId, telegramId, trimmedText, state, user);
    return;
  }
  
  // Processar comandos
  switch (command) {
    case "/start":
    case "/menu":
      userStates.delete(telegramId);
      await sendMessage(chatId, msgBoasVindas(firstName, balance), { reply_markup: MENU_PRINCIPAL });
      break;
      
    case "/saldo":
      await sendMessage(chatId, msgSaldo(firstName, balance, Number(user.total_deposited), Number(user.total_withdrawn)), { reply_markup: VOLTAR_MENU });
      break;
      
    case "/historico":
    case "/extrato":
      const transactions = await getBotTransactions(telegramId);
      await sendMessage(chatId, msgHistorico(transactions), { reply_markup: VOLTAR_MENU });
      break;
      
    case "/depositar":
    case "/deposito":
      await sendMessage(chatId, msgDepositar(), { reply_markup: menuDeposito() });
      break;
      
    case "/sacar":
    case "/saque":
      await sendMessage(chatId, msgSacar(balance), { reply_markup: balance >= MIN_WITHDRAWAL ? menuSaque(balance) : VOLTAR_MENU });
      break;
      
    case "/taxas":
      await sendMessage(chatId, msgTaxas(), { reply_markup: VOLTAR_MENU });
      break;
      
    case "/ajuda":
    case "/help":
      await sendMessage(chatId, msgAjuda(), { reply_markup: VOLTAR_MENU });
      break;
      
    default:
      await sendMessage(chatId, msgBoasVindas(firstName, balance), { reply_markup: MENU_PRINCIPAL });
      break;
  }
  
  await logTelegramAction(telegramId, null, "COMMAND", command, { firstName, username });
}

async function handleStateInput(
  chatId: number,
  telegramId: number,
  text: string,
  state: { step: string; data?: Record<string, unknown> },
  user: Record<string, unknown>
) {
  switch (state.step) {
    case "awaiting_deposit_amount":
      await handleDepositAmountInput(chatId, telegramId, text, user);
      break;
      
    case "awaiting_pix_key":
      await handlePixKeyInput(chatId, telegramId, text, state, user);
      break;
      
    default:
      userStates.delete(telegramId);
      await sendMessage(chatId, msgBoasVindas(user.first_name as string, Number(user.balance)), { reply_markup: MENU_PRINCIPAL });
      break;
  }
}

async function handleDepositAmountInput(chatId: number, telegramId: number, text: string, user: Record<string, unknown>) {
  const amount = parseFloat(text.replace(/[^\d.,]/g, "").replace(",", "."));
  
  if (isNaN(amount) || amount < MIN_DEPOSIT) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>VALOR INVALIDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Valor minimo: R$ ${formatCurrency(MIN_DEPOSIT)}
   
   Digite um valor valido:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: CANCELAR });
    return;
  }
  
  userStates.delete(telegramId);
  await processDeposit(chatId, telegramId, amount, user);
}

async function handlePixKeyInput(
  chatId: number,
  telegramId: number,
  pixKey: string,
  state: { step: string; data?: Record<string, unknown> },
  user: Record<string, unknown>
) {
  if (!pixKey || pixKey.length < 5) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>CHAVE INVALIDA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Digite uma chave PIX valida:
   (CPF, Email, Telefone ou Aleatoria)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: CANCELAR });
    return;
  }
  
  const amount = state.data?.amount as number;
  userStates.delete(telegramId);
  
  await processWithdrawal(chatId, telegramId, amount, pixKey.trim(), user);
}

async function processDeposit(chatId: number, telegramId: number, amount: number, user: Record<string, unknown>) {
  const fee = amount * (TELEGRAM_PIX_FEE_PERCENT / 100);
  const netAmount = amount - fee;
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⏳ <b>GERANDO PIX...</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Aguarde...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  
  try {
    // Buscar Medusa Black especificamente
    const acquirer = await sql`
      SELECT * FROM acquirers 
      WHERE name ILIKE '%medusa%black%' AND is_active = true
      LIMIT 1
    `;
    
    if (!acquirer[0]) {
      // Fallback para qualquer Medusa ativa
      const fallback = await sql`
        SELECT * FROM acquirers 
        WHERE name ILIKE '%medusa%' AND is_active = true
        LIMIT 1
      `;
      if (!fallback[0]) {
        throw new Error("Gateway indisponivel");
      }
      acquirer[0] = fallback[0];
    }
    
    const medusa = new MedusaPayments({
      secretKey: acquirer[0].api_key,
      licenseKey: acquirer[0].api_secret,
    });
    
    // CPF fixo para o bot do Telegram
    const CPF_FIXO_BOT = "63909654002";
    
    // Criar PIX com CPF fixo
    const pixResponse = await medusa.createSimplePixPayment(
      amount * 100,
      user.first_name as string || "Cliente",
      CPF_FIXO_BOT,
      `bot_${telegramId}@hyperionpay.com.br`,
      `Deposito Bot - ${telegramId}`,
      `${SITE_URL}/api/webhooks/telegram-pix`
    );
    
    const qrCode = pixResponse.pix?.qrcode || pixResponse.transaction?.pix?.qrcode;
    const txId = pixResponse.insertId || pixResponse.id || pixResponse.transaction?.id;
    
    if (!qrCode) {
      throw new Error("QR Code nao gerado");
    }
    
    // Salvar transacao
    await createBotTransaction(
      telegramId,
      user.id as string,
      "deposit",
      amount,
      fee,
      netAmount,
      "pending",
      qrCode,
      undefined,
      String(txId)
    );
    
    // Salvar codigo para callback de copiar
    userStates.set(telegramId, { step: "pix_generated", data: { pixCode: qrCode } });
    
    // Gerar URL do QR Code via API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
    
    // Enviar QR Code como imagem
    await sendPhoto(
      chatId,
      qrImageUrl,
      `📥 <b>PIX GERADO!</b>

💵 Valor: <b>R$ ${formatCurrency(amount)}</b>
📊 Taxa (${TELEGRAM_PIX_FEE_PERCENT}%): R$ ${formatCurrency(fee)}
✅ Voce recebe: <b>R$ ${formatCurrency(netAmount)}</b>

⏰ Valido por 30 minutos
✅ Credito automatico`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📋 Copiar Codigo PIX", callback_data: "copy_pix" }],
            [{ text: "🔙 Voltar ao Menu", callback_data: "menu" }]
          ]
        }
      }
    );
    
    await logTelegramAction(telegramId, null, "DEPOSIT_GENERATED", "depositar", { amount, txId });
    
  } catch (error) {
    console.error("[Bot] Erro deposito:", error);
    
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>GATEWAY INDISPONIVEL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   O gateway de pagamento esta
   temporariamente indisponivel.

   Por favor, tente novamente em
   alguns minutos ou entre em
   contato com o suporte.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📞 <b>SUPORTE 24H</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💬 Discord: ${DISCORD_LINK}
   📱 WhatsApp: ${WHATSAPP}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
  }
}

async function processWithdrawal(chatId: number, telegramId: number, amount: number, pixKey: string, user: Record<string, unknown>) {
  const balance = Number(user.balance);
  const fee = TELEGRAM_WITHDRAWAL_FEE_FIXED;
  const netAmount = amount - fee;
  
  if (amount > balance) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>SALDO INSUFICIENTE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 Seu saldo: R$ ${formatCurrency(balance)}
   💵 Solicitado: R$ ${formatCurrency(amount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⏳ <b>PROCESSANDO...</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Aguarde enquanto processamos
   seu saque...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  
  try {
    // Buscar Medusa Black
    const acquirer = await sql`
      SELECT * FROM acquirers 
      WHERE name ILIKE '%medusa%black%' AND is_active = true
      LIMIT 1
    `;
    
    if (!acquirer[0]) {
      const fallback = await sql`
        SELECT * FROM acquirers 
        WHERE name ILIKE '%medusa%' AND is_active = true
        LIMIT 1
      `;
      if (!fallback[0]) {
        throw new Error("Gateway indisponivel");
      }
      acquirer[0] = fallback[0];
    }
    
    // Debitar saldo primeiro
    await updateBotUserBalance(telegramId, amount, "subtract");
    
    // Salvar chave PIX
    await saveBotUserPixKey(telegramId, pixKey);
    
    // CPF fixo para saques do bot
    const CPF_FIXO_BOT = "63909654002";
    
    // Solicitar saque via Medusa
    const medusa = new MedusaPayments({
      secretKey: acquirer[0].api_key,
      licenseKey: acquirer[0].api_secret,
    });
    
    const withdrawalResponse = await medusa.requestSimpleWithdrawal(
      netAmount * 100, // Em centavos
      pixKey,
      user.first_name as string || "Cliente",
      CPF_FIXO_BOT,
      `${SITE_URL}/api/webhooks/telegram-pix`
    );
    
    // Criar transacao
    await createBotTransaction(
      telegramId,
      user.id as string,
      "withdrawal",
      amount,
      fee,
      netAmount,
      "completed",
      undefined,
      pixKey,
      withdrawalResponse.id
    );
    
    // Notificar no canal
    await sendMessageToChannel(SALES_CHANNEL_ID, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      💸 <b>SAQUE APROVADO</b> 💸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 ${user.first_name}
   
   💵 Valor: R$ ${formatCurrency(amount)}
   📊 Taxa: R$ ${formatCurrency(fee)}
   ✅ Enviado: R$ ${formatCurrency(netAmount)}
   
   📱 PIX: ${pixKey.substring(0, 10)}***
   🕐 ${new Date().toLocaleString("pt-BR")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    
    await sendMessage(chatId, `
━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━
      ✅ <b>SAQUE APROVADO!</b> ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Valor: <b>R$ ${formatCurrency(amount)}</b>
   📊 Taxa: R$ ${formatCurrency(fee)}
   ✅ Enviado: <b>R$ ${formatCurrency(netAmount)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📱 PIX: ${pixKey.substring(0, 15)}...
   
   ⚡ O valor sera creditado em instantes!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    
    await logTelegramAction(telegramId, null, "WITHDRAWAL_COMPLETED", "sacar", { amount, netAmount });
    
  } catch (error) {
    console.error("[Bot] Erro saque:", error);
    
    // Estornar
    await updateBotUserBalance(telegramId, amount, "add");
    
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>ERRO NO SAQUE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Erro ao processar saque.
   Seu saldo foi estornado.

   Por favor, tente novamente
   em alguns instantes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📞 <b>SUPORTE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💬 ${DISCORD_LINK}
   📱 ${WHATSAPP}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALLBACK HANDLER
// ══════════════════════════════════════════════════════════════════════════════

export async function handleCallback(
  callbackId: string,
  chatId: number,
  messageId: number,
  telegramId: number,
  data: string,
  firstName?: string
) {
  await answerCallbackQuery(callbackId);
  
  const user = await getOrCreateBotUser(telegramId, firstName || "Usuario");
  const balance = Number(user.balance);
  
  // Limpar estado se voltar ao menu
  if (data === "menu") {
    userStates.delete(telegramId);
  }
  
  // Deposito
  if (data.startsWith("dep_")) {
    if (data === "dep_custom") {
      userStates.set(telegramId, { step: "awaiting_deposit_amount" });
      await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       💵 <b>VALOR PERSONALIZADO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Digite o valor do deposito:
   (minimo R$ ${formatCurrency(MIN_DEPOSIT)})

━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━
`, { reply_markup: CANCELAR });
      return;
    }
    
    const amount = parseInt(data.replace("dep_", ""));
    await processDeposit(chatId, telegramId, amount, user);
    return;
  }
  
  // Saque
  if (data.startsWith("saq_")) {
    let amount = 0;
    
    if (data === "saq_all") {
      amount = balance;
    } else {
      amount = parseInt(data.replace("saq_", ""));
    }
    
    if (amount > balance) {
      await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>SALDO INSUFICIENTE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 Seu saldo: R$ ${formatCurrency(balance)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
      return;
    }
    
    const fee = TELEGRAM_WITHDRAWAL_FEE_FIXED;
    const netAmount = amount - fee;
    
    userStates.set(telegramId, { step: "awaiting_pix_key", data: { amount } });
    
    await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📤 <b>SAQUE</b> 📤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Valor: <b>R$ ${formatCurrency(amount)}</b>
   📊 Taxa: R$ ${formatCurrency(fee)}
   ✅ Voce recebe: <b>R$ ${formatCurrency(netAmount)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📱 <b>DIGITE SUA CHAVE PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   CPF, Email, Telefone ou Aleatoria

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: CANCELAR });
    return;
  }
  
  // Verificar canais obrigatorios
  if (data === "verificar_canais") {
    const { isOk, missing } = await checkRequiredChannels(telegramId);
    
    if (isOk) {
      // Usuario entrou nos canais, mostrar menu
      try {
        await deleteMessage(chatId, messageId);
      } catch {}
      await sendMessage(chatId, msgBoasVindas(firstName || "Usuario", balance), { reply_markup: MENU_PRINCIPAL });
    } else {
      // Ainda faltam canais
      await editMessageText(chatId, messageId, msgEntrarCanais(missing), { reply_markup: BOTOES_CANAIS(missing) });
    }
    return;
  }
  
  // Copiar codigo PIX
  if (data === "copy_pix") {
    const state = userStates.get(telegramId);
    if (state?.data?.pixCode) {
      await sendMessage(chatId, `<code>${state.data.pixCode}</code>

Toque na mensagem acima para copiar o codigo PIX.`, { reply_markup: VOLTAR_MENU });
    } else {
      await sendMessage(chatId, "Codigo PIX expirado. Gere um novo deposito.", { reply_markup: VOLTAR_MENU });
    }
    return;
  }
  
  // Menu - envia nova mensagem (para funcionar em fotos)
  if (data === "menu") {
    userStates.delete(telegramId);
    try {
      await deleteMessage(chatId, messageId);
    } catch {}
    await sendMessage(chatId, msgBoasVindas(firstName || "Usuario", balance), { reply_markup: MENU_PRINCIPAL });
    return;
  }
  
  // Outros callbacks
  switch (data) {
      
    case "saldo":
      await editMessageText(chatId, messageId, msgSaldo(firstName || "Usuario", balance, Number(user.total_deposited), Number(user.total_withdrawn)), { reply_markup: VOLTAR_MENU });
      break;
      
    case "historico":
      const transactions = await getBotTransactions(telegramId);
      await editMessageText(chatId, messageId, msgHistorico(transactions), { reply_markup: VOLTAR_MENU });
      break;
      
    case "depositar":
      await editMessageText(chatId, messageId, msgDepositar(), { reply_markup: menuDeposito() });
      break;
      
    case "sacar":
      await editMessageText(chatId, messageId, msgSacar(balance), { reply_markup: balance >= MIN_WITHDRAWAL ? menuSaque(balance) : VOLTAR_MENU });
      break;
      
    case "taxas":
      await editMessageText(chatId, messageId, msgTaxas(), { reply_markup: VOLTAR_MENU });
      break;
      
    case "ajuda":
      await editMessageText(chatId, messageId, msgAjuda(), { reply_markup: VOLTAR_MENU });
      break;
      
    default:
      await editMessageText(chatId, messageId, msgBoasVindas(firstName || "Usuario", balance), { reply_markup: MENU_PRINCIPAL });
      break;
  }
  
  await logTelegramAction(telegramId, null, "CALLBACK", data, { firstName });
}
