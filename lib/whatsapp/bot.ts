import "server-only";
import { generateText } from "ai";
import { sendWhatsappText } from "@/lib/whatsapp/evolution";
import {
  addMessage,
  getMessages,
  setHandledBy,
  type Conversation,
} from "@/lib/whatsapp/conversations";

const BOT_SYSTEM_PROMPT = `Voce e o atendente virtual da *Hyperion Pay*, uma plataforma de gateway de pagamentos digitais. Voce atende clientes pelo WhatsApp.

REGRAS IMPORTANTES:
- Responda APENAS sobre a Hyperion Pay: pagamentos, PIX, saques, depositos, taxas, KYC, API, conta e problemas da plataforma.
- Se perguntarem sobre outros assuntos, recuse educadamente e volte ao foco da Hyperion Pay.
- Seja breve e direto (no maximo 2 paragrafos curtos). Esta no WhatsApp, entao use mensagens curtas.
- Use portugues brasileiro, tom amigavel e profissional.
- Para negrito use UM asterisco de cada lado (formato do WhatsApp), ex: *importante*.
- NUNCA invente dados financeiros, saldos ou status de transacao especificos do cliente. Para isso, oriente a falar com um atendente humano.

ESCALAR PARA HUMANO:
- Se o cliente pedir explicitamente para falar com um atendente/humano/pessoa, OU se for um problema sensivel (conta bloqueada, saque que nao caiu, suspeita de fraude, valores especificos da conta dele), responda APENAS com a tag [ESCALAR] no inicio da mensagem, seguida de uma frase curta avisando que vai transferir para um atendente humano.
- Exemplo: "[ESCALAR] Entendi! Vou te transferir para um de nossos atendentes, ja ja alguem te responde por aqui."

INFORMACOES UTEIS:
- PIX: instantaneo, 24/7.
- Saques: processados em ate 24h uteis.
- KYC obrigatorio para saques acima de R$1.000.
- Sempre que possivel, ofereca ajuda adicional ao final.`;

const ESCALATION_KEYWORDS = [
  "atendente",
  "humano",
  "pessoa",
  "falar com alguem",
  "suporte humano",
  "reclamacao",
  "reclamar",
  "processar",
  "advogado",
];

function wantsHuman(text: string): boolean {
  const t = text.toLowerCase();
  return ESCALATION_KEYWORDS.some((k) => t.includes(k));
}

const HANDOFF_MESSAGE =
  "Certo! Vou transferir voce para um de nossos atendentes. Em breve alguem continua o atendimento por aqui. 🙂";

/**
 * Decide e executa a resposta automatica do bot para uma mensagem recebida.
 * - Se a conversa ja esta com humano, o bot nao responde.
 * - Se o cliente pede humano (ou a IA decide escalar), muda para modo humano
 *   e avisa que sera transferido.
 * - Caso contrario, gera uma resposta com IA e envia pelo WhatsApp.
 */
export async function handleIncomingForBot(
  conversation: Conversation,
  incomingText: string
): Promise<void> {
  // Se ja esta sendo atendido por humano, o bot fica em silencio.
  if (conversation.handled_by === "human") return;

  // Atalho: pedido explicito de humano -> escala sem gastar IA.
  if (wantsHuman(incomingText)) {
    await escalateToHuman(conversation);
    return;
  }

  // Monta o historico recente para dar contexto a IA.
  const history = await getMessages(conversation.id, 20);
  const modelMessages = history.map((m) => ({
    role: (m.sender === "customer" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: m.content,
  }));

  let replyText = "";
  try {
    const { text } = await generateText({
      model: "xai/grok-4.1-fast-non-reasoning",
      system: BOT_SYSTEM_PROMPT,
      messages: modelMessages,
    });
    replyText = text.trim();
  } catch (error) {
    console.error("[WhatsAppBot] Erro ao gerar resposta:", error);
    // Em caso de falha da IA, escala para humano para nao deixar o cliente sem resposta.
    await escalateToHuman(conversation);
    return;
  }

  // A IA sinalizou que deve escalar.
  if (replyText.startsWith("[ESCALAR]")) {
    const note = replyText.replace("[ESCALAR]", "").trim() || HANDOFF_MESSAGE;
    await sendBotMessage(conversation, note);
    await setHandledBy(conversation.id, "human", null);
    return;
  }

  if (replyText) {
    await sendBotMessage(conversation, replyText);
  }
}

async function escalateToHuman(conversation: Conversation): Promise<void> {
  await sendBotMessage(conversation, HANDOFF_MESSAGE);
  await setHandledBy(conversation.id, "human", null);
}

/**
 * Envia uma mensagem do bot pelo WhatsApp e registra no banco.
 */
async function sendBotMessage(
  conversation: Conversation,
  content: string
): Promise<void> {
  const result = await sendWhatsappText(conversation.phone, content);
  await addMessage({
    conversationId: conversation.id,
    direction: "out",
    sender: "bot",
    content: result.ok ? content : `(falha no envio) ${content}`,
  });
}
