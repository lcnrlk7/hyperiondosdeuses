"use client";

import { useState, useEffect } from "react";
import {
  ScrollText,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Wallet,
  Clock,
  Layers,
} from "lucide-react";

interface StatementData {
  balances: {
    available: number;
    pending: number;
    total: number;
  };
  days: {
    date: string;
    inflow: number;
    fees: number;
    withdrawals: number;
    refunds: number;
    net: number;
  }[];
  entries: {
    id: string;
    date: string;
    label: string;
    category: string;
    direction: "in" | "out";
    amount: number;
  }[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const formatDay = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function StatementPage() {
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/statement?days=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-emerald-400" />
            Extrato
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Livro-razão da plataforma: entradas, taxas, saques e estornos.
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="glass rounded-xl px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="7" className="bg-card">Últimos 7 dias</option>
          <option value="30" className="bg-card">Últimos 30 dias</option>
          <option value="90" className="bg-card">Últimos 90 dias</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
          Não foi possível carregar o extrato.
        </div>
      ) : (
        <>
          {/* Saldos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Disponível</p>
                <div className="p-2 rounded-lg bg-emerald-400/10">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(data.balances.available)}</p>
              <p className="text-xs text-muted-foreground mt-1">Recebido e liberado</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-yellow-400">Pendente</p>
                <div className="p-2 rounded-lg bg-yellow-400/10">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(data.balances.pending)}</p>
              <p className="text-xs text-muted-foreground mt-1">Aguardando confirmação</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Total</p>
                <div className="p-2 rounded-lg bg-blue-400/10">
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(data.balances.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">Disponível + pendente</p>
            </div>
          </div>

          {/* Resumo diário */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Resumo por dia</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Dia</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Entradas</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Taxas</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Saques</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Estornos</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.days.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                        Sem movimentação no período.
                      </td>
                    </tr>
                  ) : (
                    data.days.map((d) => (
                      <tr key={d.date} className="border-b border-border/50 hover:bg-secondary transition-colors">
                        <td className="p-4 text-sm text-foreground capitalize">{formatDay(d.date)}</td>
                        <td className="p-4 text-sm text-right text-emerald-400">+{formatCurrency(d.inflow)}</td>
                        <td className="p-4 text-sm text-right text-muted-foreground">-{formatCurrency(d.fees)}</td>
                        <td className="p-4 text-sm text-right text-muted-foreground">-{formatCurrency(d.withdrawals)}</td>
                        <td className="p-4 text-sm text-right text-muted-foreground">-{formatCurrency(d.refunds)}</td>
                        <td className={`p-4 text-sm text-right font-semibold ${d.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {d.net >= 0 ? "+" : ""}
                          {formatCurrency(d.net)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lançamentos */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Lançamentos recentes</h2>
            </div>
            <div className="divide-y divide-border">
              {data.entries.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Nenhum lançamento no período.</p>
              ) : (
                data.entries.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg shrink-0 ${e.direction === "in" ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
                      {e.direction === "in" ? (
                        <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{e.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.category} · {formatDateTime(e.date)}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${e.direction === "in" ? "text-emerald-400" : "text-red-400"}`}>
                      {e.direction === "in" ? "+" : "-"}
                      {formatCurrency(e.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
