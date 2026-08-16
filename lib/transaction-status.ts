// Mapeamento central de status de transacoes usado no painel admin.
// Gateways de pagamento tem varios status; normalizamos para 5 grupos visuais.

export type StatusGroup = "approved" | "pending" | "refused" | "cancelled" | "refunded";

export interface StatusMeta {
  group: StatusGroup;
  label: string;
  dot: string; // cor do ponto (emoji semantico via classe)
  className: string; // classes de badge (bg + text)
  dotClassName: string; // classe da bolinha colorida
}

const GROUP_STYLES: Record<StatusGroup, { label: string; className: string; dotClassName: string }> = {
  approved: {
    label: "Aprovada",
    className: "bg-green-500/10 text-green-400 border border-green-500/20",
    dotClassName: "bg-green-500",
  },
  pending: {
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    dotClassName: "bg-yellow-500",
  },
  refused: {
    label: "Recusada",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
    dotClassName: "bg-red-500",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
    dotClassName: "bg-slate-400",
  },
  refunded: {
    label: "Estornada",
    className: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    dotClassName: "bg-purple-500",
  },
};

// Status brutos do banco -> grupo normalizado
const RAW_TO_GROUP: Record<string, StatusGroup> = {
  completed: "approved",
  approved: "approved",
  paid: "approved",
  success: "approved",
  confirmed: "approved",
  pending: "pending",
  processing: "pending",
  waiting: "pending",
  created: "pending",
  failed: "refused",
  refused: "refused",
  declined: "refused",
  error: "refused",
  expired: "refused",
  cancelled: "cancelled",
  canceled: "cancelled",
  refunded: "refunded",
  chargeback: "refunded",
  reversed: "refunded",
};

export function getStatusMeta(rawStatus: string | null | undefined): StatusMeta {
  const key = (rawStatus || "").toLowerCase().trim();
  const group = RAW_TO_GROUP[key] || "pending";
  const style = GROUP_STYLES[group];
  return {
    group,
    label: style.label,
    dot: group,
    className: style.className,
    dotClassName: style.dotClassName,
  };
}

// Rotulo amigavel para o metodo/tipo de operacao
export function getMethodLabel(type: string | null | undefined): string {
  switch ((type || "").toLowerCase()) {
    case "deposit":
    case "pix_in":
      return "PIX";
    case "withdrawal":
    case "pix_out":
      return "PIX Saque";
    case "transfer_in":
      return "Transferência";
    case "transfer_out":
      return "Transferência";
    case "boleto":
      return "Boleto";
    case "credit_card":
    case "card":
      return "Cartão";
    default:
      return type || "-";
  }
}

export function formatBRL(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
