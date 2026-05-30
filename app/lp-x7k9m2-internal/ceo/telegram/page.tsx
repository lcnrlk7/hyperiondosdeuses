"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bot, 
  Activity, 
  Send, 
  Settings, 
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  ExternalLink,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Bell,
  Zap,
  DollarSign,
  Percent,
  Webhook,
  Copy,
  Check,
  Search,
  Users,
  TrendingUp
} from "lucide-react";

interface BotUser {
  id: string;
  telegram_id: string;
  telegram_username: string | null;
  first_name: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  pix_key: string | null;
  created_at: string;
  updated_at: string;
}

interface BotTransaction {
  id: string;
  telegram_id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  pix_code: string | null;
  pix_key: string | null;
  created_at: string;
}

interface TelegramLog {
  id: string;
  telegram_id: string;
  action: string;
  command: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

interface TelegramStats {
  actions_today: number;
  total_users: number;
  users_today: number;
  total_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  deposits_today: number;
  withdrawals_today: number;
  deposit_amount_today: number;
  withdrawal_amount_today: number;
  fees_today: number;
  total_deposits: number;
  total_withdrawals: number;
  total_deposit_amount: number;
  total_withdrawal_amount: number;
  total_fees: number;
}

export default function TelegramPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [users, setUsers] = useState<BotUser[]>([]);
  const [transactions, setTransactions] = useState<BotTransaction[]>([]);
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [webhook, setWebhook] = useState<{ url: string; pending_count: number; last_error: string | null } | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/telegram/logs");
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
        setUsers(data.users || []);
        setTransactions(data.transactions || []);
        setLogs(data.logs || []);
        setWebhook(data.webhook);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendAnnouncement = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, channel: "announcements" }),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage("");
        alert("Mensagem enviada com sucesso!");
      } else {
        alert("Erro ao enviar: " + data.error);
      }
    } catch {
      alert("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telegram_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telegram_id?.toString().includes(searchTerm)
  );

  const filteredTransactions = transactions.filter(tx =>
    tx.telegram_id?.toString().includes(searchTerm) ||
    tx.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "Visao Geral", icon: Activity },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "transactions", label: "Transacoes", icon: Wallet },
    { id: "logs", label: "Logs", icon: MessageSquare },
    { id: "send", label: "Enviar Aviso", icon: Send },
    { id: "settings", label: "Configuracoes", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bot Telegram</h1>
              <p className="text-muted-foreground">Sistema independente - Sem cadastro</p>
            </div>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_users || 0}</p>
                <p className="text-sm text-muted-foreground">Usuarios do Bot</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-xs text-green-500">+{stats?.deposits_today || 0} hoje</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_deposits || 0}</p>
                <p className="text-sm text-muted-foreground">Depositos</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ArrowUpCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-xs text-orange-500">+{stats?.withdrawals_today || 0} hoje</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_withdrawals || 0}</p>
                <p className="text-sm text-muted-foreground">Saques</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-xs text-purple-500">Taxas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(Number(stats?.total_fees) || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Arrecadado</p>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <ArrowDownCircle className="w-6 h-6 text-green-500" />
                  <h3 className="font-semibold text-foreground">Depositos Hoje</h3>
                </div>
                <p className="text-3xl font-bold text-green-500">{formatCurrency(Number(stats?.deposit_amount_today) || 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">{stats?.deposits_today || 0} transacoes</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <ArrowUpCircle className="w-6 h-6 text-orange-500" />
                  <h3 className="font-semibold text-foreground">Saques Hoje</h3>
                </div>
                <p className="text-3xl font-bold text-orange-500">{formatCurrency(Number(stats?.withdrawal_amount_today) || 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">{stats?.withdrawals_today || 0} transacoes</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Percent className="w-6 h-6 text-purple-500" />
                  <h3 className="font-semibold text-foreground">Taxas Hoje</h3>
                </div>
                <p className="text-3xl font-bold text-purple-500">{formatCurrency(Number(stats?.fees_today) || 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">5% deposito / R$7 saque</p>
              </div>
            </div>

            {/* Webhook Status & Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Webhook className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-foreground">Status do Webhook</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`flex items-center gap-2 ${webhook?.url ? "text-green-500" : "text-red-500"}`}>
                      {webhook?.url ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {webhook?.url ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pendentes</span>
                    <span className="text-foreground">{webhook?.pending_count || 0}</span>
                  </div>
                  
                  {webhook?.last_error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-sm text-red-400">{webhook.last_error}</p>
                    </div>
                  )}
                  
                  {!webhook?.url && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/telegram/setup-webhook", { method: "POST" });
                          const data = await res.json();
                          if (data.success) {
                            alert("Webhook ativado com sucesso!");
                            fetchData();
                          } else {
                            alert("Erro: " + data.error);
                          }
                        } catch {
                          alert("Erro ao ativar webhook");
                        }
                      }}
                      className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Ativar Webhook
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold text-foreground">Links Rapidos</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
<a
                                    href="https://t.me/hyperionpay_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-colors"
                                  >
                                    <Bot className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-foreground">@hyperionpay_bot</span>
                                  </a>
                  
                  <a
                    href="https://t.me/hyperionpaybot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">@hyperionpaybot</span>
                  </a>
                  
                  <a
                    href="https://t.me/hyperionpayavisos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-colors"
                  >
                    <Bell className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-foreground">@hyperionpayavisos</span>
                  </a>
                  
                  <a
                    href="https://discord.gg/sGmMSYjdnA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/20 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-foreground">Discord</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, username ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <span className="text-sm text-muted-foreground">{filteredUsers.length} usuarios</span>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Telegram</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Saldo</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Depositado</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Sacado</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Ultima Atividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{user.first_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
                      </td>
                      <td className="p-4">
                        {user.telegram_username ? (
                          <a
                            href={`https://t.me/${user.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            @{user.telegram_username}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(Number(user.balance))}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-green-500">{formatCurrency(Number(user.total_deposited))}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-orange-500">{formatCurrency(Number(user.total_withdrawn))}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{formatDate(user.updated_at)}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum usuario encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por ID, tipo ou status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <span className="text-sm text-muted-foreground">{filteredTransactions.length} transacoes</span>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Telegram ID</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Valor</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Taxa</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Liquido</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className={`flex items-center gap-2 ${tx.type === "deposit" ? "text-green-500" : "text-orange-500"}`}>
                          {tx.type === "deposit" ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                          {tx.type === "deposit" ? "Deposito" : "Saque"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{tx.telegram_id}</span>
                      </td>
                      <td className="p-4 text-right font-medium text-foreground">
                        {formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {formatCurrency(Number(tx.fee))}
                      </td>
                      <td className="p-4 text-right font-semibold text-foreground">
                        {formatCurrency(Number(tx.net_amount))}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === "completed" ? "bg-green-500/10 text-green-500" :
                          tx.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                          tx.status === "processing" ? "bg-blue-500/10 text-blue-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {tx.status === "completed" ? "Confirmado" :
                           tx.status === "pending" ? "Pendente" :
                           tx.status === "processing" ? "Processando" : "Falhou"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Nenhuma transacao encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Logs de Atividade</h3>
              <p className="text-sm text-muted-foreground">Ultimas interacoes com o bot</p>
            </div>
            
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.action === "COMMAND" ? "bg-blue-500/10 text-blue-500" :
                      log.action === "CALLBACK" ? "bg-purple-500/10 text-purple-500" :
                      log.action?.includes("DEPOSIT") ? "bg-green-500/10 text-green-500" :
                      log.action?.includes("WITHDRAWAL") ? "bg-orange-500/10 text-orange-500" :
                      "bg-gray-500/10 text-gray-500"
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">ID: {log.telegram_id}</span>
                    {log.command && (
                      <span className="text-sm font-mono text-foreground">{log.command}</span>
                    )}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum log encontrado
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "send" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Enviar Aviso</h3>
              <p className="text-muted-foreground">Envie uma mensagem para o canal @hyperionpayavisos</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setMessage("🔧 <b>MANUTENCAO PROGRAMADA</b>\n\n⚠️ Informamos que teremos uma breve manutencao.\n\n⏰ Previsao de retorno: [HORARIO]")}
                  className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg text-sm hover:bg-yellow-500/20 transition-colors"
                >
                  Manutencao
                </button>
                <button
                  onClick={() => setMessage("🎉 <b>NOVIDADE!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[Sua mensagem aqui]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🌐 https://www.hyperionpay.com.br")}
                  className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm hover:bg-green-500/20 transition-colors"
                >
                  Novidade
                </button>
                <button
                  onClick={() => setMessage("🔥 <b>PROMOCAO!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n[Detalhes da promocao]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📱 Bot: @hyperionpay_bot")}
                  className="px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg text-sm hover:bg-purple-500/20 transition-colors"
                >
                  Promocao
                </button>
                <button
                  onClick={() => setMessage("✅ <b>SISTEMA OPERACIONAL</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTodos os servicos estao funcionando normalmente!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-sm hover:bg-blue-500/20 transition-colors"
                >
                  Sistema OK
                </button>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem (suporta HTML: <b>, <i>, <code>)..."
                rows={8}
                className="w-full p-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-sm"
              />

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{message.length} caracteres</p>
                <button
                  onClick={sendAnnouncement}
                  disabled={sending || !message.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Informacoes do Bot</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bot Username</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value="@hyperionpay_bot"
                      disabled
                      className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground"
                    />
                    <button
                      onClick={() => copyToClipboard("@hyperionpay_bot")}
                      className="p-2.5 bg-muted border border-border rounded-xl hover:bg-muted/80 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Webhook URL</label>
                  <input
                    type="text"
                    value={webhook?.url || "Nao configurado"}
                    disabled
                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Canais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm font-medium text-foreground mb-1">Canal de Vendas</p>
                  <a href="https://t.me/hyperionpaybot" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
                    @hyperionpaybot
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">Depositos, saques, novos usuarios</p>
                </div>
                
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <p className="text-sm font-medium text-foreground mb-1">Canal de Avisos</p>
                  <a href="https://t.me/hyperionpayavisos" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                    @hyperionpayavisos
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">Comunicados, manutencoes, promocoes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Taxas do Bot</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownCircle className="w-5 h-5 text-green-500" />
                    <p className="font-medium text-foreground">Deposito PIX</p>
                  </div>
                  <p className="text-2xl font-bold text-green-500">5%</p>
                  <p className="text-sm text-muted-foreground">Minimo R$ 10,00</p>
                </div>
                
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpCircle className="w-5 h-5 text-orange-500" />
                    <p className="font-medium text-foreground">Saque PIX</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-500">R$ 7,00</p>
                  <p className="text-sm text-muted-foreground">Taxa fixa / Minimo R$ 20,00</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
