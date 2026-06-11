import { NextRequest, NextResponse } from "next/server";
import { parseIncomingMessage } from "@/lib/whatsapp/evolution";
import {
  getOrCreateConversation,
  addMessage,
} from "@/lib/whatsapp/conversations";
import { handleIncomingForBot } from "@/lib/whatsapp/bot";

export const maxDuration = 60;

// A Evolution API chama esta rota a cada evento. Protegemos com um token
// passado na query string (?secret=...), configurado na URL do webhook.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) return true; // se nao configurado, nao bloqueia (apenas loga)
  const provided = request.nextUrl.searchParams.get("secret");
  return provided === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignora corpos invalidos
  }

  // A Evolution envia varios tipos de evento; so tratamos mensagens novas.
  const event: string = payload?.event ?? "";
  if (event && !event.toLowerCase().includes("messages")) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const incoming = parseIncomingMessage(payload);
  // Ignora mensagens enviadas por nos mesmos (eco) e nao-texto
  if (!incoming || incoming.fromMe) {
    return NextResponse.json({ ok: true });
  }

  try {
    const conversation = await getOrCreateConversation(incoming.phone, {
      name: incoming.pushName,
      remoteJid: incoming.remoteJid,
    });

    await addMessage({
      conversationId: conversation.id,
      direction: "in",
      sender: "customer",
      content: incoming.text,
      externalId: incoming.externalId,
      incrementUnread: true,
    });

    // Encaminha para o bot decidir se responde automaticamente.
    // (Nao falha o webhook se o bot der erro.)
    handleIncomingForBot(conversation, incoming.text).catch((e) =>
      console.error("[WhatsAppWebhook] Erro no bot:", e)
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WhatsAppWebhook] Erro ao processar mensagem:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// A Evolution pode fazer um GET de verificacao
export async function GET() {
  return NextResponse.json({ ok: true, service: "whatsapp-webhook" });
}
