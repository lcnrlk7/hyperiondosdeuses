"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  User,
  Ban,
  CheckCircle,
  Edit,
  Loader2,
  Filter,
  X,
  DollarSign,
  ArrowUpDown,
  Plus,
  Minus,
  ShieldX,
  KeyRound,
  Trash2,
} from "lucide-react";
import Image from "next/image";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  cpf: string | null;
  balance: number;
  kyc_status: string;
  is_active: boolean;
  role: string;
  route_type: string;
  acquirer_id: string | null;
  daily_limit: number;
  fee_percentage: number | null;
  fixed_fee: number | null;
  withdrawal_fee: number | null;
  // Taxas personalizadas (tem prioridade sobre fee_percentage/withdrawal_fee)
  custom_fee_percentage: number | null;
  custom_fixed_fee: number | null;
  custom_withdrawal_fee: number | null;
  custom_withdrawal_fee_is_percentage: boolean | null;
  last_ip: string | null;
  created_at: string;
  avatar_url: string | null;
  bio: string | null;
  has_2fa?: boolean;
}

interface Acquirer {
  id: string;
  name: string;
  code: string;
  route_type: string;
  fee_percentage: number;
  fixed_fee: number;
  fee_is_percentage: boolean;
  withdrawal_fee: number;
  withdrawal_fee_is_percentage: boolean;
  min_deposit: number;
  min_withdrawal: number;
}

interface Filters {
  kyc: "all" | "approved" | "pending" | "submitted" | "rejected";
  route: "all" | "black" | "white";
  sortBalance: "none" | "desc" | "asc";
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceOperation, setBalanceOperation] = useState<"add" | "remove">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [disabling2FA, setDisabling2FA] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    daily_limit: 0,
    fee_percentage: "",
    fixed_fee: "",
    withdrawal_fee: "",
    route_type: "white",
    acquirer_id: "",
    is_active: true,
  });
  
  // Filtros
  const [filters, setFilters] = useState<Filters>({
    kyc: "all",
    route: "all",
    sortBalance: "none",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
    loadAcquirers();
  }, []);
  
  async function loadAcquirers() {
    try {
      const response = await fetch("/api/admin/acquirers");
      const data = await response.json();
      if (data.acquirers) {
        setAcquirers(data.acquirers);
      }
    } catch (error) {
      console.error("Error loading acquirers:", error);
    }
  }

  // Filtrar e ordenar usuários
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filtro de busca
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro KYC
    if (filters.kyc !== "all") {
      result = result.filter((user) => user.kyc_status === filters.kyc);
    }

    // Filtro Rota
    if (filters.route !== "all") {
      result = result.filter((user) => user.route_type === filters.route);
    }

    // Ordenação por saldo
    if (filters.sortBalance === "desc") {
      result.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    } else if (filters.sortBalance === "asc") {
      result.sort((a, b) => (a.balance || 0) - (b.balance || 0));
    }

    return result;
  }, [users, searchTerm, filters]);

  // Verificar se há filtros ativos
  const hasActiveFilters = filters.kyc !== "all" || filters.route !== "all" || filters.sortBalance !== "none";

  // Limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      kyc: "all",
      route: "all",
      sortBalance: "none",
    });
  };

  async function loadUsers() {
    try {
      const response = await fetch("/api/admin/users");
      
      // Se acesso negado, redirecionar para login
      if (response.status === 403 || response.status === 401) {
        window.location.href = "/lp-x7k9m2-internal";
        return;
      }
      
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

async function updateUser() {
  if (!selectedUser) return;
  
  // Buscar adquirente selecionada para usar taxas padrao
  const selectedAcquirer = acquirers.find(a => a.id === editForm.acquirer_id);
  
  // Validações
  const feeValue = editForm.fee_percentage ? parseFloat(editForm.fee_percentage) : (selectedAcquirer?.fee_percentage ?? 2.5);
  if (feeValue < 0 || feeValue > 100) {
    alert("A taxa deve estar entre 0% e 100%");
    return;
  }
  
  // Taxa de saque: usar valor informado ou padrão da adquirente
  const defaultWithdrawalFee = selectedAcquirer?.withdrawal_fee ?? (editForm.route_type === "white" ? 4 : 5);
  const withdrawalFeeValue = editForm.withdrawal_fee ? parseFloat(editForm.withdrawal_fee) : defaultWithdrawalFee;
  if (withdrawalFeeValue < 0) {
    alert("A taxa de saque não pode ser negativa");
    return;
  }
  
  // Taxa fixa: usar valor informado ou 0
  const fixedFeeValue = editForm.fixed_fee ? parseFloat(editForm.fixed_fee) : 0;
    if (fixedFeeValue < 0) {
      alert("A taxa fixa não pode ser negativa");
      return;
    }

    const limitValue = Number(editForm.daily_limit);
    if (limitValue <= 0) {
      alert("O limite diário deve ser maior que zero");
      return;
    }

    setIsUpdatingUser(true);
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "update",
          data: {
            daily_limit: limitValue,
            fee_percentage: feeValue,
            fixed_fee: fixedFeeValue,
            withdrawal_fee: withdrawalFeeValue,
            route_type: editForm.route_type,
            acquirer_id: editForm.acquirer_id || null,
            is_active: editForm.is_active,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await loadUsers();
        setShowModal(false);
        setSelectedUser(null);
        alert("Usuário atualizado com sucesso!");
      } else {
        alert(result.error || "Erro ao atualizar usuário");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Erro ao atualizar usuário");
    } finally {
      setIsUpdatingUser(false);
    }
  }

  async function blockUserIp(user: UserProfile) {
    if (!user.last_ip) {
      alert("Este usuario nao tem IP registrado");
      return;
    }
    
    if (!confirm(`Tem certeza que deseja bloquear o IP ${user.last_ip}?\n\nO usuario sera bloqueado permanentemente e vera uma tela de acesso negado.`)) {
      return;
    }
    
    setBlockingIp(user.id);
    try {
      const response = await fetch("/api/admin/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: user.last_ip,
          reason: "Bloqueio manual pelo painel CEO",
          user_id: user.id,
        }),
      });
      
      if (response.ok) {
        alert(`IP ${user.last_ip} bloqueado com sucesso!`);
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao bloquear IP");
      }
    } catch (error) {
      console.error("Erro ao bloquear IP:", error);
      alert("Erro ao bloquear IP");
    } finally {
      setBlockingIp(null);
    }
  }

  async function disableUser2FA(user: UserProfile) {
    if (!user.has_2fa) {
      alert("Este usuario nao tem 2FA ativado");
      return;
    }
    
    if (!confirm(`Tem certeza que deseja desativar a autenticacao de dois fatores de ${user.name || user.email}?`)) {
      return;
    }
    
    setDisabling2FA(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/disable-2fa`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        alert("2FA desativado com sucesso!");
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao desativar 2FA");
      }
    } catch (error) {
      console.error("Erro ao desativar 2FA:", error);
      alert("Erro ao desativar 2FA");
    } finally {
      setDisabling2FA(null);
    }
  }

  async function deleteUser(user: UserProfile) {
    const confirmText = prompt(
      `ATENCAO: Esta acao ira DELETAR PERMANENTEMENTE o usuario ${user.email} e TODOS os seus dados.\n\n` +
      `Isso inclui:\n- Todas as transacoes\n- Todos os saques\n- Integracoes\n- Tickets\n- Historico completo\n\n` +
      `Digite o email do usuario para confirmar:`
    );
    
    if (confirmText !== user.email) {
      if (confirmText !== null) {
        alert("Email incorreto. Operacao cancelada.");
      }
      return;
    }
    
    setDeletingUser(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/delete`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        alert(`Usuario ${user.email} deletado com sucesso!`);
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao deletar usuario");
      }
    } catch (error) {
      console.error("Erro ao deletar usuario:", error);
      alert("Erro ao deletar usuario");
    } finally {
      setDeletingUser(null);
    }
  }

  async function toggleUserStatus(user: UserProfile) {
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "toggle_status",
        }),
      });
      loadUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  }

  async function updateUserBalance() {
    if (!selectedUser || !balanceAmount) return;

    setIsUpdatingBalance(true);
    try {
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Digite um valor válido");
        setIsUpdatingBalance(false);
        return;
      }

      const currentBalance = Number(selectedUser.balance) || 0;
      const newBalance = balanceOperation === "add" 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount);

      const response = await fetch("/api/admin/users/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          operation: balanceOperation,
          amount: amount,
          newBalance: newBalance,
          reason: balanceReason || (balanceOperation === "add" ? "Crédito manual pelo admin" : "Débito manual pelo admin"),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        loadUsers();
        setShowBalanceModal(false);
        setSelectedUser(null);
        setBalanceAmount("");
        setBalanceReason("");
        alert(`Saldo atualizado com sucesso! Novo saldo: R$ ${Number(data.newBalance).toFixed(2)}`);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Erro ao atualizar saldo");
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Erro ao atualizar saldo");
    } finally {
      setIsUpdatingBalance(false);
    }
  }

  const openBalanceModal = (user: UserProfile) => {
    setSelectedUser(user);
    setBalanceAmount("");
    setBalanceReason("");
    setBalanceOperation("add");
    setShowBalanceModal(true);
  };

const openEditModal = (user: UserProfile) => {
  setSelectedUser(user);
  
  // Buscar a adquirente do usuario ou a primeira da rota dele
  let acquirerId = user.acquirer_id || "";
  let userAcquirer = acquirers.find(a => a.id === user.acquirer_id);
  
  if (!acquirerId && acquirers.length > 0) {
    const defaultAcquirer = acquirers.find(a => a.route_type === (user.route_type || "white"));
    if (defaultAcquirer) {
      acquirerId = defaultAcquirer.id;
      userAcquirer = defaultAcquirer;
    }
  }
  
  // Prioridade de taxas: custom > legado > adquirente > default
  // Se tem taxa personalizada, mostrar ela; senao mostrar da rota
  const feePercentage = user.custom_fee_percentage ?? user.fee_percentage ?? userAcquirer?.fee_percentage ?? 2.5;
  const withdrawalFee = user.custom_withdrawal_fee ?? user.withdrawal_fee ?? userAcquirer?.withdrawal_fee ?? (user.route_type === "white" ? 2 : 5);
  const fixedFee = user.custom_fixed_fee ?? user.fixed_fee ?? userAcquirer?.fixed_fee ?? 0;
    
    setEditForm({
      daily_limit: user.daily_limit || 10000,
      fee_percentage: feePercentage.toString(),
      fixed_fee: fixedFee.toString(),
      withdrawal_fee: withdrawalFee.toString(),
      route_type: user.route_type || "white",
      acquirer_id: acquirerId,
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return "-";
    const cleaned = cpf.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="h-12 w-full bg-muted rounded-xl" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os usuarios do sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              hasActiveFilters 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-secondary border-border text-white hover:border-primary/50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Filtro KYC */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">KYC</label>
              <select
                value={filters.kyc}
                onChange={(e) => setFilters({ ...filters, kyc: e.target.value as Filters["kyc"] })}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="all" className="bg-card">Todos</option>
                <option value="approved" className="bg-card">Aprovado</option>
                <option value="pending" className="bg-card">Pendente</option>
                <option value="submitted" className="bg-card">Enviado</option>
                <option value="rejected" className="bg-card">Reprovado</option>
              </select>
            </div>

            {/* Filtro Rota */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Rota</label>
              <select
                value={filters.route}
                onChange={(e) => setFilters({ ...filters, route: e.target.value as Filters["route"] })}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="all" className="bg-card">Todas</option>
                <option value="black" className="bg-card">Black</option>
                <option value="white" className="bg-card">White</option>
              </select>
            </div>

            {/* Ordenar por Saldo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Ordenar Saldo</label>
              <select
                value={filters.sortBalance}
                onChange={(e) => setFilters({ ...filters, sortBalance: e.target.value as Filters["sortBalance"] })}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="none" className="bg-card">Sem ordem</option>
                <option value="desc" className="bg-card">Maior</option>
                <option value="asc" className="bg-card">Menor</option>
              </select>
            </div>

            {/* Botao Limpar Filtros */}
            {hasActiveFilters && (
              <div className="flex flex-col gap-1 justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>
            )}
          </div>

          {/* Indicadores de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Ativos:</span>
              {filters.kyc !== "all" && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  KYC: {filters.kyc === "approved" ? "Aprovado" : filters.kyc === "pending" ? "Pendente" : filters.kyc === "submitted" ? "Enviado" : "Reprovado"}
                </span>
              )}
              {filters.route !== "all" && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  {filters.route === "black" ? "Black" : "White"}
                </span>
              )}
              {filters.sortBalance !== "none" && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  {filters.sortBalance === "desc" ? "Maior saldo" : "Menor saldo"}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-sm text-muted-foreground">Total de Usuários</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {users.filter((u) => u.is_active).length}
          </p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {users.filter((u) => u.kyc_status === "pending").length}
          </p>
          <p className="text-sm text-muted-foreground">KYC Pendente</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">
            {users.filter((u) => u.kyc_status === "approved").length}
          </p>
          <p className="text-sm text-muted-foreground">KYC Aprovado</p>
        </div>
      </div>

      {/* Users List - Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="glass rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.name || "Avatar"} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.name || "Sem nome"}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.kyc_status === "approved" ? "bg-green-400/10 text-green-400" : user.kyc_status === "pending" ? "bg-yellow-400/10 text-yellow-400" : user.kyc_status === "submitted" ? "bg-blue-400/10 text-blue-400" : "bg-red-400/10 text-red-400"}`}>
                    {user.kyc_status === "approved" ? "KYC OK" : user.kyc_status === "pending" ? "KYC Pend" : user.kyc_status === "submitted" ? "KYC Env" : "KYC Rep"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.route_type === "black" ? "bg-primary/10 text-primary" : "bg-zinc-400/10 text-zinc-400"}`}>
                    {user.route_type === "black" ? "Black" : "White"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {user.is_active ? "Ativo" : "Bloq"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-muted-foreground text-xs">Saldo</p>
                <p className="font-semibold text-primary">{formatCurrency(Number(user.balance) || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Taxa (deposito)</p>
                <p className="font-medium text-yellow-400">6,00% + R$ 1,50</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <button onClick={() => openBalanceModal(user)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium">
                <DollarSign className="w-4 h-4" /> Saldo
              </button>
              <button onClick={() => openEditModal(user)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-white text-sm font-medium">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => toggleUserStatus(user)} className={`px-3 py-2 rounded-lg text-sm font-medium ${user.is_active ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Saldo Líquido
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Taxa
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  KYC
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Rota
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Cadastro
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.name || "Avatar"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {user.name || "Sem nome"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground/70 max-w-[200px] truncate" title={user.bio}>
                            {user.bio}
                          </p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>CPF: {formatCPF(user.cpf)}</span>
                          <span>Tel: {formatPhone(user.phone)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-primary">
                      {formatCurrency(Number(user.balance) || 0)}
                    </p>
                  </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <p className="font-medium text-yellow-400">6,00% + R$ 1,50</p>
                                <span className="text-xs text-muted-foreground">deposito (fixo)</span>
                              </div>
                            </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.kyc_status === "approved"
                          ? "bg-green-400/10 text-green-400"
                          : user.kyc_status === "pending"
                          ? "bg-yellow-400/10 text-yellow-400"
                          : user.kyc_status === "submitted"
                          ? "bg-blue-400/10 text-blue-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {user.kyc_status === "approved"
                        ? "Aprovado"
                        : user.kyc_status === "pending"
                        ? "Pendente"
                        : user.kyc_status === "submitted"
                        ? "Enviado"
                        : "Reprovado"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.route_type === "black"
                          ? "bg-primary/10 text-primary"
                          : "bg-zinc-400/10 text-zinc-400"
                      }`}
                    >
                      {user.route_type === "black" ? "Black" : "White"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-400/10 text-green-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {user.is_active ? "Ativo" : "Bloqueado"}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openBalanceModal(user)}
                        className="p-2 rounded-lg hover:bg-green-500/10 transition-colors text-muted-foreground hover:text-green-400"
                        title="Editar Saldo"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-white"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active
                            ? "hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                            : "hover:bg-green-500/10 text-muted-foreground hover:text-green-400"
                        }`}
                        title={user.is_active ? "Bloquear" : "Desbloquear"}
                      >
  {user.is_active ? (
  <Ban className="w-4 h-4" />
  ) : (
  <CheckCircle className="w-4 h-4" />
  )}
  </button>
  {user.last_ip && (
    <button
      onClick={() => blockUserIp(user)}
      disabled={blockingIp === user.id}
      className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-muted-foreground hover:text-red-400 disabled:opacity-50"
      title={`Bloquear IP: ${user.last_ip}`}
    >
{blockingIp === user.id ? (
  <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
  <ShieldX className="w-4 h-4" />
  )}
  </button>
  )}
  {user.has_2fa && (
  <button
  onClick={() => disableUser2FA(user)}
  disabled={disabling2FA === user.id}
  className="p-2 rounded-lg transition-colors hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 disabled:opacity-50"
  title="Desativar 2FA"
  >
  {disabling2FA === user.id ? (
  <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
  <KeyRound className="w-4 h-4" />
  )}
  </button>
  )}
  <button
    onClick={() => deleteUser(user)}
    disabled={deletingUser === user.id}
    className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-muted-foreground hover:text-red-500 disabled:opacity-50"
    title="Deletar Usuario"
  >
    {deletingUser === user.id ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <Trash2 className="w-4 h-4" />
    )}
  </button>
  </div>
  </td>
  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold text-white mb-6">
              Editar Usuário
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Email
                </label>
                <input
                  type="text"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Limite Diário
                </label>
                <input
                  type="number"
                  value={editForm.daily_limit}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      daily_limit: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              {/* Taxas PIX In (Deposito) */}
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Taxa PIX In (Deposito)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Taxa Percentual (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder={editForm.route_type === "white" ? "0" : "4"}
                      value={editForm.fee_percentage}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          fee_percentage: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      White: 0% | Black: 4%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Taxa Fixa (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder={editForm.route_type === "white" ? "1.50" : "0"}
                      value={editForm.fixed_fee}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          fixed_fee: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      White: R$ 0,70 | Black: R$ 0,00
                    </p>
                  </div>
                </div>
              </div>

              {/* Taxa PIX Out (Saque) */}
              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2 mb-4">
                  <ArrowUpDown className="w-4 h-4" />
                  Taxa PIX Out (Saque)
                </h3>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Taxa de Saque (R$)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="5.00"
                    value={editForm.withdrawal_fee}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        withdrawal_fee: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    White: 2% | Black: 5%
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Rota
                </label>
                <select
                  value={editForm.acquirer_id || ""}
                  onChange={(e) => {
                    const selectedAcquirer = acquirers.find(a => a.id === e.target.value);
                    if (selectedAcquirer) {
                      setEditForm({
                        ...editForm,
                        acquirer_id: selectedAcquirer.id,
                        route_type: selectedAcquirer.route_type,
                        fee_percentage: selectedAcquirer.fee_percentage?.toString() || "0",
                        withdrawal_fee: selectedAcquirer.withdrawal_fee?.toString() || "0",
                        fixed_fee: selectedAcquirer.fixed_fee?.toString() || "0",
                      });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                >
                  {acquirers.filter(a => a.route_type === "white").length > 0 && (
                    <optgroup label="WHITE" className="bg-card text-muted-foreground">
                      {acquirers.filter(a => a.route_type === "white").map(acq => {
                        // Taxa de entrada: percentual + fixa (se houver)
                        let taxaEntrada = acq.fee_is_percentage ? `${acq.fee_percentage}%` : '';
                        if (acq.fixed_fee && Number(acq.fixed_fee) > 0) {
                          taxaEntrada += taxaEntrada ? ` + R$${Number(acq.fixed_fee).toFixed(2)}` : `R$${Number(acq.fixed_fee).toFixed(2)}`;
                        }
                        if (!taxaEntrada) taxaEntrada = 'R$0,00';
                        const taxaSaque = acq.withdrawal_fee_is_percentage ? `${acq.withdrawal_fee}%` : `R$${Number(acq.withdrawal_fee).toFixed(2)}`;
                        return (
                          <option key={acq.id} value={acq.id} className="bg-card text-white">
                            Rota White ({acq.name}) - Taxa: {taxaEntrada} | Saque: {taxaSaque}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {acquirers.filter(a => a.route_type === "black").length > 0 && (
                    <optgroup label="BLACK" className="bg-card text-muted-foreground">
                      {acquirers.filter(a => a.route_type === "black").map(acq => {
                        // Taxa de entrada: percentual + fixa (se houver)
                        let taxaEntrada = acq.fee_is_percentage ? `${acq.fee_percentage}%` : '';
                        if (acq.fixed_fee && Number(acq.fixed_fee) > 0) {
                          taxaEntrada += taxaEntrada ? ` + R$${Number(acq.fixed_fee).toFixed(2)}` : `R$${Number(acq.fixed_fee).toFixed(2)}`;
                        }
                        if (!taxaEntrada) taxaEntrada = 'R$0,00';
                        const taxaSaque = acq.withdrawal_fee_is_percentage ? `${acq.withdrawal_fee}%` : `R$${Number(acq.withdrawal_fee).toFixed(2)}`;
                        return (
                          <option key={acq.id} value={acq.id} className="bg-card text-white">
                            Rota Black ({acq.name}) - Taxa: {taxaEntrada} | Saque: {taxaSaque}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione a adquirente/rota do usuario
                </p>
              </div>
  
  <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary/50"
                />
                <label htmlFor="is_active" className="text-sm text-white">
                  Usuário ativo
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={isUpdatingUser}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-white hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={updateUser}
                disabled={isUpdatingUser}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Balance Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold text-white mb-2">
              Editar Saldo
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Usuário: <span className="text-white">{selectedUser.name || selectedUser.email}</span>
            </p>
            
            {/* Saldo atual */}
            <div className="glass rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(selectedUser.balance || 0)}
              </p>
            </div>

            <div className="space-y-4">
              {/* Operação */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Operação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBalanceOperation("add")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                      balanceOperation === "add"
                        ? "bg-green-500/10 border-green-500 text-green-400"
                        : "bg-secondary border-border text-white hover:border-green-500/50"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => setBalanceOperation("remove")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                      balanceOperation === "remove"
                        ? "bg-red-500/10 border-red-500 text-red-400"
                        : "bg-secondary border-border text-white hover:border-red-500/50"
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    Remover
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Correção de saldo, bônus, etc."
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Preview do novo saldo */}
              {balanceAmount && (
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Novo Saldo</p>
                  <p className={`text-xl font-bold ${balanceOperation === "add" ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(
                      balanceOperation === "add"
                        ? (selectedUser.balance || 0) + parseFloat(balanceAmount || "0")
                        : Math.max(0, (selectedUser.balance || 0) - parseFloat(balanceAmount || "0"))
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {balanceOperation === "add" ? "+" : "-"}{formatCurrency(parseFloat(balanceAmount || "0"))}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setSelectedUser(null);
                  setBalanceAmount("");
                  setBalanceReason("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-white hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={updateUserBalance}
                disabled={!balanceAmount || isUpdatingBalance}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingBalance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
