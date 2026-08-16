"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDownCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { getStatusMeta, getMethodLabel } from "@/lib/transaction-status";

interface ReceivablesData {
  summary: {
    today: { count: number; gross: number; net: number; fees: number };
    yesterday: { count: number; gross: number; net: number; fees: number };
    month: { count: number; gross: number; net: number; fees: number };
    pending: { count: number; amount: number };
  };
  byStatus: { status: string; count: number; amount: number }[];
  recent: {
    id: string;
    amount: number;
    net_amount: number | null;
    fee: number;
    status: string;
    type: string;
    user_name: string | null;
    user_email: string | null;
    created_at: string;
    paid_at: string | null;
  }[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ReceivablesPage() {
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/receivables")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
        Não foi possível carregar os recebimentos.
      </div>
    );
  }

  const { summary } = data;
  const todayGrowth =
    summary.yesterday.net > 0
      ? ((summary.today.net - summary.yesterday.net) / summary.yesterday.net) * 100
      : summary.today.net > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowDownCircle className="w-6 h-6 text-emerald-400" />
          Recebimentos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todo o dinheiro que entra na plataforma via PIX e outros métodos.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Hoje (líquido)</p>
            <div className="p-2 rounded-lg bg-emerald-400/10">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(summary.today.net)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${todayGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {todayGrowth >= 0 ? "+" : ""}
              {todayGrowth.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs. ontem</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.today.count} transações · bruto {formatCurrency(summary.today.gross)}
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ontem (líquido)</p>
            <div className="p-2 rounded-lg bg-secondary">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(summary.yesterday.net)}</p>
          <p className="text-xs text-muted-foreground mt-3">
            {summary.yesterday.count} transações · bruto {formatCurrency(summary.yesterday.gross)}
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Mês (líquido)</p>
            <div className="p-2 rounded-lg bg-blue-400/10">
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(summary.month.net)}</p>
          <p className="text-xs text-muted-foreground mt-3">
            {summary.month.count} transações · taxas {formatCurrency(summary.month.fees)}
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-yellow-400">A receber (pendente)</p>
            <div className="p-2 rounded-lg bg-yellow-400/10">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(summary.pending.amount)}</p>
          <p className="text-xs text-muted-foreground mt-3">{summary.pending.count} aguardando confirmação</p>
        </div>
      </div>

      {/* Breakdown por status */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Distribuição por status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.byStatus.map((s) => {
            const meta = getStatusMeta(s.status);
            return (
              <div key={s.status} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} />
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-2">{formatCurrency(s.amount)}</p>
                <p className="text-xs text-muted-foreground">{s.count} transações</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recebimentos recentes */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recebimentos recentes</h2>
          <Link
            href="/lp-x7k9m2-internal/ceo/transactions"
            className="text-xs text-primary hover:underline"
          >
            Ver todas transações
          </Link>
        </div>
        <div className="divide-y divide-border">
          {data.recent.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum recebimento ainda.</p>
          ) : (
            data.recent.map((t) => {
              const meta = getStatusMeta(t.status);
              const net = t.net_amount != null ? Number(t.net_amount) : Number(t.amount) - Number(t.fee || 0);
              return (
                <Link
                  key={t.id}
                  href={`/lp-x7k9m2-internal/ceo/transactions/${t.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-secondary transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-400/10 shrink-0">
                    {meta.group === "approved" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : meta.group === "pending" ? (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t.user_name || t.user_email || "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getMethodLabel(t.type)} · {formatDateTime(t.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-400">+{formatCurrency(net)}</p>
                    <span className={`inline-flex items-center gap-1 text-xs ${meta.className} px-2 py-0.5 rounded-full mt-1`}>
                      {meta.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
