import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST() {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: "TELEGRAM_BOT_TOKEN nao configurado" 
      }, { status: 500 });
    }

    // URL do webhook - usar o dominio de producao
    const webhookUrl = "https://app.hyperionpay.com/api/telegram/webhook";
    
    // Configurar webhook no Telegram
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true
      }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        message: "Webhook configurado com sucesso",
        webhook_url: webhookUrl
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description || "Erro ao configurar webhook"
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[Telegram] Erro ao configurar webhook:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno ao configurar webhook" 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: "TELEGRAM_BOT_TOKEN nao configurado",
        configured: false
      });
    }

    // Verificar informacoes do webhook atual
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        configured: !!result.result.url,
        url: result.result.url || null,
        pending_update_count: result.result.pending_update_count || 0,
        last_error_date: result.result.last_error_date || null,
        last_error_message: result.result.last_error_message || null
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description,
        configured: false
      });
    }
  } catch (error) {
    console.error("[Telegram] Erro ao verificar webhook:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno",
      configured: false
    });
  }
}

// DELETE para remover webhook
export async function DELETE() {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: "TELEGRAM_BOT_TOKEN nao configurado" 
      }, { status: 500 });
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: true }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        message: "Webhook removido com sucesso"
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[Telegram] Erro ao remover webhook:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno" 
    }, { status: 500 });
  }
}
