import crypto from "crypto"

export interface MerchantWebhookOptions {
  url: string
  secret?: string | null
  event: string
  data: Record<string, unknown>
  timeoutMs?: number
}

export interface MerchantWebhookResult {
  ok: boolean
  status: number
  responseBody: string
  responseTimeMs: number
  error: string | null
  payload: Record<string, unknown>
  signature: string
}

/**
 * Gera a assinatura HMAC-SHA256 (hexadecimal) de um corpo de webhook.
 * O lojista valida comparando com o header X-Webhook-Signature.
 */
export function signWebhookPayload(payloadString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadString).digest("hex")
}

/**
 * Envia um webhook padronizado e assinado para o endpoint do lojista.
 *
 * Formato do corpo: { event, timestamp, data: {...} }
 * Headers de seguranca:
 *  - X-Webhook-Signature: HMAC-SHA256(corpo, webhook_secret) em hexadecimal
 *  - X-Webhook-Event: nome do evento
 *  - X-Webhook-Timestamp: ISO 8601
 */
export async function sendMerchantWebhook({
  url,
  secret,
  event,
  data,
  timeoutMs = 10000,
}: MerchantWebhookOptions): Promise<MerchantWebhookResult> {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }
  const body = JSON.stringify(payload)
  const signature = secret ? signWebhookPayload(body, secret) : ""

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": event,
    "X-Webhook-Timestamp": payload.timestamp as string,
  }
  if (signature) {
    headers["X-Webhook-Signature"] = signature
  }

  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    })

    let responseBody = ""
    try {
      responseBody = await response.text()
      if (responseBody.length > 500) {
        responseBody = responseBody.substring(0, 500) + "..."
      }
    } catch {
      responseBody = "[Nao foi possivel ler a resposta]"
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      responseBody,
      responseTimeMs: Date.now() - startTime,
      error: null,
      payload,
      signature,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      responseBody: "",
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      payload,
      signature,
    }
  }
}
