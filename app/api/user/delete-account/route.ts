import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userId = session.userId;

    // Verificar se usuario existe e pegar email para log
    const user = await sql`SELECT id, email, name, balance FROM profiles WHERE id = ${userId}`;
    if (user.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const userEmail = user[0].email;
    const userName = user[0].name;
    const userBalance = user[0].balance;

    console.log(`[DELETE ACCOUNT] Iniciando delecao da conta: ${userEmail} (ID: ${userId})`);

    // Deletar em ordem para respeitar foreign keys

    // 1. Deletar webhook_logs das transacoes do usuario
    const transactions = await sql`SELECT id FROM transactions WHERE user_id = ${userId}`;
    for (const tx of transactions) {
      await sql`DELETE FROM webhook_logs WHERE transaction_id = ${tx.id}`;
    }
    console.log(`[DELETE ACCOUNT] Webhook logs deletados`);

    // 2. Deletar transacoes
    await sql`DELETE FROM transactions WHERE user_id = ${userId}`;
    console.log(`[DELETE ACCOUNT] Transacoes deletadas`);

    // 3. Deletar saques
    await sql`DELETE FROM withdrawals WHERE user_id = ${userId}`;
    console.log(`[DELETE ACCOUNT] Saques deletados`);

    // 4. Deletar integracoes
    await sql`DELETE FROM user_integrations WHERE user_id = ${userId}`;
    console.log(`[DELETE ACCOUNT] Integracoes deletadas`);

    // 5. Deletar payment links
    try {
      await sql`DELETE FROM payment_links WHERE user_id = ${userId}`;
      console.log(`[DELETE ACCOUNT] Payment links deletados`);
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
      console.log(`[DELETE ACCOUNT] Tickets deletados`);
    } catch (e) {
      // Tabelas podem nao existir
    }

    // 7. Deletar KYC documents
    try {
      await sql`DELETE FROM kyc_documents WHERE user_id = ${userId}`;
      console.log(`[DELETE ACCOUNT] KYC documents deletados`);
    } catch (e) {
      // Tabela pode nao existir
    }

    // 8. Deletar integration errors
    try {
      await sql`DELETE FROM integration_errors WHERE user_id = ${userId}`;
      console.log(`[DELETE ACCOUNT] Integration errors deletados`);
    } catch (e) {
      // Tabela pode nao existir
    }

    // 9. Deletar notificacoes
    try {
      await sql`DELETE FROM notifications WHERE user_id = ${userId}`;
      console.log(`[DELETE ACCOUNT] Notificacoes deletadas`);
    } catch (e) {
      // Tabela pode nao existir
    }

    // 10. Deletar sessoes
    try {
      await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
      console.log(`[DELETE ACCOUNT] Sessoes deletadas`);
    } catch (e) {
      // Tabela pode nao existir
    }

    // 11. Por fim, deletar o perfil
    await sql`DELETE FROM profiles WHERE id = ${userId}`;
    console.log(`[DELETE ACCOUNT] Perfil deletado`);

    console.log(`[DELETE ACCOUNT] Conta ${userEmail} deletada com sucesso. Saldo perdido: R$ ${userBalance}`);

    return NextResponse.json({ 
      success: true,
      message: "Conta deletada com sucesso"
    });
  } catch (error) {
    console.error("[DELETE ACCOUNT] Erro ao deletar conta:", error);
    return NextResponse.json({ error: "Erro ao deletar conta. Contate o suporte." }, { status: 500 });
  }
}
