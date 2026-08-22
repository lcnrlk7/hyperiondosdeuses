import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse, NextRequest } from "next/server"
import crypto from "crypto"
import { sendMerchantWebhook } from "@/lib/merchant-webhook"

// Testar webhook de uma integracao
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { integration_id } = body

    let webhookUrl: string
    let webhookSecret: string

    if (integration_id) {
      // Buscar da integracao especifica (tabela user_integrations)
      const integrations = await sql`
        SELECT webhook_url, webhook_secret FROM user_integrations 
        WHERE id = ${integration_id} AND user_id = ${session.userId}
      `
      const integration = integrations[0]

      if (!integration) {
        return NextResponse.json({ error: "Integracao nao encontrada" }, { status: 404 })
      }

      if (!integration.webhook_url) {
        return NextResponse.json(
          { success: false, message: "Webhook URL nao configurada para esta integracao" },
          { status: 400 }
        )
      }

      webhookUrl = integration.webhook_url
      webhookSecret = integration.webhook_secret
    } else {
      // Fallback: buscar do profile
      const profiles = await sql`
        SELECT webhook_url, webhook_secret FROM profiles WHERE id = ${session.userId}
      `
      const profile = profiles[0]

      if (!profile?.webhook_url) {
        return NextResponse.json(
          { success: false, message: "Webhook URL nao configurada" },
          { status: 400 }
        )
      }

      webhookUrl = profile.webhook_url
      webhookSecret = profile.webhook_secret
    }

    // Enviar webhook de teste usando o mesmo formato/assinatura da producao
    const result = await sendMerchantWebhook({
      url: webhookUrl,
      secret: webhookSecret,
      event: "payment.test",
      data: {
        id: "test_" + crypto.randomBytes(8).toString("hex"),
        external_id: "test_payment",
        amount: 100.00,
        fee: 2.50,
        net_amount: 97.50,
        status: "completed",
        payer_name: "Teste Hyperion Pay",
        payer_document: "12345678900",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: result.ok,
      message: result.ok
        ? "Webhook recebeu a requisicao com sucesso!"
        : result.error ? `Erro: ${result.error}` : `Webhook retornou status ${result.status}`,
      data: {
        webhook_url: webhookUrl,
        response_time_ms: result.responseTimeMs,
        response_status: result.status || null,
        response_body: result.responseBody || null,
        error: result.error,
        test_payload: result.payload,
        signature_header: "X-Webhook-Signature",
      },
    })
  } catch (error) {
    console.error("Error testing webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
