/**
 * Integração com a liquidante Medusa Online (API pública v1)
 * Documentação: https://api.medusapayments.online/api/v1
 *
 * Diferente do cliente legado (lib/acquirers/medusa.ts) que usa Basic Auth
 * e valores em centavos. Aqui usamos Bearer (mk_live_...) e valores em reais.
 */

const DEFAULT_BASE_URL = "https://api.medusapayments.online/api/v1";

export interface MedusaOnlineConfig {
  apiKey: string; // mk_live_...
  baseUrl?: string;
}

export interface MedusaOnlinePixResult {
  success: boolean;
  transactionId?: string;
  qrCode?: string; // copia e cola (EMV)
  qrCodeBase64?: string; // imagem base64
  expiresAt?: string;
  amount?: number;
  status?: string;
  simulated?: boolean;
  error?: string;
  latencyMs?: number;
}

export interface MedusaOnlineBalance {
  success: boolean;
  available?: number;
  blocked?: number;
  error?: string;
}

export interface MedusaOnlineWithdrawalResult {
  success: boolean;
  withdrawalId?: string;
  status?: string;
  error?: string;
}

// Mapeia os status da Medusa Online para os status internos do Hyperion Pay
export const MEDUSA_ONLINE_STATUS_MAP: Record<string, string> = {
  pendente: "pending",
  aprovado: "completed",
  recusado: "failed",
  estornado: "refunded",
  cancelado: "cancelled",
};

export class MedusaOnline {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MedusaOnlineConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T; status: number }> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const text = await response.text();
    let data: T;
    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      throw new Error("Resposta inválida da API Medusa Online");
    }

    if (!response.ok) {
      const err = data as { message?: string; code?: string };
      throw new Error(err?.message || err?.code || `Erro na API Medusa Online (${response.status})`);
    }

    return { data, status: response.status };
  }

  /**
   * Cria um pagamento PIX (server-to-server) via POST /api/pagamentos
   * @param valor Valor em reais
   */
  async createPix(params: {
    valor: number;
    clienteNome: string;
    clienteEmail: string;
    clienteCpf: string;
    clienteTelefone?: string;
    produto?: string;
    idempotencyKey?: string;
  }): Promise<MedusaOnlinePixResult> {
    const started = Date.now();
    try {
      const { data } = await this.request<Record<string, any>>("/api/pagamentos", {
        method: "POST",
        body: JSON.stringify({
          clienteNome: params.clienteNome,
          clienteEmail: params.clienteEmail,
          clienteCpf: (params.clienteCpf || "").replace(/\D/g, ""),
          clienteTelefone: (params.clienteTelefone || "").replace(/\D/g, "") || undefined,
          produto: params.produto || "Depósito via PIX - Hyperion Pay",
          valor: Number(params.valor),
          metodo: "PIX",
          idempotencyKey: params.idempotencyKey,
        }),
      });

      const venda = data.venda || {};
      const dp = data.dadosPagamento || {};
      const rawStatus = String(venda.status || data.status || "pendente");

      return {
        success: true,
        transactionId: String(venda.id || data.id || ""),
        qrCode: data.pixCopiaECola || dp.copiaECola || undefined,
        qrCodeBase64: data.pixQrCode || dp.qrCode || undefined,
        expiresAt: data.pixExpiresAt || dp.expiresAt || undefined,
        amount: Number(venda.valor || data.valor || params.valor),
        status: MEDUSA_ONLINE_STATUS_MAP[rawStatus] || rawStatus,
        simulated: Boolean(data.simulada ?? venda.simulada ?? false),
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar pagamento PIX",
        latencyMs: Date.now() - started,
      };
    }
  }

  /**
   * Consulta o status de uma venda via GET /api/pagamentos/:id
   */
  async getPix(id: string): Promise<MedusaOnlinePixResult> {
    try {
      const { data } = await this.request<Record<string, any>>(`/api/pagamentos/${encodeURIComponent(id)}`, {
        method: "GET",
      });
      const rawStatus = String(data.status || "pendente");
      return {
        success: true,
        transactionId: String(data.id || id),
        amount: Number(data.valor || 0),
        status: MEDUSA_ONLINE_STATUS_MAP[rawStatus] || rawStatus,
        simulated: Boolean(data.simulada ?? false),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao consultar pagamento",
      };
    }
  }

  /**
   * Consulta saldo via GET /api/saldo
   */
  async getBalance(): Promise<MedusaOnlineBalance> {
    try {
      const { data } = await this.request<Record<string, any>>("/api/saldo", { method: "GET" });
      return {
        success: true,
        available: Number(data.disponivel || 0),
        blocked: Number(data.bloqueado || 0),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao consultar saldo",
      };
    }
  }

  /**
   * Solicita um saque via POST /api/saques
   * (pode retornar 403 SAQUE_API_DESABILITADO se não estiver liberado na conta)
   */
  async requestWithdrawal(params: {
    valor: number;
    chavePix: string;
    chavePixTipo: "CPF" | "CNPJ" | "email" | "telefone" | "aleatoria";
    idempotencyKey: string;
  }): Promise<MedusaOnlineWithdrawalResult> {
    try {
      const { data } = await this.request<Record<string, any>>("/api/saques", {
        method: "POST",
        body: JSON.stringify({
          valor: Number(params.valor),
          chavePix: params.chavePix,
          chavePixTipo: params.chavePixTipo,
          idempotencyKey: params.idempotencyKey,
          tipo: "PIX",
        }),
      });
      const saque = data.saque || data;
      return {
        success: true,
        withdrawalId: String(saque.id || ""),
        status: saque.status || "pendente",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao solicitar saque",
      };
    }
  }

  /**
   * Faz um teste leve de conectividade/credenciais consultando o saldo.
   */
  async ping(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const started = Date.now();
    const balance = await this.getBalance();
    return { ok: balance.success, latencyMs: Date.now() - started, error: balance.error };
  }
}

/**
 * Detecta se uma adquirente usa a liquidante Medusa Online.
 */
export function isMedusaOnline(config: { api_url?: string; code?: string }): boolean {
  const url = (config.api_url || "").toLowerCase();
  const code = (config.code || "").toLowerCase();
  return url.includes("medusapayments.online") || code.startsWith("medusa_online");
}

/**
 * Converte o tipo de chave PIX interno para o formato da Medusa Online.
 */
export function toMedusaOnlinePixKeyType(
  internal: string
): "CPF" | "CNPJ" | "email" | "telefone" | "aleatoria" {
  switch ((internal || "").toUpperCase()) {
    case "CPF":
      return "CPF";
    case "CNPJ":
      return "CNPJ";
    case "EMAIL":
      return "email";
    case "TELEFONE":
      return "telefone";
    default:
      return "aleatoria";
  }
}
