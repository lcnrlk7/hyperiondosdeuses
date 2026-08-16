"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  Download,
  Clock,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/ceo/stat-card";
import { TransactionsOverview } from "@/components/ceo/transactions-overview";
import { MethodsDonut } from "@/components/ceo/methods-donut";
import { RecentTransactions } from "@/components/ceo/recent-transactions";

interface Growth {
  volume: number;
  fees: number;
  users: number;
  transactions: number;
}

interface Stats {
  totalVolumeRaw: number;
  totalFeesRaw: number;
  totalUsers: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  pendingKyc: number;
  pendingWithdrawals: number;
  growth: Growth;
}

interface SeriesPoint {
  date: string;
  volume: number;
  fees: number;
  approved: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  fee: number | string;
  status: string;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
  payer_name?: string | null;
}

const emptyStats: Stats = {
  totalVolumeRaw: 0,
  totalFeesRaw: 0,
  totalUsers: 0,
  completedTransactions: 0,
  pendingTransactions: 0,
  failedTransactions: 0,
  pendingKyc: 0,
  pendingWithdrawals: 0,
  growth: { volume: 0, fees: 0, users: 0, transactions: 0 },
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function CEODashboard() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [methods, setMethods] = useState<{ name: string; value: number }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState("");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/stats");
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/lp-x7k9m2-internal";
        return;
      }
      const data = await res.json();

      if (data.stats) {
        setStats({
          totalVolumeRaw: Number(data.stats.totalVolumeRaw) || 0,
          totalFeesRaw: Number(data.stats.totalFeesRaw) || 0,
          totalUsers: Number(data.stats.totalUsers) || 0,
          completedTransactions: Number(data.stats.completedTransactions) || 0,
          pendingTransactions: Number(data.stats.pendingTransactions) || 0,
          failedTransactions: Number(data.stats.failedTransactions) || 0,
          pendingKyc: Number(data.stats.pendingKyc) || 0,
          pendingWithdrawals: Number(data.stats.pendingWithdrawals) || 0,
          growth: data.stats.growth || emptyStats.growth,
        });
      }
      if (Array.isArray(data.timeSeries)) setSeries(data.timeSeries);
      if (Array.isArray(data.methodDistribution)) setMethods(data.methodDistribution);

      const txRes = await fetch("/api/admin/transactions?limit=6");
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData.transactions)) setTransactions(txData.transactions);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Rotulo do periodo: ultimos 7 dias
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    setRange(`${fmt(start)} - ${fmt(end)}`);
  }, [loadData]);

  const exportCSV = () => {
    const header = ["ID", "Tipo", "Valor", "Taxa", "Status", "Data"];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      Number(t.amount).toFixed(2),
      Number(t.fee).toFixed(2),
      t.status,
      new Date(t.created_at).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hyperionpay-transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-secondary" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-secondary lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  const sparkVolume = series.map((s) => ({ v: s.volume }));
  const sparkFees = series.map((s) => ({ v: s.fees }));
  const sparkApproved = series.map((s) => ({ v: s.approved }));

  const alerts = [
    stats.pendingKyc > 0 && {
      icon: FileCheck,
      label: `${stats.pendingKyc} verificação(ões) KYC aguardando análise`,
      href: "/lp-x7k9m2-internal/ceo/kyc",
      color: "text-amber-600 bg-amber-500/10",
    },
    stats.pendingWithdrawals > 0 && {
      icon: Wallet,
      label: `${stats.pendingWithdrawals} saque(s) pendente(s) de aprovação`,
      href: "/lp-x7k9m2-internal/ceo/withdrawals",
      color: "text-blue-600 bg-blue-500/10",
    },
    stats.pendingTransactions > 0 && {
      icon: Clock,
      label: `${stats.pendingTransactions} transação(ões) pendente(s)`,
      href: "/lp-x7k9m2-internal/ceo/transactions",
      color: "text-purple-600 bg-purple-500/10",
    },
  ].filter(Boolean) as { icon: typeof FileCheck; label: string; href: string; color: string }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            Olá, CEO <span className="animate-float-delay-1">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo geral da sua plataforma Hyperion Pay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{range}</span>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Volume Total"
          value={formatBRL(stats.totalVolumeRaw)}
          description="Total de transações aprovadas"
          icon={Wallet}
          growth={stats.growth.volume}
          sparkData={sparkVolume}
          color="blue"
        />
        <StatCard
          index={1}
          label="Taxas Arrecadadas"
          value={formatBRL(stats.totalFeesRaw)}
          description="Receita total em taxas"
          icon={DollarSign}
          growth={stats.growth.fees}
          sparkData={sparkFees}
          color="green"
        />
        <StatCard
          index={2}
          label="Usuários Cadastrados"
          value={stats.totalUsers.toString()}
          description="Total de usuários"
          icon={Users}
          growth={stats.growth.users}
          sparkData={sparkApproved}
          color="purple"
        />
        <StatCard
          index={3}
          label="Transações Aprovadas"
          value={stats.completedTransactions.toString()}
          description="Transações concluídas"
          icon={CheckCircle2}
          growth={stats.growth.transactions}
          sparkData={sparkApproved}
          color="emerald"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{a.label}</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
            </Link>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionsOverview data={series} />
        </div>
        <MethodsDonut data={methods} />
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={transactions} />
    </div>
  );
}
