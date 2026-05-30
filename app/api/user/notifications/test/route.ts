import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import webpush from "web-push";

// Configurar VAPID keys (em producao, usar variaveis de ambiente)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:suporte@hyperionpay.com.br",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // "push" or "email"

    // Buscar dados do usuario
    const result = await sql`
      SELECT name, email, push_subscription, notifications_push, notifications_email
      FROM profiles 
      WHERE id = ${session.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const user = result[0];

    if (type === "push") {
      if (!user.push_subscription) {
        return NextResponse.json({ 
          error: "Nenhuma inscricao push encontrada. Ative as notificacoes primeiro." 
        }, { status: 400 });
      }

      try {
        const subscription = typeof user.push_subscription === "string" 
          ? JSON.parse(user.push_subscription) 
          : user.push_subscription;

        const payload = JSON.stringify({
          title: "Teste de Notificacao",
          body: "Suas notificacoes push estao funcionando! Voce recebera alertas de vendas aqui.",
          icon: "/images/logo-hyperion.png",
          badge: "/images/logo-hyperion.png",
          tag: "test-notification",
          data: {
            type: "test",
            url: "/dashboard"
          }
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ 
          success: true, 
          message: "Notificacao push enviada com sucesso!" 
        });
      } catch (pushError: any) {
        console.error("Erro ao enviar push:", pushError);
        
        // Se a subscription expirou, limpar do banco
        if (pushError.statusCode === 410) {
          await sql`
            UPDATE profiles 
            SET push_subscription = NULL, notifications_push = false
            WHERE id = ${session.userId}
          `;
          return NextResponse.json({ 
            error: "Inscricao expirada. Por favor, ative as notificacoes novamente." 
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          error: "Erro ao enviar notificacao push" 
        }, { status: 500 });
      }
    }

    if (type === "email") {
      // Aqui integraria com servico de email (SendGrid, Resend, etc)
      // Por enquanto, simula o envio
      
      // Em producao, usar algo como:
      // await sendEmail({
      //   to: user.email,
      //   subject: "Teste de Notificacao - Hyperion Pay",
      //   body: "Este e um email de teste..."
      // });

      return NextResponse.json({ 
        success: true, 
        message: `Email de teste enviado para ${user.email}` 
      });
    }

    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao enviar teste:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
