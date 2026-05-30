import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY || "";
  return new Resend(apiKey);
}

const FROM_EMAIL = "Hyperion Pay <noreply@hyperionpayments.online>";

// URLs permanentes do Vercel Blob (sempre acessiveis, independente do dominio)
const MASCOT_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mascote-3q2tQJspA2i2FZswc9TgIR7bgtnhvw.png";
const LOGO_ICON_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20sem%20fundo-o9FNksnCjy2Ho8RyeK6Tc1ouqvzbIm.png";

const C = {
  bg: "#030014",
  cardBg: "#0a0a1f",
  cardBorder: "#1a1a3e",
  innerBg: "#0f0f2e",
  innerBorder: "#252560",
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  accent: "#818cf8",
  glow: "#6366f1",
  text: "#ffffff",
  textSoft: "#e0e0ff",
  textMuted: "#a5a5d6",
  textDim: "#6b6b9e",
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

function emailWrapper(content: string, showMascot = true): string {
  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Hyperion Pay</title>
<style>
  :root { color-scheme: dark; supported-color-schemes: dark; }
  body, html { background-color: ${C.bg} !important; }
  @media (prefers-color-scheme: light) {
    body, html, .email-bg, .email-wrapper, .email-outer { background-color: ${C.bg} !important; }
    .email-card { background-color: ${C.cardBg} !important; }
    u + .body { background-color: ${C.bg} !important; }
  }
  @media (prefers-color-scheme: dark) {
    body, html, .email-bg, .email-wrapper, .email-outer { background-color: ${C.bg} !important; }
    .email-card { background-color: ${C.cardBg} !important; }
  }
  /* Gmail mobile fix */
  u + .body { background-color: ${C.bg} !important; }
  div[style*="margin: 16px 0"] { margin: 0 !important; }
</style>
</head>
<body class="body" style="margin:0;padding:0;background-color:${C.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" bgcolor="${C.bg}">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}"><tr><td><![endif]-->
<div class="email-bg" style="background-color:${C.bg};width:100%;margin:0;padding:0;">
<table class="email-outer" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background-color:${C.bg};margin:0;padding:0;">
<tr><td bgcolor="${C.bg}" style="background-color:${C.bg};">
<table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background-color:${C.bg};padding:32px 16px;">
<tr><td align="center" bgcolor="${C.bg}" style="background-color:${C.bg};">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

<!-- Logo + Nome -->
<tr><td align="center" style="padding:0 0 28px 0;" bgcolor="${C.bg}">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:12px;vertical-align:middle;">
      <img src="${LOGO_ICON_URL}" alt="HP" width="36" height="36" style="display:block;border-radius:8px;">
    </td>
    <td style="vertical-align:middle;">
      <span style="font-size:22px;font-weight:800;letter-spacing:1px;color:${C.text};">HYPERION</span>
      <span style="font-size:22px;font-weight:800;letter-spacing:1px;color:${C.primary};"> PAY</span>
    </td>
  </tr></table>
</td></tr>

<!-- Card principal -->
<tr><td>
<table class="email-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.cardBg}" style="background-color:${C.cardBg};border-radius:20px;border:1px solid ${C.cardBorder};overflow:hidden;">

<!-- Barra gradient topo -->
<tr><td style="height:3px;background:linear-gradient(90deg,${C.primaryDark},${C.primary},${C.accent},${C.primary},${C.primaryDark});font-size:0;line-height:0;">&nbsp;</td></tr>

${showMascot ? `
<!-- Mascote -->
<tr><td align="center" bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:32px 0 0 0;">
  <img src="${MASCOT_URL}" alt="Hyperion Pay Mascote" width="100" height="100" style="display:block;border-radius:50%;border:3px solid ${C.cardBorder};">
</td></tr>
` : ""}

<!-- Conteudo -->
${content}

<!-- Barra gradient bottom -->
<tr><td style="height:2px;background:linear-gradient(90deg,transparent,${C.primaryDark},${C.primary},${C.primaryDark},transparent);font-size:0;line-height:0;">&nbsp;</td></tr>

</table>
</td></tr>

<!-- Footer -->
<tr><td align="center" bgcolor="${C.bg}" style="background-color:${C.bg};padding:24px 20px 0;">
  <p style="margin:0 0 6px;color:${C.textDim};font-size:11px;font-weight:600;letter-spacing:0.5px;">HYPERION PAY</p>
  <p style="margin:0 0 4px;color:${C.textDim};font-size:10px;font-style:italic;">Construindo legado. Gerando liberdade.</p>
  <p style="margin:12px 0 0;color:${C.cardBorder};font-size:9px;">Este e um email automatico, por favor nao responda.</p>
</td></tr>

</table>
</td></tr>
</table>
</td></tr>
</table>
</div>
<!--[if mso]></td></tr></table><![endif]-->
</body></html>`;
}

function codeBlock(label: string, code: string): string {
  return `
<tr><td style="padding:20px 36px;" bgcolor="${C.cardBg}">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td bgcolor="${C.innerBg}" style="background-color:${C.innerBg};border:2px solid ${C.primaryDark};border-radius:16px;padding:24px 16px;text-align:center;">
    <p style="margin:0 0 14px;color:${C.accent};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:4px;">${label}</p>
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td bgcolor="${C.bg}" style="font-family:'Courier New',Courier,monospace;font-size:42px;font-weight:800;color:${C.text};letter-spacing:16px;padding:12px 24px;background-color:${C.bg};border-radius:14px;border:1px solid ${C.innerBorder};">${code}</td>
    </tr></table>
  </td></tr>
  </table>
</td></tr>`;
}

function ctaButton(text: string, url: string): string {
  return `
<tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:24px 36px 36px;text-align:center;">
  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${C.primaryDark} 0%,${C.primary} 50%,${C.accent} 100%);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
    ${text} &#8594;
  </a>
</td></tr>`;
}

function titleSection(icon: string, title: string, subtitle: string): string {
  return `
<tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:24px 36px 8px;text-align:center;">
  <div style="display:inline-block;width:52px;height:52px;line-height:52px;background-color:${C.innerBg};border:1px solid ${C.innerBorder};border-radius:14px;font-size:22px;margin-bottom:16px;">${icon}</div>
  <h2 style="margin:0 0 8px;color:${C.text};font-size:21px;font-weight:700;">${title}</h2>
  <p style="margin:0;color:${C.textMuted};font-size:14px;line-height:1.6;">${subtitle}</p>
</td></tr>`;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================================
// 1. Email de verificacao de codigo
// ============================================================
export async function sendVerificationEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  const greeting = name ? `Ola <strong style="color:${C.text};">${name}</strong>, use` : "Use";
  const content = `
    ${titleSection("&#128272;", "Verificacao de Email", `${greeting} o codigo abaixo para verificar sua conta.`)}
    ${codeBlock("Seu codigo", code)}
    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:4px 36px 32px;text-align:center;">
      <p style="margin:0 0 6px;color:${C.textSoft};font-size:13px;">Este codigo expira em <strong style="color:${C.accent};">10 minutos</strong></p>
      <p style="margin:0;color:${C.textDim};font-size:11px;">Se voce nao solicitou este codigo, ignore este email.</p>
    </td></tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to,
      subject: `${code} - Codigo de Verificacao | Hyperion Pay`,
      html: emailWrapper(content),
    });
    if (error) { console.error("[Email] Erro ao enviar:", error); return false; }
    console.log("[Email] Codigo enviado com sucesso para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return false;
  }
}

// ============================================================
// 2. Email de boas-vindas
// ============================================================
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<boolean> {
  const features = [
    { icon: "&#9889;", text: "Receber pagamentos via PIX instantaneo" },
    { icon: "&#128202;", text: "Acompanhar todas as suas transacoes" },
    { icon: "&#128176;", text: "Sacar para sua conta bancaria" },
    { icon: "&#128274;", text: "Seguranca e protecao em cada operacao" },
  ];

  const featureRows = features.map((f, i) => `
    <tr><td style="padding:14px 20px;${i < features.length - 1 ? `border-bottom:1px solid ${C.cardBorder};` : ""}" bgcolor="${C.innerBg}">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="36" style="color:${C.accent};font-size:16px;vertical-align:middle;">${f.icon}</td>
        <td style="color:${C.textSoft};font-size:13px;vertical-align:middle;">${f.text}</td>
      </tr></table>
    </td></tr>
  `).join("");

  const content = `
    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:24px 36px 8px;text-align:center;">
      <div style="display:inline-block;width:56px;height:56px;line-height:56px;background:linear-gradient(135deg,${C.primaryDark},${C.primary});border-radius:50%;font-size:24px;color:white;margin-bottom:16px;">&#10003;</div>
      <h2 style="margin:0 0 6px;color:${C.text};font-size:22px;font-weight:700;">Bem-vindo, ${name}!</h2>
      <p style="margin:0;color:${C.textMuted};font-size:14px;">Sua conta foi criada com sucesso na Hyperion Pay</p>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:20px 36px 8px;">
      <p style="margin:0;color:${C.textMuted};font-size:14px;line-height:1.7;text-align:center;">Agora voce faz parte da Hyperion Pay! Confira o que voce pode fazer:</p>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:12px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.innerBg}" style="background-color:${C.innerBg};border-radius:14px;border:1px solid ${C.innerBorder};">
        ${featureRows}
      </table>
    </td></tr>

    ${ctaButton("Acessar minha conta", "https://app.hyperionpay.com.br/dashboard")}
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to,
      subject: "Bem-vindo a Hyperion Pay!",
      html: emailWrapper(content),
    });
    if (error) { console.error("[Email] Erro ao enviar boas-vindas:", error); return false; }
    console.log("[Email] Email de boas-vindas enviado para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email de boas-vindas:", error);
    return false;
  }
}

// ============================================================
// 3. Notificacao de saque
// ============================================================
export async function sendWithdrawalNotification(
  to: string,
  name: string,
  amount: number,
  status: "pending" | "approved" | "rejected" | "completed"
): Promise<boolean> {
  const statusConfig = {
    pending: {
      icon: "&#9203;", title: "Saque Solicitado",
      message: `Seu saque de <strong style="color:${C.text};">R$ ${amount.toFixed(2)}</strong> foi recebido e esta em analise.`,
      color: C.yellow, bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.25)",
    },
    approved: {
      icon: "&#9989;", title: "Saque Aprovado",
      message: `Seu saque de <strong style="color:${C.text};">R$ ${amount.toFixed(2)}</strong> foi aprovado e sera processado em breve.`,
      color: C.green, bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.25)",
    },
    rejected: {
      icon: "&#10060;", title: "Saque Recusado",
      message: `Seu saque de <strong style="color:${C.text};">R$ ${amount.toFixed(2)}</strong> nao pode ser processado. Entre em contato com o suporte.`,
      color: C.red, bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.25)",
    },
    completed: {
      icon: "&#128184;", title: "Saque Concluido",
      message: `Seu saque de <strong style="color:${C.text};">R$ ${amount.toFixed(2)}</strong> foi enviado para sua conta PIX com sucesso!`,
      color: C.green, bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.25)",
    },
  };

  const cfg = statusConfig[status];

  const content = `
    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:28px 36px 12px;text-align:center;">
      <div style="display:inline-block;font-size:40px;margin-bottom:14px;">${cfg.icon}</div>
      <h2 style="margin:0 0 8px;color:${C.text};font-size:20px;font-weight:700;">${cfg.title}</h2>
      <p style="margin:0;color:${C.textMuted};font-size:14px;">Ola <strong style="color:${C.text};">${name}</strong>,</p>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:12px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td bgcolor="${C.cardBg}" style="background:${cfg.bg};border-left:4px solid ${cfg.color};border-radius:12px;padding:18px 20px;">
          <p style="margin:0;color:${C.textSoft};font-size:14px;line-height:1.7;">${cfg.message}</p>
        </td>
      </tr></table>
    </td></tr>

    ${ctaButton("Ver detalhes", "https://app.hyperionpay.com.br/dashboard/wallet")}
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to,
      subject: `${cfg.title} - Hyperion Pay`,
      html: emailWrapper(content, false),
    });
    if (error) { console.error("[Email] Erro ao enviar notificacao de saque:", error); return false; }
    console.log("[Email] Notificacao de saque enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificacao de saque:", error);
    return false;
  }
}

// ============================================================
// 4. Notificacao de deposito
// ============================================================
export async function sendDepositNotification(
  to: string,
  name: string,
  amount: number
): Promise<boolean> {
  const content = `
    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:28px 36px 12px;text-align:center;">
      <div style="display:inline-block;font-size:40px;margin-bottom:14px;">&#128176;</div>
      <h2 style="margin:0 0 6px;color:${C.text};font-size:20px;font-weight:700;">Deposito Recebido!</h2>
      <p style="margin:0;color:${C.textMuted};font-size:14px;">Ola <strong style="color:${C.text};">${name}</strong>,</p>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:16px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td bgcolor="${C.innerBg}" style="background-color:${C.innerBg};border:2px solid ${C.green};border-radius:16px;padding:24px;text-align:center;">
          <p style="margin:0 0 8px;color:${C.textMuted};font-size:10px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Valor creditado</p>
          <span style="font-size:36px;font-weight:800;color:${C.green};">R$ ${amount.toFixed(2)}</span>
        </td>
      </tr></table>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:8px 36px;text-align:center;">
      <p style="margin:0;color:${C.textMuted};font-size:14px;">O valor ja esta disponivel na sua conta.</p>
    </td></tr>

    ${ctaButton("Ver meu saldo", "https://app.hyperionpay.com.br/dashboard/wallet")}
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to,
      subject: `Deposito de R$ ${amount.toFixed(2)} recebido - Hyperion Pay`,
      html: emailWrapper(content, false),
    });
    if (error) { console.error("[Email] Erro ao enviar notificacao de deposito:", error); return false; }
    console.log("[Email] Notificacao de deposito enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificacao de deposito:", error);
    return false;
  }
}

// ============================================================
// 5. Email de notificacao generica
// ============================================================
export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string
): Promise<boolean> {
  const content = `
    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:28px 36px 12px;text-align:center;">
      <h2 style="margin:0;color:${C.text};font-size:20px;font-weight:700;">${title}</h2>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:12px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td bgcolor="${C.innerBg}" style="background-color:${C.innerBg};border-radius:14px;border:1px solid ${C.innerBorder};padding:22px;">
          <p style="margin:0;color:${C.textSoft};font-size:14px;line-height:1.7;">${message}</p>
        </td>
      </tr></table>
    </td></tr>

    ${ctaButton("Acessar minha conta", "https://app.hyperionpay.com.br/dashboard")}
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to, subject,
      html: emailWrapper(content, false),
    });
    if (error) { console.error("[Email] Erro ao enviar notificacao:", error); return false; }
    console.log("[Email] Notificacao enviada para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar notificacao:", error);
    return false;
  }
}

// ============================================================
// 6. Email de reset de senha
// ============================================================
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  const greeting = name ? `Ola <strong style="color:${C.text};">${name}</strong>, voce` : "Voce";
  const content = `
    ${titleSection("&#128274;", "Alteracao de Senha", `${greeting} solicitou a alteracao da sua senha.`)}
    ${codeBlock("Codigo de seguranca", code)}

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:4px 36px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td bgcolor="${C.cardBg}" style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.12);border-radius:12px;padding:14px 18px;">
          <p style="margin:0;color:#fca5a5;font-size:12px;line-height:1.5;">
            <strong>Importante:</strong> Se voce nao solicitou esta alteracao, ignore este email e sua conta permanecera segura.
          </p>
        </td>
      </tr></table>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:8px 36px 32px;text-align:center;">
      <p style="margin:0;color:${C.textSoft};font-size:13px;">Este codigo expira em <strong style="color:${C.accent};">10 minutos</strong>.</p>
    </td></tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to,
      subject: "Alteracao de Senha - Hyperion Pay",
      html: emailWrapper(content),
    });
    if (error) { console.error("[Email] Erro ao enviar email de reset de senha:", error); return false; }
    console.log("[Email] Email de reset de senha enviado para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email de reset de senha:", error);
    return false;
  }
}

// ============================================================
// 7. Alerta de novo login
// ============================================================
export async function sendNewLoginAlert(
  to: string,
  name: string,
  device: string,
  browser: string,
  ip: string,
  date: string
): Promise<boolean> {
  const detailRow = (label: string, value: string, isLast = false, mono = false) => `
    <tr><td style="padding:13px 20px;${!isLast ? `border-bottom:1px solid ${C.cardBorder};` : ""}">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="color:${C.textMuted};font-size:12px;">${label}</td>
        <td style="color:${C.text};font-size:12px;text-align:right;font-weight:600;${mono ? "font-family:'Courier New',monospace;" : ""}">${value}</td>
      </tr></table>
    </td></tr>`;

  const content = `
    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:28px 36px 12px;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;line-height:52px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:14px;font-size:22px;margin-bottom:16px;">&#128275;</div>
      <h2 style="margin:0 0 8px;color:${C.text};font-size:20px;font-weight:700;">Novo acesso detectado</h2>
      <p style="margin:0;color:${C.textMuted};font-size:14px;">Ola <strong style="color:${C.text};">${name}</strong>, detectamos um login na sua conta.</p>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:16px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.innerBg}" style="background-color:${C.innerBg};border-radius:14px;border:1px solid ${C.innerBorder};">
        ${detailRow("Dispositivo", device)}
        ${detailRow("Navegador", browser)}
        ${detailRow("IP", ip, false, true)}
        ${detailRow("Data", date, true)}
      </table>
    </td></tr>

    <tr><td bgcolor="${C.cardBg}" style="background-color:${C.cardBg};padding:12px 36px 32px;text-align:center;">
      <p style="margin:0;color:${C.textDim};font-size:12px;line-height:1.6;">Se nao foi voce, altere sua senha imediatamente e entre em contato com o suporte.</p>
    </td></tr>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL, to,
      subject: "Novo acesso na sua conta - Hyperion Pay",
      html: emailWrapper(content, false),
    });
    if (error) { console.error("[Email] Erro ao enviar alerta de login:", error); return false; }
    console.log("[Email] Alerta de login enviado para:", to);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar alerta de login:", error);
    return false;
  }
}
