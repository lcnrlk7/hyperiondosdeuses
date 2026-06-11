"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  Loader2,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SendResult {
  success: boolean;
  message?: string;
  sent: number;
  failed: number;
  total?: number;
  test?: boolean;
}

const DEFAULT_BODY = `<p style="margin:0 0 14px;">Temos uma novidade exclusiva para voce: as <strong style="color:#ffffff;">taxas mais baixas do mercado</strong> ja estao disponiveis na <strong style="color:#22c55e;">Rota Black</strong>.</p>
<p style="margin:0 0 14px;">Com a Rota Black voce passa a receber pagamentos com taxas de <strong style="color:#22c55e;">ate 3%</strong> — perfeito para quem movimenta alto volume e quer aumentar a margem de lucro.</p>
<p style="margin:0;">Para liberar essa condicao na sua conta, <strong style="color:#ffffff;">abra um ticket no nosso site</strong> ou <strong style="color:#ffffff;">chame no WhatsApp</strong>. Nossa equipe encaminhara para o setor financeiro, que vai ajustar a sua taxa.</p>`;

export default function EmailCampaignPage() {
  const [totalRecipients, setTotalRecipients] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [result, setResult] = useState<SendResult | null>(null);
  const [testEmail, setTestEmail] = useState("");

  const [form, setForm] = useState({
    subject: "Taxas de ate 3% liberadas na Rota Black - Hyperion Pay",
    heading: "Taxas baixas disponiveis na Rota Black",
    bodyHtml: DEFAULT_BODY,
    highlight: "Ate 3%",
    highlightLabel: "Taxa exclusiva Rota Black",
    ctaText: "Abrir ticket",
    ctaUrl: "https://app.hyperionpay.com.br/dashboard/support",
    secondaryText: "Falar no WhatsApp",
    secondaryUrl: "https://wa.me/5534999353187",
  });

  useEffect(() => {
    fetch("/api/admin/email-campaign")
      .then((r) => r.json())
      .then((d) => setTotalRecipients(d.totalRecipients ?? 0))
      .catch(() => setTotalRecipients(0));
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSendTest() {
    if (!testEmail) {
      alert("Informe um email para o teste");
      return;
    }
    setIsSendingTest(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, testEmail }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Erro ao enviar email de teste");
    } finally {
      setIsSendingTest(false);
    }
  }

  async function handleSend() {
    if (
      !confirm(
        `Confirma o disparo desta campanha para todos os ${totalRecipients ?? ""} emails cadastrados?`
      )
    ) {
      return;
    }
    setIsSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Erro ao disparar a campanha");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Disparo de E-mail
          </h1>
          <p className="text-muted-foreground">
            Envie um comunicado para todos os e-mails cadastrados
          </p>
        </div>
        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">
              {totalRecipients === null ? "..." : totalRecipients}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Destinatarios</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Conteudo</h2>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Assunto do e-mail
            </label>
            <Input
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              className="bg-secondary"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Titulo (dentro do e-mail)
            </label>
            <Input
              value={form.heading}
              onChange={(e) => update("heading", e.target.value)}
              className="bg-secondary"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Mensagem (aceita HTML)
            </label>
            <textarea
              value={form.bodyHtml}
              onChange={(e) => update("bodyHtml", e.target.value)}
              rows={7}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Destaque
              </label>
              <Input
                value={form.highlight}
                onChange={(e) => update("highlight", e.target.value)}
                placeholder="Ate 3%"
                className="bg-secondary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Label do destaque
              </label>
              <Input
                value={form.highlightLabel}
                onChange={(e) => update("highlightLabel", e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Botao principal
              </label>
              <Input
                value={form.ctaText}
                onChange={(e) => update("ctaText", e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Link do botao
              </label>
              <Input
                value={form.ctaUrl}
                onChange={(e) => update("ctaUrl", e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Botao secundario
              </label>
              <Input
                value={form.secondaryText}
                onChange={(e) => update("secondaryText", e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Link secundario (WhatsApp)
              </label>
              <Input
                value={form.secondaryUrl}
                onChange={(e) => update("secondaryUrl", e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>

          {/* Teste */}
          <div className="border-t border-border pt-4">
            <label className="text-sm text-muted-foreground mb-1 block">
              Enviar teste para
            </label>
            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-secondary"
              />
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={isSendingTest}
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FlaskConical className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={isSending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Disparar para todos ({totalRecipients ?? 0})
          </Button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 flex items-start gap-3 ${
                result.success
                  ? "bg-green-400/10 border border-green-400/20"
                  : "bg-red-400/10 border border-red-400/20"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="text-white font-medium">
                  {result.test
                    ? result.success
                      ? "E-mail de teste enviado!"
                      : "Falha ao enviar teste"
                    : result.message || "Disparo concluido"}
                </p>
                <p className="text-muted-foreground mt-1">
                  Enviados: {result.sent} &middot; Falhas: {result.failed}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Preview */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Pre-visualizacao</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((s) => !s)}
            >
              {showPreview ? "Ocultar" : "Mostrar"}
            </Button>
          </div>

          {showPreview && (
            <div className="rounded-2xl overflow-hidden border border-border bg-[#030014] p-6">
              <div className="max-w-[460px] mx-auto">
                <p className="text-center text-lg font-extrabold tracking-wide mb-6">
                  <span className="text-white">HYPERION</span>
                  <span className="text-primary"> PAY</span>
                </p>
                <div className="rounded-2xl border border-[#1a1a3e] bg-[#0a0a1f] overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-6 text-center">
                    <h3 className="text-white text-xl font-bold leading-tight mb-4 text-balance">
                      {form.heading}
                    </h3>
                    <div
                      className="text-left text-sm leading-relaxed text-[#e0e0ff] bg-[#0f0f2e] border border-[#252560] rounded-xl p-4"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: form.bodyHtml }}
                    />
                    {form.highlight && (
                      <div className="mt-4 bg-[#0f0f2e] border-2 border-green-500 rounded-2xl p-5">
                        {form.highlightLabel && (
                          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                            {form.highlightLabel}
                          </p>
                        )}
                        <span className="text-4xl font-extrabold text-green-500">
                          {form.highlight}
                        </span>
                      </div>
                    )}
                    {form.ctaText && (
                      <div className="mt-6">
                        <span className="inline-block bg-gradient-to-r from-primary to-accent text-white text-sm font-bold px-10 py-3.5 rounded-xl">
                          {form.ctaText} &rarr;
                        </span>
                      </div>
                    )}
                    {form.secondaryText && (
                      <div className="mt-3">
                        <span className="inline-block bg-[#0f0f2e] border border-[#252560] text-[#e0e0ff] text-sm font-semibold px-8 py-3 rounded-xl">
                          {form.secondaryText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-center text-[10px] text-[#6b6b9e] mt-5 italic">
                  Construindo legado. Gerando liberdade.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
