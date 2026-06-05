"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Loader2,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  created_at: string;
  description: string | null;
  pix_key: string | null;
}

interface TransactionsContentProps {
  transactions: Transaction[];
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "pending":
    case "processing":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case "failed":
    case "cancelled":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
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

const isIncoming = (type: string) => {
  return type === "deposit" || type === "pix_in" || type === "transfer_in";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Concluído";
    case "pending":
      return "Pendente";
    case "processing":
      return "Processando";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};

export function TransactionsContent({ transactions }: TransactionsContentProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStatus, setExportStatus] = useState("all");

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: "transactions" });
      if (exportStartDate) params.append("startDate", exportStartDate);
      if (exportEndDate) params.append("endDate", exportEndDate);
      if (exportStatus) params.append("status", exportStatus);

      const response = await fetch(`/api/user/export?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao exportar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.pix_key?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = !filter || 
      (filter === "deposit" && (t.type === "deposit" || t.type === "pix_in")) ||
      (filter === "withdrawal" && (t.type === "withdrawal" || t.type === "pix_out")) ||
      t.type === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Transacoes
          </h1>
          <p className="text-muted-foreground mt-1">
            Historico completo de suas transacoes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Exportar Transacoes
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Data Inicial
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Data Final
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Status
                </label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pagos</option>
                  <option value="pending">Pendentes</option>
                  <option value="expired">Expirados</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, chave PIX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={filter === null ? "default" : "outline"}
            onClick={() => setFilter(null)}
            className={`flex-shrink-0 text-xs sm:text-sm ${filter === null ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filter === "deposit" ? "default" : "outline"}
            onClick={() => setFilter("deposit")}
            className={`flex-shrink-0 text-xs sm:text-sm ${filter === "deposit" ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            Depositos
          </Button>
          <Button
            variant={filter === "withdrawal" ? "default" : "outline"}
            onClick={() => setFilter("withdrawal")}
            className={`flex-shrink-0 text-xs sm:text-sm ${filter === "withdrawal" ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            Saques
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center"
        >
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-foreground font-medium">
            Nenhuma transacao encontrada
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filter
              ? "Tente ajustar os filtros"
              : "Suas transacoes aparecerao aqui"}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-3 md:hidden">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                {/* ID da transacao */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                    ID: {transaction.id}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.id);
                    }}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                    title="Copiar ID"
                  >
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  </button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isIncoming(transaction.type)
                          ? "bg-green-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      {isIncoming(transaction.type) ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {getTypeLabel(transaction.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold text-sm ${
                        isIncoming(transaction.type)
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {isIncoming(transaction.type) ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {getStatusIcon(transaction.status)}
                      <span className="text-xs text-muted-foreground">
                        {getStatusLabel(transaction.status)}
                      </span>
                    </div>
                  </div>
                </div>
                {transaction.fee > 0 && (
                  <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
                    <span>Taxa</span>
                    <span>{formatCurrency(transaction.fee)}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden hidden md:block"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      ID
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Tipo
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Valor
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Taxa
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Status
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                            {transaction.id}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(transaction.id);
                            }}
                            className="p-1 hover:bg-secondary rounded transition-colors flex-shrink-0"
                            title="Copiar ID"
                          >
                            <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isIncoming(transaction.type)
                                ? "bg-green-500/10"
                                : "bg-red-500/10"
                            }`}
                          >
                            {isIncoming(transaction.type) ? (
                              <ArrowDownLeft className="w-5 h-5 text-green-500" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <p className="font-medium text-foreground">
                            {getTypeLabel(transaction.type)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            isIncoming(transaction.type)
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {isIncoming(transaction.type)
                            ? "+"
                            : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatCurrency(transaction.fee || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className="text-sm">
                            {getStatusLabel(transaction.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
