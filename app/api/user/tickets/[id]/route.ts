import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logTicketClosed } from "@/lib/discord-webhook";

// GET - Obter ticket com mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar ticket
    const ticket = await sql`
      SELECT 
        t.*,
        p.name as user_name,
        p.email as user_email,
        p.avatar_url as user_avatar,
        a.name as admin_name,
        a.avatar_url as admin_avatar
      FROM support_tickets t
      LEFT JOIN profiles p ON t.user_id = p.id
      LEFT JOIN profiles a ON t.assigned_admin_id = a.id
      WHERE t.id = ${id} AND t.user_id = ${session.userId}
    `;

    if (ticket.length === 0) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    // Buscar mensagens
    const messages = await sql`
      SELECT 
        m.*,
        p.name as sender_name,
        p.avatar_url as sender_avatar
      FROM ticket_messages m
      LEFT JOIN profiles p ON m.sender_id = p.id
      WHERE m.ticket_id = ${id}
      ORDER BY m.created_at ASC
    `;

    // Marcar mensagens do admin como lidas
    await sql`
      UPDATE ticket_messages 
      SET is_read = true 
      WHERE ticket_id = ${id} AND sender_type = 'admin' AND is_read = false
    `;

    return NextResponse.json({ ticket: ticket[0], messages });
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Enviar nova mensagem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, attachmentUrl, attachmentType } = body;

    if (!message && !attachmentUrl) {
      return NextResponse.json({ error: "Mensagem ou anexo obrigatorio" }, { status: 400 });
    }

    // Verificar se ticket pertence ao usuario
    const ticket = await sql`
      SELECT * FROM support_tickets WHERE id = ${id} AND user_id = ${session.userId}
    `;

    if (ticket.length === 0) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    // Se ticket estiver fechado, reabrir
    if (ticket[0].status === 'closed') {
      await sql`
        UPDATE support_tickets SET status = 'open', closed_at = NULL, updated_at = NOW() WHERE id = ${id}
      `;
    }

    // Criar mensagem
    const newMessage = await sql`
      INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, attachment_url, attachment_type)
      VALUES (${id}, ${session.userId}, 'user', ${message || ''}, ${attachmentUrl || null}, ${attachmentType || null})
      RETURNING *
    `;

    // Atualizar last_message_at
    await sql`
      UPDATE support_tickets SET last_message_at = NOW(), updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: newMessage[0] });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH - Fechar ticket (usuario)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar dados do ticket antes de fechar
    const ticketInfo = await sql`
      SELECT t.subject, p.name as user_name, p.email as user_email
      FROM support_tickets t
      JOIN profiles p ON t.user_id = p.id
      WHERE t.id = ${id} AND t.user_id = ${session.userId}
    `;

    if (ticketInfo.length === 0) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    await sql`
      UPDATE support_tickets 
      SET status = 'closed', closed_at = NOW(), updated_at = NOW() 
      WHERE id = ${id} AND user_id = ${session.userId}
    `;

    // Enviar notificacao para Discord
    logTicketClosed({
      ticketId: id,
      subject: ticketInfo[0].subject,
      status: "closed",
      userName: ticketInfo[0].user_name,
      userEmail: ticketInfo[0].user_email,
      closedBy: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao fechar ticket:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Deletar ticket e todas as mensagens
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se ticket pertence ao usuario
    const ticket = await sql`
      SELECT * FROM support_tickets WHERE id = ${id} AND user_id = ${session.userId}
    `;

    if (ticket.length === 0) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    // Deletar mensagens primeiro (foreign key)
    await sql`DELETE FROM ticket_messages WHERE ticket_id = ${id}`;

    // Deletar ticket
    await sql`DELETE FROM support_tickets WHERE id = ${id} AND user_id = ${session.userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar ticket:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
