import "server-only";
import { sql } from "@/lib/db";

export interface Conversation {
  id: number;
  phone: string;
  name: string | null;
  remote_jid: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  handled_by: "bot" | "human";
  assigned_admin_id: string | null;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  direction: "in" | "out";
  sender: "customer" | "bot" | "admin";
  content: string;
  external_id: string | null;
  created_at: string;
}

/**
 * Busca uma conversa pelo telefone, criando-a se nao existir.
 */
export async function getOrCreateConversation(
  phone: string,
  opts: { name?: string | null; remoteJid?: string | null } = {}
): Promise<Conversation> {
  const existing = await sql`
    SELECT * FROM whatsapp_conversations WHERE phone = ${phone} LIMIT 1
  `;
  if (existing.length > 0) {
    // Atualiza nome/jid se vierem novos e ainda nao tivermos
    if (opts.name || opts.remoteJid) {
      await sql`
        UPDATE whatsapp_conversations
        SET name = COALESCE(name, ${opts.name ?? null}),
            remote_jid = COALESCE(remote_jid, ${opts.remoteJid ?? null}),
            updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    }
    return existing[0] as Conversation;
  }

  const created = await sql`
    INSERT INTO whatsapp_conversations (phone, name, remote_jid)
    VALUES (${phone}, ${opts.name ?? null}, ${opts.remoteJid ?? null})
    RETURNING *
  `;
  return created[0] as Conversation;
}

/**
 * Adiciona uma mensagem a uma conversa e atualiza os metadados da conversa.
 */
export async function addMessage(params: {
  conversationId: number;
  direction: "in" | "out";
  sender: "customer" | "bot" | "admin";
  content: string;
  externalId?: string | null;
  incrementUnread?: boolean;
}): Promise<Message> {
  const {
    conversationId,
    direction,
    sender,
    content,
    externalId = null,
    incrementUnread = false,
  } = params;

  const inserted = await sql`
    INSERT INTO whatsapp_messages (conversation_id, direction, sender, content, external_id)
    VALUES (${conversationId}, ${direction}, ${sender}, ${content}, ${externalId})
    RETURNING *
  `;

  await sql`
    UPDATE whatsapp_conversations
    SET last_message = ${content.slice(0, 500)},
        last_message_at = NOW(),
        updated_at = NOW(),
        unread_count = unread_count + ${incrementUnread ? 1 : 0}
    WHERE id = ${conversationId}
  `;

  return inserted[0] as Message;
}

/**
 * Lista as conversas mais recentes para o painel.
 */
export async function listConversations(limit = 100): Promise<Conversation[]> {
  const rows = await sql`
    SELECT * FROM whatsapp_conversations
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `;
  return rows as Conversation[];
}

/**
 * Retorna as mensagens de uma conversa em ordem cronologica.
 */
export async function getMessages(
  conversationId: number,
  limit = 200
): Promise<Message[]> {
  const rows = await sql`
    SELECT * FROM whatsapp_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return rows as Message[];
}

/**
 * Marca uma conversa como lida (zera o contador de nao lidas).
 */
export async function markRead(conversationId: number): Promise<void> {
  await sql`
    UPDATE whatsapp_conversations
    SET unread_count = 0, updated_at = updated_at
    WHERE id = ${conversationId}
  `;
}

/**
 * Define quem esta atendendo a conversa (bot ou humano).
 */
export async function setHandledBy(
  conversationId: number,
  handledBy: "bot" | "human",
  adminId: string | null
): Promise<void> {
  await sql`
    UPDATE whatsapp_conversations
    SET handled_by = ${handledBy},
        assigned_admin_id = ${adminId},
        updated_at = NOW()
    WHERE id = ${conversationId}
  `;
}
