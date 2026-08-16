"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet,
  BarChart3,
  ArrowUp,
  Receipt,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MobileDashboard } from "./mobile-dashboard";
import { useProfile } from "@/components/profile-provider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30">
          Aprovado
        </span>
      );
    case "pending":
    case "processing":
      return (
        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          Pendente
        </span>
      );
    case "failed":
    case "cancelled":
      return (
        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
          Falhou
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
          {status}
        </span>
      );
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "deposit":
    case "pix_in":
      return "Pagamento PIX";
    case "withdrawal":
    case "pix_out":
      return "Saque PIX";
    case "transfer_in":
      return "Transferencia Recebida";
    case "transfer_out":
      return "Transferencia Enviada";
    default:
      return "Pagamento PIX";
  }
};

const isIncomingType = (type: string) => {
  return ["deposit", "transfer_in", "pix_in"].includes(type);
};

type PeriodFilter = "today" | "week" | "month" | "year" | "all" | "custom";

const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoje",
  week: "Semanal",
  month: "Mensal",
  year: "Anual",
  all: "Todo Periodo",
  custom: "Personalizado",
};

function getDateRange(period: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (period) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end,
      };
    case "week":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
        end,
      };
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0),
        end,
      };
    case "all":
    default:
      return {
        start: new Date(0),
        end,
      };
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function DashboardContent({
  profile: serverProfile,
  transactions,
  pixKeys,
}: DashboardContentProps) {
  const { profile: contextProfile, updateBalance, updateTotalRevenue } = useProfile();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (serverProfile?.balance !== undefined) {
      const serverBalance = Number(serverProfile.balance) || 0;
      const contextBalance = Number(contextProfile?.balance) || 0;
      
      if (serverBalance !== contextBalance) {
        updateBalance(serverBalance);
      }
    }
  }, [serverProfile?.balance, contextProfile?.balance, updateBalance]);

  const currentBalance = contextProfile?.balance ?? serverProfile?.balance ?? 0;
  const profile = serverProfile ? { ...serverProfile, balance: Number(currentBalance) } : null;

  const lifetimeTotalRevenue = useMemo(() => {
    const allDeposits = transactions.filter(
      (t) => ["deposit", "transfer_in", "pix_in"].includes(t.type) && t.status === "completed"
    );
    return allDeposits.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  useEffect(() => {
    updateTotalRevenue(lifetimeTotalRevenue);
  }, [lifetimeTotalRevenue, updateTotalRevenue]);

  const stats = useMemo(() => {
    const { start, end } = getDateRange(periodFilter);
    
    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= start && txDate <= end;
    });

    const depositTypes = ["deposit", "transfer_in", "pix_in"];
    const withdrawalTypes = ["withdrawal", "transfer_out", "pix_out"];

    // Volume transacionado (bruto)
    const volumeTransacionado = filtered
      .filter(t => depositTypes.includes(t.type) && ["completed", "pending", "processing"].includes(t.status))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Total retirado
    const totalRetirado = filtered
      .filter(t => withdrawalTypes.includes(t.type) && t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Total de transacoes
    const totalTransacoes = filtered.filter(t => 
      depositTypes.includes(t.type) && ["completed", "pending", "processing"].includes(t.status)
    ).length;

    // Taxas pagas
    const taxasPagas = filtered
      .filter(t => depositTypes.includes(t.type) && t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.fee) || 0), 0);

    // Comparar com periodo anterior
    const periodMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodMs);
    const prevEnd = new Date(start.getTime() - 1);

    const prevFiltered = transactions.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= prevStart && txDate <= prevEnd;
    });

    const prevVolume = prevFiltered
      .filter(t => depositTypes.includes(t.type) && t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const prevRetirado = prevFiltered
      .filter(t => withdrawalTypes.includes(t.type) && t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const prevTransacoes = prevFiltered.filter(t => 
      depositTypes.includes(t.type) && t.status === "completed"
    ).length;

    const calcGrowth = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    return {
      volumeTransacionado,
      totalRetirado,
      totalTransacoes,
      taxasPagas,
      filteredTransactions: filtered,
      volumeGrowth: calcGrowth(volumeTransacionado, prevVolume),
      retiradoGrowth: calcGrowth(totalRetirado, prevRetirado),
      transacoesGrowth: calcGrowth(totalTransacoes, prevTransacoes),
    };
  }, [transactions, periodFilter]);

  // Dados do grafico por hora (para hoje)
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { name: string; value: number }[] = [];

    // Gerar horas de 00:00 a 23:00
    for (let i = 0; i <= 23; i += 2) {
      const hour = `${String(i).padStart(2, "0")}:00`;
      
      const hourValue = transactions
        .filter(t => {
          const txDate = new Date(t.created_at);
          const isSameDay = txDate.getDate() === now.getDate() &&
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear();
          const txHour = txDate.getHours();
          return isSameDay && 
            txHour >= i && txHour < i + 2 &&
            ["deposit", "transfer_in", "pix_in"].includes(t.type) &&
            ["completed", "pending", "processing"].includes(t.status);
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      data.push({ name: hour, value: hourValue });
    }

    return data;
  }, [transactions]);

  // Metodos de pagamento
  const paymentMethods = useMemo(() => {
    const total = stats.filteredTransactions.filter(t => 
      ["deposit", "transfer_in", "pix_in"].includes(t.type)
    ).length;

    // Por enquanto so temos PIX
    return [
      { name: "PIX", value: total > 0 ? 100 : 0, color: "#3b82f6" },
    ];
  }, [stats.filteredTransactions]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Mobile Dashboard */}
      <MobileDashboard profile={profile} transactions={transactions} />
      
      {/* Desktop Dashboard */}
      <div className="hidden lg:block space-y-6 overflow-x-hidden">
        {/* Header com saudacao e filtro */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {profile?.email || profile?.name || "Usuario"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Aqui esta um resumo da sua conta.
            </p>
          </div>

          {/* Period Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-secondary transition-colors min-w-[140px] justify-between"
            >
              <span>{periodLabels[periodFilter]}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showPeriodDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setPeriodFilter(period);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors flex items-center justify-between ${
                        periodFilter === period ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      {periodLabels[period]}
                      {periodFilter === period && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats Cards - 4 principais */}
        <div className="grid grid-cols-4 gap-4">
          {/* Saldo Disponivel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Saldo Disponivel</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(profile?.balance || 0)}
            </p>
            <p className="text-xs text-green-500">
              {formatCurrency(stats.taxasPagas)} Taxas pagas
            </p>
          </motion.div>

          {/* Volume Transacionado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Volume transacionado</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(stats.volumeTransacionado)}
            </p>
            <p className={`text-xs flex items-center gap-1 ${stats.volumeGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
              <ArrowUp className={`w-3 h-3 ${stats.volumeGrowth < 0 ? "rotate-180" : ""}`} />
              {Math.abs(stats.volumeGrowth).toFixed(0)}% vs periodo anterior
            </p>
          </motion.div>

          {/* Total Retirado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Retirado</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(stats.totalRetirado)}
            </p>
            <p className={`text-xs flex items-center gap-1 ${stats.retiradoGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
              <ArrowUp className={`w-3 h-3 ${stats.retiradoGrowth < 0 ? "rotate-180" : ""}`} />
              {Math.abs(stats.retiradoGrowth).toFixed(0)}% vs periodo anterior
            </p>
          </motion.div>

          {/* Total de Transacoes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total de transacoes</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {stats.totalTransacoes}
            </p>
            <p className={`text-xs flex items-center gap-1 ${stats.transacoesGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
              <ArrowUp className={`w-3 h-3 ${stats.transacoesGrowth < 0 ? "rotate-180" : ""}`} />
              {Math.abs(stats.transacoesGrowth).toFixed(0)}% vs periodo anterior
            </p>
          </motion.div>
        </div>

        {/* Grafico + Metodos de Pagamento */}
        <div className="grid grid-cols-3 gap-4">
          {/* Grafico de Receita */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-2 bg-card border border-border rounded-xl p-5"
          >
            <h3 className="text-base font-semibold text-foreground mb-4">
              Receita de {formatDateBR(new Date())}
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => v.toFixed(0)}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorReceita)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Metodos de Pagamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="text-base font-semibold text-foreground mb-4">
              Metodos de Pagamento
            </h3>
            <div className="flex flex-col items-center justify-center h-[240px]">
              {stats.totalTransacoes > 0 ? (
                <>
                  <div className="w-32 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethods}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {paymentMethods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 w-full">
                    {paymentMethods.map((method) => (
                      <div key={method.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: method.color }} />
                          <span className="text-sm text-muted-foreground">{method.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{method.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">PIX</p>
                  <p className="text-2xl font-bold text-foreground mt-1">0%</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tabela de Ultimas Transacoes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Ultimas 10 Transacoes
            </h3>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm" className="text-primary text-xs">
                Ver todas
              </Button>
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma transacao encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">Suas transacoes aparecerao aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Metodo</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                            {tx.id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(tx.id)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                            {(tx.customer_name || "N")[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground">
                            {tx.customer_name || "Nao informado"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <ArrowUp className={`w-3 h-3 ${isIncomingType(tx.type) ? "text-green-500" : "text-red-500 rotate-180"}`} />
                          <span className={`text-sm font-medium ${isIncomingType(tx.type) ? "text-green-500" : "text-red-500"}`}>
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-foreground">{getTypeLabel(tx.type)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
