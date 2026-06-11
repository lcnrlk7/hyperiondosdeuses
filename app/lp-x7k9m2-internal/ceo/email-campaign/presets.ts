// Biblioteca de predefinicoes de campanhas de e-mail da Hyperion Pay.
// Cada predefinicao preenche o formulario de disparo com um conteudo pronto.

export interface CampaignPreset {
  id: string;
  category: string;
  name: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  highlight?: string;
  highlightLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryText?: string;
  secondaryUrl?: string;
}

const SUPPORT_URL = "https://app.hyperionpay.com.br/dashboard/support";
const WHATSAPP_URL = "https://wa.me/5534999353187";
const DASHBOARD_URL = "https://app.hyperionpay.com.br/dashboard";

const p = (
  text: string[]
): string =>
  text
    .map(
      (t, i) =>
        `<p style="margin:0 0 ${i === text.length - 1 ? "0" : "14px"};">${t}</p>`
    )
    .join("");

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  // ---- Taxas / Comercial ----
  {
    id: "rota-black-3",
    category: "Taxas",
    name: "Rota Black - Taxas ate 3%",
    subject: "Taxas de ate 3% liberadas na Rota Black - Hyperion Pay",
    heading: "Taxas baixas disponiveis na Rota Black",
    bodyHtml: p([
      'Temos uma novidade exclusiva para voce: as <strong style="color:#ffffff;">taxas mais baixas do mercado</strong> ja estao disponiveis na <strong style="color:#22c55e;">Rota Black</strong>.',
      'Com a Rota Black voce passa a receber pagamentos com taxas de <strong style="color:#22c55e;">ate 3%</strong> — perfeito para quem movimenta alto volume e quer aumentar a margem de lucro.',
      'Para liberar essa condicao na sua conta, <strong style="color:#ffffff;">abra um ticket no nosso site</strong> ou <strong style="color:#ffffff;">chame no WhatsApp</strong>. Nossa equipe encaminhara para o setor financeiro, que vai ajustar a sua taxa.',
    ]),
    highlight: "Ate 3%",
    highlightLabel: "Taxa exclusiva Rota Black",
    ctaText: "Abrir ticket",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "reducao-taxa-volume",
    category: "Taxas",
    name: "Reducao de taxa por volume",
    subject: "Sua taxa pode ser reduzida - Hyperion Pay",
    heading: "Voce pode pagar menos por transacao",
    bodyHtml: p([
      "Identificamos que o seu volume de transacoes cresceu nos ultimos meses. Isso te qualifica para uma <strong style=\"color:#22c55e;\">revisao de taxa</strong>.",
      "Quanto mais voce movimenta, menor pode ser a sua taxa. Fale com a nossa equipe e descubra a melhor condicao para o seu perfil.",
    ]),
    highlight: "Taxa reduzida",
    highlightLabel: "Beneficio por volume",
    ctaText: "Solicitar revisao",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "taxa-zero-saque",
    category: "Taxas",
    name: "Saque sem taxa por tempo limitado",
    subject: "Saque sem taxa esta semana - Hyperion Pay",
    heading: "Saques sem taxa por tempo limitado",
    bodyHtml: p([
      'Esta semana voce pode sacar o seu saldo <strong style="color:#22c55e;">sem nenhuma taxa</strong>.',
      "Aproveite para movimentar o seu dinheiro sem custos adicionais. Promocao valida por tempo limitado.",
    ]),
    highlight: "Taxa zero",
    highlightLabel: "Saque promocional",
    ctaText: "Acessar painel",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },

  // ---- Produto / Novidades ----
  {
    id: "novo-recurso",
    category: "Produto",
    name: "Lancamento de novo recurso",
    subject: "Novidade na sua conta Hyperion Pay",
    heading: "Lancamos um novo recurso para voce",
    bodyHtml: p([
      "Trabalhamos para deixar a sua experiencia cada vez melhor. Acabamos de lancar um novo recurso no seu painel.",
      "Acesse agora e confira tudo o que voce pode fazer para gerenciar melhor os seus pagamentos.",
    ]),
    highlight: "Novo",
    highlightLabel: "Atualizacao da plataforma",
    ctaText: "Ver novidade",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "nova-api",
    category: "Produto",
    name: "Atualizacao da API",
    subject: "Atualizacao importante na API - Hyperion Pay",
    heading: "Novidades na nossa API",
    bodyHtml: p([
      "Lancamos melhorias na nossa API para tornar a sua integracao mais rapida e estavel.",
      "Confira a documentacao atualizada e aproveite os novos endpoints disponiveis.",
    ]),
    highlight: "API v2",
    highlightLabel: "Para desenvolvedores",
    ctaText: "Ver documentacao",
    ctaUrl: "https://app.hyperionpay.com.br/docs",
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "app-mobile",
    category: "Produto",
    name: "App mobile disponivel",
    subject: "Gerencie tudo pelo celular - Hyperion Pay",
    heading: "Agora voce tem a Hyperion no bolso",
    bodyHtml: p([
      "Acompanhe os seus recebimentos, saques e relatorios direto do seu celular.",
      "Tudo o que voce precisa para gerenciar o seu negocio, onde estiver.",
    ]),
    highlight: "Mobile",
    highlightLabel: "Novo aplicativo",
    ctaText: "Acessar painel",
    ctaUrl: DASHBOARD_URL,
  },

  // ---- Incentivo / Engajamento ----
  {
    id: "cashback",
    category: "Incentivo",
    name: "Programa de cashback",
    subject: "Ganhe cashback nas suas transacoes - Hyperion Pay",
    heading: "Seu dinheiro de volta a cada transacao",
    bodyHtml: p([
      'Agora voce ganha <strong style="color:#22c55e;">cashback</strong> em cada transacao aprovada na sua conta.',
      "Quanto mais voce usa a Hyperion Pay, mais voce recebe de volta. Comece a acumular hoje mesmo.",
    ]),
    highlight: "Cashback",
    highlightLabel: "Programa de recompensas",
    ctaText: "Saiba mais",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "indicacao",
    category: "Incentivo",
    name: "Programa de indicacao",
    subject: "Indique e ganhe - Hyperion Pay",
    heading: "Indique amigos e seja recompensado",
    bodyHtml: p([
      "Voce conhece alguem que tambem pode lucrar com a Hyperion Pay?",
      'Indique e ganhe <strong style="color:#22c55e;">recompensas</strong> a cada novo cadastro aprovado pelo seu link exclusivo.',
    ]),
    highlight: "Indique e ganhe",
    highlightLabel: "Programa de parceiros",
    ctaText: "Pegar meu link",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "reativacao",
    category: "Incentivo",
    name: "Reativacao de conta inativa",
    subject: "Sentimos a sua falta - Hyperion Pay",
    heading: "Que tal voltar a movimentar a sua conta?",
    bodyHtml: p([
      "Notamos que faz um tempo desde a sua ultima transacao. A Hyperion Pay evoluiu bastante e tem novidades esperando por voce.",
      "Volte a usar a sua conta e aproveite as melhores taxas e recursos do mercado.",
    ]),
    highlight: "Volte ja",
    highlightLabel: "Sua conta esta esperando",
    ctaText: "Acessar painel",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "upgrade-conta",
    category: "Incentivo",
    name: "Upgrade de conta",
    subject: "Desbloqueie mais beneficios - Hyperion Pay",
    heading: "Eleve o nivel da sua conta",
    bodyHtml: p([
      "Sua conta pode ter limites maiores, taxas menores e atendimento prioritario.",
      "Fale com a nossa equipe e descubra como fazer o upgrade do seu plano.",
    ]),
    highlight: "Upgrade",
    highlightLabel: "Mais beneficios",
    ctaText: "Quero fazer upgrade",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },

  // ---- Sazonais ----
  {
    id: "black-friday",
    category: "Sazonal",
    name: "Black Friday",
    subject: "Black Friday Hyperion Pay - condicoes especiais",
    heading: "Black Friday chegou na Hyperion Pay",
    bodyHtml: p([
      "Durante a Black Friday voce tem acesso as <strong style=\"color:#22c55e;\">melhores condicoes do ano</strong>.",
      "Taxas reduzidas e beneficios exclusivos por tempo limitado. Nao perca.",
    ]),
    highlight: "Black Friday",
    highlightLabel: "Oferta por tempo limitado",
    ctaText: "Aproveitar agora",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "fim-de-ano",
    category: "Sazonal",
    name: "Mensagem de fim de ano",
    subject: "Obrigado por 2026 - Hyperion Pay",
    heading: "Obrigado por crescer com a gente",
    bodyHtml: p([
      "Chegamos ao fim de mais um ano e queremos agradecer pela sua confianca na Hyperion Pay.",
      "Que o proximo ano seja repleto de conquistas. Continuamos juntos, construindo legado e gerando liberdade.",
    ]),
    highlight: "Obrigado!",
    highlightLabel: "Mensagem da equipe",
    ctaText: "Acessar painel",
    ctaUrl: DASHBOARD_URL,
  },
  {
    id: "ano-novo",
    category: "Sazonal",
    name: "Comeco de ano",
    subject: "Um novo ano de oportunidades - Hyperion Pay",
    heading: "Comece o ano com o pe direito",
    bodyHtml: p([
      "Um novo ano comeca e com ele novas oportunidades para o seu negocio crescer.",
      "Conte com a Hyperion Pay para receber melhor, pagar menos taxas e escalar com seguranca.",
    ]),
    highlight: "Novo ciclo",
    highlightLabel: "Comeco de ano",
    ctaText: "Acessar painel",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },

  // ---- Seguranca / Conta ----
  {
    id: "ativar-2fa",
    category: "Seguranca",
    name: "Ativar autenticacao em 2 fatores",
    subject: "Proteja a sua conta com 2FA - Hyperion Pay",
    heading: "Deixe a sua conta ainda mais segura",
    bodyHtml: p([
      'Ative a <strong style="color:#ffffff;">autenticacao em dois fatores (2FA)</strong> e adicione uma camada extra de protecao a sua conta.',
      "Leva menos de um minuto e aumenta muito a seguranca dos seus recebimentos.",
    ]),
    highlight: "2FA",
    highlightLabel: "Seguranca da conta",
    ctaText: "Ativar agora",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Preciso de ajuda",
    secondaryUrl: SUPPORT_URL,
  },
  {
    id: "kyc-pendente",
    category: "Seguranca",
    name: "Verificacao de identidade (KYC)",
    subject: "Conclua a verificacao da sua conta - Hyperion Pay",
    heading: "Falta pouco para liberar tudo",
    bodyHtml: p([
      "Para liberar todos os recursos e limites da sua conta, precisamos concluir a verificacao da sua identidade.",
      "O processo e rapido e seguro. Acesse o painel e finalize a sua verificacao.",
    ]),
    highlight: "Verificacao",
    highlightLabel: "Acao necessaria",
    ctaText: "Concluir verificacao",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Preciso de ajuda",
    secondaryUrl: SUPPORT_URL,
  },
  {
    id: "alerta-seguranca",
    category: "Seguranca",
    name: "Alerta de seguranca / golpes",
    subject: "Fique atento a golpes - Hyperion Pay",
    heading: "Sua seguranca em primeiro lugar",
    bodyHtml: p([
      "A Hyperion Pay <strong style=\"color:#ffffff;\">nunca</strong> solicita a sua senha, codigos ou dados completos do cartao por mensagem ou telefone.",
      "Desconfie de contatos suspeitos. Em caso de duvida, fale sempre pelos nossos canais oficiais.",
    ]),
    highlight: "Atencao",
    highlightLabel: "Aviso de seguranca",
    ctaText: "Falar com o suporte",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },

  // ---- Operacional ----
  {
    id: "manutencao",
    category: "Operacional",
    name: "Aviso de manutencao programada",
    subject: "Manutencao programada - Hyperion Pay",
    heading: "Manutencao programada no sistema",
    bodyHtml: p([
      "Realizaremos uma manutencao programada para melhorar a nossa plataforma.",
      "Durante esse periodo alguns servicos podem ficar temporariamente indisponiveis. Pedimos desculpas por qualquer inconveniente.",
    ]),
    highlight: "Manutencao",
    highlightLabel: "Aviso importante",
    ctaText: "Ver status",
    ctaUrl: "https://app.hyperionpay.com.br/status",
  },
  {
    id: "novos-limites",
    category: "Operacional",
    name: "Novos limites de transacao",
    subject: "Seus limites foram atualizados - Hyperion Pay",
    heading: "Atualizamos os limites da sua conta",
    bodyHtml: p([
      "Boas noticias: aumentamos os limites de transacao disponiveis na sua conta.",
      "Acesse o painel para conferir os seus novos limites e movimentar com mais liberdade.",
    ]),
    highlight: "Limites +",
    highlightLabel: "Conta atualizada",
    ctaText: "Ver meus limites",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "atualizar-dados",
    category: "Operacional",
    name: "Atualizar dados cadastrais",
    subject: "Mantenha os seus dados atualizados - Hyperion Pay",
    heading: "Confira os seus dados cadastrais",
    bodyHtml: p([
      "Para garantir o bom funcionamento da sua conta, e importante manter os seus dados sempre atualizados.",
      "Acesse o painel e revise as suas informacoes em poucos minutos.",
    ]),
    highlight: "Atualize",
    highlightLabel: "Dados cadastrais",
    ctaText: "Revisar dados",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Preciso de ajuda",
    secondaryUrl: SUPPORT_URL,
  },
  {
    id: "nova-chave-pix",
    category: "Operacional",
    name: "Cadastre sua chave Pix",
    subject: "Cadastre a sua chave Pix - Hyperion Pay",
    heading: "Receba mais rapido com Pix",
    bodyHtml: p([
      "Cadastre a sua chave Pix e receba os seus saques de forma ainda mais rapida.",
      "E simples e leva menos de um minuto direto no seu painel.",
    ]),
    highlight: "Pix",
    highlightLabel: "Recebimento rapido",
    ctaText: "Cadastrar chave",
    ctaUrl: DASHBOARD_URL,
  },

  // ---- Relacionamento ----
  {
    id: "boas-vindas",
    category: "Relacionamento",
    name: "Boas-vindas",
    subject: "Bem-vindo a Hyperion Pay",
    heading: "Que bom ter voce com a gente",
    bodyHtml: p([
      "Seja muito bem-vindo a Hyperion Pay. A partir de agora voce conta com as melhores taxas e a melhor estrutura para receber pagamentos.",
      "Qualquer duvida, a nossa equipe esta a disposicao pelos canais oficiais.",
    ]),
    highlight: "Bem-vindo!",
    highlightLabel: "Sua jornada comeca aqui",
    ctaText: "Acessar painel",
    ctaUrl: DASHBOARD_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "pesquisa-satisfacao",
    category: "Relacionamento",
    name: "Pesquisa de satisfacao",
    subject: "Queremos ouvir voce - Hyperion Pay",
    heading: "Sua opiniao vale muito",
    bodyHtml: p([
      "Estamos sempre buscando melhorar. Conte para a gente como tem sido a sua experiencia com a Hyperion Pay.",
      "Leva menos de 2 minutos e nos ajuda a evoluir cada vez mais.",
    ]),
    highlight: "2 min",
    highlightLabel: "Pesquisa rapida",
    ctaText: "Responder pesquisa",
    ctaUrl: SUPPORT_URL,
  },
  {
    id: "suporte-prioritario",
    category: "Relacionamento",
    name: "Atendimento prioritario",
    subject: "Conte com atendimento prioritario - Hyperion Pay",
    heading: "Atendimento dedicado para voce",
    bodyHtml: p([
      "Precisa de ajuda com a sua conta, taxas ou integracao? A nossa equipe esta pronta para te atender.",
      "Abra um ticket no nosso site ou fale direto no WhatsApp. Estamos aqui para ajudar.",
    ]),
    highlight: "Suporte",
    highlightLabel: "Estamos com voce",
    ctaText: "Abrir ticket",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "parceria-empresarial",
    category: "Relacionamento",
    name: "Proposta de parceria",
    subject: "Vamos crescer juntos - Hyperion Pay",
    heading: "Uma parceria feita para escalar",
    bodyHtml: p([
      "Seu negocio tem potencial para crescer ainda mais com a Hyperion Pay.",
      "Fale com a nossa equipe comercial e descubra condicoes especiais para parceiros e grandes volumes.",
    ]),
    highlight: "Parceria",
    highlightLabel: "Comercial Hyperion",
    ctaText: "Falar com comercial",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
  {
    id: "indique-e-ganhe",
    category: "Incentivo",
    name: "Indique e ganhe",
    subject: "Indique a Hyperion Pay e ganhe beneficios",
    heading: "Indique amigos e seja recompensado",
    bodyHtml: p([
      "Conhece alguem que precisa de uma gateway com taxas baixas e pagamentos rapidos? Indique a Hyperion Pay!",
      "A cada indicacao aprovada, voce ganha beneficios exclusivos na sua conta. Quanto mais indicar, mais vantagens recebe.",
    ]),
    highlight: "Indique",
    highlightLabel: "Programa de indicacao",
    ctaText: "Quero indicar",
    ctaUrl: SUPPORT_URL,
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: WHATSAPP_URL,
  },
];
