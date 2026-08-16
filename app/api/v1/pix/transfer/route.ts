import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getSystemFeesForUser } from "@/lib/acquirers"

// Criar transferência PIX
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não fornecida" },
        { status: 401 }
      )
    }

    const profiles = await sql`
      SELECT * FROM profiles WHERE api_key = ${apiKey} AND is_active = true
    `
    const profile = profiles[0]

    if (!profile) {
      return NextResponse.json(
        { error: "API key inválida ou conta inativa" },
        { status: 401 }
      )
    }

    // SEGURANCA: conta precisa estar ativa e nao bloqueada. A verificacao de
    // identidade (Didit) e feita na liberacao da conta, NAO a cada saque.
    if (profile.is_blocked) {
      return NextResponse.json(
        { error: "Conta bloqueada. Entre em contato com o suporte." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount, pix_key, pix_key_type, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      )
    }

    if (!pix_key || !pix_key_type) {
      return NextResponse.json(
        { error: "Chave PIX é obrigatória" },
        { status: 400 }
      )
    }

    // Verificar saldo
    if (Number(profile.balance) < amount) {
      return NextResponse.json(
        { error: "Saldo insuficiente" },
        { status: 400 }
      )
    }

    // Buscar taxas do usuario (usar taxa de saque para transferencias PIX Out)
    const userFees = await getSystemFeesForUser(profile.id)
    const fee = userFees.withdrawalFee
    const totalAmount = amount + fee
    
    console.log(`[PIX Transfer] Usuario ${profile.email}: Taxa R$${fee} para transferencia de R$${amount}`)

    if (Number(profile.balance) < totalAmount) {
      return NextResponse.json(
        { error: "Saldo insuficiente para cobrir a taxa" },
        { status: 400 }
      )
    }

    // Criar transação
    const transactions = await sql`
      INSERT INTO transactions (user_id, type, amount, fee, pix_key, pix_key_type, description, status)
      VALUES (${profile.id}, 'transfer_out', ${amount}, ${fee}, ${pix_key}, ${pix_key_type}, ${description || null}, 'processing')
      RETURNING *
    `
    const transaction = transactions[0]

    // Atualizar saldo
    const newBalance = Number(profile.balance) - totalAmount
    await sql`
      UPDATE profiles SET balance = ${newBalance} WHERE id = ${profile.id}
    `

    // Atualizar status para completado (simulação)
    await sql`
      UPDATE transactions SET status = 'completed' WHERE id = ${transaction.id}
    `

    // Enviar webhook se configurado
    if (profile.webhook_url) {
      try {
        const webhookPayload = {
          event: "transfer.completed",
          data: {
            id: transaction.id,
            amount,
            fee,
            pix_key,
            status: "completed",
            created_at: transaction.created_at
          }
        }

        const webhookResponse = await fetch(profile.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload)
        })

        await sql`
          INSERT INTO webhook_logs (user_id, transaction_id, url, payload, response_status, success)
          VALUES (${profile.id}, ${transaction.id}, ${profile.webhook_url}, ${JSON.stringify(webhookPayload)}, ${webhookResponse.status}, ${webhookResponse.ok})
        `
      } catch {
        // Webhook falhou, mas transação continua
      }
    }

    // Log da API
    await sql`
      INSERT INTO api_logs (user_id, endpoint, method, request_body, response_status, ip_address)
      VALUES (${profile.id}, '/api/v1/pix/transfer', 'POST', ${JSON.stringify(body)}, 200, ${request.headers.get("x-forwarded-for") || "unknown"})
    `

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        amount,
        fee,
        total: totalAmount,
        pix_key,
        pix_key_type,
        status: "completed",
        new_balance: newBalance,
        created_at: transaction.created_at
      }
    })
  } catch (error) {
    console.error("[v0] PIX transfer error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
