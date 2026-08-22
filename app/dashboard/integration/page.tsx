"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiDocumentation } from "@/components/dashboard/api-documentation";
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Code,
  Plus,
  Trash2,
  Settings,
  ExternalLink,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Edit3,
  BarChart3,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  client_id: string;
  client_secret: string;
  webhook_url: string | null;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  api_key: string;
}

export default function IntegrationPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(7);
  const [remaining, setRemaining] = useState(7);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formWebhook, setFormWebhook] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // UI states
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [oneTimeSecrets, setOneTimeSecrets] = useState<Record<string, { client?: string; webhook?: string }>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<Record<string, { success: boolean; message: string } | null>>({});
  
  // Webhook inline edit states
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [webhookInputs, setWebhookInputs] = useState<Record<string, string>>({});
  const [savingWebhook, setSavingWebhook] = useState<string | null>(null);

  // UTMify states
  const [utmifyToken, setUtmifyToken] = useState("");
  const [utmifyIntegrated, setUtmifyIntegrated] = useState(false);
  const [utmifyTokenPreview, setUtmifyTokenPreview] = useState<string | null>(null);
  const [utmifyLoading, setUtmifyLoading] = useState(false);
  const [utmifyTesting, setUtmifyTesting] = useState(false);
  const [showUtmifyToken, setShowUtmifyToken] = useState(false);

  useEffect(() => {
    loadIntegrations();
    loadProfile();
    loadUtmifyStatus();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Erro ao carregar profile:", error);
    }
  }

  async function loadUtmifyStatus() {
    try {
      const response = await fetch("/api/integrations/utmify");
      const data = await response.json();
      setUtmifyIntegrated(data.integrated);
      setUtmifyTokenPreview(data.tokenPreview);
    } catch (error) {
      console.error("Erro ao carregar status UTMify:", error);
    }
  }

  async function saveUtmifyToken(testFirst: boolean = true) {
    if (!utmifyToken.trim()) {
      alert("Insira o token da API UTMify");
      return;
    }
    
    setUtmifyLoading(true);
    if (testFirst) setUtmifyTesting(true);
    
    try {
      const response = await fetch("/api/integrations/utmify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          apiToken: utmifyToken.trim(),
          testConnection: testFirst 
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Integracao UTMify configurada com sucesso!");
        setUtmifyToken("");
        loadUtmifyStatus();
      } else {
        alert(data.error || "Erro ao configurar UTMify");
      }
    } catch (error) {
      console.error("Erro ao salvar UTMify:", error);
      alert("Erro ao configurar UTMify");
    } finally {
      setUtmifyLoading(false);
      setUtmifyTesting(false);
    }
  }

  async function removeUtmify() {
    if (!confirm("Tem certeza que deseja remover a integracao com UTMify?")) return;
    
    setUtmifyLoading(true);
    try {
      const response = await fetch("/api/integrations/utmify", { method: "DELETE" });
      const data = await response.json();
      
      if (data.success) {
        alert("Integracao UTMify removida");
        loadUtmifyStatus();
      } else {
        alert(data.error || "Erro ao remover integracao");
      }
    } catch (error) {
      console.error("Erro ao remover UTMify:", error);
      alert("Erro ao remover integracao");
    } finally {
      setUtmifyLoading(false);
    }
  }

  async function loadIntegrations() {
    try {
      const response = await fetch("/api/user/integrations");
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations);
        setLimit(data.limit);
        setRemaining(data.remaining);
      }
    } catch (error) {
      console.error("Erro ao carregar integracoes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createIntegration() {
    if (!formName.trim()) return;
    setFormLoading(true);
    try {
      const response = await fetch("/api/user/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          website_url: formWebsite,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setOneTimeSecrets((current) => ({
          ...current,
          [data.integration.id]: {
            client: data.integration.client_secret,
            webhook: data.integration.webhook_secret,
          },
        }));
        setShowCreateModal(false);
        setFormName("");
        setFormDescription("");
        setFormWebsite("");
        await loadIntegrations();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erro ao criar integracao");
    } finally {
      setFormLoading(false);
    }
  }

  async function updateIntegration() {
    if (!selectedIntegration) return;
    setFormLoading(true);
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedIntegration.id,
          name: formName,
          description: formDescription,
          website_url: formWebsite,
          webhook_url: formWebhook,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowEditModal(false);
        loadIntegrations();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erro ao atualizar integracao");
    } finally {
      setFormLoading(false);
    }
  }

  async function deleteIntegration(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta integracao? Esta acao nao pode ser desfeita.")) return;
    try {
      const response = await fetch(`/api/user/integrations?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        loadIntegrations();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erro ao excluir integracao");
    }
  }

  async function toggleIntegration(integration: Integration) {
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integration.id, is_active: !integration.is_active }),
      });
      const data = await response.json();
      if (data.success) {
        loadIntegrations();
      }
    } catch {
      alert("Erro ao atualizar status");
    }
  }

  async function regenerateSecret(integrationId: string, type: "client" | "webhook") {
    if (!confirm(`Tem certeza que deseja regenerar o ${type === "client" ? "Client Secret" : "Webhook Secret"}? As credenciais antigas deixarao de funcionar.`)) return;
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integrationId, regenerate_secret: type }),
      });
      const data = await response.json();
      if (data.success) {
        setOneTimeSecrets((current) => ({
          ...current,
          [integrationId]: {
            ...current[integrationId],
            [type]: type === "client" ? data.integration.client_secret : data.integration.webhook_secret,
          },
        }));
        await loadIntegrations();
        alert("Secret regenerado. Copie agora: ele sera exibido apenas nesta sessao.");
      }
    } catch {
      alert("Erro ao regenerar secret");
    }
  }

  async function testWebhook(integration: Integration) {
    if (!integration.webhook_url) {
      alert("Configure a URL do webhook primeiro");
      return;
    }
    setTestingWebhook(integration.id);
    setWebhookTestResult({ ...webhookTestResult, [integration.id]: null });
    try {
      const response = await fetch("/api/user/credentials/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration_id: integration.id }),
      });
      const data = await response.json();
      setWebhookTestResult({
        ...webhookTestResult,
        [integration.id]: { success: data.success, message: data.message },
      });
    } catch {
      setWebhookTestResult({
        ...webhookTestResult,
        [integration.id]: { success: false, message: "Erro ao testar webhook" },
      });
    } finally {
      setTestingWebhook(null);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function saveWebhookUrl(integrationId: string) {
    const webhookUrl = webhookInputs[integrationId] || "";
    setSavingWebhook(integrationId);
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integrationId, webhook_url: webhookUrl }),
      });
      const data = await response.json();
      if (data.success) {
        setEditingWebhook(null);
        setWebhookTestResult({ ...webhookTestResult, [integrationId]: null });
        loadIntegrations();
      } else {
        alert(data.error || "Erro ao salvar webhook");
      }
    } catch {
      alert("Erro ao salvar webhook");
    } finally {
      setSavingWebhook(null);
    }
  }

  function startEditingWebhook(integration: Integration) {
    setWebhookInputs({ ...webhookInputs, [integration.id]: integration.webhook_url || "" });
    setEditingWebhook(integration.id);
  }

  function openEditModal(integration: Integration) {
    setSelectedIntegration(integration);
    setFormName(integration.name);
    setFormDescription(integration.description || "");
    setFormWebsite(integration.website_url || "");
    setFormWebhook(integration.webhook_url || "");
    setShowEditModal(true);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Integracoes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas integracoes com outros sites ({integrations.length}/{limit})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDocsModal(true)} size="sm" className="sm:size-default">
            <Code className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Documentacao</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={remaining <= 0}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Integracao</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Sua Chave API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Sua Chave API
            </h2>
            <p className="text-xs text-muted-foreground">
              Use esta chave para autenticar suas requisicoes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-4">
          <code className="flex-1 text-xs sm:text-sm text-muted-foreground font-mono truncate">
            {showApiKey 
              ? (profile?.api_key || "Carregando...") 
              : "••••••••••••••••••••••••••••••••••••••••"}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowApiKey(!showApiKey)}
            className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            title={showApiKey ? "Esconder" : "Mostrar"}
          >
            {showApiKey ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (profile?.api_key) {
                copyToClipboard(profile.api_key, "api_key");
              }
            }}
            className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            title="Copiar"
          >
            {copied === "api_key" ? (
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
          Mantenha sua chave em segredo! Nao a compartilhe publicamente.
        </p>
        <button 
          onClick={() => setShowDocsModal(true)} 
          className="text-primary text-xs sm:text-sm hover:underline mt-2 inline-block"
        >
          Ver documentacao da API
        </button>
      </motion.div>

      {/* UTMify Integration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                UTMify
              </h2>
              {utmifyIntegrated && (
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                  Conectado
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Rastreie suas conversoes e campanhas de marketing
            </p>
          </div>
          {utmifyIntegrated && (
            <Button
              variant="outline"
              size="sm"
              onClick={removeUtmify}
              disabled={utmifyLoading}
              className="text-destructive hover:bg-destructive/10"
            >
              {utmifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {utmifyIntegrated ? (
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Token Configurado</span>
              <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">
                {utmifyTokenPreview || "Configurado"}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Suas transacoes PIX serao enviadas automaticamente para o UTMify. 
              Certifique-se de enviar os parametros UTM na criacao do pagamento.
            </p>
            <div className="mt-3 p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Parametros suportados na API de criacao PIX:</p>
              <code className="text-xs font-mono text-primary block">
                utm_source, utm_campaign, utm_medium, utm_content, utm_term, src, sck
              </code>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Conecte sua conta UTMify para rastrear a origem das suas vendas e 
                medir o desempenho das suas campanhas de marketing.
              </p>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse sua conta no <a href="https://utmify.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">UTMify</a></li>
                <li>Va em Integracoes &gt; Webhooks &gt; Credenciais de API</li>
                <li>Clique em &quot;Adicionar Credencial&quot; e copie o token gerado</li>
                <li>Cole o token no campo abaixo</li>
              </ol>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showUtmifyToken ? "text" : "password"}
                  placeholder="Cole seu token da API UTMify"
                  value={utmifyToken}
                  onChange={(e) => setUtmifyToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUtmifyToken(!showUtmifyToken)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  {showUtmifyToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                onClick={() => saveUtmifyToken(true)}
                disabled={utmifyLoading || !utmifyToken.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {utmifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {utmifyTesting ? "Testando..." : "Salvando..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Conectar UTMify
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma integracao criada
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Crie sua primeira integracao para conectar seu site e comecar a receber pagamentos via API.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Integracao
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card border rounded-2xl p-4 sm:p-6 ${
                integration.is_active ? "border-border" : "border-yellow-500/30 bg-yellow-500/5"
              }`}
            >
              {/* Integration Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    integration.is_active ? "bg-primary/10" : "bg-yellow-500/10"
                  }`}>
                    <Globe className={`w-5 h-5 ${integration.is_active ? "text-primary" : "text-yellow-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      {!integration.is_active && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                          Desativada
                        </span>
                      )}
                    </div>
                    {integration.description && (
                      <p className="text-sm text-muted-foreground truncate">{integration.description}</p>
                    )}
                    {integration.website_url && (
                      <a
                        href={integration.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <span className="truncate max-w-[200px]">{integration.website_url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada em {formatDate(integration.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleIntegration(integration)}
                    className={`text-xs ${integration.is_active ? "" : "border-green-500/30 text-green-500 hover:bg-green-500/10"}`}
                  >
                    {integration.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(integration)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteIntegration(integration.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-3 bg-secondary/30 rounded-xl p-3 sm:p-4">
                {/* Client ID */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                      {integration.client_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(integration.client_id, `client_id_${integration.id}`)}
                    >
                      {copied === `client_id_${integration.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Client Secret */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client Secret</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                    {showSecrets[`client_${integration.id}`]
                      ? oneTimeSecrets[integration.id]?.client || "Secret protegido. Regenere para exibir."
                      : "••••••••••••••••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [`client_${integration.id}`]: !showSecrets[`client_${integration.id}`],
                        })
                      }
                    >
                      {showSecrets[`client_${integration.id}`] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                    const secret = oneTimeSecrets[integration.id]?.client;
                    if (secret) copyToClipboard(secret, `client_secret_${integration.id}`);
                  }}
                  disabled={!oneTimeSecrets[integration.id]?.client}
                    >
                      {copied === `client_secret_${integration.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateSecret(integration.id, "client")}
                      title="Regenerar Client Secret"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-foreground">Webhook URL</label>
                    <span className="text-[10px] text-muted-foreground">Receba notificacoes de pagamento</span>
                  </div>
                  
                  {editingWebhook === integration.id ? (
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder="https://seusite.com/api/webhook"
                        value={webhookInputs[integration.id] || ""}
                        onChange={(e) => setWebhookInputs({ ...webhookInputs, [integration.id]: e.target.value })}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveWebhookUrl(integration.id)}
                          disabled={savingWebhook === integration.id}
                          className="bg-primary hover:bg-primary/90 text-xs"
                        >
                          {savingWebhook === integration.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWebhook(null)}
                          className="text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {integration.webhook_url ? (
                        <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                          {integration.webhook_url}
                        </code>
                      ) : (
                        <span className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm text-muted-foreground italic">
                          Nao configurado - clique em Configurar
                        </span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingWebhook(integration)}
                          className="text-xs"
                        >
                          {integration.webhook_url ? "Editar" : "Configurar"}
                        </Button>
                        {integration.webhook_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhook(integration)}
                            disabled={testingWebhook === integration.id}
                            className="text-xs"
                          >
                            {testingWebhook === integration.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Testar"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {webhookTestResult[integration.id] && (
                    <div
                      className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                        webhookTestResult[integration.id]?.success
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {webhookTestResult[integration.id]?.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {webhookTestResult[integration.id]?.message}
                    </div>
                  )}
                  
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Enviaremos um POST com os dados do pagamento para esta URL quando uma transacao for confirmada.
                  </p>
                </div>

                {/* Webhook Secret */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Webhook Secret</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                    {showSecrets[`webhook_${integration.id}`]
                      ? oneTimeSecrets[integration.id]?.webhook || "Secret protegido. Regenere para exibir."
                      : "••••••••••••••••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [`webhook_${integration.id}`]: !showSecrets[`webhook_${integration.id}`],
                        })
                      }
                    >
                      {showSecrets[`webhook_${integration.id}`] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                    const secret = oneTimeSecrets[integration.id]?.webhook;
                    if (secret) copyToClipboard(secret, `webhook_secret_${integration.id}`);
                  }}
                  disabled={!oneTimeSecrets[integration.id]?.webhook}
                    >
                      {copied === `webhook_secret_${integration.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Remaining Slots */}
      {remaining > 0 && integrations.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Voce pode criar mais {remaining} integracao{remaining > 1 ? "es" : ""}
        </p>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Nova Integracao</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie credenciais para integrar com seu site
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Nome da Integracao *
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Minha Loja Online"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Descricao (opcional)
                  </label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Integracao para checkout da loja"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    URL do Site (opcional)
                  </label>
                  <Input
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://minhaloja.com.br"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={createIntegration}
                    disabled={!formName.trim() || formLoading}
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Criar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedIntegration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Editar Integracao</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Descricao</label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">URL do Site</label>
                  <Input
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Webhook URL</label>
                  <Input
                    value={formWebhook}
                    onChange={(e) => setFormWebhook(e.target.value)}
                    placeholder="https://seu-site.com/api/webhook"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={updateIntegration}
                    disabled={formLoading}
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Documentation Modal */}
      <AnimatePresence>
        {showDocsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowDocsModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <ApiDocumentation />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
