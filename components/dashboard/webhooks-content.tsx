"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Webhook,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export interface WebhookLog {
  id: string;
  url: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  success: boolean;
  created_at: string;
}

interface WebhooksContentProps {
  webhookUrl: string | null;
  webhookLogs: WebhookLog[];
  userId: string;
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
};

export function WebhooksContent({
  webhookUrl,
  webhookLogs,
  userId,
}: WebhooksContentProps) {
  const [url, setUrl] = useState(webhookUrl || "");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  const saveWebhookUrl = async () => {
    setLoading(true);
    try {
      await fetch('/api/user/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url || null }),
      });
      router.refresh();
    } catch (error) {
      console.error('Error saving webhook:', error);
    }
    setLoading(false);
  };

  const testWebhook = async () => {
    if (!url) return;
    setTesting(true);

    // Simulate webhook test
    await new Promise((r) => setTimeout(r, 2000));

    setTesting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Webhooks
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure notificações em tempo real para suas transações
        </p>
      </div>

      {/* Webhook URL Config */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Webhook className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              URL do Webhook
            </h2>
            <p className="text-sm text-muted-foreground">
              Receba notificações HTTP para cada evento
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://seu-site.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Button
            onClick={saveWebhookUrl}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={testWebhook}
            disabled={testing || !url}
          >
            {testing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Testar
          </Button>
        </div>
      </motion.div>

      {/* Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Eventos Disponíveis
        </h2>

        <div className="grid gap-3">
          {[
            {
              event: "charge.created",
              desc: "Quando uma nova cobrança PIX é criada",
              category: "PIX",
            },
            { 
              event: "charge.paid", 
              desc: "Quando uma cobrança PIX é paga com sucesso",
              category: "PIX",
            },
            {
              event: "charge.expired",
              desc: "Quando uma cobrança PIX expira sem pagamento",
              category: "PIX",
            },
            {
              event: "checkout.order_created",
              desc: "Quando um novo pedido é criado no checkout",
              category: "Checkout",
            },
            {
              event: "checkout.payment_pending",
              desc: "Quando o PIX do checkout é gerado e aguarda pagamento",
              category: "Checkout",
            },
            {
              event: "checkout.payment_confirmed",
              desc: "Quando o pagamento do checkout é confirmado",
              category: "Checkout",
            },
            {
              event: "checkout.payment_failed",
              desc: "Quando o pagamento do checkout falha ou expira",
              category: "Checkout",
            },
            {
              event: "transfer.completed",
              desc: "Quando uma transferência/saque é concluída",
              category: "Transferencias",
            },
            {
              event: "transfer.failed",
              desc: "Quando uma transferência/saque falha",
              category: "Transferencias",
            },
          ].map((item) => (
            <div
              key={item.event}
              className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm text-primary font-mono">
                    {item.event}
                  </code>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.category === "Checkout" 
                      ? "bg-indigo-500/20 text-indigo-500"
                      : item.category === "PIX"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-blue-500/20 text-blue-500"
                  }`}>
                    {item.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.desc}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Webhook Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Histórico de Webhooks
        </h2>

        {webhookLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum webhook enviado ainda
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Os webhooks aparecerão aqui quando forem disparados
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  {log.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-mono text-foreground truncate max-w-xs">
                      {log.url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    log.response_status && log.response_status < 400
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {log.response_status || "ERR"}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payload Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Exemplos de Payload
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs font-medium mr-2">PIX</span>
              charge.paid
            </p>
            <div className="bg-secondary rounded-xl p-4">
              <pre className="text-sm text-foreground font-mono overflow-x-auto">
{`{
  "event": "charge.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "chr_abc123",
    "amount": 100.00,
    "status": "paid",
    "payer_name": "João Silva",
    "payer_document": "***.***.***-**",
    "paid_at": "2024-01-15T10:30:00Z"
  }
}`}
              </pre>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-500 text-xs font-medium mr-2">Checkout</span>
              checkout.order_created
            </p>
            <div className="bg-secondary rounded-xl p-4">
              <pre className="text-sm text-foreground font-mono overflow-x-auto">
{`{
  "event": "checkout.order_created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "ord_xyz789",
    "checkout_id": "chk_abc123",
    "checkout_slug": "meu-produto",
    "customer": {
      "name": "Maria Santos",
      "email": "maria@email.com",
      "phone": "(11) 99999-9999",
      "cpf": "***.***.***-**"
    },
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Curso de Marketing",
        "quantity": 1,
        "unit_price": 297.00
      }
    ],
    "subtotal": 297.00,
    "discount": 0.00,
    "total": 297.00,
    "coupon_code": null,
    "status": "pending",
    "pix": {
      "qr_code": "00020126...",
      "copy_paste": "00020126..."
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}`}
              </pre>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-500 text-xs font-medium mr-2">Checkout</span>
              checkout.payment_confirmed
            </p>
            <div className="bg-secondary rounded-xl p-4">
              <pre className="text-sm text-foreground font-mono overflow-x-auto">
{`{
  "event": "checkout.payment_confirmed",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "order_id": "ord_xyz789",
    "checkout_id": "chk_abc123",
    "checkout_slug": "meu-produto",
    "customer": {
      "name": "Maria Santos",
      "email": "maria@email.com"
    },
    "total": 297.00,
    "status": "paid",
    "paid_at": "2024-01-15T10:35:00Z",
    "transaction_id": "txn_abc123"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
