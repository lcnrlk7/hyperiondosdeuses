import { sql } from "@/lib/db";
import { sendPushNotification } from "@/lib/push-notifications";

export type NotificationType = "deposit" | "withdrawal" | "transaction" | "pix" | "kyc" | "system" | "success" | "error" | "warning" | "info";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  sendPush?: boolean;
  pushData?: Record<string, unknown>;
}

/**
 * Cria uma notificacao no banco de dados e envia push notification
 */
export async function createNotification({ userId, title, message, type, sendPush = true, pushData }: CreateNotificationParams): Promise<void> {
  try {
    // Salvar no banco de dados
    await sql`
      INSERT INTO user_notifications (id, user_id, title, message, type, read, created_at)
      VALUES (
        ${crypto.randomUUID()},
        ${userId},
        ${title},
        ${message},
        ${type},
        false,
        NOW()
      )
    `;
    
    // Enviar push notification se habilitado
    if (sendPush) {
      await sendPushNotification(userId, {
        title,
        body: message,
        tag: `${type}-${Date.now()}`,
        data: {
          type,
          url: getUrlForType(type),
          ...pushData
        }
      });
    }
  } catch (error) {
    console.error("[Notifications] Erro ao criar notificacao:", error);
  }
}

/**
 * Retorna a URL de destino baseada no tipo de notificacao
 */
function getUrlForType(type: NotificationType): string {
  switch (type) {
    case "deposit":
    case "transaction":
    case "pix":
      return "/dashboard/transactions";
    case "withdrawal":
      return "/dashboard/wallet";
    case "kyc":
      return "/dashboard/settings";
    default:
      return "/dashboard";
  }
}

/**
 * Notifica sobre um deposito/PIX recebido
 */
export async function notifyDeposit(userId: string, amount: number, description?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Deposito Recebido!",
    message: `Voce recebeu um deposito de ${formattedAmount}${description ? ` - ${description}` : ''}`,
    type: "success"
  });
}

/**
 * Notifica sobre uma cobranca PIX criada
 */
export async function notifyPixCreated(userId: string, amount: number, externalId: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Cobranca PIX Gerada",
    message: `Cobranca PIX de ${formattedAmount} gerada. Aguardando pagamento.`,
    type: "info",
    pushData: { amount }
  });
}

/**
 * Notifica sobre um PIX pago com valor bruto e liquido
 */
export async function notifyPixPaid(userId: string, grossAmount: number, netAmount: number, payerName?: string, transactionId?: string): Promise<void> {
  // Idempotencia: garante que a notificacao de "pagamento recebido" seja criada
  // apenas UMA vez por transacao, mesmo que varios webhooks/crons/polling detectem
  // o mesmo pagamento. Marca a transacao atomicamente e sai se ja foi notificada.
  if (transactionId) {
    const marked = await sql`
      UPDATE transactions
      SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"paid_notified": true}'::jsonb
      WHERE id = ${transactionId}
        AND COALESCE((metadata->>'paid_notified')::boolean, false) = false
      RETURNING id
    `;
    if (marked.length === 0) {
      return;
    }
  }

  const formattedGross = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossAmount);
  const formattedNet = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netAmount);
  const payerPart = payerName && payerName.trim() ? `de ${payerName.trim()} ` : '';
  await createNotification({
    userId,
    title: "Transferencia PIX recebida",
    message: `Voce recebeu ${formattedGross} ${payerPart}| Liquido: ${formattedNet}`,
    type: "success",
    pushData: {
      grossAmount,
      netAmount,
      payerName: payerName || null
    }
  });
}

/**
 * Notifica sobre deposito feito por admin
 */
export async function notifyAdminDeposit(userId: string, amount: number, adminName?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Deposito Recebido!",
    message: `Voce recebeu um deposito de ${formattedAmount}`,
    type: "success",
    pushData: {
      amount,
      type: "admin_deposit"
    }
  });
}

/**
 * Notifica mensagem motivacional
 */
export async function notifyMotivational(userId: string, title: string, message: string): Promise<void> {
  await createNotification({
    userId,
    title,
    message,
    type: "info",
    pushData: {
      type: "motivational"
    }
  });
}

/**
 * Notifica sobre um saque solicitado
 */
export async function notifyWithdrawalRequested(userId: string, amount: number, pixKey: string, recipientName?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const maskedKey = pixKey.length > 8 ? `${pixKey.substring(0, 4)}***${pixKey.substring(pixKey.length - 4)}` : pixKey;
  const destino = recipientName && recipientName.trim() ? `${recipientName.trim()} (${maskedKey})` : maskedKey;
  await createNotification({
    userId,
    title: "Saque Solicitado",
    message: `Saque de ${formattedAmount} para ${destino} esta sendo processado`,
    type: "info",
    pushData: { amount, pixKey: maskedKey, recipientName: recipientName || null }
  });
}

/**
 * Notifica sobre um saque aprovado/concluido
 */
export async function notifyWithdrawalCompleted(userId: string, grossAmount: number, netAmount: number, fee: number, pixKey: string, endToEnd?: string, recipientName?: string): Promise<void> {
  const formattedGross = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossAmount);
  const formattedNet = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netAmount);
  const formattedFee = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fee);
  const maskedKey = pixKey.length > 8 ? `${pixKey.substring(0, 4)}***${pixKey.substring(pixKey.length - 4)}` : pixKey;
  const destino = recipientName && recipientName.trim() ? `${recipientName.trim()} (${maskedKey})` : maskedKey;
  await createNotification({
    userId,
    title: "Saque Concluido!",
    message: `Valor: ${formattedGross} | Taxa: ${formattedFee} | Debitado: ${formattedNet} - Enviado para ${destino}`,
    type: "success",
    pushData: {
      grossAmount,
      netAmount,
      fee,
      endToEnd,
      recipientName: recipientName || null
    }
  });
}

/**
 * Notifica sobre um saque que falhou
 */
export async function notifyWithdrawalFailed(userId: string, amount: number, reason?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Saque Falhou",
    message: `Seu saque de ${formattedAmount} falhou${reason ? `: ${reason}` : ''}. O valor foi devolvido ao seu saldo.`,
    type: "error"
  });
}

/**
 * Notifica sobre um saque pendente de aprovacao
 */
export async function notifyWithdrawalPending(userId: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Saque em Analise",
    message: `Seu saque de ${formattedAmount} esta aguardando aprovacao. Voce sera notificado quando for processado.`,
    type: "warning"
  });
}

/**
 * Notifica sobre transacao via API/integracao
 */
export async function notifyTransactionReceived(userId: string, amount: number, integrationName?: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  await createNotification({
    userId,
    title: "Transacao Recebida!",
    message: `Voce recebeu ${formattedAmount}${integrationName ? ` via ${integrationName}` : ''}`,
    type: "transaction"
  });
}

/**
 * Notifica sobre atualizacao de KYC
 */
export async function notifyKycStatus(userId: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
  const titles: Record<string, string> = {
    approved: "KYC Aprovado!",
    rejected: "KYC Rejeitado",
    pending: "KYC em Analise"
  };
  const messages: Record<string, string> = {
    approved: "Sua verificacao de identidade foi aprovada. Voce agora tem acesso completo a plataforma.",
    rejected: "Sua verificacao de identidade foi rejeitada. Entre em contato com o suporte para mais informacoes.",
    pending: "Seus documentos estao sendo analisados. Voce sera notificado quando a verificacao for concluida."
  };
  const types: Record<string, NotificationType> = {
    approved: "success",
    rejected: "error",
    pending: "warning"
  };
  await createNotification({
    userId,
    title: titles[status],
    message: messages[status],
    type: types[status]
  });
}
