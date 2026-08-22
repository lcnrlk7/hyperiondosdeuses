"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  XCircle,
  Plus,
  Link2,
  Banknote,
  BarChart3,
  Code2,
  Calendar,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MobileDashboard } from "./mobile-dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface Profile {
  id: string;
  balance: number;
  api_key: string;
  name: string | null;
  email?: string | null;
  total_revenue?: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: string;
  created_at: string;
  description: string | null;
  payer_name?: string | null;
  payer_document?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
}

export interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  is_active: boolean;
}

interface DashboardContentProps {
  profile: Profile | null;
  transactions: Transaction[];
  pixKeys: PixKey[];
}

const INCOME_TYPES = ["pix_in", "received", "deposit", "sale", "transfer_in"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value || 0);

const formatDateTime = (date: string) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(d);
};

const shortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

const methodLabel = (t: Transaction) => {
  if (t.type?.startsWith("pix")) return "PIX";
  if (t.type?.includes("card") || t.type?.includes("credit")) return "Cartao de Credito";
  if (t.type?.includes("boleto")) return "Boleto Bancario";
  return "PIX";
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Aprovado", cls: "bg-success-bg text-success" },
    pending: { label: "Pendente", cls: "bg-warning-bg text-warning-foreground" },
    processing: { label: "Em analise", cls: "bg-info-bg text-info-foreground" },
    failed: { label: "Recusado", cls: "bg-danger-bg text-danger-foreground" },
    cancelled: { label: "Recusado", cls: "bg-danger-bg text-danger-foreground" },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${s.cls}`}>{s.label}</span>;
}

export function DashboardContent({ profile, transactions, pixKeys }: DashboardContentProps) {
  const [chartMode, setChartMode] = useState<"Diario" | "Semanal">("Diario");

  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const income = completed.filter((t) => INCOME_TYPES.includes(t.type));
    const volumeTotal = income.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const total = transactions.length;
    const approvalRate = total > 0 ? (completed.length / total) * 100 : 0;
    const ticketMedio = income.length > 0 ? volumeTotal / income.length : 0;

    const byStatus = (statuses: string[]) => {
      const rows = transactions.filter((t) => statuses.includes(t.status));
      return {
        count: rows.length,
        sum: rows.reduce((acc, t) => acc + Number(t.amount || 0), 0),
      };
    };

    return {
      volumeTotal,
      total,
      approvalRate,
      ticketMedio,
      aprovadas: byStatus(["completed"]),
      pendentes: byStatus(["pending"]),
      emAnalise: byStatus(["processing"]),
      recusadas: byStatus(["failed", "cancelled"]),
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const days = 7;
    const buckets: { label: string; volume: number; transacoes: number; key: string }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ label: shortDate(d), volume: 0, transacoes: 0, key });
    }
    const index = new Map(buckets.map((b) => [b.key, b]));
    for (const t of transactions) {
      if (!t.created_at) continue;
      const parsed = new Date(t.created_at);
      if (isNaN(parsed.getTime())) continue;
      const key = parsed.toISOString().slice(0, 10);
      const bucket = index.get(key);
      if (!bucket) continue;
      bucket.transacoes += 1;
      if (t.status === "completed" && INCOME_TYPES.includes(t.type)) {
        bucket.volume += Number(t.amount || 0);
      }
    }
    return buckets;
  }, [transactions]);

  const rangeLabel = useMemo(() => {
    if (chartData.length === 0) return "";
    return `${chartData[0].label}/${new Date().getFullYear()} - ${chartData[chartData.length - 1].label}/${new Date().getFullYear()}`;
  }, [chartData]);

  const recent = transactions.slice(0, 5);

  const topCards = [
    {
      label: "Volume Total",
      value: formatCurrency(stats.volumeTotal),
      icon: TrendingUp,
    },
    {
      label: "Transacoes",
      value: formatNumber(stats.total),
      icon: CreditCard,
    },
    {
      label: "Ticket Medio",
      value: formatCurrency(stats.ticketMedio),
      icon: DollarSign,
    },
    {
      label: "Taxa de Aprovacao",
      value: `${stats.approvalRate.toFixed(1)}%`,
      icon: ShieldCheck,
    },
  ];

  const resumo = [
    { label: "Aprovadas", icon: CheckCircle2, color: "text-success", data: stats.aprovadas },
    { label: "Pendentes", icon: Clock, color: "text-warning-foreground", data: stats.pendentes },
    { label: "Em analise", icon: Search, color: "text-info-foreground", data: stats.emAnalise },
    { label: "Recusadas", icon: XCircle, color: "text-danger-foreground", data: stats.recusadas },
  ];

  const shortcuts = [
    { label: "Nova cobranca", icon: Plus, href: "/dashboard/charges" },
    { label: "Link de pagamento", icon: Link2, href: "/dashboard/payment-links" },
    { label: "Solicitar saque", icon: Banknote, href: "/dashboard/withdrawals" },
    { label: "Relatorios", icon: BarChart3, href: "/dashboard/reports" },
  ];

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/967fe929-a539-44bd-b42d-50feaa57f174-OqXx52mfxATzAeTcKY7wFcFrH3e7Dn.png"
          alt="Beneficios da Hyperion Pay com estabilidade nas transacoes, premiacoes e novidades"
          width={2048}
          height={409}
          priority
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="h-auto w-full object-cover"
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <MobileDashboard profile={profile} transactions={transactions} />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Visao geral da sua operacao</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{rangeLabel}</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {topCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-bold text-primary mt-2">{card.value}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Resumo */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Chart */}
          <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-foreground">Grafico de volume</h2>
              <button
                onClick={() => setChartMode((m) => (m === "Diario" ? "Semanal" : "Diario"))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent/60"
              >
                {chartMode}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Volume (R$)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground">Transacoes</span>
              </span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name) => [name === "volume" ? formatCurrency(value) : value, name === "volume" ? "Volume" : "Transacoes"]}
                  />
                  <Area type="monotone" dataKey="transacoes" stroke="var(--muted-foreground)" strokeOpacity={0.5} fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="volume" stroke="var(--primary)" fill="url(#volFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resumo */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">Resumo de transacoes</h2>
              <Link href="/dashboard/transactions" className="text-xs font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="space-y-4">
              {resumo.map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <row.icon className={`w-5 h-5 ${row.color}`} />
                    <span className="text-sm text-foreground">{row.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatNumber(row.data.count)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(row.data.sum)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimas transações + laterais */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">Ultimas transacoes</h2>
              <Link href="/dashboard/transactions" className="text-xs font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma transacao ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Metodo</th>
                      <th className="pb-3 font-medium">Valor</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((t) => (
                      <tr key={t.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 text-muted-foreground font-mono text-xs">#{t.id.slice(0, 6)}</td>
                        <td className="py-3 text-foreground">{t.payer_name || t.customer_name || "—"}</td>
                        <td className="py-3 text-foreground">{methodLabel(t)}</td>
                        <td className="py-3 font-medium text-foreground">{formatCurrency(Number(t.amount || 0))}</td>
                        <td className="py-3"><StatusBadge status={t.status} /></td>
                        <td className="py-3 text-muted-foreground text-xs">{formatDateTime(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Atalhos + Integração */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">Atalhos rapidos</h2>
              <div className="grid grid-cols-2 gap-3">
                {shortcuts.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/60 transition-colors text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">{s.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Integracao</h2>
                <Link href="/dashboard/integration" className="text-muted-foreground hover:text-primary">
                  <Code2 className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Status</span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-success-bg text-success">Operacional</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ambiente</span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-info-bg text-info-foreground">Producao</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
