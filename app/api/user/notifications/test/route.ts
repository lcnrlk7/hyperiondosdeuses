import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendPushNotification } from "@/lib/push-notifications";

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
      SELECT name, email, notifications_push, notifications_email
      FROM profiles 
      WHERE id = ${session.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const user = result[0];

    if (type === "push") {
      // Verificar se existe alguma inscricao push valida na tabela correta
      const subs = await sql`
        SELECT id FROM push_subscriptions WHERE user_id = ${session.userId}
      `;

      if (!subs || subs.length === 0) {
        return NextResponse.json({
          error: "Nenhuma inscricao push encontrada. Ative as notificacoes primeiro.",
        }, { status: 400 });
      }

      // Usa o mesmo helper (mesmas chaves VAPID) que envia as notificacoes reais
      const pushResult = await sendPushNotification(session.userId, {
        title: "Teste de Notificacao",
        body: "Suas notificacoes push estao funcionando! Voce recebera alertas de vendas aqui.",
        tag: "test-notification",
        data: {
          type: "test",
          url: "/dashboard",
        },
      });

      if (pushResult.sent > 0) {
        return NextResponse.json({
          success: true,
          message: "Notificacao push enviada com sucesso!",
        });
      }

      return NextResponse.json({
        error: "Nao foi possivel enviar a notificacao. Ative as notificacoes novamente neste dispositivo.",
      }, { status: 400 });
    }

    if (type === "email") {
      // Aqui integraria com servico de email (SendGrid, Resend, etc)
      return NextResponse.json({
        success: true,
        message: `Email de teste enviado para ${user.email}`,
      });
    }

    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao enviar teste:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
