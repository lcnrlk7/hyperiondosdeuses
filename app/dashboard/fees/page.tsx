"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Percent,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  TrendingDown,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  Check,
} from "lucide-react";

interface UserFees {
  pix_fixed_fee: number;
  pix_percentage_fee: number;
  withdrawal_fee: number;
  withdrawal_fee_is_percentage: boolean;
  user_fee_percentage: number;
  has_percentage_fee: boolean;
  gateway_name: string;
  route_type: string;
  daily_limit: number;
  monthly_limit: number;
  min_deposit: number;
  max_deposit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  per_withdrawal_limit: number;
  total_fees_paid: number;
  total_transactions: number;
  total_volume: number;
}

// Taxas fixas por rota (apenas visual)
const ROUTE_FEES = {
  black: {
    name: "BLACK",
    depositPercentage: 5,
    depositFixed: 0,
    withdrawalPercentage: 5,
    withdrawalFixed: 0,
    color: "orange",
    description: "Taxa percentual em depósitos e saques",
  },
  white: {
    name: "WHITE",
    depositPercentage: 2,
    depositFixed: 0.70,
    withdrawalPercentage: 2,
    withdrawalFixed: 0,
    color: "zinc",
    description: "Taxa reduzida com valor fixo adicional",
  },
};

export default function FeesPage() {
  const [fees, setFees] = useState<UserFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<"black" | "white">("black");

  useEffect(() => {
    loadFees();
  }, []);

  useEffect(() => {
    if (fees?.route_type) {
      setSelectedRoute(fees.route_type as "black" | "white");
    }
  }, [fees]);

  async function loadFees() {
    try {
      const response = await fetch("/api/user/fees");
      const data = await response.json();
      if (data.fees) {
        setFees(data.fees);
      }
    } catch (error) {
      console.error("Error loading fees:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const formatPercent = (value: number | null | undefined) => {
    const num = Number(value) || 0;
    return `${num.toFixed(0)}%`;
  };

  const currentRouteFees = ROUTE_FEES[selectedRoute];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Taxas e Limites</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Confira suas taxas e limites de operação
          </p>
        </div>
        {fees && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
            fees.route_type === 'black' 
              ? 'bg-indigo-500/10 border border-indigo-500/20' 
              : 'bg-zinc-500/10 border border-zinc-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              fees.route_type === 'black' ? 'bg-indigo-500' : 'bg-zinc-400'
            }`} />
            <span className={`font-semibold ${
              fees.route_type === 'black' ? 'text-indigo-500' : 'text-zinc-400'
            }`}>
              Sua Rota: {fees.route_type?.toUpperCase() || 'BLACK'}
            </span>
          </div>
        )}
      </div>

      {/* Resumo de Taxas Pagas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-500/20">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <span className="text-xs sm:text-sm text-red-400">Total em Taxas</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(fees?.total_fees_paid || 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <span className="text-xs sm:text-sm text-blue-400">Volume Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(fees?.total_volume || 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-500/20">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <span className="text-xs sm:text-sm text-purple-400">Transações</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {fees?.total_transactions || 0}
          </p>
        </motion.div>
      </div>

      {/* Seletor de Rotas */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Taxas por Rota</h2>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedRoute("black")}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              selectedRoute === "black"
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-border bg-card hover:border-indigo-500/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="font-bold text-indigo-500">ROTA BLACK</span>
              </div>
              {selectedRoute === "black" && (
                <Check className="w-5 h-5 text-indigo-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {ROUTE_FEES.black.description}
            </p>
          </button>

          <button
            onClick={() => setSelectedRoute("white")}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              selectedRoute === "white"
                ? "border-zinc-400 bg-zinc-500/10"
                : "border-border bg-card hover:border-zinc-400/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-400" />
                <span className="font-bold text-zinc-400">ROTA WHITE</span>
              </div>
              {selectedRoute === "white" && (
                <Check className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {ROUTE_FEES.white.description}
            </p>
          </button>
        </div>

        {/* Cards de Taxas da Rota Selecionada */}
        <motion.div
          key={selectedRoute}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Taxa de Depósito */}
          <div className={`p-5 rounded-xl border ${
            selectedRoute === "black" 
              ? "bg-indigo-500/5 border-indigo-500/20" 
              : "bg-zinc-500/5 border-zinc-500/20"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedRoute === "black" ? "bg-indigo-500/20" : "bg-zinc-500/20"
              }`}>
                <ArrowDownLeft className={`w-5 h-5 ${
                  selectedRoute === "black" ? "text-indigo-500" : "text-zinc-400"
                }`} />
              </div>
              <span className="text-sm text-muted-foreground">Taxa Depósito</span>
            </div>
            <p className={`text-2xl font-bold ${
              selectedRoute === "black" ? "text-indigo-500" : "text-zinc-400"
            }`}>
              {formatPercent(currentRouteFees.depositPercentage)}
            </p>
            {currentRouteFees.depositFixed > 0 && (
              <p className={`text-lg font-semibold ${
                selectedRoute === "black" ? "text-indigo-400" : "text-zinc-500"
              }`}>
                + {formatCurrency(currentRouteFees.depositFixed)}
              </p>
            )}
          </div>

          {/* Taxa de Saque */}
          <div className={`p-5 rounded-xl border ${
            selectedRoute === "black" 
              ? "bg-indigo-500/5 border-indigo-500/20" 
              : "bg-zinc-500/5 border-zinc-500/20"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedRoute === "black" ? "bg-indigo-500/20" : "bg-zinc-500/20"
              }`}>
                <ArrowUpRight className={`w-5 h-5 ${
                  selectedRoute === "black" ? "text-indigo-500" : "text-zinc-400"
                }`} />
              </div>
              <span className="text-sm text-muted-foreground">Taxa Saque</span>
            </div>
            <p className={`text-2xl font-bold ${
              selectedRoute === "black" ? "text-indigo-500" : "text-zinc-400"
            }`}>
              {formatPercent(currentRouteFees.withdrawalPercentage)}
            </p>
            {currentRouteFees.withdrawalFixed > 0 && (
              <p className={`text-lg font-semibold ${
                selectedRoute === "black" ? "text-indigo-400" : "text-zinc-500"
              }`}>
                + {formatCurrency(currentRouteFees.withdrawalFixed)}
              </p>
            )}
          </div>

          {/* Limite Diário */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Limite Diário</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(fees?.daily_limit || 10000)}
            </p>
          </div>

          {/* Limite por Saque */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Limite por Saque</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(fees?.per_withdrawal_limit || fees?.max_withdrawal || 10000)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Alerta de rota atual do usuario */}
      {fees && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl ${
            fees.route_type === 'black'
              ? 'bg-indigo-500/10 border border-indigo-500/20'
              : 'bg-zinc-500/10 border border-zinc-500/20'
          }`}
        >
          <TrendingDown className={`w-5 h-5 flex-shrink-0 ${
            fees.route_type === 'black' ? 'text-indigo-500' : 'text-zinc-400'
          }`} />
          <p className={`text-sm ${fees.route_type === 'black' ? 'text-indigo-400' : 'text-zinc-400'}`}>
            Você está na rota <strong>{fees.route_type?.toUpperCase() || 'BLACK'}</strong> - 
            {fees.route_type === 'black' ? (
              <> Taxa de <strong>5%</strong> em depósitos e <strong>5%</strong> em saques</>
            ) : (
              <> Taxa de <strong>2% + R$0,70</strong> em depósitos e <strong>2%</strong> em saques</>
            )}
          </p>
        </motion.div>
      )}

      {/* Detalhes de Deposito e Saque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Depositos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Depósitos (PIX In)</h3>
              <p className="text-sm text-muted-foreground">Limites por operação</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Mínimo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.min_deposit || 10)}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Máximo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.max_deposit || 50000)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Saques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Saques (PIX Out)</h3>
              <p className="text-sm text-muted-foreground">Limites por operação</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Mínimo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.min_withdrawal || 10)}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Máximo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.max_withdrawal || 10000)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exemplo de Cálculo */}
      <motion.div
        key={`calc-${selectedRoute}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Percent className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Exemplo de Cálculo - Rota {currentRouteFees.name}</h3>
            <p className="text-sm text-muted-foreground">Veja como as taxas são aplicadas</p>
          </div>
        </div>

        <div className="bg-background/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">Valor do depósito</span>
            <span className="font-semibold text-foreground">R$ 100,00</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">
              Taxa ({formatPercent(currentRouteFees.depositPercentage)}
              {currentRouteFees.depositFixed > 0 && ` + ${formatCurrency(currentRouteFees.depositFixed)}`})
            </span>
            <span className="font-semibold text-red-400">
              - {formatCurrency(100 * currentRouteFees.depositPercentage / 100 + currentRouteFees.depositFixed)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-semibold text-foreground">Valor líquido</span>
            <span className="font-bold text-green-400 text-lg">
              {formatCurrency(100 - (100 * currentRouteFees.depositPercentage / 100) - currentRouteFees.depositFixed)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Informações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl"
      >
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Como funcionam as taxas?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Rota BLACK:</strong> 5% em depósitos + 5% em saques</li>
              <li><strong>Rota WHITE:</strong> 2% + R$0,70 em depósitos + 2% em saques</li>
              <li>A taxa de depósito é descontada automaticamente do valor recebido</li>
              <li>A taxa de saque é descontada do valor sacado</li>
              <li>Entre em contato com o suporte para mais informações</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
