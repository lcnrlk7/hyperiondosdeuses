import { NextResponse } from "next/server";
import { requireAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import {
  getMessages,
  markRead,
  setHandledBy,
  addMessage,
} from "@/lib/whatsapp/conversations";
import { sql } from "@/lib/db";
import { sendWhatsappText } from "@/lib/whatsapp/evolution";

export const dynamic = "force-dynamic";

// Lista as mensagens de uma conversa
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return accessDeniedResponse();

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    const rows =
      await sql`SELECT * FROM whatsapp_conversations WHERE id = ${conversationId} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Conversa nao encontrada" },
        { status: 404 }
      );
    }
    const messages = await getMessages(conversationId);
    await markRead(conversationId);
    return NextResponse.json({ conversation: rows[0], messages });
  } catch (error) {
    console.error("[WhatsApp Inbox] Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

// Acoes: enviar mensagem do atendente ou alternar bot/humano
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return accessDeniedResponse();

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const rows =
      await sql`SELECT * FROM whatsapp_conversations WHERE id = ${conversationId} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Conversa nao encontrada" },
        { status: 404 }
      );
    }
    const conv = rows[0] as { phone: string };

    if (action === "takeover") {
      await setHandledBy(conversationId, "human", admin.userId);
      return NextResponse.json({ ok: true, handled_by: "human" });
    }

    if (action === "release") {
      await setHandledBy(conversationId, "bot", null);
      return NextResponse.json({ ok: true, handled_by: "bot" });
    }

    if (action === "send") {
      const text = String(body.text ?? "").trim();
      if (!text) {
        return NextResponse.json(
          { error: "Mensagem vazia" },
          { status: 400 }
        );
      }
      // Ao responder manualmente, garante que a conversa fica em modo humano
      await setHandledBy(conversationId, "human", admin.userId);
      const result = await sendWhatsappText(conv.phone, text);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || "Falha ao enviar" },
          { status: 502 }
        );
      }
      const message = await addMessage({
        conversationId,
        direction: "out",
        sender: "admin",
        content: text,
      });
      return NextResponse.json({ ok: true, message });
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
  } catch (error) {
    console.error("[WhatsApp Inbox] Erro na acao:", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
