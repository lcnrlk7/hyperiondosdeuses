"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Loader2,
} from "lucide-react";
interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount?: number;
  status: string;
  pix_key: string;
  description: string;
  created_at: string;
  paid_at?: string;
  user_email?: string;
  user_name?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (filter !== "all") {
      filtered = filtered.filter((t) => t.status === filter);
    }

    if (typeFilter !== "all") {
      if (typeFilter === "pix_in") {
        filtered = filtered.filter((t) => t.type === "pix_in" || t.type === "deposit");
      } else if (typeFilter === "pix_out") {
        filtered = filtered.filter((t) => t.type === "pix_out" || t.type === "withdrawal");
      } else {
        filtered = filtered.filter((t) => t.type === typeFilter);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.includes(searchTerm)
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, filter, typeFilter, transactions]);

  async function loadTransactions() {
    try {
      const response = await fetch("/api/admin/all-transactions");
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
        setFilteredTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
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
        return "Recebimento";
      case "transfer_out":
        return "Transferência";
      default:
        return type;
    }
  };
  
  const isIncoming = (type: string) => {
    return type === "deposit" || type === "pix_in" || type === "transfer_in";
  };

  // Estatisticas baseadas nas transacoes FILTRADAS
  const stats = {
    total: filteredTransactions.length,
    totalAll: transactions.length,
    volume: filteredTransactions
      .filter(t => t.status === "completed")
      .reduce((acc, t) => acc + Number(t.amount), 0),
    fees: filteredTransactions
      .filter(t => t.status === "completed")
      .reduce((acc, t) => acc + Number(t.fee || 0), 0),
    pending: filteredTransactions.filter(t => t.status === "pending").length,
    pixInCount: filteredTransactions.filter(t => t.type === "pix_in" || t.type === "deposit").length,
    pixOutCount: filteredTransactions.filter(t => t.type === "pix_out" || t.type === "withdrawal").length,
    pixInVolume: filteredTransactions
      .filter(t => (t.type === "pix_in" || t.type === "deposit") && t.status === "completed")
      .reduce((acc, t) => acc + Number(t.amount), 0),
    pixOutVolume: filteredTransactions
      .filter(t => (t.type === "pix_out" || t.type === "withdrawal") && t.status === "completed")
      .reduce((acc, t) => acc + Number(t.amount), 0),
  };

  async function confirmTransaction(transactionId: string, forceReprocess = false) {
    const message = forceReprocess 
      ? "ATENÇÃO: Esta transação já foi confirmada. Deseja REPROCESSAR e creditar o saldo novamente? Isso pode duplicar o crédito se o saldo já foi creditado corretamente."
      : "Tem certeza que deseja confirmar esta transação? O saldo será creditado ao usuário.";
    
    if (!confirm(message)) {
      return;
    }

    setConfirmingId(transactionId);
    try {
      const response = await fetch("/api/admin/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, forceReprocess }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Transação ${forceReprocess ? 'reprocessada' : 'confirmada'}! Saldo anterior: R$ ${data.user.previousBalance.toFixed(2)} | Novo saldo: R$ ${data.user.newBalance.toFixed(2)}`);
        loadTransactions();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      alert("Erro ao confirmar transação");
    } finally {
      setConfirmingId(null);
    }
  }

  async function fixBalance(transactionId: string) {
    if (!confirm("Isso irá creditar o valor líquido da transação na conta do usuário. O saldo será somado ao saldo atual. Continuar?")) {
      return;
    }

    setConfirmingId(transactionId);
    try {
      const response = await fetch("/api/admin/transactions/fix-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Saldo corrigido!\n\nUsuário: ${data.user.email}\nSaldo anterior: R$ ${data.user.previousBalance.toFixed(2)}\nCreditado: R$ ${data.user.creditedAmount.toFixed(2)}\nNovo saldo: R$ ${data.user.newBalance.toFixed(2)}`);
        loadTransactions();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fixing balance:", error);
      alert("Erro ao corrigir saldo");
    } finally {
      setConfirmingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Transacoes</h1>
          <p className="text-sm text-muted-foreground">
            Monitore todas as transacoes do sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-secondary border border-border rounded-xl text-white text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="all" className="bg-card">Todos</option>
              <option value="pix_in" className="bg-card">PIX In</option>
              <option value="pix_out" className="bg-card">PIX Out</option>
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-secondary border border-border rounded-xl text-white text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="all" className="bg-card">Todos</option>
              <option value="completed" className="bg-card">Concluido</option>
              <option value="pending" className="bg-card">Pendente</option>
              <option value="failed" className="bg-card">Falhou</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-muted-foreground">
            {typeFilter === "all" ? "Total" : typeFilter === "pix_in" ? "PIX In" : "PIX Out"}
            {filter !== "all" && ` (${filter})`}
          </p>
          {typeFilter === "all" && (
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pixInCount} in / {stats.pixOutCount} out
            </p>
          )}
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(stats.volume)}
          </p>
          <p className="text-sm text-muted-foreground">Volume (Concluido)</p>
          {typeFilter === "all" && (
            <p className="text-xs text-muted-foreground mt-1">
              In: {formatCurrency(stats.pixInVolume)} / Out: {formatCurrency(stats.pixOutVolume)}
            </p>
          )}
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.fees)}
          </p>
          <p className="text-sm text-muted-foreground">Taxas (Concluido)</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Transactions - Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            Nenhuma transacao encontrada
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="glass rounded-xl p-4">
              {/* ID da transacao */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                  ID: {transaction.id}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transaction.id);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copiar ID"
                >
                  <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isIncoming(transaction.type) ? "bg-green-400/10" : "bg-red-400/10"}`}>
                    {isIncoming(transaction.type) ? (
                      <ArrowDownRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{getTypeLabel(transaction.type)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === "completed" ? "bg-green-400/10 text-green-400" : transaction.status === "pending" ? "bg-yellow-400/10 text-yellow-400" : "bg-red-400/10 text-red-400"}`}>
                  {transaction.status === "completed" ? "OK" : transaction.status === "pending" ? "Pend" : "Falhou"}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-white truncate max-w-[150px]">{transaction.user_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{transaction.user_email}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isIncoming(transaction.type) ? "text-green-400" : "text-red-400"}`}>
                    {isIncoming(transaction.type) ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">Taxa: {formatCurrency(Number(transaction.fee || 0))}</p>
                </div>
              </div>
              {(transaction.status === "pending" || transaction.status === "completed") && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  {transaction.status === "pending" && (
                    <button
                      onClick={() => confirmTransaction(transaction.id, false)}
                      disabled={confirmingId === transaction.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {confirmingId === transaction.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirmar
                    </button>
                  )}
                  {transaction.status === "completed" && (
                    <button
                      onClick={() => fixBalance(transaction.id)}
                      disabled={confirmingId === transaction.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {confirmingId === transaction.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                      Corrigir Saldo
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Transactions Table - Desktop */}
      <div className="hidden lg:block glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  ID
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Taxa
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Data
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-secondary transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                          {transaction.id}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(transaction.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copiar ID"
                        >
                          <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
<div
                          className={`p-2 rounded-lg ${
                            isIncoming(transaction.type)
                              ? "bg-green-400/10"
                              : "bg-red-400/10"
                          }`}
                        >
                          {isIncoming(transaction.type) ? (
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <span className="text-white">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white">
                        {transaction.user_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.user_email}
                      </p>
                    </td>
                    <td className="p-4">
<p
                        className={`font-semibold ${
                          isIncoming(transaction.type)
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {isIncoming(transaction.type) ? "+" : "-"}
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatCurrency(Number(transaction.fee || 0))}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-400/10 text-green-400"
                            : transaction.status === "pending"
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {transaction.status === "completed"
                          ? "Concluído"
                          : transaction.status === "pending"
                          ? "Pendente"
                          : "Falhou"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {transaction.status === "pending" && (
                          <button
                            onClick={() => confirmTransaction(transaction.id, false)}
                            disabled={confirmingId === transaction.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm disabled:opacity-50"
                          >
                            {confirmingId === transaction.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Confirmar
                          </button>
                        )}
                        {transaction.status === "completed" && (
                          <>
                            <button
                              onClick={() => fixBalance(transaction.id)}
                              disabled={confirmingId === transaction.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm disabled:opacity-50"
                              title="Corrigir Saldo: credita o valor líquido no saldo do usuário"
                            >
                              {confirmingId === transaction.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <DollarSign className="w-4 h-4" />
                              )}
                              Corrigir Saldo
                            </button>
                          </>
                        )}
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
