import "server-only";
import { generateText } from "ai";
import { xai } from "@ai-sdk/xai";
import { sendWhatsappText } from "@/lib/whatsapp/evolution";
import {
  addMessage,
  getMessages,
  setHandledBy,
  type Conversation,
} from "@/lib/whatsapp/conversations";

const BOT_SYSTEM_PROMPT = `Voce e um atendente da *Hyperion Pay*, um gateway de pagamentos digitais. Voce conversa com clientes pelo WhatsApp e deve soar como uma PESSOA REAL da equipe: simpatico, natural, prestativo e direto. Nunca diga que e um robo ou uma IA.

ESTILO DE CONVERSA:
- Portugues brasileiro, tom humano e acolhedor, como um atendente de verdade.
- Mensagens curtas e claras (no maximo 2 paragrafos curtos), porque e WhatsApp.
- Para negrito use UM asterisco de cada lado (padrao do WhatsApp), ex: *importante*.
- Nunca repita a mesma frase ou saudacao que voce ja enviou antes na conversa.
- Use o nome do cliente quando souber.

SOBRE O QUE VOCE RESPONDE (pode falar de tudo isso com seguranca):
- *Taxas*: PIX a partir de *R$ 0,50* por transacao. A taxa por venda varia de *0% a 1%*. Sem taxa de adesao, sem mensalidade e sem surpresas.
- *Como criar conta*: e gratis e leva menos de 2 minutos, sem burocracia. O cadastro e feito em *hyperionpay.com.br/auth/register* (ou no botao "Criar Conta" do site hyperionpay.com.br).
- *PIX*: instantaneo, 24 horas por dia, 7 dias por semana.
- *Saques*: processados em ate 24h uteis. Saques acima de *R$ 400* podem passar por aprovacao manual. KYC (verificacao de documentos) e obrigatorio para saques maiores.
- *Recursos da plataforma*: API REST completa e documentada, webhooks em tempo real, dashboard completo, relatorios detalhados, multiplas chaves PIX e saque rapido.
- *Links uteis*: Site: hyperionpay.com.br | Cadastro: hyperionpay.com.br/auth/register | Login: hyperionpay.com.br/auth/login | Instagram: @hyperionpay
- *Suporte*: 24 horas.

REGRAS:
- Responda SOMENTE sobre a Hyperion Pay e seus servicos. Se perguntarem de outro assunto, recuse com gentileza e traga de volta para a Hyperion Pay.
- NUNCA invente dados especificos da conta do cliente (saldo, status de uma transacao, valores que ele recebeu). Para isso, ofereca transferir para um atendente humano.
- Ao FINAL de cada resposta, de forma natural, lembre que ele pode falar com um atendente humano se quiser. Ex: "Se preferir, e so pedir que te transfiro para um atendente da nossa equipe."

TRANSFERIR PARA ATENDENTE HUMANO:
- Se o cliente pedir para falar com uma pessoa/atendente/humano/suporte de verdade, OU se for algo sensivel (conta bloqueada, saque que nao caiu, suspeita de fraude, problema financeiro especifico), responda APENAS com a tag [ESCALAR] no inicio, seguida de uma frase curta e calorosa avisando que vai transferir.
- Exemplo: "[ESCALAR] Claro! Ja estou te transferindo para um atendente da nossa equipe, em instantes alguem continua por aqui com voce. 🙂"`;

const ESCALATION_KEYWORDS = [
  "atendente",
  "humano",
  "pessoa de verdade",
  "falar com alguem",
  "falar com uma pessoa",
  "suporte humano",
  "quero falar com",
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
  "Certo! Vou te transferir para um de nossos atendentes. Em breve alguem continua o atendimento por aqui com voce. 🙂";

/**
 * Decide e executa a resposta automatica do bot para uma mensagem recebida.
 * - Se a conversa ja esta com humano, o bot NAO responde (atendente assumiu).
 * - Se o cliente pede humano (ou a IA decide escalar), transfere e silencia o bot.
 * - Caso contrario, gera uma resposta com IA e envia pelo WhatsApp.
 * - Para contatos novos, a IA recebe contexto para dar boas-vindas.
 * - Nunca reenvia uma mensagem identica a ultima que o bot ja mandou.
 */
export async function handleIncomingForBot(
  conversation: Conversation,
  incomingText: string
): Promise<void> {
  // Se ja esta sendo atendido por humano, o bot fica em silencio total.
  if (conversation.handled_by === "human") return;

  // Atalho: pedido explicito de humano -> escala sem gastar IA.
  if (wantsHuman(incomingText)) {
    await escalateToHuman(conversation);
    return;
  }

  // Historico recente para dar contexto a IA.
  const history = await getMessages(conversation.id, 20);

  // Detecta se este e o primeiro contato do cliente (so existe a msg que
  // acabou de chegar). Serve para o bot dar boas-vindas adequadas.
  const customerMessages = history.filter((m) => m.sender === "customer");
  const isFirstContact = customerMessages.length <= 1;

  const modelMessages = history.map((m) => ({
    role: (m.sender === "customer" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: m.content,
  }));

  // Para o primeiro contato, injeta uma orientacao de boas-vindas.
  const systemPrompt = isFirstContact
    ? `${BOT_SYSTEM_PROMPT}

CONTEXTO: Este e o PRIMEIRO contato deste cliente. Comece com uma saudacao calorosa de boas-vindas a Hyperion Pay, apresente-se brevemente como parte da equipe e pergunte como pode ajudar, alem de responder o que ele perguntou.`
    : BOT_SYSTEM_PROMPT;

  let replyText = "";
  try {
    const { text } = await generateText({
      model: xai("grok-3-fast"),
      system: systemPrompt,
      messages: modelMessages,
    });
    replyText = text.trim();
  } catch (error) {
    console.error("[WhatsAppBot] Erro ao gerar resposta:", error);
    // Falha temporaria da IA: NAO escala para humano (senao a conversa ficaria
    // travada em "humano" para sempre). Apenas avisa de forma leve, sem mudar
    // o handled_by, para que o bot volte a responder assim que a IA normalizar.
    await sendBotMessage(
      conversation,
      "Estou com uma instabilidade momentanea por aqui. Pode repetir sua mensagem em instantes? Se preferir, e so pedir que te transfiro para um atendente da nossa equipe."
    );
    return;
  }

  // A IA sinalizou que deve escalar para humano.
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
 * Evita reenviar uma mensagem identica a ultima ja enviada pelo bot.
 */
async function sendBotMessage(
  conversation: Conversation,
  content: string
): Promise<void> {
  // Anti-duplicata: se a ultima mensagem do bot for igual, nao reenvia.
  const recent = await getMessages(conversation.id, 6);
  const lastBotMsg = [...recent]
    .reverse()
    .find((m) => m.sender === "bot");
  if (lastBotMsg && lastBotMsg.content.trim() === content.trim()) {
    console.log("[WhatsAppBot] Mensagem duplicada ignorada.");
    return;
  }

  const result = await sendWhatsappText(conversation.phone, content);
  await addMessage({
    conversationId: conversation.id,
    direction: "out",
    sender: "bot",
    content: result.ok ? content : `(falha no envio) ${content}`,
  });
}
