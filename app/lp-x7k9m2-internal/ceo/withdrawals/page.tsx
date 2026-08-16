"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  X,
  CreditCard,
  RefreshCw,
  Edit3,
  Loader2,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  processed_at: string | null;
  user_email: string;
  user_name: string;
  user_balance: number;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [withdrawalMode, setWithdrawalMode] = useState<"automatic" | "manual">("automatic");
  const [savingMode, setSavingMode] = useState(false);

  useEffect(() => {
    loadWithdrawals();
    loadWithdrawalMode();
  }, []);

  useEffect(() => {
    let filtered = withdrawals;

    if (filter !== "all") {
      filtered = filtered.filter((w) => w.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.pix_key?.includes(searchTerm)
      );
    }

    setFilteredWithdrawals(filtered);
  }, [searchTerm, filter, withdrawals]);

  async function loadWithdrawals() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/withdrawals");
      const data = await response.json();

      if (data.withdrawals) {
        setWithdrawals(data.withdrawals);
        setFilteredWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadWithdrawalMode() {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.withdrawal_mode) {
        const mode = typeof data.withdrawal_mode === "string" 
          ? data.withdrawal_mode.replace(/"/g, "") 
          : data.withdrawal_mode;
        setWithdrawalMode(mode as "automatic" | "manual");
      }
    } catch (error) {
      console.error("Error loading withdrawal mode:", error);
    }
  }

  async function toggleWithdrawalMode() {
    const newMode = withdrawalMode === "automatic" ? "manual" : "automatic";
    setSavingMode(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { withdrawal_mode: newMode } }),
      });
      if (response.ok) {
        setWithdrawalMode(newMode);
      }
    } catch (error) {
      console.error("Error saving withdrawal mode:", error);
    } finally {
      setSavingMode(false);
    }
  }

  const [isProcessing, setIsProcessing] = useState(false);

  async function approveWithdrawal(withdrawal: Withdrawal) {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Saque aprovado e enviado para processamento!");
        loadWithdrawals();
        setShowModal(false);
      } else {
        // Mostrar mensagem de erro detalhada
        if (data.insufficientBalance) {
          alert(`SALDO INSUFICIENTE NA ADQUIRENTE\n\n${data.error}\n\nVerifique o saldo da conta da adquirente (${data.acquirerName || "Medusa/MisticPay"}) antes de aprovar este saque.`);
        } else {
          alert(`Erro ao aprovar saque:\n\n${data.error || "Erro desconhecido"}`);
        }
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar saque");
    } finally {
      setIsProcessing(false);
    }
  }

  async function markAsPaid(withdrawal: Withdrawal) {
    // Para saques que já foram aprovados manualmente, marcar como pago
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Saque marcado como pago!");
        loadWithdrawals();
        setShowModal(false);
      } else {
        alert(data.error || "Erro ao marcar como pago");
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao marcar como pago");
    } finally {
      setIsProcessing(false);
    }
  }

  async function changeWithdrawalStatus(withdrawal: Withdrawal, newStatus: string) {
    if (!confirm(`Tem certeza que deseja alterar o status para "${newStatus}"?\n\nEsta acao e manual e deve ser usada apenas em ultimo caso.`)) {
      return;
    }
    
    setChangingStatus(true);
    try {
      const adminToken = localStorage.getItem("lp_admin_session");
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Status alterado para: ${newStatus}`);
        loadWithdrawals();
        setShowModal(false);
        setShowStatusModal(false);
      } else {
        alert(data.error || "Erro ao alterar status");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status");
    } finally {
      setChangingStatus(false);
    }
  }

  async function rejectWithdrawal(withdrawal: Withdrawal) {
    if (!rejectionReason) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectionReason }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Saque rejeitado. Saldo devolvido ao usuário.");
        loadWithdrawals();
        setShowModal(false);
        setRejectionReason("");
      } else {
        alert(data.error || "Erro ao rejeitar saque");
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Erro ao rejeitar saque");
    } finally {
      setIsProcessing(false);
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

  const getPixKeyTypeLabel = (type: string) => {
    switch (type) {
      case "cpf":
        return "CPF";
      case "cnpj":
        return "CNPJ";
      case "email":
        return "E-mail";
      case "phone":
        return "Telefone";
      case "random":
        return "Chave Aleatória";
      default:
        return type;
    }
  };

  const totalPending = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Saques</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as solicitacoes de saque
            </p>
          </div>
          {/* Toggle Modo de Saque */}
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-xl">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground">Modo:</span>
            <button
              onClick={toggleWithdrawalMode}
              disabled={savingMode}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                withdrawalMode === "automatic"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {savingMode ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : withdrawalMode === "automatic" ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{withdrawalMode === "automatic" ? "Automatico" : "Manual"}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="all" className="bg-card">Todos</option>
            <option value="pending" className="bg-card">Pendentes</option>
            <option value="processing" className="bg-card">Processando</option>
            <option value="completed" className="bg-card">Concluidos</option>
            <option value="cancelled" className="bg-card">Cancelados</option>
            <option value="failed" className="bg-card">Falhou</option>
          </select>
        </div>
      </div>

      {/* Info do Modo */}
      <div className={`p-3 sm:p-4 rounded-xl border ${
        withdrawalMode === "automatic" 
          ? "bg-green-500/5 border-green-500/20" 
          : "bg-yellow-500/5 border-yellow-500/20"
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          {withdrawalMode === "automatic" ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          )}
          <div>
            <p className={`font-medium text-sm sm:text-base ${withdrawalMode === "automatic" ? "text-green-400" : "text-yellow-400"}`}>
              Modo {withdrawalMode === "automatic" ? "Automatico" : "Manual"}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {withdrawalMode === "automatic" 
                ? "Saques ate R$ 400 sao automaticos."
                : "Todos os saques requerem aprovacao."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="glass rounded-xl p-3 sm:p-4">
          <p className="text-xl sm:text-2xl font-bold text-yellow-400">
            {withdrawals.filter((w) => w.status === "pending").length}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Pendentes</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4">
          <p className="text-xl sm:text-2xl font-bold text-blue-400">
            {withdrawals.filter((w) => w.status === "processing").length}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Processando</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4">
          <p className="text-xl sm:text-2xl font-bold text-primary">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Total Pend.</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4">
          <p className="text-xl sm:text-2xl font-bold text-green-400">
            {withdrawals.filter((w) => w.status === "completed").length}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Concluidos</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xl sm:text-2xl font-bold text-red-400">
            {withdrawals.filter((w) => w.status === "cancelled" || w.status === "failed").length}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Cancelados</p>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredWithdrawals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum saque encontrado
            </div>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedWithdrawal(withdrawal);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {withdrawal.user_name || withdrawal.user_email || "Usuario"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {getPixKeyTypeLabel(withdrawal.pix_key_type)}: {withdrawal.pix_key}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(withdrawal.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Liq: {formatCurrency(withdrawal.net_amount)}
                    </p>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                      withdrawal.status === "completed"
                        ? "bg-green-400/10 text-green-400"
                        : withdrawal.status === "processing"
                        ? "bg-blue-400/10 text-blue-400"
                        : withdrawal.status === "pending"
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {withdrawal.status === "processing" && (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    )}
                    {withdrawal.status === "completed"
                      ? "OK"
                      : withdrawal.status === "processing"
                      ? "Proc"
                      : withdrawal.status === "pending"
                      ? "Pend"
                      : withdrawal.status === "cancelled"
                      ? "Canc"
                      : withdrawal.status === "failed"
                      ? "Falhou"
                      : withdrawal.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Detalhes do Saque
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground mb-1">Valor</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Taxa: {formatCurrency(selectedWithdrawal.fee)} | Líquido:{" "}
                  {formatCurrency(selectedWithdrawal.net_amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usuario</p>
                  <p className="text-foreground">
                    {selectedWithdrawal.user_name || "Sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedWithdrawal.user_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Saldo Atual
                  </p>
                  <p className="text-foreground">
                    {formatCurrency(selectedWithdrawal.user_balance || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      selectedWithdrawal.status === "completed"
                        ? "bg-green-400/10 text-green-400"
                        : selectedWithdrawal.status === "processing"
                        ? "bg-blue-400/10 text-blue-400"
                        : selectedWithdrawal.status === "pending"
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {selectedWithdrawal.status === "processing" && (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    )}
                    {selectedWithdrawal.status === "completed"
                      ? "Concluido"
                      : selectedWithdrawal.status === "processing"
                      ? "Processando"
                      : selectedWithdrawal.status === "pending"
                      ? "Pendente"
                      : selectedWithdrawal.status === "cancelled"
                      ? "Cancelado"
                      : selectedWithdrawal.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data</p>
                  <p className="text-foreground text-sm">
                    {formatDate(selectedWithdrawal.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Chave PIX</p>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">
                    {getPixKeyTypeLabel(selectedWithdrawal.pix_key_type)}
                  </p>
                  <p className="text-foreground font-mono">
                    {selectedWithdrawal.pix_key}
                  </p>
                </div>
              </div>

              {selectedWithdrawal.status === "pending" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Motivo da Rejeição (se aplicável)
                    </p>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Informe o motivo..."
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => rejectWithdrawal(selectedWithdrawal)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      {isProcessing ? "Processando..." : "Rejeitar"}
                    </button>
                    <button
                      onClick={() => approveWithdrawal(selectedWithdrawal)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isProcessing ? "Processando..." : "Aprovar e Processar"}
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Saques acima de R$ 500,00 requerem aprovação manual
                  </p>
                </>
              )}

              {selectedWithdrawal.status === "approved" && (
                <button
                  onClick={() => markAsPaid(selectedWithdrawal)}
                  className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Marcar como Pago
                </button>
              )}

              {selectedWithdrawal.status === "rejected" &&
                selectedWithdrawal.rejection_reason && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 font-medium mb-1">
                      Motivo da Rejeicao:
                    </p>
                    <p className="text-red-300">
                      {selectedWithdrawal.rejection_reason}
                    </p>
                  </div>
                )}

              {/* Botao para alterar status manualmente */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="w-full px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Alterar Status Manualmente (Ultimo Caso)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal para alterar status manualmente */}
      {showStatusModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Alterar Status
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-orange-400">
                Use apenas em ultimo caso quando o status nao foi atualizado automaticamente.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => changeWithdrawalStatus(selectedWithdrawal, "processing")}
                disabled={changingStatus || selectedWithdrawal.status === "processing"}
                className="w-full px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Processando
              </button>
              <button
                onClick={() => changeWithdrawalStatus(selectedWithdrawal, "completed")}
                disabled={changingStatus || selectedWithdrawal.status === "completed"}
                className="w-full px-4 py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Concluido
              </button>
              <button
                onClick={() => changeWithdrawalStatus(selectedWithdrawal, "cancelled")}
                disabled={changingStatus || selectedWithdrawal.status === "cancelled"}
                className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Cancelado (Devolve Saldo)
              </button>
            </div>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              Status atual: <span className="font-medium">{selectedWithdrawal.status}</span>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
