"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  RefreshCw,
  DollarSign,
  Hash,
  CheckCircle2,
  Ban,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";

const CHECKOUT_BASE_URL = "https://pay-checkout-pagamentoseguros.online";

// Cores do tema
const COLORS = {
  primary: "#2563eb",
  accent: "#0ea5e9",
  success: "#16a34a",
  danger: "#dc2626",
  muted: "#94a3b8",
};

interface AdminLink {
  id: string;
  code: string;
  title: string;
  description: string | null;
  amount: number | null;
  amount_type: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  status: string;
  total_received: number | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0)
  );

const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(Number(value || 0));

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "-";

export default function AdminPaymentLinksPage() {
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch (error) {
      console.error("Error loading payment links:", error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const active = links.filter((l) => l.status === "active");
    const cancelled = links.filter((l) => l.status !== "active");
    const totalValue = active.reduce((a, l) => a + Number(l.amount || 0), 0);
    const totalUses = links.reduce((a, l) => a + Number(l.current_uses || 0), 0);
    const totalReceived = links.reduce(
      (a, l) => a + Number(l.total_received || 0),
      0
    );
    return {
      total: links.length,
      active: active.length,
      cancelled: cancelled.length,
      totalValue,
      totalUses,
      totalReceived,
    };
  }, [links]);

  // Grafico: links criados por dia (ultimos 14 dias)
  const dailyData = useMemo(() => {
    const days: { date: string; label: string; criados: number; usos: number }[] =
      [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        criados: 0,
        usos: 0,
      });
    }
    for (const l of links) {
      const key = new Date(l.created_at).toISOString().slice(0, 10);
      const bucket = days.find((x) => x.date === key);
      if (bucket) {
        bucket.criados += 1;
        bucket.usos += Number(l.current_uses || 0);
      }
    }
    return days;
  }, [links]);

  // Grafico: distribuicao de status
  const statusData = useMemo(
    () => [
      { name: "Ativos", value: stats.active, color: COLORS.success },
      { name: "Cancelados", value: stats.cancelled, color: COLORS.danger },
    ],
    [stats]
  );

  // Grafico: top 5 links por usos
  const topLinks = useMemo(() => {
    return [...links]
      .sort((a, b) => Number(b.current_uses || 0) - Number(a.current_uses || 0))
      .slice(0, 5)
      .map((l) => ({
        name: l.title.length > 16 ? l.title.slice(0, 16) + "…" : l.title,
        usos: Number(l.current_uses || 0),
      }));
  }, [links]);

  function copyLink(code: string) {
    navigator.clipboard.writeText(`${CHECKOUT_BASE_URL}/link/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const statCards = [
    {
      label: "Total de links",
      value: formatNumber(stats.total),
      icon: Link2,
      color: "text-primary",
    },
    {
      label: "Links ativos",
      value: formatNumber(stats.active),
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Valor em aberto",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Usos totais",
      value: formatNumber(stats.totalUses),
      icon: Hash,
      color: "text-info-foreground",
    },
    {
      label: "Total recebido",
      value: formatCurrency(stats.totalReceived),
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "Cancelados",
      value: formatNumber(stats.cancelled),
      icon: Ban,
      color: "text-danger",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            Links de Pagamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Visao global de todos os links da plataforma.
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground font-mono tabular-nums">
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Area chart - criados por dia */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Links criados (ultimos 14 dias)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorCriados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="criados"
                  name="Links"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorCriados)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie - status */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Distribuicao por status
          </h2>
          <div className="h-64 flex flex-col">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {s.name} ({s.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top links bar chart */}
      {topLinks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Top 5 links por usos
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLinks} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "var(--secondary)" }}
                />
                <Bar dataKey="usos" fill={COLORS.accent} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de links */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Todos os links ({links.length})
          </h2>
        </div>
        <div className="table-responsive">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-5 py-3 font-semibold">Link</th>
                <th className="px-5 py-3 font-semibold">Dono</th>
                <th className="px-5 py-3 font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Usos</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Criado</th>
                <th className="px-5 py-3 font-semibold text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    Nenhum link de pagamento na plataforma.
                  </td>
                </tr>
              ) : (
                links.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border/60 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{l.title}</p>
                      <p className="text-xs text-muted-foreground font-mono uppercase">
                        {l.code}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-foreground truncate max-w-[180px]">
                        {l.user_name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {l.user_email || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-foreground">
                      {formatCurrency(Number(l.amount || 0))}
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-foreground">
                      {l.current_uses}
                      {l.max_uses ? `/${l.max_uses}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          l.status === "active"
                            ? "bg-success-bg text-success"
                            : "bg-danger-bg text-danger"
                        }`}
                      >
                        {l.status === "active" ? "Ativo" : "Cancelado"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(l.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => copyLink(l.code)}
                          title="Copiar link"
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          {copied === l.code ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
