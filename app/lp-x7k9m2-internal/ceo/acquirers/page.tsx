"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AcquirerAnalytics } from "@/components/admin/acquirer-analytics";
import {
  Server,
  Plus,
  Edit,
  Power,
  PowerOff,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  Wallet,
  Webhook,
  Copy,
  Check,
} from "lucide-react";

interface Acquirer {
  id: string;
  name: string;
  code: string;
  api_url: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  success_rate: number;
  total_transactions: number;
  total_volume: number;
  fee_percentage: number;
  fixed_fee: number;
  fee_is_percentage: boolean;
  withdrawal_fee: number;
  withdrawal_fee_is_percentage: boolean;
  min_deposit: number;
  min_withdrawal: number;
  route_type: "white" | "black";
  min_amount: number;
  max_amount: number;
  created_at: string;
  health_status?: "online" | "degraded" | "offline";
  last_health_check?: string;
  avg_response_time?: number;
  failure_count_today?: number;
  company_id?: string;
  max_ticket?: number;
  badge?: string;
  is_selectable?: boolean;
}

export default function AcquirersPage() {
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAcquirer, setEditingAcquirer] = useState<Acquirer | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    api_url: "",
    api_key: "",
    api_secret: "",
    fee_percentage: 2.5,
    withdrawal_fee: 0,
    withdrawal_fee_is_percentage: false,
    min_deposit: 1,
    min_withdrawal: 10,
    max_withdrawal: 10000,
    daily_limit: 10000,
    route_type: "white" as "white" | "black",
    company_id: "",
    max_ticket: 0,
    badge: "",
    is_selectable: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [balances, setBalances] = useState<
    Record<string, { ok: boolean; available?: number; blocked?: number; error?: string }>
  >({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{
    webhookUrl: string;
    acquirers: Array<{ id: string; name: string; registered: boolean; registeredAt: string | null }>;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);

  useEffect(() => {
    loadAcquirers();
    loadBalances();
    loadWebhook();
  }, []);

  async function loadWebhook() {
    try {
      const response = await fetch("/api/admin/acquirers/webhook");
      const data = await response.json();
      if (data.success) {
        setWebhookInfo({ webhookUrl: data.webhookUrl, acquirers: data.acquirers || [] });
      }
    } catch (error) {
      console.error("Error loading webhook info:", error);
    }
  }

  async function copyWebhook() {
    if (!webhookInfo?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookInfo.webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch {}
  }

  async function registerWebhook() {
    setRegisteringWebhook(true);
    try {
      const response = await fetch("/api/admin/acquirers/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        alert("Webhook registrado com sucesso em todas as adquirentes Medusa Online.");
      } else {
        const fails = (data.results || [])
          .filter((r: any) => !r.ok)
          .map((r: any) => `${r.name}: ${r.error}`)
          .join("\n");
        alert("Alguns registros falharam:\n" + (fails || "erro desconhecido"));
      }
      loadWebhook();
    } catch {
      alert("Erro ao registrar webhook.");
    } finally {
      setRegisteringWebhook(false);
    }
  }

  async function loadBalances() {
    setLoadingBalances(true);
    try {
      const response = await fetch("/api/admin/acquirers/balance");
      const data = await response.json();
      if (data.success && Array.isArray(data.balances)) {
        const map: Record<string, { ok: boolean; available?: number; blocked?: number; error?: string }> = {};
        for (const b of data.balances) {
          if (!b.supported) continue;
          map[b.id] = { ok: b.ok, available: b.available, blocked: b.blocked, error: b.error };
        }
        setBalances(map);
      }
    } catch (error) {
      console.error("Error loading balances:", error);
    } finally {
      setLoadingBalances(false);
    }
  }

  async function loadAcquirers() {
    try {
      const response = await fetch("/api/admin/acquirers");
      const data = await response.json();
      if (data.acquirers) {
        setAcquirers(data.acquirers);
      }
    } catch (error) {
      console.error("Error loading acquirers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkHealth(acquirerId: string) {
    setCheckingHealth(acquirerId);
    try {
      const response = await fetch("/api/admin/acquirers/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquirerId }),
      });
      const data = await response.json();
      if (data.success) {
        loadAcquirers();
      }
    } catch (error) {
      console.error("Error checking health:", error);
    } finally {
      setCheckingHealth(null);
    }
  }

  function getHealthIcon(status?: string) {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "offline":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  }

  function getHealthLabel(status?: string) {
    switch (status) {
      case "online":
        return "Online";
      case "degraded":
        return "Degradado";
      case "offline":
        return "Offline";
      default:
        return "Desconhecido";
    }
  }

  async function saveAcquirer() {
    setIsSaving(true);
    try {
      if (editingAcquirer) {
        await fetch("/api/admin/acquirers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAcquirer.id,
            action: "update",
            data: {
              name: form.name,
              code: form.code,
              api_url: form.api_url,
              api_key: form.api_key,
              api_secret: form.api_secret,
              fee_percentage: form.fee_percentage,
              withdrawal_fee: form.withdrawal_fee,
              withdrawal_fee_is_percentage: form.withdrawal_fee_is_percentage,
              min_deposit: form.min_deposit,
              min_withdrawal: form.min_withdrawal,
              route_type: form.route_type,
              company_id: form.company_id,
              max_ticket: form.max_ticket,
              badge: form.badge,
              is_selectable: form.is_selectable,
            },
          }),
        });
      } else {
        await fetch("/api/admin/acquirers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      loadAcquirers();
      closeModal();
    } catch (error) {
      console.error("Error saving acquirer:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleAcquirer(acquirer: Acquirer) {
    try {
      await fetch("/api/admin/acquirers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acquirer.id, action: "toggle" }),
      });
      loadAcquirers();
    } catch (error) {
      console.error("Error toggling acquirer:", error);
    }
  }

  async function deleteAcquirer(acquirer: Acquirer) {
    if (!confirm(`Tem certeza que deseja remover a adquirente "${acquirer.name}"?`)) {
      return;
    }
    try {
      await fetch("/api/admin/acquirers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acquirer.id }),
      });
      loadAcquirers();
    } catch (error) {
      console.error("Error deleting acquirer:", error);
    }
  }

  async function runTest(acquirer: Acquirer) {
    setTesting(acquirer.id);
    setTestResults((prev) => ({ ...prev, [acquirer.id]: { ok: false, msg: "Testando..." } }));
    try {
      const res = await fetch("/api/admin/acquirers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquirerId: acquirer.id }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [acquirer.id]: {
            ok: true,
            msg: `Funcional - ${data.latencyMs}ms${data.hasQrCode ? " - QR gerado" : ""}${data.simulated ? " (modo teste)" : ""}`,
          },
        }));
      } else {
        setTestResults((prev) => ({ ...prev, [acquirer.id]: { ok: false, msg: data.error || "Falhou" } }));
      }
      loadAcquirers();
    } catch {
      setTestResults((prev) => ({ ...prev, [acquirer.id]: { ok: false, msg: "Erro de conexão" } }));
    } finally {
      setTesting(null);
    }
  }

  function openAddModal() {
    setEditingAcquirer(null);
    setForm({
      name: "",
      code: "",
      api_url: "",
      api_key: "",
      api_secret: "",
      fee_percentage: 2.5,
      withdrawal_fee: 0,
      withdrawal_fee_is_percentage: false,
      min_deposit: 1,
      min_withdrawal: 10,
      max_withdrawal: 10000,
      daily_limit: 10000,
      route_type: "white",
      company_id: "",
      max_ticket: 0,
      badge: "",
      is_selectable: false,
    });
    setShowModal(true);
  }

  function openEditModal(acquirer: Acquirer) {
    setEditingAcquirer(acquirer);
    setForm({
      name: acquirer.name,
      code: acquirer.code || "",
      api_url: acquirer.api_url,
      api_key: acquirer.api_key || "",
      api_secret: acquirer.api_secret || "",
      fee_percentage: acquirer.fee_percentage || 2.5,
      withdrawal_fee: acquirer.withdrawal_fee || 0,
      withdrawal_fee_is_percentage: acquirer.withdrawal_fee_is_percentage ?? false,
      min_deposit: acquirer.min_deposit || 1,
      min_withdrawal: acquirer.min_withdrawal || 10,
      max_withdrawal: (acquirer as any).max_withdrawal || 10000,
      daily_limit: (acquirer as any).daily_limit || 10000,
      route_type: acquirer.route_type || "white",
      company_id: acquirer.company_id || "",
      max_ticket: Number(acquirer.max_ticket) || 0,
      badge: acquirer.badge || "",
      is_selectable: acquirer.is_selectable ?? false,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingAcquirer(null);
    setForm({
      name: "",
      code: "",
      api_url: "",
      api_key: "",
      api_secret: "",
      fee_percentage: 2.5,
      withdrawal_fee: 0,
      withdrawal_fee_is_percentage: false,
      min_deposit: 1,
      min_withdrawal: 10,
      max_withdrawal: 10000,
      daily_limit: 10000,
      route_type: "white",
      company_id: "",
      max_ticket: 0,
      badge: "",
      is_selectable: false,
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Adquirentes</h1>
          <p className="text-muted-foreground">
            Gerencie os gateways de pagamento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadBalances}
            disabled={loadingBalances}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loadingBalances ? "animate-spin" : ""}`} />
            Atualizar saldos
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Adquirente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{acquirers.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {acquirers.filter((a) => a.is_active).length}
          </p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">
            {acquirers.filter((a) => !a.is_active).length}
          </p>
          <p className="text-sm text-muted-foreground">Inativos</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-primary flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {loadingBalances && Object.keys(balances).length === 0 ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                R${" "}
                {Object.values(balances)
                  .filter((b) => b.ok)
                  .reduce((sum, b) => sum + Number(b.available || 0), 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground">Saldo total disponível</p>
        </div>
      </div>

      {/* Webhook Medusa Online */}
      {webhookInfo && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Webhook className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-1">Webhook Medusa Online</h3>
              <p className="text-sm text-muted-foreground mb-4">
                URL onde a Medusa envia os status de pagamento e saque em tempo real. Configure esta URL
                em Configurações → API e Integrações → Webhook no painel da Medusa, ou clique em
                &quot;Registrar automaticamente&quot;.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <code className="flex-1 px-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground font-mono break-all">
                  {webhookInfo.webhookUrl}
                </code>
                <button
                  onClick={copyWebhook}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  {copiedWebhook ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedWebhook ? "Copiado" : "Copiar"}
                </button>
                <button
                  onClick={registerWebhook}
                  disabled={registeringWebhook}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {registeringWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
                  Registrar automaticamente
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {webhookInfo.acquirers.map((a) => (
                  <span
                    key={a.id}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      a.registered ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.registered ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {a.name}: {a.registered ? "registrado" : "não registrado"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics / Gráficos */}
      <AcquirerAnalytics />

      {/* Acquirers List */}
      <div className="space-y-4">
        {acquirers.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum adquirente cadastrado
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Adicionar primeiro adquirente
            </button>
          </div>
        ) : (
          acquirers.map((acquirer, index) => (
            <motion.div
              key={acquirer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-2xl p-6 ${
                !acquirer.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {acquirer.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          acquirer.is_active
                            ? "bg-green-400/10 text-green-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {acquirer.is_active ? "Ativo" : "Inativo"}
                      </span>
                      {/* Health Status */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        acquirer.health_status === "online" ? "bg-green-400/10 text-green-400" :
                        acquirer.health_status === "degraded" ? "bg-yellow-400/10 text-yellow-400" :
                        acquirer.health_status === "offline" ? "bg-red-400/10 text-red-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {getHealthIcon(acquirer.health_status)}
                        {getHealthLabel(acquirer.health_status)}
                      </span>

                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {acquirer.api_url}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Código: <span className="text-foreground font-mono">{acquirer.code}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        acquirer.route_type === "white" 
                          ? "bg-blue-500/10 text-blue-400" 
                          : "bg-purple-500/10 text-purple-400"
                      }`}>
                        {acquirer.route_type === "white" ? "WHITE" : "BLACK"}
                      </span>
                      <span className="text-muted-foreground">
                        Taxa Entrada: <span className="text-primary">{acquirer.fee_is_percentage ? `${acquirer.fee_percentage || 0}%` : `R$ ${Number(acquirer.fixed_fee || 0).toFixed(2)}`}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Taxa Saque: <span className="text-green-400">{acquirer.withdrawal_fee_is_percentage ? `${acquirer.withdrawal_fee || 0}%` : `R$ ${Number(acquirer.withdrawal_fee || 0).toFixed(2)}`}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Min. Dep: <span className="text-foreground">R$ {Number(acquirer.min_deposit || 1).toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Min. Saque: <span className="text-foreground">R$ {Number(acquirer.min_withdrawal || 10).toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Max. Saque: <span className="text-yellow-400">R$ {Number((acquirer as any).max_withdrawal || 10000).toLocaleString('pt-BR')}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Limite Diario: <span className="text-yellow-400">R$ {Number((acquirer as any).daily_limit || 10000).toLocaleString('pt-BR')}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {acquirer.api_url?.includes("medusapayments.online") && (
                    <button
                      onClick={() => runTest(acquirer)}
                      disabled={testing === acquirer.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-sm font-medium disabled:opacity-50"
                      title="Testar em tempo real (gera PIX de teste)"
                    >
                      {testing === acquirer.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      Testar
                    </button>
                  )}
                  <button
                    onClick={() => checkHealth(acquirer.id)}
                    disabled={checkingHealth === acquirer.id}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                    title="Verificar Status"
                  >
                    {checkingHealth === acquirer.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleAcquirer(acquirer)}
                    className={`p-2 rounded-lg transition-colors ${
                      acquirer.is_active
                        ? "hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        : "hover:bg-green-500/10 text-muted-foreground hover:text-green-400"
                    }`}
                    title={acquirer.is_active ? "Desativar" : "Ativar"}
                  >
                    {acquirer.is_active ? (
                      <PowerOff className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(acquirer)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAcquirer(acquirer)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info da liquidante Medusa Online */}
              {acquirer.api_url?.includes("medusapayments.online") && (
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Nominal exibida: <span className="text-foreground font-medium">{acquirer.name}</span>
                  </span>
                  {acquirer.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {acquirer.badge}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    Ticket máx.: <span className="text-yellow-400 font-medium">R$ {Number(acquirer.max_ticket || 0).toLocaleString("pt-BR")}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Company ID: <span className="text-foreground font-mono text-xs">{acquirer.company_id || "-"}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${acquirer.is_selectable ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {acquirer.is_selectable ? "Selecionável pelo usuário" : "Oculta do usuário"}
                  </span>

                  {/* Saldo da adquirente */}
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Wallet className="w-4 h-4 text-primary" />
                    Saldo disponível:{" "}
                    {loadingBalances && !balances[acquirer.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : balances[acquirer.id]?.ok ? (
                      <span className="text-green-400 font-semibold">
                        R$ {Number(balances[acquirer.id].available || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : balances[acquirer.id] ? (
                      <span className="text-red-400" title={balances[acquirer.id].error}>indisponível</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  {balances[acquirer.id]?.ok && Number(balances[acquirer.id].blocked || 0) > 0 && (
                    <span className="text-muted-foreground">
                      Bloqueado:{" "}
                      <span className="text-yellow-400 font-medium">
                        R$ {Number(balances[acquirer.id].blocked || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  )}

                  {testResults[acquirer.id] && (
                    <span className={`flex items-center gap-1.5 ${testResults[acquirer.id].ok ? "text-green-400" : "text-red-400"}`}>
                      {testResults[acquirer.id].ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {testResults[acquirer.id].msg}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-modal border border-border shadow-2xl rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingAcquirer ? "Editar Adquirente" : "Novo Adquirente"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: MisticPay"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Código (identificador único)
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  placeholder="Ex: misticpay"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado para identificar a adquirente no código. Apenas letras minúsculas, números e underscore.
                </p>
              </div>

              {/* Configuração da liquidante Medusa Online */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                <p className="text-sm font-semibold text-primary">Liquidante Medusa Online</p>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Company ID (id da empresa)
                  </label>
                  <input
                    type="text"
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                    placeholder="Ex: 03582a2b-ecc3-4283-..."
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Ticket máximo (R$)
                    </label>
                    <input
                      type="number"
                      value={form.max_ticket}
                      onChange={(e) => setForm({ ...form, max_ticket: Number(e.target.value) })}
                      placeholder="1000"
                      min="0"
                      step="50"
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Selo (Nova / Exclusiva)
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="Nova"
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_selectable}
                    onChange={(e) => setForm({ ...form, is_selectable: e.target.checked })}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">Disponível para o usuário selecionar</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  URL da API
                </label>
                <input
                  type="text"
                  value={form.api_url}
                  onChange={(e) => setForm({ ...form, api_url: e.target.value })}
                  placeholder="https://api.gateway.com"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  API Key
                </label>
                <input
                  type="text"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder="Chave da API"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  API Secret
                </label>
                <input
                  type="password"
                  value={form.api_secret}
                  onChange={(e) =>
                    setForm({ ...form, api_secret: e.target.value })
                  }
                  placeholder="Secret da API"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Tipo de Rota
                </label>
                <select
                  value={form.route_type}
                  onChange={(e) => setForm({ ...form, route_type: e.target.value as "white" | "black" })}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="white">WHITE - Gateway Premium</option>
                  <option value="black">BLACK - Gateway Express</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Taxa Entrada (%)
                  </label>
                  <input
                    type="number"
                    value={form.fee_percentage}
                    onChange={(e) =>
                      setForm({ ...form, fee_percentage: Number(e.target.value) })
                    }
                    placeholder="2.5"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Taxa Saque ({form.withdrawal_fee_is_percentage ? "%" : "R$"})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.withdrawal_fee}
                      onChange={(e) =>
                        setForm({ ...form, withdrawal_fee: Number(e.target.value) })
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <select
                      value={form.withdrawal_fee_is_percentage ? "percent" : "fixed"}
                      onChange={(e) =>
                        setForm({ ...form, withdrawal_fee_is_percentage: e.target.value === "percent" })
                      }
                      className="px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50"
                    >
                      <option value="fixed">R$</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Min. Deposito (R$)
                  </label>
                  <input
                    type="number"
                    value={form.min_deposit}
                    onChange={(e) =>
                      setForm({ ...form, min_deposit: Number(e.target.value) })
                    }
                    placeholder="1"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Min. Saque (R$)
                  </label>
                  <input
                    type="number"
                    value={form.min_withdrawal}
                    onChange={(e) =>
                      setForm({ ...form, min_withdrawal: Number(e.target.value) })
                    }
                    placeholder="10"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Limite por Saque (R$)
                  </label>
                  <input
                    type="number"
                    value={form.max_withdrawal}
                    onChange={(e) =>
                      setForm({ ...form, max_withdrawal: Number(e.target.value) })
                    }
                    placeholder="10000"
                    min="0"
                    step="100"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Limite Diario (R$)
                  </label>
                  <input
                    type="number"
                    value={form.daily_limit}
                    onChange={(e) =>
                      setForm({ ...form, daily_limit: Number(e.target.value) })
                    }
                    placeholder="10000"
                    min="0"
                    step="100"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveAcquirer}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
