// Catalogo central de permissoes e cargos do painel administrativo.
// Usado pela tela de Cargos & Permissoes (RBAC) e pela API /api/admin/roles.

export interface PermissionDef {
  key: string;
  label: string;
}

export interface PermissionGroup {
  category: string;
  permissions: PermissionDef[];
}

// Agrupamento legivel das permissoes existentes no sistema (team_members.permissions).
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: "Visão Geral",
    permissions: [
      { key: "view_dashboard", label: "Ver dashboard" },
      { key: "view_financial", label: "Ver financeiro" },
      { key: "view_reports", label: "Ver relatórios" },
    ],
  },
  {
    category: "Operações",
    permissions: [
      { key: "view_transactions", label: "Ver transações" },
      { key: "manage_transactions", label: "Gerenciar transações" },
      { key: "view_withdrawals", label: "Ver saques" },
      { key: "manage_withdrawals", label: "Gerenciar saques" },
    ],
  },
  {
    category: "Financeiro",
    permissions: [
      { key: "view_fees", label: "Ver taxas" },
      { key: "manage_fees", label: "Gerenciar taxas" },
      { key: "view_acquirers", label: "Ver adquirentes" },
    ],
  },
  {
    category: "Usuários",
    permissions: [
      { key: "view_users", label: "Ver usuários" },
      { key: "edit_users", label: "Editar usuários" },
      { key: "view_kyc", label: "Ver KYC" },
      { key: "manage_kyc", label: "Gerenciar KYC" },
      { key: "view_affiliates", label: "Ver afiliados" },
      { key: "view_team", label: "Ver equipe" },
      { key: "manage_team", label: "Gerenciar equipe" },
    ],
  },
  {
    category: "Segurança",
    permissions: [
      { key: "view_blacklist", label: "Ver bloqueios" },
      { key: "view_attacks", label: "Ver antifraude" },
      { key: "view_logs", label: "Ver logs" },
    ],
  },
  {
    category: "Suporte",
    permissions: [
      { key: "view_tickets", label: "Ver tickets" },
      { key: "manage_tickets", label: "Gerenciar tickets" },
      { key: "view_notifications", label: "Ver notificações" },
      { key: "manage_notifications", label: "Gerenciar notificações" },
      { key: "view_rewards", label: "Ver premiações" },
      { key: "manage_rewards", label: "Gerenciar premiações" },
    ],
  },
  {
    category: "Sistema",
    permissions: [
      { key: "view_status", label: "Ver status" },
      { key: "view_settings", label: "Ver configurações" },
      { key: "manage_settings", label: "Gerenciar configurações" },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

export interface RoleDef {
  key: string;
  label: string;
  description: string;
  color: string;
  editable: boolean; // CEO nao e editavel (sempre acesso total)
}

export const ROLE_DEFS: RoleDef[] = [
  { key: "ceo", label: "CEO", description: "Acesso total ao sistema", color: "purple", editable: false },
  { key: "manager", label: "Gerente", description: "Acesso amplo de operação e gestão", color: "blue", editable: true },
  { key: "finance", label: "Financeiro", description: "Transações, saques, taxas e adquirentes", color: "yellow", editable: true },
  { key: "support", label: "Suporte", description: "Atendimento, tickets e usuários", color: "green", editable: true },
  { key: "tech", label: "Técnico", description: "Sistema, logs, status e configurações", color: "cyan", editable: true },
];

// Conjuntos de permissoes por cargo (usado para semear system_settings.rbac_roles).
const grant = (keys: string[]): Record<string, boolean> =>
  Object.fromEntries(ALL_PERMISSION_KEYS.map((k) => [k, keys.includes(k)]));

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  ceo: Object.fromEntries(ALL_PERMISSION_KEYS.map((k) => [k, true])),
  manager: grant([
    "view_dashboard", "view_financial", "view_reports",
    "view_transactions", "manage_transactions", "view_withdrawals", "manage_withdrawals",
    "view_fees", "view_acquirers",
    "view_users", "edit_users", "view_kyc", "manage_kyc", "view_affiliates", "view_team",
    "view_blacklist", "view_logs",
    "view_tickets", "manage_tickets", "view_notifications", "manage_notifications", "view_rewards",
    "view_status",
  ]),
  finance: grant([
    "view_dashboard", "view_financial", "view_reports",
    "view_transactions", "manage_transactions", "view_withdrawals", "manage_withdrawals",
    "view_fees", "manage_fees", "view_acquirers",
    "view_status",
  ]),
  support: grant([
    "view_dashboard",
    "view_transactions", "view_withdrawals",
    "view_users", "view_kyc",
    "view_tickets", "manage_tickets", "view_notifications",
    "view_status",
  ]),
  tech: grant([
    "view_dashboard",
    "view_acquirers",
    "view_attacks", "view_logs",
    "view_status", "view_settings", "manage_settings",
  ]),
};
