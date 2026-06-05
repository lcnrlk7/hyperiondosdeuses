"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Search,
  RefreshCw,
  Loader2,
  X,
  Eye,
  Send,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  description: string;
  created_at: string;
  payer_name?: string;
  external_id?: string;
  pix_key?: string;
  pix_key_type?: string;
  recipient_name?: string;
  recipient_bank?: string;
  balance_after?: number;
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resendingWebhooks, setResendingWebhooks] = useState(false);
  const [exporting, setExporting] = useState(false);

  const typeOptions = [
    { value: "all", label: "Todos" },
    { value: "pix_in", label: "Pagamento PIX" },
    { value: "pix_out", label: "PIX Saída" },
    { value: "withdrawal", label: "Saque" },
    { value: "deposit", label: "Depósito" },
  ];

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendente" },
    { value: "completed", label: "Aprovado" },
    { value: "cancelled", label: "Cancelado" },
    { value: "failed", label: "Falhou" },
  ];

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const response = await fetch("/api/user/reports");
      const data = await response.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendWebhooks() {
    setResendingWebhooks(true);
    try {
      const response = await fetch("/api/user/resend-webhooks", {
        method: "POST",
      });
      if (response.ok) {
        alert("Webhooks das últimas 24h foram reenviados!");
      } else {
        alert("Erro ao reenviar webhooks");
      }
    } catch (error) {
      console.error("Erro ao reenviar webhooks:", error);
      alert("Erro ao reenviar webhooks");
    } finally {
      setResendingWebhooks(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: "transactions" });
      if (typeFilter !== "all") params.append("transactionType", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/user/export?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao exportar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extrato_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-500/20 text-yellow-400", label: "Pendente" },
      processing: { color: "bg-blue-500/20 text-blue-400", label: "Processando" },
      completed: { color: "bg-green-500/20 text-green-400", label: "Aprovado" },
      cancelled: { color: "bg-red-500/20 text-red-400", label: "Cancelado" },
      failed: { color: "bg-red-500/20 text-red-400", label: "Falhou" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      pix_in: "Pagamento PIX",
      pix_out: "PIX Saída",
      withdrawal: "Saque",
      deposit: "Depósito",
      transfer_in: "Transferência Recebida",
      transfer_out: "Transferência Enviada",
    };
    return types[type] || type;
  };

  const isIncoming = (type: string) => {
    return ["pix_in", "deposit", "transfer_in"].includes(type);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.id.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search) ||
        tx.payer_name?.toLowerCase().includes(search) ||
        tx.external_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTypeDropdown(false);
      setShowStatusDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Extrato</h1>
          <p className="text-sm text-muted-foreground">Histórico completo de movimentações.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleResendWebhooks}
            disabled={resendingWebhooks}
            className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
          >
            {resendingWebhooks ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Reenviar Webhooks (24h)
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar Relatório Completo
          </Button>
        </div>
      </div>

      {/* Movimentações Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Card Header with Filters */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={loadReports}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-48"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors min-w-[140px]"
                >
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{typeOptions.find(o => o.value === typeFilter)?.label}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      {typeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTypeFilter(option.value);
                            setShowTypeDropdown(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          {option.label}
                          {typeFilter === option.value && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowTypeDropdown(false);
                  }}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors min-w-[140px]"
                >
                  <span className="text-muted-foreground">Status:</span>
                  <span>{statusOptions.find(o => o.value === statusFilter)?.label}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showStatusDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter(option.value);
                            setShowStatusDropdown(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          {option.label}
                          {statusFilter === option.value && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-border">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isIncoming(tx.type) ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <ArrowDownLeft className={`w-5 h-5 ${
                    isIncoming(tx.type) ? "text-green-500" : "text-red-500 rotate-180"
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {tx.payer_name || "Não informado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-muted-foreground">
                      {getTypeLabel(tx.type)}
                    </span>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      isIncoming(tx.type) ? "text-green-400" : "text-foreground"
                    }`}>
                      {isIncoming(tx.type) ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  {getStatusBadge(tx.status)}

                  <div className="text-right hidden sm:block min-w-[100px]">
                    <span className="text-xs text-muted-foreground">Saldo:</span>
                    <span className="text-sm text-foreground ml-1">
                      R$ 0,00
                    </span>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setShowDetails(true);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Detalhes da Movimentação
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">ID</span>
                  <span className="text-foreground font-mono text-xs truncate max-w-[200px]">
                    {selectedTransaction.id}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="text-foreground">
                    {getTypeLabel(selectedTransaction.type)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-foreground">
                    {selectedTransaction.payer_name || "Não informado"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Valor</span>
                  <span className={`font-semibold ${
                    isIncoming(selectedTransaction.type) ? "text-green-400" : "text-foreground"
                  }`}>
                    {isIncoming(selectedTransaction.type) ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>

                {selectedTransaction.fee > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Taxa</span>
                    <span className="text-red-400">
                      -{formatCurrency(selectedTransaction.fee)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>

                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Data</span>
                  <span className="text-foreground">
                    {formatDate(selectedTransaction.created_at)}
                  </span>
                </div>

                {selectedTransaction.description && (
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Descrição</span>
                    <span className="text-foreground text-right max-w-[200px]">
                      {selectedTransaction.description}
                    </span>
                  </div>
                )}

                {selectedTransaction.external_id && (
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">ID Externo</span>
                    <span className="text-foreground font-mono text-xs truncate max-w-[200px]">
                      {selectedTransaction.external_id}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setShowDetails(false)}
                className="w-full mt-6"
              >
                Fechar
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
