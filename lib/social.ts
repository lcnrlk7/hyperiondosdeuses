/**
 * Canais oficiais da Hyperion Pay.
 * Centralizado para que uma troca de convite/handle nao precise ser
 * replicada em landing page, header, suporte e pagina de status.
 */
export const SOCIAL = {
  discord: {
    url: "https://discord.gg/Babac43dDJ",
    label: "Discord",
    handle: "discord.gg/Babac43dDJ",
  },
  instagram: {
    url: "https://www.instagram.com/hyperion.pay/",
    label: "Instagram",
    handle: "@hyperion.pay",
  },
  whatsapp: {
    url: "https://wa.me/5534999353187",
    label: "WhatsApp",
    handle: "(34) 99935-3187",
  },
  email: {
    url: "mailto:contato@hyperionpay.com",
    label: "Email",
    handle: "contato@hyperionpay.com",
  },
} as const;
