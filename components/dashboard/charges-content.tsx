"use client";

import { useState } from "react";
import { ReceiptText, Plus, Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface Charge {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  payer_name: string | null;
  copy_paste: string | null;
  created_at: string;
  paid_at: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Paga", cls: "bg-success-bg text-success" },
    completed: { label: "Paga", cls: "bg-success-bg text-success" },
    pending: { label: "Pendente", cls: "bg-warning-bg text-warning-foreground" },
    expired: { label: "Expirada", cls: "bg-danger-bg text-danger-foreground" },
    cancelled: { label: "Cancelada", cls: "bg-danger-bg text-danger-foreground" },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${s.cls}`}>{s.label}</span>;
}

export function ChargesContent({ charges }: { charges: Charge[] }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ copyPaste: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const summary = [
    { label: "Cobrancas", value: new Intl.NumberFormat("pt-BR").format(charges.length) },
    {
      label: "Pagas",
      value: new Intl.NumberFormat("pt-BR").format(
        charges.filter((c) => c.status === "paid" || c.status === "completed").length
      ),
    },
    {
      label: "Total recebido",
      value: formatCurrency(
        charges
          .filter((c) => c.status === "paid" || c.status === "completed")
          .reduce((a, c) => a + Number(c.amount || 0), 0)
      ),
    },
  ];

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const handleCreate = async () => {
    const value = parseFloat(amount);
    if (!amount || value <= 0) {
      setError("Informe um valor valido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, description: description || "Cobranca PIX - Hyperion Pay" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao gerar cobranca");
        return;
      }
      setResult({ copyPaste: data.copyPaste, amount: value });
    } catch {
      setError("Falha na conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobrancas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gere cobrancas PIX e acompanhe os pagamentos</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova cobranca
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-primary mt-2">{s.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <ReceiptText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Historico de cobrancas</h2>
        {charges.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma cobranca gerada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Descricao</th>
                  <th className="pb-3 font-medium">Pagador</th>
                  <th className="pb-3 font-medium">Valor</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 text-muted-foreground font-mono text-xs">#{c.id.slice(0, 6)}</td>
                    <td className="py-3 text-foreground">{c.description || "Cobranca PIX"}</td>
                    <td className="py-3 text-foreground">{c.payer_name || "—"}</td>
                    <td className="py-3 font-medium text-foreground">{formatCurrency(Number(c.amount || 0))}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-muted-foreground text-xs">{formatDateTime(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New charge dialog */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="!bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nova cobranca PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {!result ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valor da cobranca</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-secondary border-border"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Descricao (opcional)</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Servico de consultoria"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={loading || !amount}
                  className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar cobranca"
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(result.copyPaste)}`}
                    alt="QR Code PIX"
                    width={180}
                    height={180}
                    className="mx-auto"
                  />
                </div>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(result.amount)}</p>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                  <code className="flex-1 text-xs text-muted-foreground break-all line-clamp-2 text-left">
                    {result.copyPaste}
                  </code>
                  <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => copy(result.copyPaste)}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                    window.location.reload();
                  }}
                >
                  Concluir
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
