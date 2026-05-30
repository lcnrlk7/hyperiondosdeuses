"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  FileCode,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


interface ApiContentProps {
  profile: {
    api_key: string;
    webhook_url: string | null;
  } | null;
  userId: string;
}

export function ApiContent({ profile, userId }: ApiContentProps) {
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const regenerateKey = async () => {
    setLoading(true);
    try {
      await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      router.refresh();
    } catch (error) {
      console.error('Error regenerating API key:', error);
    }
    setLoading(false);
  };

  const maskedKey = profile?.api_key
    ? profile.api_key.slice(0, 6) + "..." + profile.api_key.slice(-4)
    : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          API
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas credenciais e acesse a documentação
        </p>
      </div>

      {/* API Key Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Chave API
            </h2>
            <p className="text-sm text-muted-foreground">
              Use esta chave para autenticar suas requisições
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-secondary rounded-xl p-4 mb-4">
          <code className="flex-1 text-sm text-muted-foreground font-mono">
            {showKey ? profile?.api_key : maskedKey}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(profile?.api_key || "")}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={regenerateKey}
            disabled={loading}
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerar Chave
          </Button>
          <p className="text-xs text-muted-foreground">
            Atenção: ao regenerar, a chave atual será invalidada
          </p>
        </div>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Início Rápido
        </h2>

        <div className="space-y-4">
          <div className="bg-secondary rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Criar uma cobrança PIX:
            </p>
            <pre className="text-sm text-foreground font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST https://hyperionpay.com.br/api/pix/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${profile?.api_key || "SUA_API_KEY"}",
    "amount": 100.00,
    "description": "Pagamento de teste",
    "externalId": "pedido_123"
  }'`}
            </pre>
          </div>

          <div className="bg-secondary rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Resposta de exemplo:
            </p>
            <pre className="text-sm text-foreground font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`{
  "success": true,
  "transactionId": "uuid-transacao",
  "externalId": "pedido_123",
  "status": "pending",
  "amount": 100.00,
  "copyPaste": "00020126...",
  "qrCode": "00020126..."
}`}
            </pre>
          </div>
        </div>

        <Link href="/dashboard/integration">
          <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
            <FileCode className="w-4 h-4 mr-2" />
            Ver Documentacao Completa
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>

      {/* Endpoints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Endpoints Disponíveis
        </h2>

        <div className="space-y-3">
          {[
            { method: "POST", path: "/api/pix/create", desc: "Criar cobrança PIX" },
            { method: "GET", path: "/api/pix/status?id=:id", desc: "Consultar status do PIX" },
            { method: "GET", path: "/api/transactions", desc: "Listar transações" },
            { method: "GET", path: "/api/user/balance", desc: "Consultar saldo" },
            { method: "POST", path: "/api/webhooks/medusa", desc: "Webhook de confirmação" },
          ].map((endpoint) => (
            <div
              key={endpoint.path}
              className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl"
            >
              <span
                className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                  endpoint.method === "POST"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-blue-500/20 text-blue-500"
                }`}
              >
                {endpoint.method}
              </span>
              <code className="text-sm text-foreground font-mono flex-1">
                {endpoint.path}
              </code>
              <span className="text-sm text-muted-foreground">
                {endpoint.desc}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
