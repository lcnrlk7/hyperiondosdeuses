import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import webpush from "web-push";
import { generateUniqueMotivationalMessage } from "@/lib/motivational-messages";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = "mailto:contato@hyperionpay.com.br";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * API para enviar mensagens motivacionais para todos os usuarios
 * 
 * USO COM SERVICO DE CRON EXTERNO (cron-job.org, EasyCron, etc):
 * 
 * URL: https://seudominio.com/api/cron/motivational?key=SUA_CHAVE_AQUI
 * 
 * Configure a variavel de ambiente CRON_SECRET no Vercel com uma chave segura
 * Depois adicione essa URL no seu servico de cron nos horarios desejados
 * 
 * Horarios sugeridos: 08:00, 11:00, 14:00, 17:00, 20:00
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar chave de autenticacao via query param
    const cronSecret = process.env.CRON_SECRET;
    const providedKey = request.nextUrl.searchParams.get("key");
    
    // Se CRON_SECRET esta configurado, exigir a chave
    if (cronSecret && providedKey !== cronSecret) {
      console.log("[Motivational Cron] Acesso negado - chave invalida");
      return NextResponse.json({ error: "Chave invalida" }, { status: 401 });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    console.log("[Motivational Cron] Iniciando envio de mensagens motivacionais...");

    // Buscar todos os usuários ativos com push subscription
    const users = await sql`
      SELECT id, email, push_subscription, name
      FROM profiles
      WHERE push_subscription IS NOT NULL
      AND is_active = true
      AND notifications_push = true
    `;

    console.log(`[Motivational Cron] Encontrados ${users.length} usuarios com push ativo`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const subscription = user.push_subscription;
        
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
          console.log(`[Motivational Cron] Usuario ${user.email} sem subscription valida`);
          continue;
        }

        // Gerar mensagem única para este usuário
        const { title, message, hash } = generateUniqueMotivationalMessage(user.id);

        // Criar payload da notificação
        const payload = JSON.stringify({
          title,
          body: message,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `motivational-${hash}`,
          data: {
            type: "motivational",
            url: "/dashboard",
            hash
          }
        });

        // Enviar push notification
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          },
          payload
        );

        // NAO criar notificacao no banco - mensagens motivacionais vao apenas via push
        console.log(`[Motivational Cron] Enviado para ${user.email}: "${title}"`);
        sent++;

      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number };
        console.error(`[Motivational Cron] Erro ao enviar para ${user.email}:`, err.message);
        
        // Se subscription expirou (410 Gone), remover
        if (err.statusCode === 410) {
          await sql`
            UPDATE profiles 
            SET push_subscription = NULL 
            WHERE id = ${user.id}
          `;
          console.log(`[Motivational Cron] Subscription removida para ${user.email} (expirada)`);
        }
        
        failed++;
        errors.push(`${user.email}: ${err.message}`);
      }
    }

    console.log(`[Motivational Cron] Concluido: ${sent} enviados, ${failed} falhas`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: users.length,
      errors: errors.slice(0, 10) // Limitar erros retornados
    });

  } catch (error) {
    console.error("[Motivational Cron] Erro geral:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST - Enviar mensagem motivacional para usuário específico (para testes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: "userId or email required" }, { status: 400 });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    // Buscar usuário
    const users = email 
      ? await sql`SELECT id, email, push_subscription FROM profiles WHERE email = ${email}`
      : await sql`SELECT id, email, push_subscription FROM profiles WHERE id = ${userId}`;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
    const subscription = user.push_subscription;

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "User has no push subscription" }, { status: 400 });
    }

    // Gerar mensagem
    const { title, message, hash } = generateUniqueMotivationalMessage(user.id);

    // Enviar push
    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: `motivational-${hash}`,
      data: {
        type: "motivational",
        url: "/dashboard"
      }
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      payload
    );

    // NAO criar notificacao no banco - mensagens motivacionais vao apenas via push

    return NextResponse.json({
      success: true,
      title,
      message,
      sentTo: user.email
    });

  } catch (error) {
    console.error("[Motivational] Erro:", error);
    return NextResponse.json(
      { error: "Failed to send", details: (error as Error).message },
      { status: 500 }
    );
  }
}
