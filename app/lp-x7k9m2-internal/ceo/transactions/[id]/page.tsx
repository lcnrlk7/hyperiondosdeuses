"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Circle,
  Clock,
  User,
  CreditCard,
  Loader2,
  XCircle,
  RotateCcw,
  Ban,
  Webhook,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { getStatusMeta, getMethodLabel, formatBRL } from "@/lib/transaction-status";

interface TxDetail {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount?: number;
  status: string;
  pix_key?: string;
  pix_key_type?: string;
  external_id?: string;
  acquirer_transaction_id?: string;
  description?: string;
  payer_name?: string;
  payer_document?: string;
  payer_email?: string;
  payer_phone?: string;
  created_at: string;
  paid_at?: string;
  updated_at?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  user_name?: string;
  user_email?: string;
  user_document?: string;
  user_phone?: string;
  user_balance?: number;
  is_demo?: boolean;
}

interface TxEvent {
  id: string;
  action: string;
  description?: string;
  created_at: string;
}

interface WebhookLog {
  id: string;
  url: string;
  response_status?: number;
  success?: boolean;
  attempts?: number;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  transaction_manual_confirm: "Confirmação manual",
  transaction_cancel: "Cancelamento",
  transaction_refund: "Estorno",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  CREATE_TRANSACTION: "Transação criada",
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tx, setTx] = useState<TxDetail | null>(null);
  const [events, setEvents] = useState<TxEvent[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      if (data.transaction) {
        setTx(data.transaction);
        setEvents(data.events || []);
        setWebhooks(data.webhooks || []);
      }
    } catch (e) {
      console.error("[v0] erro ao carregar detalhe:", e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDateTime = (d?: string) =>
    d ? new Date(d).toLocaleString("pt-BR") : "-";

  async function confirmTx() {
    if (!confirm("Confirmar esta transação? O saldo líquido será creditado ao usuário.")) return;
    setActing(true);
    try {
      const res = await fetch("/api/admin/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Confirmada! Novo saldo do usuário: ${formatBRL(data.user.newBalance)}`);
        load();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } finally {
      setActing(false);
    }
  }

  async function runAction(action: "cancel" | "refund") {
    const verb = action === "cancel" ? "cancelar" : "estornar";
    const reason = prompt(`Motivo para ${verb} (opcional):`) ?? "";
    if (!confirm(`Tem certeza que deseja ${verb} esta transação?`)) return;
    setActing(true);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === "cancel" ? "Transação cancelada." : "Transação estornada.");
        load();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } finally {
      setActing(false);
    }
  }

  function copyId() {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-secondary" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-secondary lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (notFound || !tx) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-lg font-semibold text-foreground">Transação não encontrada</p>
        <button
          onClick={() => router.push("/lp-x7k9m2-internal/ceo/transactions")}
          className="rounded-xl bg-secondary px-4 py-2 text-sm text-foreground hover:bg-secondary/70"
        >
          Voltar para Transações
        </button>
      </div>
    );
  }

  const statusMeta = getStatusMeta(tx.status);
  const incoming = tx.type === "pix_in" || tx.type === "deposit" || tx.type === "transfer_in";
  const net = tx.net_amount != null ? Number(tx.net_amount) : Number(tx.amount) - Number(tx.fee || 0);

  // Timeline derivada do estado real da transacao
  const isApproved = statusMeta.group === "approved";
  const isRefunded = statusMeta.group === "refunded";
  const isCancelled = statusMeta.group === "cancelled";
  const isRefused = statusMeta.group === "refused";

  const timeline = [
    { label: "Transação criada", at: tx.created_at, done: true },
    {
      label: incoming ? "PIX gerado" : "Solicitação registrada",
      at: tx.created_at,
      done: true,
    },
    {
      label: incoming ? "Pagamento recebido" : "Processamento",
      at: tx.paid_at,
      done: isApproved || isRefunded,
    },
    {
      label: incoming ? "Saldo disponibilizado" : "Concluída",
      at: tx.paid_at,
      done: isApproved,
    },
  ];

  if (isRefunded) timeline.push({ label: "Estornada", at: tx.updated_at, done: true });
  if (isCancelled) timeline.push({ label: "Cancelada", at: tx.updated_at, done: true });
  if (isRefused) timeline.push({ label: "Recusada / Expirada", at: tx.updated_at, done: true });

  const canConfirm = statusMeta.group === "pending";
  const canCancel = statusMeta.group === "pending";
  const canRefund = statusMeta.group === "approved";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.push("/lp-x7k9m2-internal/ceo/transactions")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Detalhe da Transação</h1>
            {tx.is_demo && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-400">
                Demo
              </span>
            )}
          </div>
          <button
            onClick={copyId}
            className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="font-mono">{id}</span>
            <Copy className="h-3 w-3" />
            {copied && <span className="text-green-400">copiado</span>}
          </button>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${statusMeta.className}`}>
          <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
          {statusMeta.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Resumo do valor */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${incoming ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {incoming ? (
                    <ArrowDownRight className="h-6 w-6 text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-6 w-6 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{getMethodLabel(tx.type)}</p>
                  <p className={`text-2xl font-bold ${incoming ? "text-green-400" : "text-red-400"}`}>
                    {incoming ? "+" : "-"}{formatBRL(tx.amount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Valor bruto" value={formatBRL(tx.amount)} />
              <Field label="Taxa" value={formatBRL(tx.fee || 0)} />
              <Field label="Valor líquido" value={formatBRL(net)} highlight />
              <Field label="Método" value={getMethodLabel(tx.type)} />
              <Field label="ID externo" value={tx.external_id || "-"} mono />
              <Field label="ID adquirente" value={tx.acquirer_transaction_id || "-"} mono />
            </div>
          </div>

          {/* Dados do PIX / pagamento */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Dados do pagamento
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Chave PIX" value={tx.pix_key || "-"} mono />
              <Field label="Tipo de chave" value={tx.pix_key_type || "-"} />
              <Field label="Pagador" value={tx.payer_name || "-"} />
              <Field label="Documento pagador" value={tx.payer_document || "-"} />
              <Field label="Criada em" value={formatDateTime(tx.created_at)} />
              <Field label="Paga em" value={formatDateTime(tx.paid_at)} />
              {tx.description && <Field label="Descrição" value={tx.description} className="sm:col-span-2" />}
            </div>
          </div>

          {/* Origem / UTM */}
          {(tx.utm_source || tx.utm_campaign || tx.utm_medium) && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Origem do tráfego</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Fonte" value={tx.utm_source || "-"} />
                <Field label="Campanha" value={tx.utm_campaign || "-"} />
                <Field label="Mídia" value={tx.utm_medium || "-"} />
              </div>
            </div>
          )}

          {/* Webhooks */}
          {webhooks.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Webhook className="h-4 w-4 text-muted-foreground" />
                Webhooks enviados
              </h2>
              <div className="space-y-2">
                {webhooks.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                    <span className="truncate font-mono text-muted-foreground">{w.url}</span>
                    <span className={`ml-2 shrink-0 font-medium ${w.success ? "text-green-400" : "text-red-400"}`}>
                      {w.response_status || (w.success ? "OK" : "Falha")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Ações */}
          {(canConfirm || canCancel || canRefund) && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Ações</h2>
              <div className="space-y-2">
                {canConfirm && (
                  <button
                    onClick={confirmTx}
                    disabled={acting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/15 px-4 py-2.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/25 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirmar pagamento
                  </button>
                )}
                {canRefund && (
                  <button
                    onClick={() => runAction("refund")}
                    disabled={acting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500/15 px-4 py-2.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/25 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Estornar transação
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => runAction("cancel")}
                    disabled={acting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                    Cancelar transação
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cliente */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              Cliente
            </h2>
            <div className="space-y-3">
              <Field label="Nome" value={tx.user_name || "-"} />
              <Field label="E-mail" value={tx.user_email || "-"} />
              <Field label="Documento" value={tx.user_document || "-"} />
              <Field label="Telefone" value={tx.user_phone || "-"} />
              <Field label="Saldo atual" value={formatBRL(tx.user_balance || 0)} highlight />
            </div>
            <button
              onClick={() => router.push(`/lp-x7k9m2-internal/ceo/users?q=${encodeURIComponent(tx.user_email || "")}`)}
              className="mt-4 w-full rounded-xl bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/70"
            >
              Ver perfil do cliente
            </button>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Linha do tempo
            </h2>
            <div className="relative space-y-4 pl-2">
              {timeline.map((step, i) => (
                <div key={i} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                    {i < timeline.length - 1 && (
                      <div className={`mt-1 h-6 w-0.5 ${step.done ? "bg-green-400/40" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className={`text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {step.label}
                    </p>
                    {step.done && step.at && (
                      <p className="text-xs text-muted-foreground">{formatDateTime(step.at)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Eventos de auditoria reais */}
            {events.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Registros de auditoria
                </p>
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="text-xs">
                      <p className="font-medium text-foreground">
                        {actionLabels[ev.action] || ev.action}
                      </p>
                      {ev.description && <p className="text-muted-foreground">{ev.description}</p>}
                      <p className="text-muted-foreground/70">{formatDateTime(ev.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
  mono,
  className = "",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 break-words text-sm ${highlight ? "font-semibold text-primary" : "text-foreground"} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
