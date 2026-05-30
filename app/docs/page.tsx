"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Key,
  CreditCard,
  ArrowUpDown,
  Webhook,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  FileCode,
  Terminal,
  BookOpen,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Bot,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "intro", title: "Introdução", icon: BookOpen },
  { id: "auth", title: "Autenticação", icon: Key },
  { id: "balance", title: "Saldo", icon: Wallet },
  { id: "charges", title: "Cobranças PIX", icon: CreditCard },
  { id: "transfers", title: "Transferências", icon: ArrowUpDown },
  { id: "webhooks", title: "Webhooks", icon: Webhook },
  { id: "errors", title: "Erros", icon: AlertCircle },
  { id: "ai-prompts", title: "Prompts para IA", icon: Bot },
];

const languages = ["curl", "javascript", "python", "php"];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const [activeLang, setActiveLang] = useState("curl");
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id, language }: { code: string; id: string; language?: string }) => (
    <div className="relative group">
      {language && (
        <div className="absolute top-2 left-4 text-xs text-muted-foreground font-mono">
          {language}
        </div>
      )}
      <pre className="bg-[#0d0d0d] border border-border rounded-xl p-4 pt-8 text-sm text-foreground font-mono overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyCode(code, id)}
      >
        {copied === id ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  const highlightCode = (code: string) => {
    return code
      .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$&</span>')
      .replace(/\b(const|let|var|function|return|import|from|export|async|await|if|else)\b/g, '<span class="text-purple-400">$&</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-indigo-400">$&</span>')
      .replace(/(\d+\.?\d*)/g, '<span class="text-indigo-400">$&</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-muted-foreground">$&</span>');
  };

  const MethodBadge = ({ method }: { method: string }) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-500/20 text-blue-400",
      POST: "bg-green-500/20 text-green-400",
      PUT: "bg-yellow-500/20 text-yellow-400",
      DELETE: "bg-red-500/20 text-red-400",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${colors[method]}`}>
        {method}
      </span>
    );
  };

  const baseUrl = "https://hyperionpay.com.br";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo-hyperion.png"
                alt="Hyperion Pay"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="font-bold text-foreground">
                Hyperion<span className="text-primary">Pay</span>
              </span>
              <span className="text-muted-foreground text-sm">API Docs</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-white/[0.02] min-h-[calc(100vh-64px)] sticky top-16 hidden lg:block">
          <nav className="p-6 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 px-3 font-semibold">
              Documentacao
            </p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === section.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{section.title}</span>
                {activeSection === section.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}

            <div className="pt-6 mt-6 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 px-3 font-semibold">
                Recursos
              </p>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-medium"
              >
                <Terminal className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/api"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-medium"
              >
                <Key className="w-4 h-4" />
                Suas API Keys
              </Link>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            {/* Introducao */}
            {activeSection === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">
                    API Hyperion Pay
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Bem-vindo a documentacao da API Hyperion Pay. Aqui voce encontra tudo que precisa
                    para integrar nosso gateway de pagamentos PIX ao seu sistema.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Simples e Rapido</h3>
                    <p className="text-muted-foreground text-sm">
                      Integracao em minutos com nossa API RESTful. Suporte a multiplas linguagens.
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">100% Anonimo</h3>
                    <p className="text-muted-foreground text-sm">
                      Sem KYC, sem MED, sem bloqueios. Opere com total privacidade.
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">URL Base</h2>
                  <CodeBlock code={baseUrl} id="base-url" />
                  <p className="text-muted-foreground text-sm mt-4">
                    Todas as requisicoes devem ser feitas para esta URL base seguida do endpoint desejado.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Integrando com IA?</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        Temos prompts prontos para voce copiar e colar na sua IA favorita (ChatGPT, Claude, etc.)
                        e integrar nossa API automaticamente!
                      </p>
                      <Button
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => setActiveSection("ai-prompts")}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Ver Prompts para IA
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Autenticacao */}
            {activeSection === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Autenticacao</h1>
                  <p className="text-lg text-muted-foreground">
                    Existem dois tipos de autenticacao: API Key (simples) e Basic Auth (integracoes).
                  </p>
                </div>

                {/* Explicacao das Credenciais */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Tipos de Credenciais</h2>
                  <div className="space-y-4">
                    <div className="bg-background/50 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <h3 className="font-semibold text-foreground">API Key</h3>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Simples</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Chave unica para acesso basico. Encontrada no Dashboard &gt; API.
                      </p>
                      <code className="text-xs bg-secondary px-2 py-1 rounded text-primary">lp_xxxxxxxxxxxxxxxx</code>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Uso:</strong> Enviar no body da requisicao como <code className="text-primary">apiKey</code>
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <h3 className="font-semibold text-foreground">Client ID + Client Secret</h3>
                        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Integracoes</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Par de credenciais para integracoes avancadas. Encontrado no Dashboard &gt; Integracao API.
                      </p>
                      <div className="space-y-1">
                        <div>
                          <span className="text-xs text-muted-foreground">Client ID:</span>
                          <code className="text-xs bg-secondary px-2 py-1 rounded text-primary ml-2">cli_xxxxxxxxxxxxxxxx</code>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Client Secret:</span>
                          <code className="text-xs bg-secondary px-2 py-1 rounded text-primary ml-2">sec_xxxxxxxxxxxxxxxx</code>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Uso:</strong> Basic Auth no header - <code className="text-primary">Authorization: Basic base64(client_id:client_secret)</code>
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <h3 className="font-semibold text-foreground">Webhook Secret</h3>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Seguranca</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Chave para validar que as notificacoes vieram da Hyperion Pay.
                      </p>
                      <code className="text-xs bg-secondary px-2 py-1 rounded text-primary">whsec_xxxxxxxxxxxxxxxx</code>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Uso:</strong> Valide o header <code className="text-primary">X-Hyperion Pay-Signature</code> usando HMAC-SHA256
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Obtendo suas Credenciais</h2>
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-4">
                    <li><strong>API Key:</strong> Dashboard &gt; API &gt; Copie a chave que comeca com <code className="text-primary">lp_</code></li>
                    <li><strong>Client ID/Secret:</strong> Dashboard &gt; Integracao API &gt; Crie uma nova integracao</li>
                    <li><strong>Webhook Secret:</strong> Gerado automaticamente ao criar uma integracao</li>
                  </ol>
                  <div className="flex gap-2 flex-wrap">
                    <Link href="/dashboard/api">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Ver API Key
                      </Button>
                    </Link>
                    <Link href="/dashboard/integration">
                      <Button variant="outline">
                        Criar Integracao
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Metodo 1: API Key (Simples)</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envie a API Key no body da requisicao. Ideal para testes rapidos.
                  </p>
                  <CodeBlock 
                    code={`POST /api/pix/create
Content-Type: application/json

{
  "apiKey": "lp_sua_api_key_aqui",
  "amount": 100.00,
  "description": "Pagamento teste"
}`}
                    id="auth-apikey"
                    language="http"
                  />
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Metodo 2: Basic Auth (Integracoes)</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Basic Auth com client_id:client_secret em Base64. Recomendado para producao.
                  </p>
                  <CodeBlock 
                    code={`# Suas credenciais
CLIENT_ID="cli_seu_client_id"
CLIENT_SECRET="sec_seu_client_secret"

# Codificar em Base64
# Em JavaScript: btoa(client_id + ":" + client_secret)
# Em Python: base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
# Em PHP: base64_encode($client_id . ":" . $client_secret)

Authorization: Basic Y2xpX3NldV9jbGllbnRfaWQ6c2VjX3NldV9jbGllbnRfc2VjcmV0`}
                    id="auth-basic"
                    language="http"
                  />
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Exemplos Completos</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exemplos usando Basic Auth (client_id:client_secret) - recomendado para producao e bots.
                  </p>
                  
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          activeLang === lang
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  {activeLang === "curl" && (
                    <CodeBlock
                      code={`# Usando Basic Auth (client_id:client_secret)
CLIENT_ID="cli_seu_client_id"
CLIENT_SECRET="sec_seu_client_secret"

# Codificar credenciais em Base64
CREDENTIALS=$(echo -n "$CLIENT_ID:$CLIENT_SECRET" | base64)

curl -X POST "${baseUrl}/api/v1/integration/pix" \\
  -H "Authorization: Basic $CREDENTIALS" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "external_id": "pedido_123",
    "description": "Pagamento do pedido #123"
  }'`}
                      id="auth-curl"
                      language="bash"
                    />
                  )}
                  {activeLang === "javascript" && (
                    <CodeBlock
                      code={`// Suas credenciais (Dashboard > Integracao API)
const CLIENT_ID = "cli_seu_client_id";
const CLIENT_SECRET = "sec_seu_client_secret";

// Codificar em Base64
const credentials = btoa(CLIENT_ID + ":" + CLIENT_SECRET);

// Criar cobranca PIX
const response = await fetch("${baseUrl}/api/v1/integration/pix", {
  method: "POST",
  headers: {
    "Authorization": "Basic " + credentials,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 100.00,
    external_id: "pedido_123",
    description: "Pagamento do pedido #123"
  })
});

const data = await response.json();

if (data.success) {
  console.log("QR Code:", data.data.pix.qr_code_base64);
  console.log("Copy-Paste:", data.data.pix.copy_paste);
} else {
  console.error("Erro:", data.error);
}`}
                      id="auth-js"
                      language="javascript"
                    />
                  )}
                  {activeLang === "python" && (
                    <CodeBlock
                      code={`import requests
import base64

# Suas credenciais (Dashboard > Integracao API)
CLIENT_ID = "cli_seu_client_id"
CLIENT_SECRET = "sec_seu_client_secret"

# Codificar em Base64
credentials = base64.b64encode(
    f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
).decode()

# Criar cobranca PIX
response = requests.post(
    "${baseUrl}/api/v1/integration/pix",
    headers={
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/json"
    },
    json={
        "amount": 100.00,
        "external_id": "pedido_123",
        "description": "Pagamento do pedido #123"
    }
)

data = response.json()

if data.get("success"):
    print("QR Code:", data["data"]["pix"]["qr_code_base64"])
    print("Copy-Paste:", data["data"]["pix"]["copy_paste"])
else:
    print("Erro:", data.get("error"))`}
                      id="auth-python"
                      language="python"
                    />
                  )}
                  {activeLang === "php" && (
                    <CodeBlock
                      code={`<?php
// Suas credenciais (Dashboard > Integracao API)
$clientId = "cli_seu_client_id";
$clientSecret = "sec_seu_client_secret";

// Codificar em Base64
$credentials = base64_encode($clientId . ":" . $clientSecret);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "${baseUrl}/api/v1/integration/pix",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Basic " . $credentials,
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "amount" => 100.00,
        "external_id" => "pedido_123",
        "description" => "Pagamento do pedido #123"
    ])
]);

$response = curl_exec($curl);
$data = json_decode($response, true);

if ($data["success"]) {
    echo "QR Code: " . $data["data"]["pix"]["qr_code_base64"] . "\\n";
    echo "Copy-Paste: " . $data["data"]["pix"]["copy_paste"] . "\\n";
} else {
    echo "Erro: " . $data["error"] . "\\n";
}`}
                      id="auth-php"
                      language="php"
                    />
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-yellow-500 mb-2">Erro Comum: Credenciais Invalidas</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Se voce esta recebendo erro de credenciais invalidas, verifique:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Voce esta usando <strong>Client ID</strong> e <strong>Client Secret</strong>, nao a API Key</li>
                    <li>As credenciais estao codificadas em <strong>Base64</strong> no formato <code className="text-primary">client_id:client_secret</code></li>
                    <li>O header e <code className="text-primary">Authorization: Basic ...</code> (nao Bearer)</li>
                    <li>A integracao esta <strong>ativa</strong> no Dashboard</li>
                    <li>Sua conta tem <strong>KYC aprovado</strong></li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Saldo */}
            {activeSection === "balance" && (
              <motion.div
                key="balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Saldo</h1>
                  <p className="text-lg text-muted-foreground">
                    Consulte o saldo disponivel na sua conta.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MethodBadge method="GET" />
                    <code className="text-foreground font-mono text-lg">/api/user/balance</code>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-4">Resposta</h3>
                  <CodeBlock
                    code={`{
  "success": true,
  "data": {
    "balance": 1500.50,
    "pending": 250.00,
    "available": 1250.50,
    "currency": "BRL"
  }
}`}
                    id="balance-response"
                    language="json"
                  />

                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Campos da Resposta</h4>
                    {[
                      { name: "balance", desc: "Saldo total da conta" },
                      { name: "pending", desc: "Valor em transacoes pendentes" },
                      { name: "available", desc: "Saldo disponivel para saque" },
                    ].map((field) => (
                      <div key={field.name} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl">
                        <code className="text-primary text-sm font-mono">{field.name}</code>
                        <span className="text-sm text-muted-foreground">{field.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cobrancas */}
            {activeSection === "charges" && (
              <motion.div
                key="charges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Cobrancas PIX</h1>
                  <p className="text-lg text-muted-foreground">
                    Crie cobrancas PIX com QR Code dinamico e codigo copia e cola.
                  </p>
                </div>

                {/* Criar Cobranca */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MethodBadge method="POST" />
                    <code className="text-foreground font-mono text-lg">/api/pix/create</code>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-4">Criar Cobranca</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Parametros</h4>
                    <div className="space-y-2">
                      {[
                        { name: "amount", type: "number", required: true, desc: "Valor da cobranca em reais (ex: 100.00)" },
                        { name: "description", type: "string", required: false, desc: "Descricao da cobranca" },
                        { name: "expiration", type: "number", required: false, desc: "Tempo de expiracao em minutos (padrao: 30)" },
                        { name: "external_id", type: "string", required: false, desc: "ID externo para sua referencia" },
                      ].map((param) => (
                        <div key={param.name} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-xl">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <code className="text-primary text-sm font-mono">{param.name}</code>
                            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{param.type}</span>
                            {param.required && (
                              <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">obrigatorio</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{param.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground mb-3">Exemplo</h4>
                  <CodeBlock
                    code={`curl -X POST "${baseUrl}/api/pix/create" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 150.00,
    "description": "Pedido #12345",
    "expiration": 60
  }'`}
                    id="charge-create"
                    language="bash"
                  />

                  <h4 className="text-sm font-semibold text-foreground mt-6 mb-3">Resposta</h4>
                  <CodeBlock
                    code={`{
  "success": true,
  "data": {
    "id": "chr_abc123def456",
    "amount": 150.00,
    "description": "Pedido #12345",
    "status": "active",
    "qr_code_base64": "data:image/png;base64,iVBORw0KGgo...",
    "copy_paste": "00020126580014br.gov.bcb.pix...",
    "expiration": "2024-01-15T11:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  }
}`}
                    id="charge-response"
                    language="json"
                  />
                </div>

                {/* Consultar Cobranca */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MethodBadge method="GET" />
                    <code className="text-foreground font-mono text-lg">/api/pix/status?id=:id</code>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-4">Consultar Cobranca</h3>
                  <p className="text-muted-foreground mb-4">
                    Consulte o status e detalhes de uma cobranca pelo ID.
                  </p>

                  <h4 className="text-sm font-semibold text-foreground mb-3">Status Possiveis</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { status: "active", color: "text-blue-400", desc: "Aguardando pagamento" },
                      { status: "paid", color: "text-green-400", desc: "Pagamento confirmado" },
                      { status: "expired", color: "text-yellow-400", desc: "Cobranca expirada" },
                      { status: "cancelled", color: "text-red-400", desc: "Cobranca cancelada" },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                        <code className={`text-sm font-mono ${item.color}`}>{item.status}</code>
                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Listar Cobrancas */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MethodBadge method="GET" />
                    <code className="text-foreground font-mono text-lg">/api/transactions</code>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-4">Listar Cobrancas</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Query Parameters</h4>
                    <div className="space-y-2">
                      {[
                        { name: "status", desc: "Filtrar por status (active, paid, expired, cancelled)" },
                        { name: "limit", desc: "Limite de resultados (padrao: 20, max: 100)" },
                        { name: "offset", desc: "Offset para paginacao" },
                      ].map((param) => (
                        <div key={param.name} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl">
                          <code className="text-primary text-sm font-mono">{param.name}</code>
                          <span className="text-sm text-muted-foreground">{param.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transferencias */}
            {activeSection === "transfers" && (
              <motion.div
                key="transfers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Transferencias PIX</h1>
                  <p className="text-lg text-muted-foreground">
                    Envie transferencias PIX para qualquer chave.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MethodBadge method="POST" />
                    <code className="text-foreground font-mono text-lg">/api/withdrawals/create</code>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-4">Enviar PIX</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Parametros</h4>
                    <div className="space-y-2">
                      {[
                        { name: "amount", type: "number", required: true, desc: "Valor da transferencia em reais" },
                        { name: "pix_key", type: "string", required: true, desc: "Chave PIX de destino" },
                        { name: "pix_key_type", type: "string", required: true, desc: "cpf, cnpj, email, phone ou random" },
                        { name: "description", type: "string", required: false, desc: "Descricao da transferencia" },
                      ].map((param) => (
                        <div key={param.name} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-xl">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <code className="text-primary text-sm font-mono">{param.name}</code>
                            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{param.type}</span>
                            {param.required && (
                              <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">obrigatorio</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{param.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground mb-3">Exemplo</h4>
                  <CodeBlock
                    code={`curl -X POST "${baseUrl}/v1/pix/transfer" \\
  -H "Authorization: Bearer lp_sua_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "pix_key": "email@exemplo.com",
    "pix_key_type": "email",
    "description": "Pagamento fornecedor"
  }'`}
                    id="transfer-create"
                    language="bash"
                  />

                  <h4 className="text-sm font-semibold text-foreground mt-6 mb-3">Resposta</h4>
                  <CodeBlock
                    code={`{
  "success": true,
  "data": {
    "id": "txn_xyz789abc123",
    "amount": 100.00,
    "fee": 1.75,
    "net_amount": 98.25,
    "status": "completed",
    "pix_key": "email@exemplo.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}`}
                    id="transfer-response"
                    language="json"
                  />

                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-sm text-yellow-400">
                      <strong>Nota sobre taxas:</strong> A taxa e calculada automaticamente com base na rota utilizada.
                      Rota White: 0% + R$1,50 fixo | Rota Black: 4% + R$0,00 fixo
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Webhooks */}
            {activeSection === "webhooks" && (
              <motion.div
                key="webhooks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Webhooks</h1>
                  <p className="text-lg text-muted-foreground">
                    Receba notificacoes em tempo real sobre eventos da sua conta.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Configurando Webhooks</h2>
                  <p className="text-muted-foreground mb-4">
                    Configure a URL do seu webhook no{" "}
                    <Link href="/dashboard/webhooks" className="text-primary hover:underline">
                      painel de controle
                    </Link>
                    . Enviaremos uma requisicao POST sempre que um evento ocorrer.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Eventos Disponiveis</h2>
                  <div className="space-y-2">
                    {[
                      { event: "charge.created", desc: "Nova cobranca criada" },
                      { event: "charge.paid", desc: "Cobranca foi paga" },
                      { event: "charge.expired", desc: "Cobranca expirou" },
                      { event: "charge.cancelled", desc: "Cobranca foi cancelada" },
                      { event: "transfer.completed", desc: "Transferencia concluida" },
                      { event: "transfer.failed", desc: "Transferencia falhou" },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl">
                        <code className="text-primary text-sm font-mono">{item.event}</code>
                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Estrutura do Payload</h2>
                  <CodeBlock
                    code={`{
  "event": "charge.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "chr_abc123",
    "amount": 100.00,
    "status": "paid",
    "payer_name": "Joao Silva",
    "payer_document": "***.***.***-**",
    "paid_at": "2024-01-15T10:30:00Z",
    "external_id": "seu_id_externo"
  },
  "signature": "sha256=a1b2c3d4e5..."
}`}
                    id="webhook-payload"
                    language="json"
                  />
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Verificacao de Assinatura</h2>
                  <p className="text-muted-foreground mb-4">
                    Valide a assinatura HMAC-SHA256 do header <code className="text-primary">X-Webhook-Signature</code> usando sua API Key.
                  </p>
                  <CodeBlock
                    code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, apiKey) {
  const expected = crypto
    .createHmac('sha256', apiKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === 'sha256=' + expected;
}

// Exemplo de uso no Express
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  if (!verifyWebhook(req.body, signature, 'lp_sua_api_key')) {
    return res.status(401).json({ error: 'Assinatura invalida' });
  }
  
  // Processar o evento
  const { event, data } = req.body;
  
  switch (event) {
    case 'charge.paid':
      // Liberar produto/servico
      break;
    case 'transfer.completed':
      // Atualizar status interno
      break;
  }
  
  res.json({ received: true });
});`}
                    id="webhook-verify"
                    language="javascript"
                  />
                </div>
              </motion.div>
            )}

            {/* Erros */}
            {activeSection === "errors" && (
              <motion.div
                key="errors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Codigos de Erro</h1>
                  <p className="text-lg text-muted-foreground">
                    Lista de codigos de erro HTTP e como trata-los.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Erros HTTP</h2>
                  <div className="space-y-3">
                    {[
                      { code: "400", title: "Bad Request", desc: "Parametros invalidos na requisicao" },
                      { code: "401", title: "Unauthorized", desc: "API Key invalida ou ausente" },
                      { code: "403", title: "Forbidden", desc: "Sem permissao para acessar o recurso" },
                      { code: "404", title: "Not Found", desc: "Recurso nao encontrado" },
                      { code: "422", title: "Unprocessable Entity", desc: "Dados validos mas nao processaveis" },
                      { code: "429", title: "Too Many Requests", desc: "Limite de requisicoes excedido" },
                      { code: "500", title: "Internal Server Error", desc: "Erro interno do servidor" },
                    ].map((error) => (
                      <div key={error.code} className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          error.code.startsWith('4') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {error.code}
                        </span>
                        <div>
                          <p className="text-foreground font-medium">{error.title}</p>
                          <p className="text-sm text-muted-foreground">{error.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Formato de Erro</h2>
                  <CodeBlock
                    code={`{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "O valor deve ser maior que zero",
    "field": "amount"
  }
}`}
                    id="error-format"
                    language="json"
                  />
                </div>
              </motion.div>
            )}

            {/* Prompts para IA */}
            {activeSection === "ai-prompts" && (
              <motion.div
                key="ai-prompts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-foreground">Prompts para IA</h1>
                      <p className="text-muted-foreground">Integre nossa API usando sua IA favorita</p>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Copie o prompt abaixo e cole na sua IA (ChatGPT, Claude, Copilot, etc.) para integrar
                    a API Hyperion Pay automaticamente ao seu projeto.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Como usar</h2>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Escolha o prompt adequado para sua necessidade</li>
                    <li>Clique no botao &quot;Copiar&quot; para copiar o prompt</li>
                    <li>Cole na sua IA favorita (ChatGPT, Claude, etc.)</li>
                    <li>Substitua <code className="text-primary">SUA_API_KEY</code> pela sua chave real</li>
                    <li>A IA vai gerar o codigo de integracao para voce!</li>
                  </ol>
                </div>

                {/* Prompt Completo */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Prompt Completo de Integracao</h2>
                        <p className="text-sm text-muted-foreground">Para integrar toda a API ao seu projeto</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => copyCode(fullIntegrationPrompt, "full-prompt")}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {copied === "full-prompt" ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Prompt
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-[#0d0d0d] border border-border rounded-xl p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                      {fullIntegrationPrompt}
                    </pre>
                  </div>
                </div>

                {/* Prompt para Criar Cobranca */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Prompt para Cobrancas PIX</h2>
                        <p className="text-sm text-muted-foreground">Criar QR Code e receber pagamentos</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => copyCode(chargePrompt, "charge-prompt")}
                      variant="outline"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      {copied === "charge-prompt" ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-[#0d0d0d] border border-border rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                      {chargePrompt}
                    </pre>
                  </div>
                </div>

                {/* Prompt para Webhooks */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Prompt para Webhooks</h2>
                        <p className="text-sm text-muted-foreground">Receber notificacoes de pagamento</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => copyCode(webhookPrompt, "webhook-prompt")}
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      {copied === "webhook-prompt" ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-[#0d0d0d] border border-border rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                      {webhookPrompt}
                    </pre>
                  </div>
                </div>

                {/* Prompt para Transferencias */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Prompt para Transferencias</h2>
                        <p className="text-sm text-muted-foreground">Enviar PIX automaticamente</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => copyCode(transferPrompt, "transfer-prompt")}
                      variant="outline"
                      className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                    >
                      {copied === "transfer-prompt" ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-[#0d0d0d] border border-border rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                      {transferPrompt}
                    </pre>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Dicas</h2>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Sempre substitua <code className="text-primary">SUA_API_KEY</code> pela sua chave real antes de enviar</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Informe a linguagem/framework do seu projeto para a IA gerar codigo compativel</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Peca para a IA adicionar tratamento de erros e validacoes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Use o prompt completo se quiser uma integracao full, ou os especificos para funcionalidades isoladas</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Prompts para IA
const fullIntegrationPrompt = `Preciso integrar a API de pagamentos PIX da Hyperion Pay ao meu projeto.

## Informacoes da API

**URL Base:** https://api.hyperionpay.com.br
**Autenticacao:** Bearer Token no header Authorization
**Minha API Key:** SUA_API_KEY (substitua pela sua chave real)

## Endpoints Disponiveis

### 1. Consultar Saldo
- GET /v1/balance
- Retorna: { balance, pending, available }

### 2. Criar Cobranca PIX (QR Code)
- POST /v1/pix/charge
- Body: { amount: number, description?: string, expiration?: number, external_id?: string }
- Retorna: { id, qr_code_base64, copy_paste, status, expiration }

### 3. Consultar Cobranca
- GET /v1/pix/charge/:id
- Retorna detalhes da cobranca incluindo status (active, paid, expired, cancelled)

### 4. Listar Cobrancas
- GET /v1/pix/charge?status=paid&limit=20
- Retorna array de cobrancas

### 5. Enviar PIX (Transferencia)
- POST /v1/pix/transfer
- Body: { amount: number, pix_key: string, pix_key_type: "cpf"|"cnpj"|"email"|"phone"|"random", description?: string }
- Retorna: { id, amount, fee, status }

### 6. Configurar Webhook
- POST /v1/webhook
- Body: { url: string, events: string[] }
- Eventos: charge.paid, charge.expired, transfer.completed, transfer.failed

## Formato de Resposta
Todas as respostas seguem: { success: boolean, data?: object, error?: { code, message } }

## Taxas
- Rota White (MisticPay): 0% + R$1,50 fixo | Saque: R$2,00
- Rota Black (Medusa): 4% + R$0,00 fixo | Saque: R$5,00

Por favor, crie uma integracao completa para meu projeto com:
1. Funcao para criar cobrancas PIX com QR Code
2. Funcao para consultar status de cobranca
3. Funcao para enviar transferencias PIX
4. Endpoint de webhook para receber notificacoes
5. Tratamento de erros adequado
6. Tipagem TypeScript (se aplicavel)`;

const chargePrompt = `Preciso criar cobrancas PIX com QR Code usando a API Hyperion Pay.

**URL Base:** https://api.hyperionpay.com.br
**Minha API Key:** SUA_API_KEY

**Endpoint:** POST /v1/pix/charge
**Headers:** 
- Authorization: Bearer SUA_API_KEY
- Content-Type: application/json

**Body:**
{
  "amount": 100.00,        // valor em reais (obrigatorio)
  "description": "Pedido #123",  // descricao (opcional)
  "expiration": 30,        // minutos ate expirar (opcional, padrao 30)
  "external_id": "meu_id"  // seu ID interno (opcional)
}

**Resposta de sucesso:**
{
  "success": true,
  "data": {
    "id": "chr_abc123",
    "amount": 100.00,
    "status": "active",
    "qr_code_base64": "data:image/png;base64,...",
    "copy_paste": "00020126...",
    "expiration": "2024-01-15T11:00:00Z"
  }
}

Crie uma funcao que:
1. Receba valor e descricao
2. Faca a requisicao para criar a cobranca
3. Retorne o QR Code (base64) e codigo copia e cola
4. Trate erros adequadamente`;

const webhookPrompt = `Preciso configurar um webhook para receber notificacoes de pagamento da Hyperion Pay.

**URL Base:** https://api.hyperionpay.com.br
**Minha API Key:** SUA_API_KEY

**Eventos disponiveis:**
- charge.paid - Cobranca foi paga
- charge.expired - Cobranca expirou
- charge.cancelled - Cobranca cancelada
- transfer.completed - Transferencia concluida
- transfer.failed - Transferencia falhou

**Payload recebido no webhook:**
{
  "event": "charge.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "chr_abc123",
    "amount": 100.00,
    "status": "paid",
    "payer_name": "Joao Silva",
    "external_id": "meu_id_interno",
    "paid_at": "2024-01-15T10:30:00Z"
  },
  "signature": "sha256=..."
}

**Verificacao de assinatura:**
A assinatura HMAC-SHA256 esta no header X-Webhook-Signature.
Calcule: sha256=HMAC-SHA256(payload_json, api_key)

Crie um endpoint webhook que:
1. Receba as notificacoes POST
2. Verifique a assinatura para seguranca
3. Processe os eventos (charge.paid, etc)
4. Retorne 200 OK para confirmar recebimento`;

const transferPrompt = `Preciso enviar transferencias PIX automaticamente usando a API Hyperion Pay.

**URL Base:** https://api.hyperionpay.com.br
**Minha API Key:** SUA_API_KEY

**Endpoint:** POST /v1/pix/transfer
**Headers:**
- Authorization: Bearer SUA_API_KEY  
- Content-Type: application/json

**Body:**
{
  "amount": 100.00,           // valor em reais (obrigatorio)
  "pix_key": "email@ex.com",  // chave PIX destino (obrigatorio)
  "pix_key_type": "email",    // tipo: cpf, cnpj, email, phone, random (obrigatorio)
  "description": "Pagamento"  // descricao (opcional)
}

**Resposta:**
{
  "success": true,
  "data": {
    "id": "txn_xyz789",
    "amount": 100.00,
    "fee": 1.75,
    "net_amount": 98.25,
    "status": "completed",
    "pix_key": "email@ex.com"
  }
}

**Taxas:**
- Rota White (MisticPay): 0% + R$1,50 fixo | Saque: R$2,00
- Rota Black (Medusa): 4% + R$0,00 fixo | Saque: R$5,00

Crie uma funcao que:
1. Receba valor, chave PIX e tipo da chave
2. Valide os parametros antes de enviar
3. Faca a transferencia
4. Retorne o resultado com a taxa cobrada
5. Trate erros (saldo insuficiente, chave invalida, etc)`;
