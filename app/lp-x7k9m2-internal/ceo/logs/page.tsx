"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Search,
  RefreshCw,
  Loader2,
  LogIn,
  LogOut,
  ArrowLeftRight,
  Wallet,
  User,
  FileCheck,
  Code,
  Webhook,
  Gift,
  Shield,
  AlertTriangle,
  DollarSign,
  Users,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

// Categorias de ações
type Category = "all" | "auth" | "transactions" | "users" | "errors" | "system";

const categoryConfig: Record<Category, { label: string; icon: typeof Activity; color: string; bgColor: string }> = {
  all: { label: "Todos", icon: Activity, color: "text-foreground", bgColor: "bg-white/10" },
  auth: { label: "Autenticação", icon: Key, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  transactions: { label: "Transações", icon: DollarSign, color: "text-green-400", bgColor: "bg-green-500/10" },
  users: { label: "Usuários", icon: Users, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  errors: { label: "Erros", icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-500/10" },
  system: { label: "Sistema", icon: Shield, color: "text-orange-400", bgColor: "bg-orange-500/10" },
};

// Mapeamento de ações para categorias
const actionToCategory: Record<string, Category> = {
  // Auth
  LOGIN: "auth",
  LOGIN_FAILED: "errors",
  LOGOUT: "auth",
  REGISTER: "users",
  // Transações
  PIX_CHARGE_CREATED: "transactions",
  PIX_COMPLETED: "transactions",
  WITHDRAWAL_PENDING: "transactions",
  WITHDRAWAL_PROCESSING: "transactions",
  WITHDRAWAL_APPROVED: "transactions",
  WITHDRAWAL_COMPLETED: "transactions",
  WITHDRAWAL_REJECTED: "errors",
  BALANCE_UPDATED: "transactions",
  // Usuários
  KYC_SUBMITTED: "users",
  KYC_APPROVED: "users",
  KYC_REJECTED: "errors",
  USER_BLOCKED: "users",
  USER_UNBLOCKED: "users",
  USER_UPDATED: "users",
  // Sistema
  CREDENTIALS_GENERATED: "system",
  WEBHOOK_UPDATED: "system",
  CREATE_NOTIFICATION: "system",
  CREATE_REWARD: "system",
  REWARD_CREDITED: "transactions",
  CREATE_ACQUIRER: "system",
  DELETE_ACQUIRER: "system",
};

const actionIcons: Record<string, { icon: typeof Activity; color: string }> = {
  LOGIN: { icon: LogIn, color: "text-green-400" },
  LOGIN_FAILED: { icon: LogIn, color: "text-red-400" },
  LOGOUT: { icon: LogOut, color: "text-gray-400" },
  REGISTER: { icon: User, color: "text-blue-400" },
  PIX_CHARGE_CREATED: { icon: ArrowLeftRight, color: "text-blue-400" },
  PIX_COMPLETED: { icon: ArrowLeftRight, color: "text-green-400" },
  WITHDRAWAL_PENDING: { icon: Wallet, color: "text-yellow-400" },
  WITHDRAWAL_PROCESSING: { icon: Wallet, color: "text-blue-400" },
  WITHDRAWAL_APPROVED: { icon: Wallet, color: "text-green-400" },
  WITHDRAWAL_COMPLETED: { icon: Wallet, color: "text-green-400" },
  WITHDRAWAL_REJECTED: { icon: Wallet, color: "text-red-400" },
  BALANCE_UPDATED: { icon: DollarSign, color: "text-primary" },
  KYC_SUBMITTED: { icon: FileCheck, color: "text-yellow-400" },
  KYC_APPROVED: { icon: FileCheck, color: "text-green-400" },
  KYC_REJECTED: { icon: FileCheck, color: "text-red-400" },
  USER_BLOCKED: { icon: User, color: "text-red-400" },
  USER_UNBLOCKED: { icon: User, color: "text-green-400" },
  USER_UPDATED: { icon: User, color: "text-blue-400" },
  CREDENTIALS_GENERATED: { icon: Code, color: "text-cyan-400" },
  WEBHOOK_UPDATED: { icon: Webhook, color: "text-pink-400" },
  CREATE_NOTIFICATION: { icon: Activity, color: "text-blue-400" },
  CREATE_REWARD: { icon: Gift, color: "text-primary" },
  REWARD_CREDITED: { icon: Gift, color: "text-green-400" },
  CREATE_ACQUIRER: { icon: Shield, color: "text-purple-400" },
  DELETE_ACQUIRER: { icon: Shield, color: "text-red-400" },
  other: { icon: Activity, color: "text-muted-foreground" },
};

const actionLabels: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FAILED: "Login Falhou",
  LOGOUT: "Logout",
  REGISTER: "Cadastro",
  PIX_CHARGE_CREATED: "PIX Criado",
  PIX_COMPLETED: "PIX Completo",
  WITHDRAWAL_PENDING: "Saque Pendente",
  WITHDRAWAL_PROCESSING: "Saque Processando",
  WITHDRAWAL_APPROVED: "Saque Aprovado",
  WITHDRAWAL_COMPLETED: "Saque Completo",
  WITHDRAWAL_REJECTED: "Saque Rejeitado",
  BALANCE_UPDATED: "Saldo Atualizado",
  KYC_SUBMITTED: "KYC Enviado",
  KYC_APPROVED: "KYC Aprovado",
  KYC_REJECTED: "KYC Rejeitado",
  USER_BLOCKED: "Usuário Bloqueado",
  USER_UNBLOCKED: "Usuário Desbloqueado",
  USER_UPDATED: "Usuário Atualizado",
  CREDENTIALS_GENERATED: "Credenciais",
  WEBHOOK_UPDATED: "Webhook",
  CREATE_NOTIFICATION: "Notificação",
  CREATE_REWARD: "Premiação",
  REWARD_CREDITED: "Premiação Creditada",
  CREATE_ACQUIRER: "Adquirente Criada",
  DELETE_ACQUIRER: "Adquirente Removida",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/logs");
      const data = await response.json();

      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Auto-refresh a cada 10 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLogs(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  // Contagem por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      all: logs.length,
      auth: 0,
      transactions: 0,
      users: 0,
      errors: 0,
      system: 0,
    };

    logs.forEach((log) => {
      const category = actionToCategory[log.action] || "system";
      counts[category]++;
    });

    return counts;
  }, [logs]);

  // Filtrar logs por categoria e busca
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtro de categoria
      if (activeCategory !== "all") {
        const logCategory = actionToCategory[log.action] || "system";
        if (logCategory !== activeCategory) return false;
      }

      // Filtro de busca
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          log.user_email?.toLowerCase().includes(searchLower) ||
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.description?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [logs, activeCategory, search]);

  const getIcon = (action: string) => {
    const config = actionIcons[action] || actionIcons.other;
    const Icon = config.icon;
    return <Icon className={`w-5 h-5 ${config.color}`} />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Logs de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Acompanhe todas as ações dos usuários em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLogs(false)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="glass rounded-2xl p-2">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryConfig) as Category[]).map((category) => {
            const config = categoryConfig[category];
            const Icon = config.icon;
            const count = categoryCounts[category];
            const isActive = activeCategory === category;
            
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? `${config.bgColor} ${config.color} ring-1 ring-current`
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{config.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-secondary"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuário, ação, descrição..."
          className="bg-secondary pl-11 h-12"
        />
      </div>

      {/* Logs List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {activeCategory === "all" ? "Todas as Atividades" : categoryConfig[activeCategory].label}
            </h2>
            {activeCategory !== "all" && (
              <span className={`text-xs px-2 py-1 rounded-full ${categoryConfig[activeCategory].bgColor} ${categoryConfig[activeCategory].color}`}>
                {categoryConfig[activeCategory].label}
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredLogs.length} registro(s)
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhum log encontrado</p>
            {activeCategory !== "all" && (
              <button
                onClick={() => setActiveCategory("all")}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Ver todos os logs
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log, index) => {
              const logCategory = actionToCategory[log.action] || "system";
              const catConfig = categoryConfig[logCategory];
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                  className="p-4 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${catConfig.bgColor} shrink-0`}>
                      {getIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-foreground">
                          {actionLabels[log.action] || log.action}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${catConfig.bgColor} ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                        {log.entity_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {log.entity_type}
                          </span>
                        )}
                      </div>
                      
                      {/* Descrição ou valores */}
                      {(log.description || log.new_value) && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {log.description || (
                            typeof log.new_value === 'object' 
                              ? Object.entries(log.new_value).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' | ')
                              : String(log.new_value)
                          )}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono">{formatDate(log.created_at)}</span>
                        {(log.user_name || log.user_email) && (
                          <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-full">
                            <User className="w-3 h-3" />
                            {log.user_name || log.user_email}
                          </span>
                        )}
                        {log.entity_id && (
                          <span className="font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                            ID: {log.entity_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
