import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// GET - Buscar configuracao do Telegram
export async function GET(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id obrigatorio" }, { status: 400 })
    }

    const result = await sql`
      SELECT telegram_config FROM white_label_tenants WHERE id = ${tenantId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      config: result[0].telegram_config || {} 
    })
  } catch (error: any) {
    console.error("Erro ao buscar config Telegram:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Salvar configuracao do Telegram
export async function POST(request: NextRequest) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { tenant_id, telegram_config } = body

    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id obrigatorio" }, { status: 400 })
    }

    await sql`
      UPDATE white_label_tenants 
      SET telegram_config = ${JSON.stringify(telegram_config)}::jsonb,
          updated_at = NOW()
      WHERE id = ${tenant_id}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao salvar config Telegram:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Testar conexao do Bot
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_token, chat_id } = body

    if (!bot_token) {
      return NextResponse.json({ error: "Token do bot obrigatorio" }, { status: 400 })
    }

    // Verificar se o token e valido
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`)
    const botInfo = await botInfoResponse.json()

    if (!botInfo.ok) {
      return NextResponse.json({ 
        success: false, 
        error: "Token invalido. Verifique se o token esta correto." 
      }, { status: 400 })
    }

    // Se tiver chat_id, enviar mensagem de teste
    if (chat_id) {
      const testMessage = `✅ *Teste de Conexao*\n\nSeu bot "${botInfo.result.first_name}" esta configurado corretamente!\n\n🤖 Username: @${botInfo.result.username}\n📅 Data: ${new Date().toLocaleString("pt-BR")}`
      
      const sendResponse = await fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id,
          text: testMessage,
          parse_mode: "Markdown"
        })
      })

      const sendResult = await sendResponse.json()

      if (!sendResult.ok) {
        return NextResponse.json({ 
          success: false, 
          bot_valid: true,
          bot_info: botInfo.result,
          error: `Bot valido, mas erro ao enviar mensagem: ${sendResult.description}. Verifique se o Chat ID esta correto e se o bot foi adicionado ao grupo/canal.`
        }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        bot_info: botInfo.result,
        message: "Bot conectado e mensagem de teste enviada com sucesso!"
      })
    }

    return NextResponse.json({ 
      success: true, 
      bot_info: botInfo.result,
      message: "Token valido! Agora adicione o Chat ID para completar a configuracao."
    })
  } catch (error: any) {
    console.error("Erro ao testar bot Telegram:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
