/**
 * Integracao com UTMify para tracking de conversoes
 * Documentacao: https://api.utmify.com.br
 */

import { sql } from "@/lib/db";

// Tipos da API UTMify
export interface UTMifyCustomer {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  country?: string;
  ip?: string;
}

export interface UTMifyProduct {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  quantity: number;
  priceInCents: number;
}

export interface UTMifyTrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface UTMifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency?: "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD";
}

export interface UTMifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: "credit_card" | "boleto" | "pix" | "paypal" | "free_price";
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt: string; // UTC YYYY-MM-DD HH:MM:SS
  approvedDate: string | null; // UTC
  refundedAt: string | null; // UTC
  customer: UTMifyCustomer;
  products: UTMifyProduct[];
  trackingParameters: UTMifyTrackingParameters;
  commission: UTMifyCommission;
  isTest?: boolean;
}

// Endpoint da API UTMify
const UTMIFY_API_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

/**
 * Formata data para o formato UTMify (UTC)
 */
function formatDateUTC(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Busca a credencial UTMify do usuario
 */
export async function getUserUtmifyCredential(userId: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT utmify_api_token FROM profiles WHERE id = ${userId}
    `;
    return result[0]?.utmify_api_token || null;
  } catch {
    return null;
  }
}

/**
 * Salva a credencial UTMify do usuario
 */
export async function saveUserUtmifyCredential(userId: string, token: string): Promise<boolean> {
  try {
    await sql`
      UPDATE profiles SET utmify_api_token = ${token} WHERE id = ${userId}
    `;
    return true;
  } catch (error) {
    console.error("Erro ao salvar credencial UTMify:", error);
    return false;
  }
}

/**
 * Remove a credencial UTMify do usuario
 */
export async function removeUserUtmifyCredential(userId: string): Promise<boolean> {
  try {
    await sql`
      UPDATE profiles SET utmify_api_token = NULL WHERE id = ${userId}
    `;
    return true;
  } catch (error) {
    console.error("Erro ao remover credencial UTMify:", error);
    return false;
  }
}

/**
 * Envia evento para UTMify
 */
export async function sendToUtmify(
  apiToken: string,
  payload: UTMifyOrderPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(UTMIFY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro UTMify:", response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar para UTMify:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Envia evento de transacao PIX para UTMify
 */
export async function sendPixEventToUtmify(
  userId: string,
  transaction: {
    id: string;
    amount: number;
    fee: number;
    status: string;
    payer_name?: string;
    payer_email?: string;
    payer_document?: string;
    payer_phone?: string;
    description?: string;
    external_id?: string;
    created_at: string;
    paid_at?: string;
    refunded_at?: string;
    // UTM params
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    src?: string;
    sck?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // Buscar credencial do usuario
  const apiToken = await getUserUtmifyCredential(userId);
  
  if (!apiToken) {
    // Usuario nao tem UTMify configurado, ignora silenciosamente
    return { success: true };
  }

  // Mapear status para UTMify
  let utmifyStatus: UTMifyOrderPayload["status"];
  switch (transaction.status) {
    case "pending":
    case "waiting_payment":
      utmifyStatus = "waiting_payment";
      break;
    case "paid":
    case "completed":
    case "approved":
      utmifyStatus = "paid";
      break;
    case "refunded":
      utmifyStatus = "refunded";
      break;
    case "chargedback":
    case "chargeback":
      utmifyStatus = "chargedback";
      break;
    case "failed":
    case "cancelled":
    case "expired":
    default:
      utmifyStatus = "refused";
      break;
  }

  const amountInCents = Math.round(transaction.amount * 100);
  const feeInCents = Math.round((transaction.fee || 0) * 100);

  const payload: UTMifyOrderPayload = {
    orderId: transaction.external_id || transaction.id,
    platform: "Hyperion Pay",
    paymentMethod: "pix",
    status: utmifyStatus,
    createdAt: formatDateUTC(transaction.created_at) || formatDateUTC(new Date())!,
    approvedDate: transaction.paid_at ? formatDateUTC(transaction.paid_at) : null,
    refundedAt: transaction.refunded_at ? formatDateUTC(transaction.refunded_at) : null,
    customer: {
      name: transaction.payer_name || "Cliente",
      email: transaction.payer_email || "",
      phone: transaction.payer_phone || null,
      document: transaction.payer_document || null,
      country: "BR",
    },
    products: [
      {
        id: transaction.id,
        name: transaction.description || "Pagamento PIX",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: amountInCents,
      },
    ],
    trackingParameters: {
      src: transaction.src || null,
      sck: transaction.sck || null,
      utm_source: transaction.utm_source || null,
      utm_campaign: transaction.utm_campaign || null,
      utm_medium: transaction.utm_medium || null,
      utm_content: transaction.utm_content || null,
      utm_term: transaction.utm_term || null,
    },
    commission: {
      totalPriceInCents: amountInCents,
      gatewayFeeInCents: feeInCents,
      userCommissionInCents: amountInCents - feeInCents,
      currency: "BRL",
    },
  };

  return sendToUtmify(apiToken, payload);
}

/**
 * Testa a conexao com UTMify
 */
export async function testUtmifyConnection(apiToken: string): Promise<{ success: boolean; error?: string }> {
  const testPayload: UTMifyOrderPayload = {
    orderId: `test_${Date.now()}`,
    platform: "Hyperion Pay",
    paymentMethod: "pix",
    status: "paid",
    createdAt: formatDateUTC(new Date())!,
    approvedDate: formatDateUTC(new Date()),
    refundedAt: null,
    customer: {
      name: "Teste Hyperion Pay",
      email: "teste@hyperionpay.com.br",
      phone: null,
      document: null,
      country: "BR",
    },
    products: [
      {
        id: "test_product",
        name: "Teste de Integracao",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: 100, // R$ 1,00
      },
    ],
    trackingParameters: {
      src: "hyperionpay_test",
      sck: null,
      utm_source: "hyperionpay",
      utm_campaign: "integration_test",
      utm_medium: "api",
      utm_content: null,
      utm_term: null,
    },
    commission: {
      totalPriceInCents: 100,
      gatewayFeeInCents: 5,
      userCommissionInCents: 95,
      currency: "BRL",
    },
    isTest: true,
  };

  return sendToUtmify(apiToken, testPayload);
}
