"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SalesChart } from "./sales-chart";
import { StatsCards } from "./stats-cards";
import { GoalsRoadmap } from "./goals-roadmap";
import { BannerCarousel } from "./banner-carousel";
import { CustomizableWidgets } from "./customizable-widgets";
import { MobileDashboard } from "./mobile-dashboard";
import { SupportAnnouncement } from "./support-announcement";
import { useProfile } from "@/components/profile-provider";

export interface Profile {
  id: string;
  balance: number;
  api_key: string;
  name: string | null;
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
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "pending":
    case "processing":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "failed":
    case "cancelled":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "deposit":
    case "transfer_in":
    case "pix_in":
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    case "withdrawal":
    case "transfer_out":
    case "pix_out":
      return <ArrowUpRight className="w-5 h-5 text-red-500" />;
    default:
      return <ArrowUpRight className="w-5 h-5 text-muted-foreground" />;
  }
};

const isIncomingType = (type: string) => {
  return ["deposit", "transfer_in", "pix_in"].includes(type);
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "deposit":
    case "pix_in":
      return "Depósito PIX";
    case "withdrawal":
    case "pix_out":
      return "Saque PIX";
    case "transfer_in":
      return "Transferência Recebida";
    case "transfer_out":
      return "Transferência Enviada";
    default:
      return type;
  }
};

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  year: "Este ano",
  all: "Todo período",
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

export function DashboardContent({
  profile: serverProfile,
  transactions,
  pixKeys,
}: DashboardContentProps) {
  const { profile: contextProfile, updateBalance, updateTotalRevenue } = useProfile();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Sincronizar saldo do servidor com o contexto global
  // Isso garante que quando o Server Component traz dados novos, o contexto é atualizado
  useEffect(() => {
    if (serverProfile?.balance !== undefined) {
      const serverBalance = Number(serverProfile.balance) || 0;
      const contextBalance = Number(contextProfile?.balance) || 0;
      
      // Se o saldo do servidor é diferente, atualiza o contexto
      if (serverBalance !== contextBalance) {
        updateBalance(serverBalance);
      }
    }
  }, [serverProfile?.balance, contextProfile?.balance, updateBalance]);

  // Usar o saldo do contexto (mais atualizado) ou do servidor como fallback
  const currentBalance = contextProfile?.balance ?? serverProfile?.balance ?? 0;
  const profile = serverProfile ? { ...serverProfile, balance: Number(currentBalance) } : null;

  // Calcular faturamento TOTAL acumulado (para metas) - independente do filtro de periodo
  const lifetimeTotalRevenue = useMemo(() => {
    const allDeposits = transactions.filter(
      (t) => ["deposit", "transfer_in", "pix_in"].includes(t.type) && t.status === "completed"
    );
    return allDeposits.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  // Sincronizar o faturamento total com o contexto global (para o header usar)
  useEffect(() => {
    updateTotalRevenue(lifetimeTotalRevenue);
  }, [lifetimeTotalRevenue, updateTotalRevenue]);

  const { totalReceivedGross, totalReceivedNet, totalSent, filteredTransactions } = useMemo(() => {
    const { start, end } = getDateRange(periodFilter);
    
    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= start && txDate <= end;
    });

    // Calcular valor bruto (amount) e liquido (net_amount ou amount - fee)
    const completedDeposits = filtered.filter(
      (t) => ["deposit", "transfer_in", "pix_in"].includes(t.type) && t.status === "completed"
    );

    const receivedGross = completedDeposits.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const receivedNet = completedDeposits.reduce((sum, t) => {
      // Se tem net_amount, usa ele; senao calcula: amount - fee
      const netValue = t.net_amount !== undefined 
        ? Number(t.net_amount) 
        : (Number(t.amount) || 0) - (Number(t.fee) || 0);
      return sum + (netValue || 0);
    }, 0);

    // Calcular valor liquido dos saques (net_amount = valor que o usuario recebeu, sem taxas)
    const sent = filtered
      .filter((t) => ["withdrawal", "transfer_out", "pix_out"].includes(t.type) && t.status === "completed")
      .reduce((sum, t) => {
        // Se tem net_amount, usa ele; senao calcula: amount - fee
        const netValue = t.net_amount !== undefined 
          ? Number(t.net_amount) 
          : (Number(t.amount) || 0) - (Number(t.fee) || 0);
        return sum + (netValue || 0);
      }, 0);

    return { 
      totalReceivedGross: receivedGross, 
      totalReceivedNet: receivedNet, 
      totalSent: sent, 
      filteredTransactions: filtered 
    };
  }, [transactions, periodFilter]);

  return (
    <>
      {/* Mobile Dashboard */}
      <MobileDashboard profile={profile} transactions={transactions} />
      
      {/* Desktop Dashboard */}
      <div data-onboarding="dashboard" className="hidden lg:block space-y-4 sm:space-y-6 lg:space-y-8 overflow-x-hidden">
      {/* Aviso de Suporte */}
      <SupportAnnouncement />
      
      {/* Welcome */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Olá, {profile?.name || "Usuário"}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Customizable Widgets */}
      <CustomizableWidgets
        balance={profile?.balance || 0}
        totalReceived={totalReceivedGross}
        totalSent={totalSent}
        pendingCount={filteredTransactions.filter(t => t.status === 'pending').length}
        savedPixKeys={pixKeys.map(k => ({ id: k.id, key_value: k.key_value, key_type: k.key_type }))}
      />
      
      {/* Sales Chart */}
      <div data-onboarding="sales-chart">
        <SalesChart transactions={transactions} />
      </div>

      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Metricas</h2>
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary border border-border rounded-xl text-xs sm:text-sm text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            {periodLabels[periodFilter]}
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`} />
          </button>
          {showPeriodDropdown && (
            <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setPeriodFilter(period);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm hover:bg-secondary transition-colors ${
                    periodFilter === period ? "bg-primary/10 text-primary" : "text-foreground"
                  }`}
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div data-onboarding="stats-cards">
        <StatsCards
        balance={profile?.balance || 0}
        blockedBalance={0}
        transactions={filteredTransactions}
        periodFilter={periodLabels[periodFilter]}
        allTransactions={transactions}
        />
      </div>

      {/* Goals Roadmap */}
      {profile && (
        <GoalsRoadmap
          totalRevenue={lifetimeTotalRevenue}
          userId={profile.id}
        />
      )}

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Transações Recentes
          </h2>
          <Link href="/dashboard/transactions">
            <Button variant="ghost" className="text-primary text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
              Ver todas
            </Button>
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma transação encontrada
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas transações aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-xl gap-3"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {getTypeLabel(transaction.type)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold text-sm sm:text-base ${
                      isIncomingType(transaction.type)
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {isIncomingType(transaction.type) ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {getStatusIcon(transaction.status)}
                    <span className="text-xs text-muted-foreground capitalize hidden sm:inline">
                      {transaction.status === "completed" && "Concluido"}
                      {transaction.status === "pending" && "Pendente"}
                      {transaction.status === "processing" && "Processando"}
                      {transaction.status === "failed" && "Falhou"}
                      {transaction.status === "cancelled" && "Cancelado"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
    </>
  );
}
