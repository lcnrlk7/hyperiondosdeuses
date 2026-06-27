"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Screening {
  id: string;
  transaction_ref: string;
  didit_transaction_id: string | null;
  user_id: string | null;
  internal_entity: string;
  internal_entity_id: string;
  direction: "inbound" | "outbound";
  amount: string | number;
  currency: string;
  status: string;
  risk_score: string | number | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

interface Stats {
  total: number;
  APPROVED: number;
  IN_REVIEW: number;
  DECLINED: number;
  AWAITING_USER: number;
  PENDING: number;
  ERROR: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  APPROVED: { label: "Aprovada", color: "text-green-400", bg: "bg-green-500/10" },
  IN_REVIEW: { label: "Em Analise", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  AWAITING_USER: { label: "Aguardando", color: "text-blue-400", bg: "bg-blue-500/10" },
  DECLINED: { label: "Recusada", color: "text-red-400", bg: "bg-red-500/10" },
  PENDING: { label: "Pendente", color: "text-muted-foreground", bg: "bg-muted/40" },
  ERROR: { label: "Erro", color: "text-orange-400", bg: "bg-orange-500/10" },
};

export default function AMLPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("flagged");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/aml?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setScreenings(data.screenings || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Erro ao carregar AML:", e);
    }
    setLoading(false);
  }

  const filters = [
    { value: "flagged", label: "Sinalizadas" },
    { value: "DECLINED", label: "Recusadas" },
    { value: "IN_REVIEW", label: "Em Analise" },
    { value: "APPROVED", label: "Aprovadas" },
    { value: "all", label: "Todas" },
  ];

  function formatAmount(v: string | number, currency: string) {
    const n = Number(v) || 0;
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    });
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const statCards = [
    { key: "total", label: "Total", value: stats?.total ?? 0, icon: ShieldAlert, color: "text-foreground" },
    { key: "DECLINED", label: "Recusadas", value: stats?.DECLINED ?? 0, icon: XCircle, color: "text-red-400" },
    { key: "IN_REVIEW", label: "Em Analise", value: stats?.IN_REVIEW ?? 0, icon: Clock, color: "text-yellow-400" },
    { key: "APPROVED", label: "Aprovadas", value: stats?.APPROVED ?? 0, icon: ShieldCheck, color: "text-green-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Monitoramento AML / KYT
          </h1>
          <p className="text-muted-foreground text-sm">
            Triagem antifraude e prevencao a lavagem de dinheiro em saques e depositos
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground text-sm font-medium transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Aviso de politica */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          O monitoramento opera em modo <span className="text-foreground font-medium">somente sinalizacao</span>:
          as transacoes nao sao bloqueadas automaticamente. Casos marcados como
          {" "}<span className="text-red-400 font-medium">Recusada</span> ou
          {" "}<span className="text-yellow-400 font-medium">Em Analise</span> devem ser revisados manualmente.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div
            key={c.key}
            className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-secondary">
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : screenings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Nenhuma triagem encontrada</p>
            <p className="text-sm text-muted-foreground">
              Nao ha registros para o filtro selecionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Risco</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s) => {
                  const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.PENDING;
                  const isInbound = s.direction === "inbound";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {s.user_name || "Desconhecido"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.user_email || s.user_id || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            isInbound ? "text-green-400" : "text-orange-400"
                          }`}
                        >
                          {isInbound ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                          {isInbound ? "Deposito" : "Saque"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatAmount(s.amount, s.currency)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {s.risk_score != null ? Number(s.risk_score).toFixed(0) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(s.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
