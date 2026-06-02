"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  ChevronDown,
  Wallet,
  FileText,
  ArrowLeftRight,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/components/profile-provider";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  description: string | null;
}

interface MobileDashboardProps {
  profile: {
    id: string;
    balance: number;
    name: string | null;
    email?: string;
  } | null;
  transactions: Transaction[];
}

type PeriodFilter = "today" | "week" | "month" | "all";

const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoje",
  week: "Semana",
  month: "Mes",
  all: "Tudo",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  }).toUpperCase();
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
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
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

const isIncomingType = (type: string) => {
  return ["deposit", "transfer_in", "pix_in", "received", "sale"].includes(type);
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "deposit":
    case "pix_in":
      return "Transacao Recebida";
    case "withdrawal":
    case "pix_out":
      return "Saque PIX";
    case "transfer_in":
      return "Transferencia Recebida";
    case "transfer_out":
      return "Transferencia Enviada";
    default:
      return "Transacao";
  }
};

export function MobileDashboard({ profile: serverProfile, transactions }: MobileDashboardProps) {
  const { profile: contextProfile } = useProfile();
  const [showBalance, setShowBalance] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const currentBalance = contextProfile?.balance ?? serverProfile?.balance ?? 0;
  const profile = serverProfile ? { ...serverProfile, balance: Number(currentBalance) } : null;

  // Calcular estatisticas baseadas no periodo
  const stats = useMemo(() => {
    const { start, end } = getDateRange(periodFilter);
    
    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= start && txDate <= end;
    });

    const completedDeposits = filtered.filter(
      (t) => isIncomingType(t.type) && t.status === "completed"
    );
    const completedWithdrawals = filtered.filter(
      (t) => ["withdrawal", "transfer_out", "pix_out"].includes(t.type) && t.status === "completed"
    );

    const totalTransactions = completedDeposits.length;
    const totalVolume = completedDeposits.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalFees = completedDeposits.reduce((sum, t) => {
      // Estimar taxa de 2.5%
      return sum + (Number(t.amount) || 0) * 0.025;
    }, 0);
    const totalWithdrawals = completedWithdrawals.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      transactions: totalTransactions,
      volume: totalVolume,
      fees: totalFees,
      withdrawals: totalWithdrawals,
      filteredTransactions: filtered.slice(0, 10),
    };
  }, [transactions, periodFilter]);

  // Agrupar transacoes por data
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    stats.filteredTransactions.forEach((tx) => {
      const date = formatDate(tx.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });
    
    return groups;
  }, [stats.filteredTransactions]);

  const quickActions = [
    { id: "deposit", label: "DEPOSITAR", icon: Wallet, href: "/dashboard/wallet", color: "bg-primary/10 text-primary" },
    { id: "extract", label: "EXTRATO", icon: FileText, href: "/dashboard/transactions", color: "bg-blue-500/10 text-blue-400" },
    { id: "transfer", label: "TRANSFERIR", icon: ArrowLeftRight, href: "/dashboard/transfer", color: "bg-purple-500/10 text-purple-400" },
    { id: "affiliates", label: "AFILIADOS", icon: Users, href: "/dashboard/affiliates", badge: "NOVO", color: "bg-cyan-500/10 text-cyan-400" },
  ];

  return (
    <div className="lg:hidden space-y-4 pb-24">
      {/* Header com saudacao e periodo */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Ola, {profile?.name?.split(" ")[0] || "Usuario"}
          </h1>
          <p className="text-xs text-muted-foreground">Resumo da sua conta</p>
        </div>
        
        {/* Seletor de Periodo */}
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            {periodLabels[periodFilter]}
            <ChevronDown className={`w-3 h-3 transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {showPeriodDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-1 w-28 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setPeriodFilter(period);
                      setShowPeriodDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-secondary transition-colors ${
                      periodFilter === period ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                  >
                    {periodLabels[period]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Card de Saldo Principal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        {/* Saldo */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground tracking-wider">SALDO DISPONIVEL</span>
          <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground p-1">
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-3xl font-bold text-foreground mb-5">
          {showBalance ? formatCurrency(profile?.balance || 0) : "R$ ******"}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground tracking-wider">TRANSACOES</p>
            <p className="text-sm font-semibold text-foreground">{stats.transactions}</p>
          </div>
          <div className="text-center border-l border-border">
            <p className="text-[10px] text-muted-foreground tracking-wider">VOLUME</p>
            <p className="text-sm font-semibold text-foreground">
              {showBalance ? `R$ ${Math.floor(stats.volume)}` : "***"}
            </p>
          </div>
          <div className="text-center border-l border-border">
            <p className="text-[10px] text-muted-foreground tracking-wider">TAXAS</p>
            <p className="text-sm font-semibold text-foreground">
              {showBalance ? `R$ ${Math.floor(stats.fees)}` : "***"}
            </p>
          </div>
          <div className="text-center border-l border-border">
            <p className="text-[10px] text-muted-foreground tracking-wider">SAQUES</p>
            <p className="text-sm font-semibold text-foreground">
              {showBalance ? `R$ ${Math.floor(stats.withdrawals)}` : "***"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Funcoes Principais */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">FUNCOES PRINCIPAIS</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link key={action.id} href={action.href}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl"
              >
                {action.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-cyan-500 text-[8px] font-bold text-white rounded-full">
                    {action.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-foreground text-center">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Transacoes Recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground tracking-wider">TRANSACOES RECENTES</h2>
          <Link href="/dashboard/transactions" className="text-xs text-primary flex items-center gap-1">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhuma transacao no periodo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <p className="text-[10px] text-muted-foreground mb-2 px-1">{date}</p>
                <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {txs.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isIncomingType(tx.type) ? "bg-green-500/10" : "bg-red-500/10"
                        }`}>
                          {isIncomingType(tx.type) ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{getTypeLabel(tx.type)}</p>
                          <p className="text-xs text-muted-foreground">{tx.description || "Nao informado"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          isIncomingType(tx.type) ? "text-green-500" : "text-red-500"
                        }`}>
                          {isIncomingType(tx.type) ? "+" : "-"}{formatCurrency(tx.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          {tx.status === "completed" && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {tx.status === "pending" && <Clock className="w-3 h-3 text-yellow-500" />}
                          {tx.status === "failed" && <XCircle className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border px-4 py-2 z-40">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 py-1.5 px-3 text-primary">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
            </svg>
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          
          <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 py-1.5 px-3 text-muted-foreground">
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Extrato</span>
          </Link>
          
          {/* Botao Central */}
          <Link href="/dashboard/wallet" className="relative -mt-6">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <ArrowUpRight className="w-6 h-6 text-primary-foreground" />
            </div>
          </Link>
          
          <Link href="/dashboard/integration" className="flex flex-col items-center gap-1 py-1.5 px-3 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-[10px]">Integracoes</span>
          </Link>
          
          <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 py-1.5 px-3 text-muted-foreground">
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Ajustes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
