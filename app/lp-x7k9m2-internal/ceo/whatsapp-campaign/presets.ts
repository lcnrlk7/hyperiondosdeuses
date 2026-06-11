// Predefinicoes de mensagens para disparo via WhatsApp (texto puro).
// Use {nome} como placeholder que sera substituido pelo nome do usuario.

export interface WhatsappPreset {
  id: string;
  category: string;
  name: string;
  message: string;
}

const TICKET = "https://app.hyperionpay.com.br/dashboard/support";
const WPP = "https://wa.me/5534999353187";

export const WHATSAPP_PRESETS: WhatsappPreset[] = [
  // ---------------- Taxas ----------------
  {
    id: "rota-black-3",
    category: "Taxas",
    name: "Rota Black - taxas ate 3%",
    message:
      "Ola {nome}! 🚀\n\nAs taxas mais baixas do mercado ja estao disponiveis na *Rota Black* da Hyperion Pay: receba seus pagamentos com taxas de *ate 3%*.\n\nPara liberar essa condicao na sua conta, abra um ticket no nosso site ou responda esta mensagem. Nossa equipe encaminhara para o setor financeiro, que vai ajustar a sua taxa.\n\nAbrir ticket: " +
      TICKET,
  },
  {
    id: "reducao-taxa",
    category: "Taxas",
    name: "Reducao de taxa por volume",
    message:
      "Oi {nome}! Notamos que voce vem movimentando um bom volume na Hyperion Pay. 👏\n\nVoce pode ter direito a uma *taxa reduzida*. Fale com a gente e vamos avaliar a melhor condicao para o seu perfil.\n\nResponda aqui ou abra um ticket: " +
      TICKET,
  },
  {
    id: "taxa-saque-zero",
    category: "Taxas",
    name: "Saque sem custo",
    message:
      "{nome}, novidade boa: agora voce pode sacar seu saldo na Hyperion Pay com *custo reduzido*. ⚡\n\nQuer saber como ativar? Responda esta mensagem que a gente te explica.",
  },

  // ---------------- Produto ----------------
  {
    id: "nova-dashboard",
    category: "Produto",
    name: "Nova dashboard",
    message:
      "Ola {nome}! Atualizamos a sua dashboard na Hyperion Pay com novos relatorios e graficos em tempo real. 📊\n\nAcesse e confira: https://app.hyperionpay.com.br/dashboard",
  },
  {
    id: "pix-instantaneo",
    category: "Produto",
    name: "Pix instantaneo",
    message:
      "{nome}, seus recebimentos via Pix agora caem ainda mais rapido na Hyperion Pay. 💸\n\nContinue vendendo tranquilo, o dinheiro chega na hora!",
  },
  {
    id: "api-integracao",
    category: "Produto",
    name: "API e integracoes",
    message:
      "Oi {nome}! Voce sabia que a Hyperion Pay tem uma API completa para automatizar seus pagamentos? 🤖\n\nVeja a documentacao: https://app.hyperionpay.com.br/docs",
  },
  {
    id: "app-link-pagamento",
    category: "Produto",
    name: "Link de pagamento",
    message:
      "{nome}, crie links de pagamento em segundos na Hyperion Pay e venda por qualquer canal. 🔗\n\nExperimente agora no seu painel: https://app.hyperionpay.com.br/dashboard",
  },

  // ---------------- Incentivo ----------------
  {
    id: "volte-a-vender",
    category: "Incentivo",
    name: "Reativacao de conta",
    message:
      "Sentimos sua falta, {nome}! 💙\n\nFaz um tempo que voce nao movimenta na Hyperion Pay. Que tal voltar com taxas especiais? Responda esta mensagem e a gente prepara uma condicao para voce.",
  },
  {
    id: "indique-e-ganhe",
    category: "Incentivo",
    name: "Indique e ganhe",
    message:
      "{nome}, indique a Hyperion Pay para amigos e ganhe beneficios a cada indicacao aprovada! 🎁\n\nQuer indicar? Responda aqui que te passamos os detalhes.",
  },
  {
    id: "primeiro-saque",
    category: "Incentivo",
    name: "Incentivo primeiro saque",
    message:
      "Oi {nome}! Voce ainda nao fez seu primeiro saque na Hyperion Pay. 💰\n\nEsta com alguma duvida? Responda esta mensagem que a gente te ajuda no passo a passo.",
  },

  // ---------------- Sazonal ----------------
  {
    id: "black-friday",
    category: "Sazonal",
    name: "Black Friday",
    message:
      "🔥 *BLACK FRIDAY HYPERION PAY* 🔥\n\n{nome}, prepare-se para o maior volume de vendas do ano! Garanta taxas especiais para a Black Friday. Responda esta mensagem para ativar.",
  },
  {
    id: "fim-de-ano",
    category: "Sazonal",
    name: "Fim de ano",
    message:
      "{nome}, o fim de ano e a melhor epoca para vender! 🎄\n\nA Hyperion Pay esta com voce em cada venda. Conte com a gente para receber rapido e com seguranca.",
  },
  {
    id: "ano-novo",
    category: "Sazonal",
    name: "Comecar o ano",
    message:
      "Feliz ano novo, {nome}! 🎉\n\nComece o ano vendendo mais com a Hyperion Pay. Estamos a disposicao para ajustar a melhor condicao para o seu negocio.",
  },

  // ---------------- Seguranca ----------------
  {
    id: "ative-2fa",
    category: "Seguranca",
    name: "Ative o 2FA",
    message:
      "{nome}, proteja a sua conta na Hyperion Pay. 🔐\n\nAtive a verificacao em duas etapas (2FA) nas configuracoes e deixe seus recebimentos ainda mais seguros.",
  },
  {
    id: "alerta-seguranca",
    category: "Seguranca",
    name: "Boas praticas",
    message:
      "Oi {nome}! Lembrete de seguranca da Hyperion Pay: nunca compartilhe sua senha ou codigos de acesso. Nossa equipe jamais pede esses dados por mensagem. 🛡️",
  },
  {
    id: "atualize-dados",
    category: "Seguranca",
    name: "Atualizar cadastro",
    message:
      "{nome}, mantenha seus dados atualizados na Hyperion Pay para evitar bloqueios e garantir seus saques sem interrupcao.\n\nAtualize aqui: https://app.hyperionpay.com.br/dashboard/settings",
  },

  // ---------------- Operacional ----------------
  {
    id: "manutencao",
    category: "Operacional",
    name: "Aviso de manutencao",
    message:
      "Aviso Hyperion Pay: faremos uma manutencao programada em breve para melhorar nossos servicos. ⚙️\n\n{nome}, seus recebimentos nao serao afetados. Qualquer duvida, e so responder esta mensagem.",
  },
  {
    id: "novo-app",
    category: "Operacional",
    name: "Aplicativo disponivel",
    message:
      "{nome}, gerencie seus pagamentos de qualquer lugar com a Hyperion Pay. 📱\n\nAcesse pelo navegador: https://app.hyperionpay.com.br/dashboard",
  },
  {
    id: "comprovante-disponivel",
    category: "Operacional",
    name: "Comprovantes",
    message:
      "Oi {nome}! Voce pode baixar os comprovantes de todas as suas transacoes direto no painel da Hyperion Pay. 🧾\n\nAcesse: https://app.hyperionpay.com.br/dashboard",
  },

  // ---------------- Relacionamento ----------------
  {
    id: "boas-vindas",
    category: "Relacionamento",
    name: "Boas-vindas",
    message:
      "Seja bem-vindo(a), {nome}! 🎉\n\nQue bom ter voce na Hyperion Pay. Qualquer duvida, e so responder esta mensagem. Estamos aqui para ajudar voce a vender mais!",
  },
  {
    id: "pesquisa-satisfacao",
    category: "Relacionamento",
    name: "Pesquisa de satisfacao",
    message:
      "{nome}, sua opiniao vale muito para nos! 💬\n\nComo tem sido sua experiencia com a Hyperion Pay? Responda esta mensagem com uma nota de 0 a 10. Obrigado!",
  },
  {
    id: "suporte-disponivel",
    category: "Relacionamento",
    name: "Suporte disponivel",
    message:
      "Oi {nome}! Lembrando que o suporte da Hyperion Pay esta sempre a disposicao. 🤝\n\nPrecisa de algo? Abra um ticket: " +
      TICKET,
  },
  {
    id: "obrigado-cliente",
    category: "Relacionamento",
    name: "Agradecimento",
    message:
      "{nome}, obrigado por confiar na Hyperion Pay! 💙\n\nSeguimos trabalhando todos os dias para oferecer as melhores taxas e o pagamento mais rapido para voce.",
  },
  {
    id: "novidades-em-breve",
    category: "Relacionamento",
    name: "Novidades em breve",
    message:
      "Fique de olho, {nome}! 👀\n\nNovidades incriveis estao chegando na Hyperion Pay. Em breve te contamos tudo por aqui!",
  },
];
