// Sistema de Logs para Discord - Hyperion Pay
// Envia logs em tempo real para webhooks do Discord com embeds personalizadas

// Importa waitUntil dinamicamente para evitar erro quando nao disponivel
let waitUntilFn: ((promise: Promise<unknown>) => void) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vercelFunctions = require("@vercel/functions");
  waitUntilFn = vercelFunctions.waitUntil;
} catch {
  // @vercel/functions nao disponivel (ambiente local)
}

const DISCORD_WEBHOOKS = {
  sistema: "https://discord.com/api/webhooks/1499837126609731725/rd7ex3iTcCjGnunDuap0KL-NfnEKhX8FIvywgHwbBa8mR_oXAQZSwad26S-CusN1t16q",
  transacoes: "https://discord.com/api/webhooks/1499837272516722770/NapVqX-BUAD0nhELgeowLVwbN_01r-7iE720EjFQJrk8q6CasynT1TEGPfI_m2Aqphf6",
  saques: "https://discord.com/api/webhooks/1499837361440161886/qD-d03QN8WqTglC0SmUFB0BAJCakSoaQGDVyvydLnYl9Vp9yAAjwrCjkLWPtCX3Kd-ZI",
  geral: "https://discord.com/api/webhooks/1499837482303492320/llq0EYn-DH_qI8QaXiKSyvvrPNqiZX3z9oB2SqoYjAQMgDhMd2Rvw1Wrz7r7zyLUXhK_",
  cadastros: "https://discord.com/api/webhooks/1499837621147406498/NEwuwrhItxr6qRU-fB1speAwDbm2IYosFGhqevTrDbzv-8h74zssSdrMngX94KucoDkk",
  suporte: "https://discord.com/api/webhooks/1501311387664912596/rnzOo0UspOYuwOAwhEh0HJsBtZneYwYQGsidN8kUxD-a1-KjyLLiRslB_4C2YAOoPq1t",
};

// Cores para os embeds
const COLORS = {
  success: 0x22c55e,    // Verde
  error: 0xef4444,      // Vermelho
  warning: 0xf59e0b,    // Amarelo
  info: 0x3b82f6,       // Azul
  primary: 0x4f46e5,    // Indigo (cor da Hyperion Pay)
  purple: 0x8b5cf6,     // Roxo
  pink: 0xec4899,       // Rosa
};

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

// Funcao base para enviar webhook (usa waitUntil para garantir execucao em serverless)
function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): void {
  const sendRequest = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Hyperion Pay Logs",
          avatar_url: "https://hyperionpay.com.br/mascote.png",
          ...payload,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Discord Webhook] Erro HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("[Discord Webhook] Erro ao enviar:", error);
    }
  };
  
  // Usa waitUntil para garantir que a funcao execute mesmo apos a resposta ser enviada
  if (waitUntilFn) {
    waitUntilFn(sendRequest());
  } else {
    // Fallback para ambiente local ou quando waitUntil nao esta disponivel
    sendRequest().catch(console.error);
  }
}

// Formatar valor em BRL
function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Formatar data/hora
function formatDateTime(): string {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Mascara para documento
function maskDocument(doc: string): string {
  if (!doc) return "N/A";
  if (doc.length === 11) {
    return `${doc.slice(0, 3)}.***.***-${doc.slice(-2)}`;
  }
  return `${doc.slice(0, 2)}.***.***/${doc.slice(-4)}`;
}

// Mascara para email
function maskEmail(email: string): string {
  if (!email) return "N/A";
  const [user, domain] = email.split("@");
  if (user.length <= 3) return email;
  return `${user.slice(0, 3)}***@${domain}`;
}

// ==================== LOGS DE TRANSACOES ====================

export function logNewTransaction(data: {
  transactionId: string;
  userName: string;
  userEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  payerName?: string;
  payerDocument?: string;
  description?: string;
  route: string;
  status: string;
}): void {
  const embed: DiscordEmbed = {
    title: "Nova Transacao PIX Criada",
    color: COLORS.warning,
    fields: [
      { name: "ID da Transacao", value: `\`${data.transactionId}\``, inline: false },
      { name: "Usuario", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "Rota", value: data.route.toUpperCase(), inline: true },
      { name: "Valor Bruto", value: formatBRL(data.amount), inline: true },
      { name: "Taxa", value: formatBRL(data.fee), inline: true },
      { name: "Valor Liquido", value: formatBRL(data.netAmount), inline: true },
      { name: "Pagador", value: data.payerName || "N/A", inline: true },
      { name: "CPF/CNPJ", value: maskDocument(data.payerDocument || ""), inline: true },
      { name: "Status", value: "`AGUARDANDO PAGAMENTO`", inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/6404/6404655.png" },
    author: { name: "Sistema de Transacoes", icon_url: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png" },
  };

  if (data.description) {
    embed.fields?.push({ name: "Descricao", value: data.description, inline: false });
  }

  // Enviar para webhook de transacoes e geral (fire-and-forget com waitUntil)
  sendDiscordWebhook(DISCORD_WEBHOOKS.transacoes, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

export function logTransactionStatusUpdate(data: {
  transactionId: string;
  userName: string;
  userEmail: string;
  amount: number;
  oldStatus: string;
  newStatus: string;
  payerName?: string;
}): void {
  const isCompleted = data.newStatus === "completed";
  const isFailed = data.newStatus === "failed" || data.newStatus === "expired";

  const embed: DiscordEmbed = {
    title: isCompleted ? "PIX Pago - Saldo Creditado" : isFailed ? "Transacao Falhou" : "Status Atualizado",
    color: isCompleted ? COLORS.success : isFailed ? COLORS.error : COLORS.warning,
    fields: [
      { name: "ID da Transacao", value: `\`${data.transactionId}\``, inline: false },
      { name: "Usuario", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "Valor", value: formatBRL(data.amount), inline: true },
      { name: "Status Anterior", value: `\`${data.oldStatus.toUpperCase()}\``, inline: true },
      { name: "Novo Status", value: `\`${data.newStatus.toUpperCase()}\``, inline: true },
      { name: "Pagador", value: data.payerName || "N/A", inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Atualizacao de Transacao", icon_url: "https://cdn-icons-png.flaticon.com/512/1827/1827933.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.transacoes, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

// ==================== LOGS DE SAQUES ====================

export function logWithdrawalRequest(data: {
  withdrawalId: string;
  userName: string;
  userEmail: string;
  userDocument?: string;
  amount: number;
  fee: number;
  netAmount: number;
  pixKey: string;
  pixKeyType: string;
}): void {
  const embed: DiscordEmbed = {
    title: "Nova Solicitacao de Saque",
    color: COLORS.warning,
    fields: [
      { name: "ID do Saque", value: `\`${data.withdrawalId}\``, inline: false },
      { name: "Usuario", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "CPF/CNPJ", value: maskDocument(data.userDocument || ""), inline: true },
      { name: "Valor Bruto", value: formatBRL(data.amount), inline: true },
      { name: "Taxa", value: formatBRL(data.fee), inline: true },
      { name: "Valor Liquido", value: formatBRL(data.netAmount), inline: true },
      { name: "Tipo Chave PIX", value: data.pixKeyType.toUpperCase(), inline: true },
      { name: "Chave PIX", value: `\`${data.pixKey}\``, inline: true },
      { name: "Status", value: "`PENDENTE`", inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png" },
    author: { name: "Sistema de Saques", icon_url: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.saques, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

export function logWithdrawalStatusUpdate(data: {
  withdrawalId: string;
  userName: string;
  userEmail: string;
  amount: number;
  netAmount: number;
  oldStatus: string;
  newStatus: string;
  pixKey: string;
  adminName?: string;
}): void {
  const isCompleted = data.newStatus === "completed";
  const isRejected = data.newStatus === "rejected" || data.newStatus === "failed";

  const embed: DiscordEmbed = {
    title: isCompleted ? "Saque Concluido" : isRejected ? "Saque Rejeitado" : "Saque em Processamento",
    color: isCompleted ? COLORS.success : isRejected ? COLORS.error : COLORS.info,
    fields: [
      { name: "ID do Saque", value: `\`${data.withdrawalId}\``, inline: false },
      { name: "Usuario", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "Valor Liquido", value: formatBRL(data.netAmount), inline: true },
      { name: "Status Anterior", value: `\`${data.oldStatus.toUpperCase()}\``, inline: true },
      { name: "Novo Status", value: `\`${data.newStatus.toUpperCase()}\``, inline: true },
      { name: "Chave PIX", value: `\`${data.pixKey}\``, inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Atualizacao de Saque", icon_url: "https://cdn-icons-png.flaticon.com/512/1827/1827933.png" },
  };

  if (data.adminName) {
    embed.fields?.push({ name: "Aprovado por", value: data.adminName, inline: true });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.saques, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

// ==================== LOGS DE CADASTROS E KYC ====================

export function logNewUser(data: {
  userId: string;
  name: string;
  email: string;
  document?: string;
  phone?: string;
  referralCode?: string;
  referredBy?: string;
}): void {
  const embed: DiscordEmbed = {
    title: "Novo Usuario Cadastrado",
    color: COLORS.primary,
    fields: [
      { name: "ID do Usuario", value: `\`${data.userId}\``, inline: false },
      { name: "Nome", value: data.name || "N/A", inline: true },
      { name: "Email", value: data.email, inline: true },
      { name: "CPF/CNPJ", value: maskDocument(data.document || ""), inline: true },
      { name: "Telefone", value: data.phone || "N/A", inline: true },
      { name: "Codigo Indicacao", value: data.referralCode || "N/A", inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    author: { name: "Sistema de Cadastro", icon_url: "https://cdn-icons-png.flaticon.com/512/681/681392.png" },
  };

  if (data.referredBy) {
    embed.fields?.push({ name: "Indicado por", value: data.referredBy, inline: true });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.cadastros, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

export function logKYCSubmission(data: {
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  documentsCount: number;
}): void {
  const embed: DiscordEmbed = {
    title: "Nova Solicitacao de KYC",
    color: COLORS.info,
    fields: [
      { name: "ID do Usuario", value: `\`${data.userId}\``, inline: false },
      { name: "Nome", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "Tipo de Documento", value: data.documentType || "N/A", inline: true },
      { name: "Documentos Enviados", value: `${data.documentsCount} arquivo(s)`, inline: true },
      { name: "Status", value: "`PENDENTE`", inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/4436/4436481.png" },
    author: { name: "Sistema de KYC", icon_url: "https://cdn-icons-png.flaticon.com/512/6195/6195699.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.cadastros, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

export function logKYCStatusUpdate(data: {
  userId: string;
  userName: string;
  userEmail: string;
  oldStatus: string;
  newStatus: string;
  adminName?: string;
  reason?: string;
}): void {
  const isApproved = data.newStatus === "approved";
  const isRejected = data.newStatus === "rejected";

  const embed: DiscordEmbed = {
    title: isApproved ? "KYC Aprovado" : isRejected ? "KYC Rejeitado" : "KYC em Analise",
    color: isApproved ? COLORS.success : isRejected ? COLORS.error : COLORS.warning,
    fields: [
      { name: "ID do Usuario", value: `\`${data.userId}\``, inline: false },
      { name: "Nome", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "Status Anterior", value: `\`${data.oldStatus.toUpperCase()}\``, inline: true },
      { name: "Novo Status", value: `\`${data.newStatus.toUpperCase()}\``, inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Atualizacao de KYC", icon_url: "https://cdn-icons-png.flaticon.com/512/1827/1827933.png" },
  };

  if (data.adminName) {
    embed.fields?.push({ name: "Analisado por", value: data.adminName, inline: true });
  }
  if (data.reason) {
    embed.fields?.push({ name: "Motivo", value: data.reason, inline: false });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.cadastros, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

// ==================== LOGS DE SISTEMA ====================

export function logSystemEvent(data: {
  title: string;
  description: string;
  type: "info" | "warning" | "error" | "success";
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): void {
  const colorMap = {
    info: COLORS.info,
    warning: COLORS.warning,
    error: COLORS.error,
    success: COLORS.success,
  };

  const iconMap = {
    info: "https://cdn-icons-png.flaticon.com/512/1827/1827370.png",
    warning: "https://cdn-icons-png.flaticon.com/512/564/564619.png",
    error: "https://cdn-icons-png.flaticon.com/512/753/753345.png",
    success: "https://cdn-icons-png.flaticon.com/512/845/845646.png",
  };

  const embed: DiscordEmbed = {
    title: data.title,
    description: data.description,
    color: colorMap[data.type],
    fields: data.fields || [],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Sistema Hyperion Pay", icon_url: iconMap[data.type] },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.sistema, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

export function logAdminAction(data: {
  adminName: string;
  adminEmail: string;
  action: string;
  target?: string;
  details?: string;
}): void {
  const embed: DiscordEmbed = {
    title: "Acao Administrativa",
    color: COLORS.purple,
    fields: [
      { name: "Admin", value: data.adminName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.adminEmail), inline: true },
      { name: "Acao", value: data.action, inline: false },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
    author: { name: "Painel Admin", icon_url: "https://cdn-icons-png.flaticon.com/512/2099/2099058.png" },
  };

  if (data.target) {
    embed.fields?.push({ name: "Alvo", value: data.target, inline: true });
  }
  if (data.details) {
    embed.fields?.push({ name: "Detalhes", value: data.details, inline: false });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.sistema, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

export function logLogin(data: {
  userId: string;
  userName: string;
  userEmail: string;
  ip?: string;
  userAgent?: string;
  isAdmin?: boolean;
  isNewDevice?: boolean;
  }): void {
  const embed: DiscordEmbed = {
    title: data.isAdmin ? "Login Admin" : "Login de Usuario",
    color: data.isAdmin ? COLORS.purple : COLORS.info,
    fields: [
      { name: "ID", value: `\`${data.userId}\``, inline: false },
      { name: "Nome", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "IP", value: data.ip || "N/A", inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Sistema de Login", icon_url: "https://cdn-icons-png.flaticon.com/512/2889/2889676.png" },
  };

  if (data.userAgent) {
    const ua = data.userAgent.length > 50 ? data.userAgent.slice(0, 50) + "..." : data.userAgent;
    embed.fields?.push({ name: "Dispositivo", value: ua, inline: false });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.sistema, { embeds: [embed] });
}

export function logAPIUsage(data: {
  userId: string;
  userName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  amount?: number;
}): void {
  const isSuccess = data.statusCode >= 200 && data.statusCode < 300;

  const embed: DiscordEmbed = {
    title: "Uso da API",
    color: isSuccess ? COLORS.success : COLORS.error,
    fields: [
      { name: "Usuario", value: data.userName || "N/A", inline: true },
      { name: "Endpoint", value: `\`${data.method} ${data.endpoint}\``, inline: false },
      { name: "Status", value: `\`${data.statusCode}\``, inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "API Gateway", icon_url: "https://cdn-icons-png.flaticon.com/512/4248/4248443.png" },
  };

  if (data.amount) {
    embed.fields?.push({ name: "Valor", value: formatBRL(data.amount), inline: true });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.sistema, { embeds: [embed] });
}

// ==================== LOGS DE AFILIADOS ====================

export function logAffiliateCommission(data: {
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  referredUserName: string;
  transactionAmount: number;
  commissionAmount: number;
  commissionRate: number;
}): void {
  const embed: DiscordEmbed = {
    title: "Comissao de Afiliado",
    color: COLORS.pink,
    fields: [
      { name: "Afiliado", value: data.affiliateName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.affiliateEmail), inline: true },
      { name: "Usuario Indicado", value: data.referredUserName || "N/A", inline: true },
      { name: "Valor da Transacao", value: formatBRL(data.transactionAmount), inline: true },
      { name: "Taxa de Comissao", value: `${data.commissionRate}%`, inline: true },
      { name: "Comissao Recebida", value: formatBRL(data.commissionAmount), inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png" },
    author: { name: "Sistema de Afiliados", icon_url: "https://cdn-icons-png.flaticon.com/512/3135/3135789.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.transacoes, { embeds: [embed] });
  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

// ==================== LOGS DE CHECKOUT ====================

export function logCheckoutCreated(data: {
  checkoutId: string;
  userName: string;
  userEmail: string;
  productName: string;
  amount: number;
  checkoutUrl: string;
}): void {
  const embed: DiscordEmbed = {
    title: "Novo Checkout Criado",
    color: COLORS.info,
    fields: [
      { name: "ID do Checkout", value: `\`${data.checkoutId}\``, inline: false },
      { name: "Usuario", value: data.userName || "N/A", inline: true },
      { name: "Email", value: maskEmail(data.userEmail), inline: true },
      { name: "Produto", value: data.productName || "N/A", inline: true },
      { name: "Valor", value: formatBRL(data.amount), inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Sistema de Checkout", icon_url: "https://cdn-icons-png.flaticon.com/512/3144/3144456.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.geral, { embeds: [embed] });
}

// ==================== LOGS DE WEBHOOK ====================

export function logWebhookReceived(data: {
  source: string;
  transactionId: string;
  status: string;
  amount?: number;
}): void {
  const embed: DiscordEmbed = {
    title: "Webhook Recebido",
    color: COLORS.info,
    fields: [
      { name: "Origem", value: data.source.toUpperCase(), inline: true },
      { name: "ID Transacao", value: `\`${data.transactionId}\``, inline: true },
      { name: "Status", value: `\`${data.status.toUpperCase()}\``, inline: true },
    ],
    footer: { text: `Hyperion Pay • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Webhook Gateway", icon_url: "https://cdn-icons-png.flaticon.com/512/4248/4248443.png" },
  };

  if (data.amount) {
    embed.fields?.push({ name: "Valor", value: formatBRL(data.amount), inline: true });
  }

  sendDiscordWebhook(DISCORD_WEBHOOKS.sistema, { embeds: [embed] });
}

// ==================== LOGS DE SUPORTE/TICKETS ====================

const TICKET_CATEGORY_LABELS: Record<string, string> = {
  technical: "Tecnico",
  financial: "Financeiro",
  account: "Conta",
  integration: "Integracao",
  other: "Outro",
};

const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const TICKET_PRIORITY_EMOJIS: Record<string, string> = {
  low: "🟢",
  normal: "🟡",
  high: "🟠",
  urgent: "🔴",
};

export function logNewTicket(data: {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  userName: string;
  userEmail: string;
}): void {
  const priorityEmoji = TICKET_PRIORITY_EMOJIS[data.priority] || "🟡";
  const isUrgent = data.priority === "urgent" || data.priority === "high";

  const embed: DiscordEmbed = {
    title: "🎫 Novo Ticket de Suporte",
    description: `**${data.subject}**`,
    color: isUrgent ? COLORS.error : COLORS.primary,
    fields: [
      { name: "👤 Usuario", value: data.userName || "N/A", inline: true },
      { name: "📧 Email", value: data.userEmail, inline: true },
      { name: "📂 Categoria", value: TICKET_CATEGORY_LABELS[data.category] || data.category, inline: true },
      { name: `${priorityEmoji} Prioridade`, value: TICKET_PRIORITY_LABELS[data.priority] || data.priority, inline: true },
      { name: "🔗 ID", value: `\`${data.ticketId.slice(0, 8)}...\``, inline: true },
      { name: "📊 Status", value: "`ABERTO`", inline: true },
      { 
        name: "💬 Mensagem", 
        value: data.message.length > 500 ? data.message.substring(0, 500) + "..." : data.message, 
        inline: false 
      },
    ],
    footer: { text: `Hyperion Pay Suporte • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png" },
    author: { name: "Central de Suporte", icon_url: "https://cdn-icons-png.flaticon.com/512/1067/1067566.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.suporte, { embeds: [embed] });
}

export function logTicketClosed(data: {
  ticketId: string;
  subject: string;
  status: string;
  userName: string;
  userEmail: string;
  closedBy: "user" | "admin";
  adminName?: string;
}): void {
  const isResolved = data.status === "resolved";
  const statusEmoji = isResolved ? "✅" : "🔒";
  const statusText = isResolved ? "RESOLVIDO" : "ENCERRADO";
  const closedByText = data.closedBy === "user" 
    ? "Encerrado pelo usuario" 
    : `Encerrado por ${data.adminName || "Admin"}`;

  const embed: DiscordEmbed = {
    title: `${statusEmoji} Ticket ${isResolved ? "Resolvido" : "Encerrado"}`,
    description: `**${data.subject}**`,
    color: isResolved ? COLORS.info : COLORS.success,
    fields: [
      { name: "👤 Usuario", value: data.userName || "N/A", inline: true },
      { name: "📧 Email", value: data.userEmail, inline: true },
      { name: "🔗 ID", value: `\`${data.ticketId.slice(0, 8)}...\``, inline: true },
      { name: "📊 Status", value: `\`${statusText}\``, inline: true },
      { name: "🔐 Acao", value: closedByText, inline: true },
    ],
    footer: { text: `Hyperion Pay Suporte • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    thumbnail: { url: isResolved 
      ? "https://cdn-icons-png.flaticon.com/512/5610/5610944.png" 
      : "https://cdn-icons-png.flaticon.com/512/4436/4436481.png" 
    },
    author: { name: "Central de Suporte", icon_url: "https://cdn-icons-png.flaticon.com/512/1067/1067566.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.suporte, { embeds: [embed] });
}

export function logTicketAdminReply(data: {
  ticketId: string;
  subject: string;
  userName: string;
  adminName: string;
  message: string;
}): void {
  const embed: DiscordEmbed = {
    title: "💬 Nova Resposta do Suporte",
    description: `**${data.subject}**`,
    color: COLORS.purple,
    fields: [
      { name: "👤 Usuario", value: data.userName || "N/A", inline: true },
      { name: "🛡️ Atendente", value: data.adminName, inline: true },
      { name: "🔗 ID", value: `\`${data.ticketId.slice(0, 8)}...\``, inline: true },
      { 
        name: "💬 Resposta", 
        value: data.message.length > 500 ? data.message.substring(0, 500) + "..." : data.message, 
        inline: false 
      },
    ],
    footer: { text: `Hyperion Pay Suporte • ${formatDateTime()}` },
    timestamp: new Date().toISOString(),
    author: { name: "Central de Suporte", icon_url: "https://cdn-icons-png.flaticon.com/512/1067/1067566.png" },
  };

  sendDiscordWebhook(DISCORD_WEBHOOKS.suporte, { embeds: [embed] });
}
