import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "ceo")) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Verificar se usuario existe
    const user = await sql`SELECT id, email FROM profiles WHERE id = ${userId}`;
    if (user.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Nao permitir deletar admin
    const targetUser = await sql`SELECT role FROM profiles WHERE id = ${userId}`;
    if (targetUser[0]?.role === "admin") {
      return NextResponse.json({ error: "Nao e possivel deletar um administrador" }, { status: 403 });
    }

    console.log(`[ADMIN] Deletando usuario ${user[0].email} (${userId}) por ${session.userId}`);

    // Deletar em ordem para respeitar foreign keys
    
    // 1. Buscar transacoes do usuario para deletar webhook_logs
    const transactions = await sql`SELECT id FROM transactions WHERE user_id = ${userId}`;
    for (const tx of transactions) {
      await sql`DELETE FROM webhook_logs WHERE transaction_id = ${tx.id}`;
    }

    // 2. Deletar transacoes
    await sql`DELETE FROM transactions WHERE user_id = ${userId}`;

    // 3. Deletar saques
    await sql`DELETE FROM withdrawals WHERE user_id = ${userId}`;

    // 4. Deletar integracoes
    await sql`DELETE FROM user_integrations WHERE user_id = ${userId}`;

    // 5. Deletar payment links
    try {
      await sql`DELETE FROM payment_links WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 6. Deletar tickets e mensagens
    try {
      const tickets = await sql`SELECT id FROM support_tickets WHERE user_id = ${userId}`;
      for (const ticket of tickets) {
        await sql`DELETE FROM ticket_messages WHERE ticket_id = ${ticket.id}`;
      }
      await sql`DELETE FROM support_tickets WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 7. Deletar KYC documents
    try {
      await sql`DELETE FROM kyc_documents WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 8. Deletar integration errors
    try {
      await sql`DELETE FROM integration_errors WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 9. Deletar notificacoes
    try {
      await sql`DELETE FROM notifications WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 10. Deletar sessoes
    try {
      await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 11. Deletar pix keys
    try {
      await sql`DELETE FROM pix_keys WHERE user_id = ${userId}`;
    } catch (e) {
      // Tabela pode nao existir
    }

    // 12. Finalmente deletar o perfil
    await sql`DELETE FROM profiles WHERE id = ${userId}`;

    console.log(`[ADMIN] Usuario ${user[0].email} deletado com sucesso`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar usuario:", error);
    return NextResponse.json({ error: "Erro interno ao deletar usuario" }, { status: 500 });
  }
}
