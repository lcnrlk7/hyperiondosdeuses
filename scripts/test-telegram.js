async function testAll() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  console.log("=== TESTE COMPLETO DO BOT TELEGRAM ===\n");
  
  async function send(chatId, text) {
    const res = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
    });
    const data = await res.json();
    return data.ok;
  }
  
  const now = new Date().toLocaleString("pt-BR");
  
  // 1. Testar canal de vendas
  console.log("1. CANAL DE VENDAS (@legacypaybot)");
  console.log("   Testando deposito...");
  
  const depMsg = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      💰 <b>DEPOSITO CONFIRMADO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 Usuario: tes***@gmail.com
   
   💵 Valor: R$ 1.000,00
   📊 Taxa (5%): R$ 50,00
   ✅ Creditado: R$ 950,00
   
   🕐 ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⚡ <b>Hyperion Pay</b> - Bot Telegram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const depOk = await send("@legacypaybot", depMsg);
  console.log("   Deposito:", depOk ? "OK" : "ERRO");
  
  await new Promise(r => setTimeout(r, 500));
  
  console.log("   Testando saque...");
  const sacMsg = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      💸 <b>SAQUE APROVADO</b> 💸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 Usuario: cli***@hotmail.com
   
   💵 Valor: R$ 500,00
   📊 Taxa: R$ 7,00
   ✅ Enviado: R$ 493,00
   
   📱 PIX: ***@gmail.com
   🕐 ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⚡ <b>Hyperion Pay</b> - Bot Telegram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const sacOk = await send("@legacypaybot", sacMsg);
  console.log("   Saque:", sacOk ? "OK" : "ERRO");
  
  await new Promise(r => setTimeout(r, 500));
  
  console.log("   Testando novo usuario...");
  const userMsg = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🆕 <b>NOVO USUARIO TELEGRAM</b> 🆕
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 Email: nov***@email.com
   📱 Telegram: @novo_usuario
   
   🕐 ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const userOk = await send("@legacypaybot", userMsg);
  console.log("   Novo usuario:", userOk ? "OK" : "ERRO");
  
  // 2. Testar canal de avisos
  console.log("\n2. CANAL DE AVISOS (@legacypayavisos)");
  
  await new Promise(r => setTimeout(r, 500));
  
  const avisoMsg = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📢 <b>SISTEMA TELEGRAM ATIVO</b> 📢
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O bot do Hyperion Pay foi atualizado!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ✨ <b>FUNCIONALIDADES</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ Menu com botoes interativos
   ✅ Depositos via PIX (5% taxa)
   ✅ Saques instantaneos (R$7 fixo)
   ✅ Rota sem complicacoes
   ✅ Consulta de saldo/extrato
   ✅ Notificacoes em tempo real

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📱 <b>ACESSE AGORA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🤖 Bot: @HyperionPay_bot
   📊 Vendas: @legacypaybot
   📣 Avisos: @legacypayavisos
   
   🌐 Site: https://www.hyperionpay.com.br
   💬 Discord: https://discord.gg/ea32hgRSeM
   📱 WhatsApp: (34) 99935-3187

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⚡ <b>Hyperion Pay</b> - A melhor!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const avisoOk = await send("@legacypayavisos", avisoMsg);
  console.log("   Aviso:", avisoOk ? "OK" : "ERRO");
  
  // 3. Verificar webhook
  console.log("\n3. STATUS DO WEBHOOK");
  const info = await fetch("https://api.telegram.org/bot" + token + "/getWebhookInfo");
  const infoData = await info.json();
  console.log("   URL:", infoData.result?.url || "Nao configurado");
  console.log("   Pendentes:", infoData.result?.pending_update_count || 0);
  console.log("   Erro:", infoData.result?.last_error_message || "Nenhum");
  
  // 4. Verificar comandos
  console.log("\n4. COMANDOS DO BOT");
  const cmds = await fetch("https://api.telegram.org/bot" + token + "/getMyCommands");
  const cmdsData = await cmds.json();
  if (cmdsData.ok && cmdsData.result.length > 0) {
    cmdsData.result.forEach(c => {
      console.log("   /" + c.command + " - " + c.description);
    });
  } else {
    console.log("   Nenhum comando configurado");
  }
  
  console.log("\n=== RESUMO ===");
  console.log("Canais:");
  console.log("  - Vendas/Depositos/Saques: @legacypaybot");
  console.log("  - Avisos: @legacypayavisos");
  console.log("\nTaxas:");
  console.log("  - Deposito: 5%");
  console.log("  - Saque: R$7,00 fixo");
  console.log("\nWebhook: https://www.hyperionpay.com.br/api/telegram/webhook");
  console.log("\nBot: @HyperionPay_bot");
}

testAll();
