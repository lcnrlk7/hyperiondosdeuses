import "server-only";

/**
 * Cliente minimo para a Evolution API (WhatsApp nao oficial / self-hosted).
 *
 * Variaveis de ambiente necessarias:
 *  - EVOLUTION_API_URL   -> URL base da sua instancia (ex: https://evo.seudominio.com)
 *  - EVOLUTION_API_KEY   -> API Key (header "apikey")
 *  - EVOLUTION_INSTANCE  -> Nome da instancia conectada (que leu o QR Code)
 */

function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  return { baseUrl, apiKey, instance };
}

export function isEvolutionConfigured(): boolean {
  const { baseUrl, apiKey, instance } = getConfig();
  return Boolean(baseUrl && apiKey && instance);
}

/**
 * Normaliza um telefone brasileiro para o formato esperado pela Evolution API.
 * Os numeros no banco estao salvos como DDD + numero (ex: "63992032973"),
 * sem o codigo do pais. Adicionamos "55" quando necessario.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  // mantem apenas digitos
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // remove zeros a esquerda
  digits = digits.replace(/^0+/, "");
  // se ja vier com 55 (12 ou 13 digitos), mantem
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }
  // DDD + numero (10 ou 11 digitos) -> adiciona 55
  if (digits.length === 10 || digits.length === 11) {
    return "55" + digits;
  }
  // formatos inesperados sao descartados
  return null;
}

export interface SendTextResult {
  ok: boolean;
  error?: string;
}

/**
 * Envia uma mensagem de texto simples via Evolution API.
 */
export async function sendWhatsappText(
  phone: string,
  message: string
): Promise<SendTextResult> {
  const { baseUrl, apiKey, instance } = getConfig();
  if (!baseUrl || !apiKey || !instance) {
    return { ok: false, error: "Evolution API nao configurada" };
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { ok: false, error: "Telefone invalido" };
  }

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: normalized,
        text: message,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[WhatsApp] Falha ao enviar para ${normalized}: ${res.status} ${detail.slice(0, 200)}`
      );
      return { ok: false, error: `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar mensagem:", error);
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Extrai os dados relevantes de um evento "messages.upsert" da Evolution API.
 * Retorna null se nao for uma mensagem de texto recebida de um cliente.
 */
export interface IncomingMessage {
  phone: string; // somente digitos, com DDI (ex: 5563992032973)
  remoteJid: string;
  pushName: string | null;
  text: string;
  externalId: string | null;
  fromMe: boolean;
}

export function parseIncomingMessage(payload: any): IncomingMessage | null {
  try {
    const data = payload?.data ?? payload;
    const key = data?.key ?? {};
    const remoteJid: string = key?.remoteJid ?? "";

    // Ignora grupos e status/broadcast
    if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("broadcast")) {
      return null;
    }

    const fromMe = Boolean(key?.fromMe);

    // Extrai o texto de diferentes formatos de mensagem
    const msg = data?.message ?? {};
    const text: string =
      msg?.conversation ??
      msg?.extendedTextMessage?.text ??
      msg?.imageMessage?.caption ??
      msg?.videoMessage?.caption ??
      "";

    if (!text || typeof text !== "string") return null;

    const phone = remoteJid.split("@")[0].replace(/\D/g, "");
    if (!phone) return null;

    return {
      phone,
      remoteJid,
      pushName: data?.pushName ?? null,
      text: text.trim(),
      externalId: key?.id ?? null,
      fromMe,
    };
  } catch (error) {
    console.error("[WhatsApp] Erro ao interpretar webhook:", error);
    return null;
  }
}
