"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ArrowDownLeft,
  Download,
  Search,
  RefreshCw,
  Loader2,
  X,
  Eye,
  Send,
  ChevronDown,
  Check,
  Copy,
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
  payer_document?: string;
  external_id?: string;
  pix_key?: string;
  pix_key_type?: string;
  recipient_name?: string;
  recipient_bank?: string;
  end_to_end_id?: string;
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
  const [copied, setCopied] = useState(false);

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

  function handleExportPDF() {
    setExporting(true);
    
    // Create printable content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permita pop-ups para exportar o relatório");
      setExporting(false);
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR");

    let runningBalance = 0;
    const transactionsHTML = filteredTransactions.map((tx) => {
      const isIn = isIncoming(tx.type);
      const valueSign = isIn ? "(+)" : "(-)";
      const valueColor = isIn ? "color: #22c55e;" : "color: #ef4444;";
      runningBalance += isIn ? tx.amount : -tx.amount;
      const feeDisplay = tx.fee > 0 ? `-R$ ${tx.fee.toFixed(2).replace(".", ",")}` : "-";
      
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #333; font-size: 12px; color: #888;">
            ${new Date(tx.created_at).toLocaleDateString("pt-BR")}<br/>
            ${new Date(tx.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #333;">
            <div style="font-weight: 600; color: #fff; font-size: 13px;">${tx.payer_name || "NÃO INFORMADO"}</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">ID: ${tx.id}</div>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #333; text-align: right;">
            <span style="${valueColor} font-weight: 600;">${valueSign} R$ ${tx.amount.toFixed(2).replace(".", ",")}</span>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #333; text-align: right; color: #ef4444; font-size: 12px;">
            ${feeDisplay}
          </td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Hyperion Pay</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            padding: 40px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f97316;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 800;
            color: #f97316;
            letter-spacing: 2px;
          }
          .logo-sub {
            font-size: 10px;
            color: #888;
            letter-spacing: 3px;
          }
          .header-right {
            text-align: right;
            font-size: 12px;
            color: #888;
          }
          .header-right strong {
            color: #fff;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #888;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          th {
            text-align: left;
            padding: 12px 8px;
            border-bottom: 2px solid #333;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          th:nth-child(3), th:nth-child(4) {
            text-align: right;
          }
          .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #333;
            font-size: 11px;
            color: #666;
          }
          .footer p {
            margin-bottom: 5px;
          }
          @media print {
            body { background: #fff; color: #000; }
            .header { border-bottom-color: #f97316; }
            th { border-bottom-color: #ddd; color: #666; }
            td { border-bottom-color: #eee; color: #333; }
            td div { color: #000 !important; }
            .footer { border-top-color: #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <div>
              <div class="logo-text">HYPERION</div>
              <div class="logo-sub">PAY</div>
            </div>
          </div>
          <div class="header-right">
            <strong>Gerado em: ${dateStr} às ${timeStr}</strong><br/>
            Documento Oficial para fins de conferência
          </div>
        </div>

        <div class="title">Relatório Consolidado de Conta Corrente</div>

        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Descrição da Transação</th>
              <th>Valor (R$)</th>
              <th>Taxa (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${transactionsHTML || '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #666;">Nenhuma transação encontrada</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p>Este documento foi gerado eletronicamente e possui autenticidade digital garantida pelo motor Hyperion Pay.</p>
          <p>Página de conferência Hyperion Pay v2.0</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      setExporting(false);
    }, 500);
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadTransactionPDF(tx: Transaction) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permita pop-ups para baixar o PDF");
      return;
    }

    const date = new Date(tx.created_at);
    const dateStr = date.toLocaleDateString("pt-BR");
    const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante - ${tx.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #fff;
            padding: 40px;
            max-width: 500px;
            margin: 0 auto;
          }
          .card {
            background: #1e293b;
            border-radius: 16px;
            padding: 24px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
          }
          .badge {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-pending { background: #fbbf24; color: #000; }
          .badge-completed { background: #22c55e; color: #fff; }
          .badge-failed { background: #ef4444; color: #fff; }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .amount-card {
            background: #0f172a;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
          }
          .amount-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #fff;
          }
          .amount-date {
            font-size: 12px;
            color: #64748b;
            margin-top: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px solid #334155;
          }
          .info-label {
            color: #64748b;
            font-size: 14px;
          }
          .info-value {
            color: #fff;
            font-size: 14px;
            text-align: right;
          }
          .id-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #334155;
          }
          .id-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .id-box {
            background: #0f172a;
            border-radius: 8px;
            padding: 12px;
            font-family: monospace;
            font-size: 12px;
            color: #94a3b8;
            word-break: break-all;
          }
          @media print {
            body { background: #fff; }
            .card { background: #f8fafc; }
            .amount-card { background: #e2e8f0; }
            .id-box { background: #e2e8f0; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="title">Detalhes do ${getTypeLabel(tx.type)}</div>
            <div class="badge badge-${tx.status}">${getStatusLabel(tx.status)}</div>
          </div>
          <div class="subtitle">Dados processados via Hyperion Pay</div>
          
          <div class="amount-card">
            <div class="amount-label">Valor da Operação</div>
            <div class="amount">R$ ${tx.amount.toFixed(2).replace(".", ",")}</div>
            <div class="amount-date">${dateStr} ${timeStr}</div>
          </div>

          <div class="info-row">
            <span class="info-label">Pagador</span>
            <span class="info-value">${tx.payer_name || "Não informado"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">End to End</span>
            <span class="info-value">${tx.end_to_end_id || "-"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Documento</span>
            <span class="info-value">${tx.payer_document || "Não informado"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Taxa da Transação</span>
            <span class="info-value">R$ ${tx.fee.toFixed(2).replace(".", ",")}</span>
          </div>

          <div class="id-section">
            <div class="id-label">ID da Transação / Autenticação</div>
            <div class="id-box">${tx.id}</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
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
            onClick={handleExportPDF}
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">
                      Detalhes do {getTypeLabel(selectedTransaction.type)}
                    </h2>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dados processados via Hyperion Pay
                </p>
              </div>

              {/* Amount Card */}
              <div className="p-6">
                <div className="bg-[#1e293b] rounded-xl p-6 text-center mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Valor da Operação
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatDate(selectedTransaction.created_at)}
                  </p>
                </div>

                {/* Info Rows */}
                <div className="space-y-0">
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Pagador</span>
                    <span className="text-white font-medium">
                      {selectedTransaction.payer_name || "Não informado"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">End to End</span>
                    <span className="text-white">
                      {selectedTransaction.end_to_end_id || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Documento</span>
                    <span className="text-white">
                      {selectedTransaction.payer_document || "Não informado"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Taxa da Transação</span>
                    <span className="text-white">
                      {formatCurrency(selectedTransaction.fee)}
                    </span>
                  </div>
                </div>

                {/* ID Section */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      ID da Transação / Autenticação
                    </span>
                    <button
                      onClick={() => handleCopyId(selectedTransaction.id)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <div className="bg-[#1e293b] rounded-lg p-3">
                    <p className="text-sm font-mono text-muted-foreground break-all">
                      {selectedTransaction.id}
                    </p>
                  </div>
                </div>

                {/* Download PDF Button */}
                <button
                  onClick={() => handleDownloadTransactionPDF(selectedTransaction)}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-transparent border border-border rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
