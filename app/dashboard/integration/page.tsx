"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        setShowCreateModal(false);
        setFormName("");
        setFormDescription("");
        setFormWebsite("");
        loadIntegrations();
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
        loadIntegrations();
        alert("Secret regenerado com sucesso!");
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
                        ? integration.client_secret
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
                      onClick={() => copyToClipboard(integration.client_secret, `client_secret_${integration.id}`)}
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
                        ? integration.webhook_secret
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
                      onClick={() => copyToClipboard(integration.webhook_secret, `webhook_secret_${integration.id}`)}
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

              <h3 className="text-xl font-bold text-foreground mb-2">Documentacao da API</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Guia completo para integrar pagamentos PIX ao seu sistema
              </p>

              <div className="space-y-6">
                {/* Base URL */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Base URL</h4>
                  <code className="block p-3 bg-background rounded-lg text-sm font-mono text-primary">
                    https://hyperionpay.com.br/api/v1/integration
                  </code>
                </div>

                {/* Explicacao Credenciais */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Tipos de Credenciais</h4>
                  <div className="space-y-3 text-xs">
                    
                    {/* API Key */}
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          <span className="font-semibold text-foreground">API Key (Chave API)</span>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Dashboard &gt; API</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Chave simples para testes rapidos. Comeca com <code className="text-primary">lp_</code>
                      </p>
                      <div className="bg-secondary/50 rounded p-2 text-[10px]">
                        <p className="text-muted-foreground"><strong>Quando usar:</strong> Testes locais, scripts simples, primeiros testes da API</p>
                        <p className="text-muted-foreground"><strong>Como usar:</strong> Envie no body da requisicao como <code className="text-primary">apiKey</code></p>
                      </div>
                    </div>

                    {/* Client ID */}
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="font-semibold text-foreground">Client ID</span>
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Integracao API</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Identificador da sua integracao. Comeca com <code className="text-primary">cli_</code>
                      </p>
                      <div className="bg-secondary/50 rounded p-2 text-[10px]">
                        <p className="text-muted-foreground"><strong>Quando usar:</strong> Bots Discord, sites em producao, aplicacoes externas</p>
                        <p className="text-muted-foreground"><strong>Como usar:</strong> Junto com Client Secret no header Authorization (Basic Auth)</p>
                      </div>
                    </div>

                    {/* Client Secret */}
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="font-semibold text-foreground">Client Secret</span>
                        </div>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">SECRETO</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Senha secreta da integracao. Comeca com <code className="text-primary">sec_</code>
                      </p>
                      <div className="bg-red-500/10 rounded p-2 text-[10px]">
                        <p className="text-red-400"><strong>NUNCA compartilhe!</strong> Mantenha seguro no seu servidor/backend.</p>
                      </div>
                    </div>

                    {/* Webhook Secret */}
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="font-semibold text-foreground">Webhook Secret</span>
                        </div>
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Seguranca</span>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Para validar notificacoes recebidas. Comeca com <code className="text-primary">whsec_</code>
                      </p>
                      <div className="bg-secondary/50 rounded p-2 text-[10px]">
                        <p className="text-muted-foreground"><strong>Quando usar:</strong> Ao receber webhooks de pagamento confirmado</p>
                        <p className="text-muted-foreground"><strong>Como usar:</strong> Valide o header <code className="text-primary">X-Hyperion Pay-Signature</code></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qual usar? */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Qual credencial devo usar?</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">→</span>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Testes rapidos:</strong> Use a <code className="text-primary">API Key</code> (lp_) no body da requisicao
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">→</span>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Bot Discord / Producao:</strong> Use <code className="text-primary">Client ID + Client Secret</code> com Basic Auth
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">→</span>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Receber confirmacoes:</strong> Configure o <code className="text-primary">Webhook URL</code> e use o <code className="text-primary">Webhook Secret</code> para validar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auth */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Autenticacao</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Voce pode autenticar de 3 formas diferentes:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-400 mb-1">Opcao 1: Headers separados (Recomendado)</p>
                      <code className="block text-xs font-mono text-muted-foreground">
                        x-client-id: seu_client_id{"\n"}
                        x-client-secret: seu_client_secret
                      </code>
                    </div>
                    
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-400 mb-1">Opcao 2: Basic Auth</p>
                      <code className="block text-xs font-mono text-muted-foreground">
                        Authorization: Basic base64(client_id:client_secret)
                      </code>
                    </div>
                    
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-400 mb-1">Opcao 3: Bearer Token</p>
                      <code className="block text-xs font-mono text-muted-foreground">
                        Authorization: Bearer base64(client_id:client_secret)
                      </code>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3 mb-2">Exemplo em JavaScript (Headers):</p>
                  <code className="block p-2 bg-background rounded-lg text-xs font-mono">
{`headers: {
  "x-client-id": "seu_client_id",
  "x-client-secret": "seu_client_secret"
}`}
                  </code>
                </div>

                {/* Erro comum */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Erro: Credenciais Invalidas?</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>- Verifique se esta usando <strong>Client ID</strong> e <strong>Client Secret</strong> (nao API Key)</li>
                    <li>- Codifique em <strong>Base64</strong> no formato <code className="text-primary">cli_xxx:sec_xxx</code></li>
                    <li>- Use header <code className="text-primary">Authorization: Basic ...</code> (nao Bearer)</li>
                    <li>- Certifique que a integracao esta <strong>ativa</strong></li>
                  </ul>
                </div>

                {/* Tutorial Section */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h4 className="text-base font-semibold text-primary mb-3">Tutorial: Fluxo Completo de Pagamento</h4>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                      <div>
                        <p className="font-medium text-foreground">Crie uma cobranca PIX</p>
                        <p className="text-muted-foreground">Envie uma requisicao POST para /pix com o valor e seus dados</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                      <div>
                        <p className="font-medium text-foreground">Exiba o QR Code ou Copy-Paste</p>
                        <p className="text-muted-foreground">Use o qr_code_base64 para exibir a imagem ou copy_paste para o codigo PIX</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                      <div>
                        <p className="font-medium text-foreground">Receba a confirmacao via Webhook</p>
                        <p className="text-muted-foreground">Quando o pagamento for confirmado, enviaremos um POST para sua URL de webhook</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                      <div>
                        <p className="font-medium text-foreground">Ou consulte o status manualmente</p>
                        <p className="text-muted-foreground">Use GET /pix?external_id=seu_id para verificar o status a qualquer momento</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tutoriais por Plataforma */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                    <h4 className="text-sm font-semibold text-foreground">Tutoriais por Plataforma</h4>
                  </div>
                  
                  {/* Discord Bot */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                      </div>
                      <h5 className="font-semibold text-foreground">Bot Discord (discord.js)</h5>
                    </div>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`// config.js - Suas credenciais
const CLIENT_ID = "cli_seu_client_id";
const CLIENT_SECRET = "sec_seu_client_secret";
const credentials = Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");

// comando /pix <valor>
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || interaction.commandName !== "pix") return;
  
  const valor = interaction.options.getNumber("valor");
  const response = await fetch("https://hyperionpay.com.br/api/v1/integration/pix", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + credentials,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: valor,
      external_id: "discord_" + interaction.user.id + "_" + Date.now(),
      description: "Pagamento Discord - " + interaction.user.username
    })
  });
  
  const data = await response.json();
  if (data.success) {
    await interaction.reply({
      content: "**PIX Gerado!**\\nValor: R$ " + valor + "\\nCodigo: \`" + data.data.pix.copy_paste + "\`",
      ephemeral: true
    });
  } else {
    await interaction.reply({ content: "Erro: " + data.error, ephemeral: true });
  }
});`}
                    </code>
                  </div>

                  {/* Website/E-commerce */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <h5 className="font-semibold text-foreground">Site / E-commerce (Next.js API Route)</h5>
                    </div>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`// app/api/criar-pix/route.ts
import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.LEGACYPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.LEGACYPAY_CLIENT_SECRET;
const credentials = Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");

export async function POST(request: NextRequest) {
  const { amount, orderId, customerName } = await request.json();

  const response = await fetch("https://hyperionpay.com.br/api/v1/integration/pix", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + credentials,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      external_id: "order_" + orderId,
      description: "Pedido #" + orderId + " - " + customerName
    })
  });

  const data = await response.json();
  return NextResponse.json(data);
}

// Webhook para receber confirmacao: app/api/webhook-hyperionpay/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (body.event === "payment.completed") {
    const orderId = body.data.external_id.replace("order_", "");
    // Atualizar pedido no banco de dados como pago
    await db.orders.update({ where: { id: orderId }, data: { status: "paid" } });
  }
  
  return NextResponse.json({ received: true });
}`}
                    </code>
                  </div>

                  {/* Python/FastAPI */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#3776AB] flex items-center justify-center">
                        <span className="text-white font-bold text-xs">Py</span>
                      </div>
                      <h5 className="font-semibold text-foreground">Python (FastAPI / Flask)</h5>
                    </div>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`import base64
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI()

CLIENT_ID = "cli_seu_client_id"
CLIENT_SECRET = "sec_seu_client_secret"
credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()

@app.post("/criar-pix")
async def criar_pix(amount: float, order_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://hyperionpay.com.br/api/v1/integration/pix",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            },
            json={
                "amount": amount,
                "external_id": f"order_{order_id}",
                "description": f"Pedido #{order_id}"
            }
        )
    
    data = response.json()
    if not data.get("success"):
        raise HTTPException(status_code=400, detail=data.get("error"))
    
    return {
        "qr_code": data["data"]["pix"]["qr_code_base64"],
        "copy_paste": data["data"]["pix"]["copy_paste"],
        "transaction_id": data["data"]["transaction_id"]
    }

@app.post("/webhook")
async def webhook(payload: dict):
    if payload.get("event") == "payment.completed":
        order_id = payload["data"]["external_id"].replace("order_", "")
        # Atualizar pedido como pago
        print(f"Pedido {order_id} pago!")
    return {"received": True}`}
                    </code>
                  </div>

                  {/* PHP */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#777BB4] flex items-center justify-center">
                        <span className="text-white font-bold text-xs">PHP</span>
                      </div>
                      <h5 className="font-semibold text-foreground">PHP (Laravel / Vanilla)</h5>
                    </div>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`<?php
// config
$clientId = "cli_seu_client_id";
$clientSecret = "sec_seu_client_secret";
$credentials = base64_encode($clientId . ":" . $clientSecret);

// Criar PIX
function criarPix($amount, $orderId, $description) {
    global $credentials;
    
    $ch = curl_init("https://hyperionpay.com.br/api/v1/integration/pix");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Basic " . $credentials,
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            "amount" => $amount,
            "external_id" => "order_" . $orderId,
            "description" => $description
        ])
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Webhook (webhook.php)
$payload = json_decode(file_get_contents("php://input"), true);

if ($payload["event"] === "payment.completed") {
    $orderId = str_replace("order_", "", $payload["data"]["external_id"]);
    // Atualizar pedido como pago no banco
    $pdo->query("UPDATE orders SET status='paid' WHERE id='$orderId'");
}

echo json_encode(["received" => true]);`}
                    </code>
                  </div>
                </div>

                {/* Create PIX */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">1. Criar Cobranca PIX</h4>
                  <p className="text-xs text-muted-foreground mb-2">POST /pix</p>
                  <code className="block p-3 bg-secondary rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "amount": 100.00,
  "external_id": "pedido_123",
  "description": "Pagamento do pedido"
}`}
                  </code>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p><strong>amount</strong> - Valor em reais (obrigatorio)</p>
                    <p><strong>external_id</strong> - Seu ID interno para rastrear o pedido (opcional mas recomendado)</p>
                    <p><strong>description</strong> - Descricao do pagamento (opcional)</p>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Resposta da Criacao</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "success": true,
  "data": {
    "transaction_id": "abc123-uuid",
    "external_id": "pedido_123",
    "amount": 100.00,
    "fee": 2.75,
    "net_amount": 97.25,
    "status": "pending",
    "pix": {
      "qr_code": "00020126...",
      "qr_code_base64": "data:image/png;base64,...",
      "copy_paste": "00020126580014br.gov.bcb..."
    },
    "expires_at": "2024-01-01T00:30:00Z"
  }
}`}
                  </code>
                </div>

                {/* Check Status - DETAILED */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">2. Consultar Status do Pagamento</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Voce pode consultar o status a qualquer momento usando o transaction_id ou seu external_id:
                  </p>
                  <code className="block p-2 bg-background rounded-lg text-xs font-mono mb-2">
                    GET /pix?transaction_id=abc123-uuid
                  </code>
                  <code className="block p-2 bg-background rounded-lg text-xs font-mono">
                    GET /pix?external_id=pedido_123
                  </code>
                  
                  <h5 className="text-xs font-semibold text-foreground mt-4 mb-2">Resposta:</h5>
                  <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "success": true,
  "data": {
    "transaction_id": "abc123-uuid",
    "external_id": "pedido_123",
    "status": "completed",
    "amount": 100.00,
    "net_amount": 97.25,
    "paid_at": "2024-01-01T00:05:00Z",
    "payer_name": "JOAO DA SILVA"
  }
}`}
                  </code>
                </div>

                {/* Webhook - DETAILED */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">3. Receber Notificacoes via Webhook</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Configure sua URL de webhook nas configuracoes da integracao. Quando um pagamento for confirmado, 
                    enviaremos um POST para sua URL com os seguintes dados:
                  </p>
                  <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "event": "payment.completed",
  "data": {
    "transaction_id": "abc123-uuid",
    "external_id": "pedido_123",
    "status": "completed",
    "amount": 100.00,
    "fee": 2.75,
    "net_amount": 97.25,
    "paid_at": "2024-01-01T00:05:00Z",
    "payer_name": "JOAO DA SILVA"
  },
  "timestamp": "2024-01-01T00:05:01Z"
}`}
                  </code>
                  
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-500 font-medium">Importante: Validacao de Seguranca</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sempre valide o header <code className="text-primary">X-Webhook-Signature</code> usando seu webhook_secret 
                      para garantir que a requisicao veio da Hyperion Pay.
                    </p>
                  </div>
                </div>

                {/* Balance & Transactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">4. Consultar Saldo</h4>
                    <code className="block p-2 bg-secondary rounded-lg text-xs font-mono">
                      GET /balance
                    </code>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">5. Listar Transacoes</h4>
                    <code className="block p-2 bg-secondary rounded-lg text-xs font-mono">
                      GET /transactions?limit=50
                    </code>
                  </div>
                </div>

                {/* Code Example - Node.js */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Exemplo Completo - Node.js</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`const CLIENT_ID = "seu_client_id";
const CLIENT_SECRET = "seu_client_secret";
const BASE_URL = "https://hyperionpay.com.br/api/v1/integration";

// Criar credenciais em Base64
const credentials = Buffer.from(
  \`\${CLIENT_ID}:\${CLIENT_SECRET}\`
).toString("base64");

// Funcao para criar cobranca PIX
async function criarPix(amount, externalId, description) {
  const response = await fetch(\`\${BASE_URL}/pix\`, {
    method: "POST",
    headers: {
      "Authorization": \`Basic \${credentials}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount, external_id: externalId, description })
  });
  return response.json();
}

// Funcao para consultar status
async function consultarStatus(externalId) {
  const response = await fetch(
    \`\${BASE_URL}/pix?external_id=\${externalId}\`,
    { headers: { "Authorization": \`Basic \${credentials}\` } }
  );
  return response.json();
}

// Uso
const pix = await criarPix(100.00, "pedido_123", "Compra na loja");
console.log("QR Code:", pix.data.pix.copy_paste);

// Verificar status depois
const status = await consultarStatus("pedido_123");
console.log("Status:", status.data.status);`}
                  </code>
                </div>

                {/* Status Codes */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Status das Transacoes</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <div>
                        <span className="font-medium text-foreground">pending</span>
                        <span className="text-muted-foreground ml-1">- Aguardando pagamento</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <div>
                        <span className="font-medium text-foreground">completed</span>
                        <span className="text-muted-foreground ml-1">- Pago com sucesso</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <div>
                        <span className="font-medium text-foreground">expired</span>
                        <span className="text-muted-foreground ml-1">- Expirado</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                      <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                      <div>
                        <span className="font-medium text-foreground">cancelled</span>
                        <span className="text-muted-foreground ml-1">- Cancelado</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SAQUES / WITHDRAWALS */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                  <h4 className="text-base font-semibold text-indigo-400 mb-3">API de Saques (PIX Out)</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Realize saques programaticos para qualquer chave PIX diretamente via API.
                  </p>
                  
                  {/* Criar Saque */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-foreground mb-2">6. Criar Saque</h5>
                    <p className="text-xs text-muted-foreground mb-2">POST /withdrawal</p>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "amount": 100.00,
  "pix_key": "email@exemplo.com",
  "pix_key_type": "email",
  "external_id": "saque_123",
  "description": "Saque do pedido 123"
}`}
                    </code>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <p><strong>amount</strong> - Valor em reais (obrigatorio, minimo R$ 10)</p>
                      <p><strong>pix_key</strong> - Chave PIX do destinatario (obrigatorio)</p>
                      <p><strong>pix_key_type</strong> - Tipo da chave: cpf, cnpj, email, phone, random (obrigatorio)</p>
                      <p><strong>external_id</strong> - Seu ID interno para rastrear (opcional)</p>
                      <p><strong>description</strong> - Descricao do saque (opcional)</p>
                    </div>
                  </div>
                  
                  {/* Resposta Saque */}
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-foreground mb-2">Resposta da Criacao do Saque:</h5>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "success": true,
  "data": {
    "withdrawal_id": "wd_abc123-uuid",
    "external_id": "saque_123",
    "amount": 100.00,
    "fee": 5.00,
    "net_amount": 95.00,
    "pix_key": "email@exemplo.com",
    "pix_key_type": "email",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}`}
                    </code>
                  </div>
                  
                  {/* Consultar Status Saque */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-foreground mb-2">7. Consultar Status do Saque</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Consulte o status usando o withdrawal_id ou seu external_id:
                    </p>
                    <code className="block p-2 bg-background rounded-lg text-xs font-mono mb-2">
                      GET /withdrawal?withdrawal_id=wd_abc123-uuid
                    </code>
                    <code className="block p-2 bg-background rounded-lg text-xs font-mono">
                      GET /withdrawal?external_id=saque_123
                    </code>
                    
                    <h6 className="text-xs font-semibold text-foreground mt-3 mb-2">Resposta:</h6>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`{
  "success": true,
  "data": {
    "withdrawal_id": "wd_abc123-uuid",
    "external_id": "saque_123",
    "status": "completed",
    "amount": 100.00,
    "fee": 5.00,
    "net_amount": 95.00,
    "pix_key": "email@exemplo.com",
    "recipient_name": "JOAO DA SILVA",
    "recipient_bank": "Banco Inter",
    "completed_at": "2024-01-01T00:02:00Z"
  }
}`}
                    </code>
                  </div>
                  
                  {/* Status do Saque */}
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-foreground mb-2">Status do Saque:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        <span><strong>pending</strong> - Aguardando processamento</span>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span><strong>processing</strong> - Em processamento</span>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span><strong>completed</strong> - Concluido com sucesso</span>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span><strong>failed</strong> - Falhou</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Exemplo Node.js Saque */}
                  <div>
                    <h5 className="text-xs font-semibold text-foreground mb-2">Exemplo - Node.js:</h5>
                    <code className="block p-3 bg-background rounded-lg text-xs font-mono whitespace-pre overflow-x-auto">
{`// Criar saque
async function criarSaque(amount, pixKey, pixKeyType, externalId) {
  const response = await fetch(\`\${BASE_URL}/withdrawal\`, {
    method: "POST",
    headers: {
      "Authorization": \`Basic \${credentials}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      external_id: externalId
    })
  });
  return response.json();
}

// Consultar status do saque
async function consultarSaque(externalId) {
  const response = await fetch(
    \`\${BASE_URL}/withdrawal?external_id=\${externalId}\`,
    { headers: { "Authorization": \`Basic \${credentials}\` } }
  );
  return response.json();
}

// Uso
const saque = await criarSaque(100.00, "email@exemplo.com", "email", "saque_123");
console.log("Saque criado:", saque.data.withdrawal_id);

// Verificar status
const status = await consultarSaque("saque_123");
console.log("Status:", status.data.status);`}
                    </code>
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400 font-medium">Importante:</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Saques sao debitados do seu saldo disponivel. Certifique-se de ter saldo suficiente 
                      (valor + taxa) antes de criar um saque.
                    </p>
                  </div>
                </div>

                {/* Errors */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Codigos de Erro</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                      <code className="text-red-400">401</code>
                      <span className="text-muted-foreground">Credenciais invalidas ou ausentes</span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                      <code className="text-red-400">400</code>
                      <span className="text-muted-foreground">Dados invalidos na requisicao</span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                      <code className="text-red-400">404</code>
                      <span className="text-muted-foreground">Transacao nao encontrada</span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                      <code className="text-red-400">500</code>
                      <span className="text-muted-foreground">Erro interno do servidor</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
