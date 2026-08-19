import crypto from "node:crypto";

// Workflow de verificacao da Didit (config por sessao, NAO e segredo).
// Pode ser sobrescrito por env; o padrao aponta para o workflow atual da conta.
export const DIDIT_WORKFLOW_ID =
  process.env.DIDIT_WORKFLOW_ID || "e9dcd725-a87a-4144-bc79-f03534bcb34c";

// Base URL da API de verificacao da Didit
export const DIDIT_BASE_URL = "https://verification.didit.me";

// URL base da aplicacao (para callback de retorno do usuario)
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://hyperionpay.com.br"
  );
}

export interface DiditSession {
  session_id: string;
  session_token?: string;
  url: string;
  status?: string;
  workflow_id?: string;
  vendor_data?: string;
}

// Formata um telefone brasileiro para o padrao E.164 (+55...).
function toE164BR(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("55")) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

// Dados cadastrais do usuario, usados para pre-preencher e comparar a verificacao.
export interface DiditUserData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  documentNumber?: string | null; // CPF
}

// Cria uma sessao de verificacao na Didit (server-side).
export async function createDiditSession(params: {
  vendorData: string;
  callback: string;
  user?: DiditUserData;
}): Promise<DiditSession> {
  const apiKey = process.env.DIDIT_API_KEY;
  if (!apiKey) {
    throw new Error("DIDIT_API_KEY nao configurada");
  }

  const payload: Record<string, unknown> = {
    workflow_id: DIDIT_WORKFLOW_ID,
    vendor_data: params.vendorData,
    callback: params.callback,
  };

  const user = params.user;
  if (user) {
    // Dados de contato (email/telefone) enviados a Didit.
    const email = user.email?.trim();
    const phone = toE164BR(user.phone);
    if (email || phone) {
      payload.contact_details = {
        ...(email ? { email, email_lang: "pt" } : {}),
        ...(phone ? { phone } : {}),
      };
    }

    // Dados esperados de identidade (comparados com o documento na verificacao).
    const expected: Record<string, unknown> = {};
    const fullName = user.fullName?.trim();
    if (fullName) {
      const parts = fullName.split(/\s+/);
      expected.first_name = parts[0];
      if (parts.length > 1) expected.last_name = parts.slice(1).join(" ");
    }
    const doc = user.documentNumber?.replace(/\D/g, "");
    if (doc) {
      expected.document_number = doc;
    }
    if (Object.keys(expected).length > 0) {
      payload.expected_details = expected;
    }
  }

  const res = await fetch(`${DIDIT_BASE_URL}/v3/session/`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Didit session_create_failed (${res.status}): ${detail}`);
  }

  return (await res.json()) as DiditSession;
}

// --- Verificacao de assinatura de webhook (X-Signature-V2) ---

// Floats inteiros (1.0) -> inteiros (1), recursivamente. Igual a canonicalizacao do servidor da Didit.
function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [
        k,
        shortenFloats(x),
      ]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0)
    return Math.trunc(v);
  return v;
}

// Ordena chaves lexicograficamente (ordem de arrays preservada).
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

// Verifica a assinatura HMAC-SHA256 do webhook da Didit usando o corpo bruto.
export function verifyDiditSignature(params: {
  rawBody: string;
  signatureV2: string;
  timestamp: number;
}): { valid: boolean; reason?: string } {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) {
    return { valid: false, reason: "DIDIT_WEBHOOK_SECRET nao configurada" };
  }

  // 1. Frescor — rejeita qualquer coisa fora de 300s (protecao contra replay).
  if (
    !params.timestamp ||
    Math.abs(Date.now() / 1000 - params.timestamp) > 300
  ) {
    return { valid: false, reason: "timestamp stale" };
  }

  // 2. Canonicaliza (shortenFloats -> sortKeys -> JSON.stringify com Unicode nao escapado).
  let canonical: string;
  try {
    const parsed = JSON.parse(params.rawBody);
    canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));
  } catch {
    return { valid: false, reason: "invalid json" };
  }

  // 3. Compara HMAC-SHA256 em tempo constante contra X-Signature-V2.
  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest("hex");

  const sig = params.signatureV2 || "";
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return { valid: false, reason: "bad signature" };
  }

  return { valid: true };
}
