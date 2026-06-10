"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Users,
  Download,
  Eye,
  Calendar,
  X,
  Copy,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  description: string;
  created_at: string;
  payer_name?: string;
  external_id?: string;
}

interface ReportStats {
  total_transactions: number;
  total_volume: number;
  total_fees_collected: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
  users_count: number;
  today_volume: number;
  today_fees: number;
}

type PeriodFilter = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "all" | "custom";

export default function AdminReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pix_in" | "pix_out" | "withdrawal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reports");
      const data = await response.json();
      if (data.transactions) {
        setTransactions(data.transactions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
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

  const formatDateOnly = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" />, label: "Pendente" },
      processing: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: "Processando" },
      completed: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3 h-3" />, label: "Aprovado" },
      cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" />, label: "Cancelado" },
      failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertCircle className="w-3 h-3" />, label: "Falhou" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pix_in: { color: "bg-green-500/10 text-green-400", icon: <ArrowDownLeft className="w-3 h-3" />, label: "PIX In" },
      pix_out: { color: "bg-orange-500/10 text-orange-400", icon: <ArrowUpRight className="w-3 h-3" />, label: "PIX Out" },
      withdrawal: { color: "bg-purple-500/10 text-purple-400", icon: <ArrowUpRight className="w-3 h-3" />, label: "Saque" },
      deposit: { color: "bg-blue-500/10 text-blue-400", icon: <ArrowDownLeft className="w-3 h-3" />, label: "Depósito" },
    };
    const typeInfo = types[type] || types.pix_in;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.icon}
        {typeInfo.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pix_in: "Pagamento PIX",
      pix_out: "PIX Saída",
      withdrawal: "Saque",
      deposit: "Depósito",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      completed: "Aprovado",
      cancelled: "Cancelado",
      failed: "Falhou",
    };
    return labels[status] || status;
  };

  const filterByDate = useCallback((tx: Transaction) => {
    const txDate = new Date(tx.created_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (periodFilter) {
      case "today":
        return txDate >= today;
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return txDate >= yesterday && txDate < today;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return txDate >= monthAgo;
      case "quarter":
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return txDate >= quarterAgo;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return txDate >= yearAgo;
      case "custom":
        if (customDateStart && customDateEnd) {
          const start = new Date(customDateStart);
          const end = new Date(customDateEnd + "T23:59:59");
          return txDate >= start && txDate <= end;
        }
        return true;
      case "all":
      default:
        return true;
    }
  }, [periodFilter, customDateStart, customDateEnd]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (!filterByDate(tx)) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.id.toLowerCase().includes(search) ||
        tx.user_email?.toLowerCase().includes(search) ||
        tx.user_name?.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search) ||
        tx.external_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filteredStats = {
    volume: filteredTransactions
      .filter(tx => tx.status === "completed" && (tx.type === "pix_in" || tx.type === "deposit"))
      .reduce((acc, tx) => acc + tx.amount, 0),
    fees: filteredTransactions.filter(tx => tx.status === "completed").reduce((acc, tx) => acc + tx.fee, 0),
    count: filteredTransactions.length,
    completedCount: filteredTransactions.filter(tx => tx.status === "completed").length,
    pendingCount: filteredTransactions.filter(tx => tx.status === "pending").length,
    cancelledCount: filteredTransactions.filter(tx => tx.status === "cancelled" || tx.status === "failed").length,
  };

  const getPeriodLabel = () => {
    const labels: Record<PeriodFilter, string> = {
      today: "Hoje",
      yesterday: "Ontem",
      week: "Última Semana",
      month: "Último Mês",
      quarter: "Último Trimestre",
      year: "Último Ano",
      all: "Todo Período",
      custom: customDateStart && customDateEnd 
        ? `${formatDateOnly(customDateStart)} - ${formatDateOnly(customDateEnd)}`
        : "Personalizado",
    };
    return labels[periodFilter];
  };

  // Exportar PDF
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR");

    const completedTxs = filteredTransactions.filter(tx => tx.status === "completed");
    const totalVolume = completedTxs
      .filter(tx => tx.type === "pix_in" || tx.type === "deposit")
      .reduce((acc, tx) => acc + tx.amount, 0);
    const totalFees = completedTxs.reduce((acc, tx) => acc + tx.fee, 0);
    const totalNet = totalVolume - totalFees;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Financeiro - Hyperion Pay</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20px; 
            background: white; 
            color: #1a1a1a;
            font-size: 11px;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 2px solid #1a1a1a; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
          }
          .logo { 
            font-size: 24px; 
            font-weight: 800; 
            color: #f97316;
            letter-spacing: 2px;
          }
          .logo span { color: #1a1a1a; }
          .header-info { text-align: right; font-size: 10px; color: #666; }
          .title { 
            font-size: 16px; 
            font-weight: 700; 
            margin-bottom: 5px;
            color: #1a1a1a;
          }
          .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
          .period-badge {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .summary-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
          }
          .summary-card.highlight {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            border: none;
          }
          .summary-card .label { font-size: 10px; text-transform: uppercase; opacity: 0.7; margin-bottom: 5px; }
          .summary-card .value { font-size: 18px; font-weight: 700; }
          .summary-card.highlight .label { color: rgba(255,255,255,0.8); }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-size: 10px;
          }
          th { 
            background: #1a1a1a; 
            color: white; 
            padding: 10px 8px; 
            text-align: left;
            font-weight: 600;
            font-size: 9px;
            text-transform: uppercase;
          }
          th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }
          td { 
            padding: 8px; 
            border-bottom: 1px solid #eee;
            vertical-align: middle;
          }
          td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; }
          tr:hover { background: #f8f9fa; }
          .user-cell { }
          .user-name { font-weight: 600; color: #1a1a1a; }
          .user-email { font-size: 9px; color: #666; }
          .type-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
          }
          .type-pix_in { background: #dcfce7; color: #166534; }
          .type-pix_out { background: #ffedd5; color: #9a3412; }
          .type-withdrawal { background: #f3e8ff; color: #7c3aed; }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
          }
          .status-completed { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef9c3; color: #854d0e; }
          .status-cancelled, .status-failed { background: #fee2e2; color: #991b1b; }
          .amount { font-weight: 600; }
          .amount.positive { color: #166534; }
          .amount.negative { color: #991b1b; }
          .fee { color: #166534; font-weight: 600; }
          .footer { 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 9px;
            color: #999;
          }
          .totals-row {
            background: #f8f9fa;
            font-weight: 700;
          }
          .totals-row td { border-top: 2px solid #1a1a1a; }
          @media print {
            body { padding: 0; }
            .summary-card.highlight { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">HYPERION<span>PAY</span></div>
          </div>
          <div class="header-info">
            <div>Gerado em: ${dateStr} às ${timeStr}</div>
            <div>Documento Oficial para fins de conferência</div>
          </div>
        </div>
        
        <div class="title">RELATÓRIO FINANCEIRO CONSOLIDADO</div>
        <div class="subtitle">Visão geral de transações e taxas da plataforma</div>
        <div class="period-badge">Período: ${getPeriodLabel()}</div>
        
        <div class="summary-cards">
          <div class="summary-card">
            <div class="label">Total de Transações</div>
            <div class="value">${filteredStats.count}</div>
          </div>
          <div class="summary-card">
            <div class="label">Volume Processado</div>
            <div class="value">${formatCurrency(totalVolume)}</div>
          </div>
          <div class="summary-card highlight">
            <div class="label">Taxas Coletadas</div>
            <div class="value">${formatCurrency(totalFees)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Aprovadas / Pendentes / Canceladas</div>
            <div class="value">${filteredStats.completedCount} / ${filteredStats.pendingCount} / ${filteredStats.cancelledCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Tipo</th>
              <th>Valor (R$)</th>
              <th>Taxa (R$)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.slice(0, 500).map(tx => `
              <tr>
                <td>${formatDate(tx.created_at)}</td>
                <td class="user-cell">
                  <div class="user-name">${tx.user_name || tx.payer_name || "Não informado"}</div>
                  <div class="user-email">${tx.user_email || "-"}</div>
                </td>
                <td><span class="type-badge type-${tx.type}">${getTypeLabel(tx.type)}</span></td>
                <td class="amount ${tx.type === "pix_in" || tx.type === "deposit" ? "positive" : "negative"}">
                  ${tx.type === "pix_in" || tx.type === "deposit" ? "+" : "-"}${formatCurrency(tx.amount)}
                </td>
                <td class="fee">+${formatCurrency(tx.fee || 0)}</td>
                <td><span class="status-badge status-${tx.status}">${getStatusLabel(tx.status)}</span></td>
              </tr>
            `).join("")}
            <tr class="totals-row">
              <td colspan="3"><strong>TOTAIS (${completedTxs.length} transações aprovadas)</strong></td>
              <td class="amount positive"><strong>${formatCurrency(totalVolume)}</strong></td>
              <td class="fee"><strong>+${formatCurrency(totalFees)}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Este documento foi gerado eletronicamente e possui autenticidade digital garantida pelo motor Hyperion Pay.</p>
          <p>Página de conferência: HyperionPay v2.0</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ["Data", "Usuário", "Email", "Tipo", "Valor", "Taxa", "Líquido", "Status", "ID"];
    const rows = filteredTransactions.map(tx => [
      formatDate(tx.created_at),
      tx.user_name || tx.payer_name || "Não informado",
      tx.user_email || "-",
      getTypeLabel(tx.type),
      tx.amount.toFixed(2),
      (tx.fee || 0).toFixed(2),
      (tx.amount - (tx.fee || 0)).toFixed(2),
      getStatusLabel(tx.status),
      tx.id,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_financeiro_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Abrir modal de detalhes
  const openDetailModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Visão completa de transações e taxas da plataforma</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90">
            <Printer className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Período</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "today", label: "Hoje" },
            { value: "yesterday", label: "Ontem" },
            { value: "week", label: "7 dias" },
            { value: "month", label: "30 dias" },
            { value: "quarter", label: "Trimestre" },
            { value: "year", label: "Anual" },
            { value: "all", label: "Tudo" },
            { value: "custom", label: "Personalizado" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriodFilter(option.value as PeriodFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === option.value
                  ? "bg-primary text-white"
                  : "bg-[#1a1a1a] text-muted-foreground hover:text-foreground hover:bg-[#222]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Custom date range */}
        {periodFilter === "custom" && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Data Início</label>
              <Input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="bg-[#1a1a1a] border-border"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="bg-[#1a1a1a] border-border"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Transações</span>
          </div>
          <p className="text-2xl font-bold text-white">{filteredStats.count}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Volume</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(filteredStats.volume)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20"
        >
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Taxas Ganhas</span>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(filteredStats.fees)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Aprovadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{filteredStats.completedCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-white">{filteredStats.pendingCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <XCircle className="w-4 h-4" />
            <span className="text-xs">Canceladas</span>
          </div>
          <p className="text-2xl font-bold text-white">{filteredStats.cancelledCount}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-2xl bg-[#111111] border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, usuário, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os tipos</option>
            <option value="pix_in">PIX Entrada</option>
            <option value="pix_out">PIX Saída</option>
            <option value="withdrawal">Saques</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="completed">Aprovados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#111111] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuário</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Taxa</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma transação encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 100).map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px] block">
                        {tx.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">{formatDate(tx.created_at)}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.user_name || tx.payer_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{tx.user_email}</p>
                      </div>
                    </td>
                    <td className="p-4">{getTypeBadge(tx.type)}</td>
                    <td className="p-4 text-right">
                      <span className={`text-sm font-medium ${tx.type === "pix_in" || tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                        {tx.type === "pix_in" || tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-green-400 font-medium">
                        +{formatCurrency(tx.fee || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openDetailModal(tx)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {Math.min(filteredTransactions.length, 100)} de {filteredTransactions.length} transações
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Volume: <span className="text-foreground font-medium">{formatCurrency(filteredStats.volume)}</span>
            </span>
            <span className="text-sm font-medium text-green-400">
              Taxas: {formatCurrency(filteredStats.fees)}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d1117] border border-border rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">
                  Detalhes da Transação
                </h3>
                {getStatusBadge(selectedTransaction.status)}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Amount Card */}
              <div className="bg-[#161b22] rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valor da Operação</p>
                <p className={`text-3xl font-bold ${selectedTransaction.type === "pix_in" || selectedTransaction.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                  {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(selectedTransaction.created_at)}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Usuário</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedTransaction.user_name || selectedTransaction.payer_name || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm text-foreground">
                    {selectedTransaction.user_email || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="text-sm text-foreground">
                    {getTypeLabel(selectedTransaction.type)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Taxa Coletada</span>
                  <span className="text-sm font-medium text-green-400">
                    +{formatCurrency(selectedTransaction.fee || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Valor Líquido</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(selectedTransaction.amount - (selectedTransaction.fee || 0))}
                  </span>
                </div>
              </div>

              {/* ID Section */}
              <div className="bg-[#161b22] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">ID da Transação</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTransaction.id);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {selectedTransaction.id}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="outline"
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
