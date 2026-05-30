"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Ban,
  Search,
  Plus,
  Trash2,
  Filter,
  RefreshCw,
  Globe,
  Mail,
  User,
  Smartphone,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  Download,
  Upload,
  UserX,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlacklistEntry {
  id: string;
  type: "cpf" | "email" | "ip" | "device" | "phone";
  value: string;
  reason: string;
  blocked_by: string;
  created_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  hits: number;
  last_hit_at: string | null;
  notes: string | null;
}

interface BlacklistStats {
  total: number;
  by_type: {
    cpf: number;
    email: number;
    ip: number;
    device: number;
    phone: number;
  };
  blocked_today: number;
  hits_today: number;
  permanent: number;
  temporary: number;
}

const TYPE_CONFIG = {
  cpf: { icon: FileText, label: "CPF", color: "text-blue-400 bg-blue-500/10" },
  email: { icon: Mail, label: "E-mail", color: "text-purple-400 bg-purple-500/10" },
  ip: { icon: Globe, label: "IP", color: "text-green-400 bg-green-500/10" },
  device: { icon: Smartphone, label: "Dispositivo", color: "text-yellow-400 bg-yellow-500/10" },
  phone: { icon: User, label: "Telefone", color: "text-pink-400 bg-pink-500/10" },
};

const REASON_OPTIONS = [
  "Fraude confirmada",
  "Chargeback",
  "Atividade suspeita",
  "Multiplas contas",
  "Abuso do sistema",
  "Spam",
  "Documentos falsos",
  "Lavagem de dinheiro",
  "Outro",
];

interface SearchUser {
  id: string;
  name: string | null;
  email: string;
  cpf: string | null;
  phone: string | null;
  last_ip: string | null;
  device_id: string | null;
  is_blocked: boolean;
  created_at: string;
}

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [stats, setStats] = useState<BlacklistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "cpf" as "cpf" | "email" | "ip" | "device" | "phone",
    value: "",
    reason: "",
    notes: "",
    is_permanent: true,
    expires_days: 30,
  });
  const [addingEntry, setAddingEntry] = useState(false);
  
  // Estados para bloquear usuario completo
  const [showBlockUserModal, setShowBlockUserModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [blockUserReason, setBlockUserReason] = useState("");
  const [blockUserNotes, setBlockUserNotes] = useState("");
  const [blockTypes, setBlockTypes] = useState({
    email: true,
    cpf: true,
    ip: true,
    device: true,
    phone: true,
  });
  const [blockingUser, setBlockingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Recarrega quando mudar o filtro
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(debounce);
  }, [filterType, searchTerm]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (searchTerm) params.set("search", searchTerm);
      params.set("status", "active");

      const response = await fetch(`/api/admin/blacklist?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erro ao carregar blacklist");
      }

      const data = await response.json();

      // Mapeia os dados da API para o formato do componente
      const mappedEntries: BlacklistEntry[] = data.blocks.map((block: {
        id: string;
        type: "cpf" | "email" | "ip" | "device" | "phone";
        value: string;
        reason: string;
        blocked_by_name?: string;
        blocked_by?: string;
        created_at: string;
        expires_at: string | null;
        is_active: boolean;
        notes: string | null;
      }) => ({
        id: block.id,
        type: block.type,
        value: block.value,
        reason: block.reason,
        blocked_by: block.blocked_by_name || "Sistema",
        created_at: block.created_at,
        expires_at: block.expires_at,
        is_permanent: !block.expires_at,
        hits: 0,
        last_hit_at: null,
        notes: block.notes,
      }));

      const mappedStats: BlacklistStats = {
        total: data.stats?.total_blocks || 0,
        by_type: {
          cpf: data.stats?.cpf_blocks || 0,
          email: data.stats?.email_blocks || 0,
          ip: data.stats?.ip_blocks || 0,
          device: data.stats?.device_blocks || 0,
          phone: data.stats?.phone_blocks || 0,
        },
        blocked_today: 0,
        hits_today: 0,
        permanent: data.stats?.active_blocks || 0,
        temporary: (data.stats?.total_blocks || 0) - (data.stats?.active_blocks || 0),
      };

      setStats(mappedStats);
      setEntries(mappedEntries);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry() {
    if (!newEntry.value || !newEntry.reason) return;
    
    setAddingEntry(true);
    try {
      const expiresAt = newEntry.is_permanent 
        ? null 
        : new Date(Date.now() + newEntry.expires_days * 86400000).toISOString();

      const response = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newEntry.type,
          value: newEntry.value,
          reason: newEntry.reason,
          notes: newEntry.notes || null,
          expires_at: expiresAt,
          blocked_by: "admin", // Sera substituido pelo ID real do admin no backend
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao adicionar bloqueio");
        return;
      }

      // Recarrega a lista
      await loadData();
      
      setShowAddModal(false);
      setNewEntry({
        type: "cpf",
        value: "",
        reason: "",
        notes: "",
        is_permanent: true,
        expires_days: 30,
      });
    } catch (error) {
      console.error("Erro ao adicionar entrada:", error);
      alert("Erro ao adicionar bloqueio. Tente novamente.");
    } finally {
      setAddingEntry(false);
    }
  }

  async function handleRemoveEntry(id: string) {
    if (!confirm("Tem certeza que deseja remover esta entrada da blacklist?")) return;
    
    try {
      const response = await fetch(`/api/admin/blacklist?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao remover bloqueio");
        return;
      }

      // Recarrega a lista
      await loadData();
    } catch (error) {
      console.error("Erro ao remover entrada:", error);
      alert("Erro ao remover bloqueio. Tente novamente.");
    }
  }

  // Busca usuarios para bloquear
  async function searchUsers(term: string) {
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const response = await fetch(`/api/admin/blacklist/block-user?search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Erro ao buscar usuarios:", error);
    } finally {
      setSearchingUsers(false);
    }
  }

  // Bloqueia usuario completo
  async function handleBlockUser() {
    if (!selectedUser || !blockUserReason) return;
    
    setBlockingUser(true);
    try {
      const typesToBlock = Object.entries(blockTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      const response = await fetch("/api/admin/blacklist/block-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          reason: blockUserReason,
          notes: blockUserNotes || null,
          block_types: typesToBlock,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao bloquear usuario");
        return;
      }

      alert(`Usuario bloqueado com sucesso!\n\nBloqueios criados:\n${data.blocks_created.join('\n')}`);
      
      // Reset modal
      setShowBlockUserModal(false);
      setSelectedUser(null);
      setUserSearchTerm("");
      setSearchResults([]);
      setBlockUserReason("");
      setBlockUserNotes("");
      setBlockTypes({ email: true, cpf: true, ip: true, device: true, phone: true });
      
      // Recarrega lista
      await loadData();
    } catch (error) {
      console.error("Erro ao bloquear usuario:", error);
      alert("Erro ao bloquear usuario. Tente novamente.");
    } finally {
      setBlockingUser(false);
    }
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (date: string | null) => {
    if (!date) return "Nunca";
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}min atras`;
    if (hours < 24) return `${hours}h atras`;
    return `${days}d atras`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            Blacklist Avancada
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie bloqueios por CPF, IP, e-mail, dispositivo e telefone
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            onClick={() => setShowBlockUserModal(true)}
          >
            <UserX className="w-4 h-4 mr-2" />
            Bloquear Usuario
          </Button>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Bloqueio
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Ban className="w-4 h-4" />
              Total Bloqueados
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Hoje
            </div>
            <div className="text-2xl font-bold text-yellow-500">+{stats.blocked_today}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Shield className="w-4 h-4 text-red-500" />
              Tentativas Bloqueadas
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.hits_today}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="w-4 h-4 text-blue-400" />
              CPFs
            </div>
            <div className="text-2xl font-bold">{stats.by_type.cpf}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Globe className="w-4 h-4 text-green-400" />
              IPs
            </div>
            <div className="text-2xl font-bold">{stats.by_type.ip}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Mail className="w-4 h-4 text-purple-400" />
              E-mails
            </div>
            <div className="text-2xl font-bold">{stats.by_type.email}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por valor, motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="ip">IP</SelectItem>
            <SelectItem value="device">Dispositivo</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Motivo</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Hits</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ultimo Hit</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Criado em</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhuma entrada encontrada
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const typeConfig = TYPE_CONFIG[entry.type];
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${typeConfig.color}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{typeConfig.label}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {entry.value}
                        </code>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{entry.reason}</span>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {entry.notes}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        {entry.is_permanent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                            <Ban className="w-3 h-3" />
                            Permanente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                            <Clock className="w-3 h-3" />
                            Expira em {Math.ceil((new Date(entry.expires_at!).getTime() - Date.now()) / 86400000)}d
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${entry.hits > 10 ? "text-red-400" : entry.hits > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {entry.hits}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatRelativeTime(entry.last_hit_at)}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleRemoveEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border rounded-2xl shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" />
                Adicionar a Blacklist
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bloqueie CPF, IP, e-mail, dispositivo ou telefone
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Bloqueio</label>
                <Select 
                  value={newEntry.type} 
                  onValueChange={(v) => setNewEntry({ ...newEntry, type: v as typeof newEntry.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Valor ({TYPE_CONFIG[newEntry.type].label})
                </label>
                <Input
                  placeholder={
                    newEntry.type === "cpf" ? "000.000.000-00" :
                    newEntry.type === "email" ? "email@exemplo.com" :
                    newEntry.type === "ip" ? "192.168.0.1" :
                    newEntry.type === "device" ? "Device ID" :
                    "(00) 00000-0000"
                  }
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium mb-2 block">Motivo</label>
                <Select 
                  value={newEntry.reason} 
                  onValueChange={(v) => setNewEntry({ ...newEntry, reason: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Observacoes (opcional)</label>
                <Input
                  placeholder="Detalhes adicionais..."
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium mb-2 block">Duracao</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newEntry.is_permanent}
                      onChange={() => setNewEntry({ ...newEntry, is_permanent: true })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">Permanente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!newEntry.is_permanent}
                      onChange={() => setNewEntry({ ...newEntry, is_permanent: false })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">Temporario</span>
                  </label>
                </div>
                {!newEntry.is_permanent && (
                  <div className="mt-3">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={newEntry.expires_days}
                      onChange={(e) => setNewEntry({ ...newEntry, expires_days: parseInt(e.target.value) || 30 })}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground ml-2">dias</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleAddEntry}
                disabled={!newEntry.value || !newEntry.reason || addingEntry}
              >
                {addingEntry ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 mr-2" />
                )}
                Adicionar Bloqueio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserX className="w-5 h-5 text-orange-400" />
                Bloquear Usuario Completo
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione um usuario para bloquear todos os dados dele de uma vez
              </p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Search User */}
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar Usuario</label>
                <div className="relative">
                  <Input
                    placeholder="Digite nome, email, CPF ou telefone..."
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="pr-10"
                  />
                  {searchingUsers && (
                    <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>
                {userSearchTerm.length > 0 && userSearchTerm.length < 3 && (
                  <p className="text-xs text-muted-foreground mt-1">Digite pelo menos 3 caracteres</p>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {user.cpf && <p>CPF: {user.cpf}</p>}
                          {user.is_blocked && (
                            <span className="text-red-400 font-medium">Ja bloqueado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected User Info */}
              {selectedUser && (
                <div className="border rounded-xl p-4 bg-accent/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">{selectedUser.name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setUserSearchTerm("");
                      }}
                    >
                      Trocar
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground">CPF:</span>
                      <span>{selectedUser.cpf || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-400" />
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{selectedUser.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground">IP:</span>
                      <span>{selectedUser.last_ip || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-yellow-400" />
                      <span className="text-muted-foreground">Device:</span>
                      <span>{selectedUser.device_id ? selectedUser.device_id.substring(0, 12) + "..." : "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Block Types */}
              {selectedUser && (
                <div>
                  <label className="text-sm font-medium mb-3 block">O que bloquear?</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${blockTypes.email ? 'bg-purple-500/10 border-purple-500/50' : 'hover:bg-accent'} ${!selectedUser.email ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={blockTypes.email}
                        onChange={(e) => setBlockTypes({ ...blockTypes, email: e.target.checked })}
                        disabled={!selectedUser.email}
                        className="w-4 h-4 accent-purple-500"
                      />
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${blockTypes.cpf ? 'bg-blue-500/10 border-blue-500/50' : 'hover:bg-accent'} ${!selectedUser.cpf ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={blockTypes.cpf}
                        onChange={(e) => setBlockTypes({ ...blockTypes, cpf: e.target.checked })}
                        disabled={!selectedUser.cpf}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">CPF</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${blockTypes.ip ? 'bg-green-500/10 border-green-500/50' : 'hover:bg-accent'} ${!selectedUser.last_ip ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={blockTypes.ip}
                        onChange={(e) => setBlockTypes({ ...blockTypes, ip: e.target.checked })}
                        disabled={!selectedUser.last_ip}
                        className="w-4 h-4 accent-green-500"
                      />
                      <Globe className="w-4 h-4 text-green-400" />
                      <span className="text-sm">IP</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${blockTypes.device ? 'bg-yellow-500/10 border-yellow-500/50' : 'hover:bg-accent'} ${!selectedUser.device_id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={blockTypes.device}
                        onChange={(e) => setBlockTypes({ ...blockTypes, device: e.target.checked })}
                        disabled={!selectedUser.device_id}
                        className="w-4 h-4 accent-yellow-500"
                      />
                      <Smartphone className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">Device</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${blockTypes.phone ? 'bg-pink-500/10 border-pink-500/50' : 'hover:bg-accent'} ${!selectedUser.phone ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={blockTypes.phone}
                        onChange={(e) => setBlockTypes({ ...blockTypes, phone: e.target.checked })}
                        disabled={!selectedUser.phone}
                        className="w-4 h-4 accent-pink-500"
                      />
                      <User className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">Telefone</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Reason */}
              {selectedUser && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Motivo do Bloqueio</label>
                  <Select 
                    value={blockUserReason} 
                    onValueChange={setBlockUserReason}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_OPTIONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              {selectedUser && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Observacoes (opcional)</label>
                  <Input
                    placeholder="Detalhes adicionais sobre o bloqueio..."
                    value={blockUserNotes}
                    onChange={(e) => setBlockUserNotes(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockUserModal(false);
                  setSelectedUser(null);
                  setUserSearchTerm("");
                  setSearchResults([]);
                  setBlockUserReason("");
                  setBlockUserNotes("");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleBlockUser}
                disabled={!selectedUser || !blockUserReason || blockingUser}
              >
                {blockingUser ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4 mr-2" />
                )}
                Bloquear Usuario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
