/**
 * Integração com Medusa Payments
 * Documentação: https://api.medusapayments.com
 */

const MEDUSA_API_URL = "https://api.medusapayments.com/v1";

interface MedusaConfig {
  secretKey: string;
  licenseKey?: string; // Para saques
}

interface MedusaCustomer {
  name: string;
  email: string;
  phone?: string;
  document: {
    type: "cpf" | "cnpj";
    number: string;
  };
}

interface MedusaItem {
  title: string;
  description?: string;
  quantity: number;
  tangible: boolean;
  unitPrice: number;
}

interface MedusaCreateTransactionRequest {
  paymentMethod: "pix";
  amount: number; // Em centavos
  customer: MedusaCustomer;
  items: MedusaItem[];
  isInfoProducts?: boolean;
  postbackUrl?: string;
  idSeller?: string;
  nameSeller?: string;
  emailSeller?: string;
}

interface MedusaTransaction {
  id: string | number;
  tenantId?: number;
  companyId?: number;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt?: string;
  paidAmount?: number;
  refundedAt?: string;
  refundedAmount?: number;
  postbackUrl?: string;
  metadata?: unknown;
  ip?: string;
  externalRef?: string;
  createdAt: string;
  updatedAt?: string;
  items?: MedusaItem[];
  customer?: MedusaCustomer;
  pix?: {
    qrcode: string;
    end2EndId?: string;
    receiptUrl?: string;
    expirationDate?: string;
  };
}

interface MedusaTransactionResponse {
  message?: string;
  insertId?: number;
  transaction?: MedusaTransaction;
  // Fallback para quando a API retorna diretamente a transação
  id?: string | number;
  pix?: {
    qrcode: string;
    end2EndId?: string;
    receiptUrl?: string;
    expirationDate?: string;
  };
  status?: string;
  amount?: number;
  paidAt?: string;
}

interface MedusaWithdrawalRequest {
  amount: number; // Em centavos
  pixKey: string;
  pixKeyType: "EMAIL" | "CPF" | "CNPJ" | "TELEFONE" | "CHAVE_ALEATORIA";
  license: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  baasPostbackUrl?: string;
}

interface MedusaWithdrawalResponse {
  id: string;
  status: string;
  amount: number;
  pixKey: string;
  processedAt?: string;
  error?: string;
}

interface MedusaBalanceResponse {
  balance: number;
  available: number;
}

interface MedusaListTransactionsResponse {
  data: MedusaTransactionResponse[];
  page: number;
  pageSize: number;
  total: number;
}

export class MedusaPayments {
  private secretKey: string;
  private licenseKey: string;

  constructor(config: MedusaConfig) {
    this.secretKey = config.secretKey;
    this.licenseKey = config.licenseKey || "";
  }

  private getAuthHeader(): string {
    // Basic Auth com x:{SECRET_KEY}
    return "Basic " + Buffer.from(`x:${this.secretKey}`).toString("base64");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${MEDUSA_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const responseText = await response.text();

    let data: T;
    try {
      data = JSON.parse(responseText) as T;
    } catch {
      console.error("[MedusaPayments] Erro ao parsear JSON:", responseText.substring(0, 200));
      throw new Error(`Erro ao processar resposta da API Medusa`);
    }

    if (!response.ok) {
      const errorData = data as { message?: string; error?: string };
      const errorMessage = errorData.message || errorData.error || `Erro na API Medusa (${response.status})`;
      console.error("[MedusaPayments] API Error:", errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * Consultar saldo disponível
   */
  async checkBalance(): Promise<MedusaBalanceResponse> {
    return this.request<MedusaBalanceResponse>("/balance/available", {
      method: "GET",
    });
  }

  /**
   * Criar pagamento PIX (QR Code)
   * @param amount - Valor em centavos
   * @param customer - Dados do cliente
   * @param items - Itens da venda
   * @param postbackUrl - URL para webhook
   */
  async createPixPayment(
    amount: number,
    customer: MedusaCustomer,
    items: MedusaItem[],
    postbackUrl?: string
  ): Promise<MedusaTransactionResponse> {
    const payload: MedusaCreateTransactionRequest = {
      paymentMethod: "pix",
      amount,
      customer,
      items,
      isInfoProducts: false,
      postbackUrl,
    };

    return this.request<MedusaTransactionResponse>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Criar pagamento PIX simplificado
   * @param amount - Valor em centavos
   * @param payerName - Nome do pagador
   * @param payerDocument - CPF/CNPJ do pagador
   * @param payerEmail - Email do pagador
   * @param description - Descrição do pagamento
   * @param postbackUrl - URL para webhook
   */
  async createSimplePixPayment(
    amount: number,
    payerName: string,
    payerDocument: string,
    payerEmail?: string,
    description?: string,
    postbackUrl?: string
  ): Promise<MedusaTransactionResponse> {
    // Limpar documento - remover caracteres não numéricos
    const cleanDoc = (payerDocument || "00000000000").replace(/\D/g, "");
    const docType = cleanDoc.length > 11 ? "cnpj" : "cpf";

    // Garantir que name e email nunca sejam undefined
    const safeName = (payerName || "Cliente").trim() || "Cliente";
    const safeEmail = (payerEmail || "cliente@hyperionpay.com.br").trim() || "cliente@hyperionpay.com.br";

    const customer: MedusaCustomer = {
      name: safeName,
      email: safeEmail,
      phone: "+5511999999999", // Telefone fixo para Medusa
      document: {
        type: docType,
        number: cleanDoc || "00000000000",
      },
    };

    const items: MedusaItem[] = [
      {
        title: description && description.trim() ? description.trim() : "Deposito via PIX - Hyperion Pay",
        description: description && description.trim() ? description.trim() : "Deposito via PIX - Hyperion Pay",
        quantity: 1,
        tangible: false,
        unitPrice: amount,
      },
    ];

    const response = await this.createPixPayment(amount, customer, items, postbackUrl);
    
    // Normalizar resposta - a API pode retornar { transaction: {...} } ou diretamente {...}
    const tx = response.transaction || response;
    
    // IMPORTANTE: Usar insertId como ID principal, pois é o ID usado na listagem de transações
    // response.insertId = ID numérico (999) - usado nas listagens /all/transactions
    // tx.id = UUID - não usado nas listagens
    const transactionId = response.insertId || tx.id;
    
    console.log("[Medusa] Resposta createPix - insertId:", response.insertId, "tx.id:", tx.id, "usando:", transactionId);
    
    return {
      ...response,
      id: transactionId,
      insertId: response.insertId,
      pix: tx.pix || response.pix,
      status: tx.status || response.status,
      amount: tx.amount || response.amount,
    };
  }

  /**
   * Consultar status de uma transação
   * @param transactionId - ID da transação
   */
  async getTransaction(
    transactionId: string | number
  ): Promise<MedusaTransactionResponse> {
    return this.request<MedusaTransactionResponse>(
      `/transaction?id=${transactionId}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Listar todas as transações
   * @param page - Número da página (padrão: 1)
   * @param pageSize - Itens por página (padrão: 20, máximo: 50)
   */
  async listTransactions(
    page: number = 1,
    pageSize: number = 20
  ): Promise<MedusaListTransactionsResponse> {
    return this.request<MedusaListTransactionsResponse>(
      `/all/transactions?page=${page}&pageSize=${Math.min(pageSize, 50)}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Solicitar saque PIX
   * @param amount - Valor em centavos
   * @param pixKey - Chave PIX do destinatário
   * @param pixKeyType - Tipo da chave PIX
   * @param beneficiaryName - Nome do titular
   * @param beneficiaryDocument - Documento do titular
   * @param postbackUrl - URL para webhook do saque
   */
  async requestWithdrawal(
    amount: number,
    pixKey: string,
    pixKeyType: MedusaWithdrawalRequest["pixKeyType"],
    beneficiaryName: string,
    beneficiaryDocument: string,
    postbackUrl?: string
  ): Promise<MedusaWithdrawalResponse> {
    if (!this.licenseKey) {
      throw new Error("License key necessária para saques");
    }

    const payload: MedusaWithdrawalRequest = {
      amount,
      pixKey,
      pixKeyType,
      license: this.licenseKey,
      beneficiaryName,
      beneficiaryDocument,
      baasPostbackUrl: postbackUrl,
    };

    return this.request<MedusaWithdrawalResponse>("/request/withdraw", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Solicitar saque PIX simplificado (detecta tipo da chave automaticamente)
   * @param amount - Valor em centavos
   * @param pixKey - Chave PIX do destinatário
   * @param beneficiaryName - Nome do titular
   * @param beneficiaryDocument - Documento do titular
   */
  async requestSimpleWithdrawal(
    amount: number,
    pixKey: string,
    beneficiaryName: string,
    beneficiaryDocument: string,
    postbackUrl?: string
  ): Promise<MedusaWithdrawalResponse> {
    const pixKeyType = this.detectPixKeyType(pixKey);
    return this.requestWithdrawal(
      amount,
      pixKey,
      pixKeyType,
      beneficiaryName,
      beneficiaryDocument,
      postbackUrl
    );
  }

  /**
   * Detecta o tipo de chave PIX baseado no formato
   */
  private detectPixKeyType(
    pixKey: string
  ): MedusaWithdrawalRequest["pixKeyType"] {
    const cleaned = pixKey.replace(/\D/g, "");

    // Email
    if (pixKey.includes("@")) {
      return "EMAIL";
    }

    // Telefone (com +55 ou 11 dígitos)
    if (pixKey.startsWith("+55") || (cleaned.length === 11 && cleaned.startsWith("9"))) {
      return "TELEFONE";
    }

    // CPF (11 dígitos)
    if (cleaned.length === 11 && !cleaned.startsWith("9")) {
      return "CPF";
    }

    // CNPJ (14 dígitos)
    if (cleaned.length === 14) {
      return "CNPJ";
    }

    // Chave aleatória (UUID ou formato aleatório)
    return "CHAVE_ALEATORIA";
  }

  /**
   * Consulta o status de um saque/transferência na Medusa
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<{ id: string; status: string } | null> {
    try {
      const data = await this.request<{ id: string; status: string }>(`/request/withdraw/${withdrawalId}`, {
        method: "GET",
      });
      
      console.log(`[Medusa] Status do saque ${withdrawalId}:`, data);
      
      return {
        id: data.id || withdrawalId,
        status: data.status || "unknown",
      };
    } catch (error) {
      console.error(`[Medusa] Erro ao consultar status do saque ${withdrawalId}:`, error);
      return null;
    }
  }
}

/**
 * MEDUSA STATUS (conforme documentação oficial)
 * - waiting_payment: Pagamento ainda não realizado
 * - pending: Em processamento
 * - approved: Confirmado com sucesso
 * - refused: Pagamento negado
 * - in_protest: Em disputa/contestação
 * - refunded: Valor devolvido ao pagador
 * - paid: Pagamento efetivado
 * - cancelled: Operação encerrada sem sucesso
 * - chargeback: Estorno iniciado pelo cliente ou instituição financeira
 */
export const MEDUSA_STATUS_MAP: Record<string, string> = {
  // Status de aguardando/processando -> pending
  waiting_payment: "pending",
  pending: "pending",
  processing: "pending",
  
  // Status de sucesso -> completed
  approved: "completed",
  paid: "completed",
  
  // Status de falha -> failed
  refused: "failed",
  
  // Status de cancelamento -> cancelled
  cancelled: "cancelled",
  
  // Status de disputa/estorno
  in_protest: "disputed",
  refunded: "refunded",
  chargeback: "chargeback",
  
  // Fallbacks para compatibilidade
  completed: "completed",
  failed: "failed",
  expired: "expired",
};

// Instância singleton com configuração do ambiente
let medusaInstance: MedusaPayments | null = null;

export function getMedusaPayments(secretKey?: string, licenseKey?: string): MedusaPayments {
  const key = secretKey || process.env.MEDUSA_SECRET_KEY;
  const license = licenseKey || process.env.MEDUSA_LICENSE_KEY;

  if (!key) {
    throw new Error("MEDUSA_SECRET_KEY não configurada");
  }

  if (!medusaInstance || secretKey) {
    medusaInstance = new MedusaPayments({ secretKey: key, licenseKey: license });
  }

  return medusaInstance;
}

// Helper para usar adquirente do banco de dados
export async function createMedusaFromDb(
  acquirerConfig: Record<string, unknown>
): Promise<MedusaPayments> {
  const secretKey = acquirerConfig.api_key as string;
  const licenseKey = acquirerConfig.api_secret as string;

  if (!secretKey) {
    throw new Error("API Key da Medusa Payments não configurada");
  }

  return new MedusaPayments({ secretKey, licenseKey });
}
