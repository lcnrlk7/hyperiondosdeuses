import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import webpush from "web-push";

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:suporte@hyperionpay.com.br",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json({ error: "Email obrigatorio" }, { status: 400 });
    }

    // Buscar usuario
    const users = await sql`
      SELECT id, email FROM profiles WHERE email = ${email}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const user = users[0];

    // Buscar subscriptions do usuario
    const subscriptions = await sql`
      SELECT * FROM push_subscriptions WHERE user_id = ${user.id}
    `;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        error: "Nenhuma subscription encontrada",
        user_id: user.id 
      }, { status: 404 });
    }

    const results = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: "Teste Hyperion Pay",
          body: "Se voce esta vendo isso, as notificacoes estao funcionando!",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "test-notification",
          data: {
            url: "/dashboard",
            type: "test",
          },
        });

        await webpush.sendNotification(pushSubscription, payload);
        
        results.push({
          subscription_id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + "...",
          status: "success",
        });
      } catch (error: any) {
        console.error("[v0] Erro ao enviar push:", error);
        
        // Se subscription expirou, remover
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`;
          results.push({
            subscription_id: sub.id,
            status: "removed",
            reason: "Subscription expirada ou invalida",
          });
        } else {
          results.push({
            subscription_id: sub.id,
            status: "error",
            error: error.message,
            statusCode: error.statusCode,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Teste de notificacao enviado",
      user_email: email,
      results,
    });
  } catch (error: any) {
    console.error("[v0] Erro geral:", error);
    return NextResponse.json({ 
      error: "Erro interno", 
      details: error.message 
    }, { status: 500 });
  }
}
