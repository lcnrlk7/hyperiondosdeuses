import webpush from "web-push";
import { sql } from "@/lib/db";

// Configurar VAPID keys (você precisa gerar essas chaves)
// Para gerar: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@hyperionpay.com.br";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Enviar notificação push para um usuário específico
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  console.log("[v0] sendPushNotification called:", { userId, title: payload.title });
  
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[v0] VAPID keys not configured, skipping push notification");
    return { success: false, sent: 0, failed: 0 };
  }

  console.log("[v0] VAPID keys configured, searching subscriptions for user:", userId);

  // Buscar todas as subscriptions do usuário
  const subscriptions = await sql`
    SELECT * FROM push_subscriptions WHERE user_id = ${userId}
  `;

  console.log("[v0] Found subscriptions:", subscriptions?.length || 0);

  if (!subscriptions || subscriptions.length === 0) {
    console.log("[v0] No push subscriptions found for user:", userId);
    return { success: false, sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192x192.png",
    badge: payload.badge || "/icon-192x192.png",
    tag: payload.tag,
    data: payload.data,
    actions: payload.actions,
  });

  let sent = 0;
  let failed = 0;

  // Enviar para todas as subscriptions do usuário
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        notificationPayload
      );
      sent++;
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      console.error("[v0] Push notification failed:", error);
      failed++;

      // Se a subscription expirou ou é inválida, remover
      if (error.statusCode === 410 || error.statusCode === 404) {
        await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`;
        console.log("[v0] Removed expired subscription:", sub.id);
      }
    }
  }

  return { success: sent > 0, sent, failed };
}

/**
 * Enviar notificação de nova transação PIX gerada
 */
export async function notifyNewTransaction(
  userId: string,
  amount: number,
  transactionId: string
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  await sendPushNotification(userId, {
    title: "Nova cobranca PIX",
    body: `Uma cobranca de ${formattedAmount} foi gerada`,
    tag: `transaction-${transactionId}`,
    data: {
      type: "new_transaction",
      transactionId,
      amount,
      url: "/dashboard/transactions",
    },
    actions: [
      {
        action: "view",
        title: "Ver detalhes",
      },
    ],
  });
}

/**
 * Enviar notificacao de transacao aprovada/paga com valor bruto e liquido
 */
export async function notifyTransactionApproved(
  userId: string,
  grossAmount: number,
  netAmount: number,
  transactionId: string
): Promise<void> {
  const formattedGross = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(grossAmount);
  
  const formattedNet = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(netAmount);

  await sendPushNotification(userId, {
    title: "Venda Aprovada!",
    body: `Bruto: ${formattedGross} | Liquido: ${formattedNet}`,
    tag: `transaction-approved-${transactionId}`,
    data: {
      type: "transaction_approved",
      transactionId,
      grossAmount,
      netAmount,
      url: "/dashboard",
    },
    actions: [
      {
        action: "view",
        title: "Ver saldo",
      },
    ],
  });
}

/**
 * Enviar notificacao de saque aprovado com valor bruto, liquido e taxa
 */
export async function notifyWithdrawalApproved(
  userId: string,
  grossAmount: number,
  netAmount: number,
  fee: number,
  withdrawalId: string
): Promise<void> {
  const formattedGross = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(grossAmount);
  
  const formattedNet = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(netAmount);
  
  const formattedFee = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(fee);

  await sendPushNotification(userId, {
    title: "Saque Aprovado!",
    body: `Valor: ${formattedGross} | Taxa: ${formattedFee} | Recebido: ${formattedNet}`,
    tag: `withdrawal-${withdrawalId}`,
    data: {
      type: "withdrawal_approved",
      withdrawalId,
      grossAmount,
      netAmount,
      fee,
      url: "/dashboard/wallet",
    },
  });
}

/**
 * Enviar notificação de KYC aprovado
 */
export async function notifyKYCApproved(userId: string): Promise<void> {
  await sendPushNotification(userId, {
    title: "KYC Aprovado!",
    body: "Parabens! Sua conta foi verificada e esta pronta para uso",
    tag: "kyc-approved",
    data: {
      type: "kyc_approved",
      url: "/dashboard",
    },
  });
}

/**
 * Enviar notificação de PIX gerado no checkout
 */
export async function notifyPixGenerated(
  userId: string,
  amount: number,
  orderId: string,
  customerName: string
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  await sendPushNotification(userId, {
    title: "PIX Gerado!",
    body: `${customerName} iniciou compra de ${formattedAmount}. Aguardando pagamento...`,
    tag: `pix-generated-${orderId}`,
    data: {
      type: "pix_generated",
      orderId,
      amount,
      url: "/dashboard/transactions",
    },
  });
}

/**
 * Enviar notificação de pagamento confirmado no checkout
 */
export async function notifyCheckoutPayment(
  userId: string,
  amount: number,
  customerName: string,
  productName: string
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  await sendPushNotification(userId, {
    title: "Venda Confirmada!",
    body: `${customerName} comprou ${productName} por ${formattedAmount}`,
    tag: `checkout-paid-${Date.now()}`,
    data: {
      type: "checkout_paid",
      amount,
      url: "/dashboard",
    },
  });
}

/**
 * Enviar notificação para TODOS os usuários com push ativo
 */
export async function sendPushToAllUsers(
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, sent: 0, failed: 0 };
  }

  // Buscar todas as subscriptions ativas da coluna push_subscription em profiles
  const users = await sql`
    SELECT id, push_subscription 
    FROM profiles 
    WHERE notifications_push = true 
    AND push_subscription IS NOT NULL
  `;

  if (!users || users.length === 0) {
    return { success: false, sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192x192.png",
    badge: payload.badge || "/icon-192x192.png",
    tag: payload.tag || `broadcast-${Date.now()}`,
    data: payload.data,
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const sub = user.push_subscription as { endpoint: string; keys: { p256dh: string; auth: string } };
      
      if (!sub || !sub.endpoint || !sub.keys) {
        failed++;
        continue;
      }

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        notificationPayload
      );
      sent++;
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      failed++;
      // Se subscription expirou, limpar do profile
      if (error.statusCode === 410 || error.statusCode === 404) {
        await sql`UPDATE profiles SET push_subscription = NULL, notifications_push = false WHERE id = ${user.id}`;
      }
    }
  }

  return { success: sent > 0, sent, failed };
}

/**
 * Buscar mensagem motivacional aleatória
 */
export async function getRandomMotivationalMessage(): Promise<string | null> {
  try {
    const result = await sql`
      SELECT message FROM motivational_messages 
      WHERE is_active = true 
      ORDER BY RANDOM() 
      LIMIT 1
    `;
    return result.length > 0 ? result[0].message : null;
  } catch {
    return null;
  }
}

/**
 * Enviar mensagem motivacional para um usuário
 */
export async function sendMotivationalMessage(userId: string): Promise<void> {
  const message = await getRandomMotivationalMessage();
  if (!message) return;

  await sendPushNotification(userId, {
    title: "Hyperion Pay",
    body: message,
    tag: `motivation-${Date.now()}`,
    data: {
      type: "motivation",
      url: "/dashboard",
    },
  });
}

/**
 * Enviar mensagem motivacional para todos os usuários
 */
export async function sendMotivationalToAll(): Promise<{ success: boolean; sent: number; failed: number }> {
  const message = await getRandomMotivationalMessage();
  if (!message) return { success: false, sent: 0, failed: 0 };

  return sendPushToAllUsers({
    title: "Hyperion Pay",
    body: message,
    tag: `motivation-broadcast-${Date.now()}`,
    data: {
      type: "motivation",
      url: "/dashboard",
    },
  });
}
