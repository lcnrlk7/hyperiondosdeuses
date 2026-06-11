"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Send,
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  FlaskConical,
  LayoutTemplate,
  Search,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WHATSAPP_PRESETS, type WhatsappPreset } from "./presets";

interface SendResult {
  success: boolean;
  message?: string;
  error?: string;
  sent: number;
  failed: number;
  total?: number;
  test?: boolean;
  log?: { phone: string; name: string | null; ok: boolean }[];
}

const DEFAULT_MESSAGE = WHATSAPP_PRESETS[0].message;

// Opcoes de intervalo entre os envios (anti-spam). Valores em segundos.
const DELAY_PRESETS = [
  { label: "Rapido", min: 2, max: 5 },
  { label: "Seguro", min: 3, max: 8 },
  { label: "Cauteloso", min: 8, max: 15 },
  { label: "Lento", min: 20, max: 40 },
];

export default function WhatsappCampaignPage() {
  const [totalRecipients, setTotalRecipients] = useState<number | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [result, setResult] = useState<SendResult | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [presetSearch, setPresetSearch] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(
    WHATSAPP_PRESETS[0].id
  );
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  // Intervalo (timer) entre cada mensagem, em segundos [min, max]
  const [delayRange, setDelayRange] = useState<[number, number]>([3, 8]);
  // Progresso do disparo em lotes
  const [progress, setProgress] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);
  // Flag para abortar o disparo em andamento
  const cancelRef = useRef(false);

  const categories = useMemo(
    () => Array.from(new Set(WHATSAPP_PRESETS.map((p) => p.category))),
    []
  );

  const filteredPresets = useMemo(() => {
    const q = presetSearch.trim().toLowerCase();
    if (!q) return WHATSAPP_PRESETS;
    return WHATSAPP_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.message.toLowerCase().includes(q)
    );
  }, [presetSearch]);

  useEffect(() => {
    fetch("/api/admin/whatsapp-campaign")
      .then((r) => r.json())
      .then((d) => {
        setTotalRecipients(d.totalRecipients ?? 0);
        setConfigured(Boolean(d.configured));
      })
      .catch(() => {
        setTotalRecipients(0);
        setConfigured(false);
      });
  }, []);

  function applyPreset(preset: WhatsappPreset) {
    setActivePreset(preset.id);
    setMessage(preset.message);
  }

  async function handleSendTest() {
    if (!testPhone) {
      alert("Informe um numero para o teste (ex: 5534999999999)");
      return;
    }
    setIsSendingTest(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, testPhone }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Erro ao enviar mensagem de teste");
    } finally {
      setIsSendingTest(false);
    }
  }

  async function handleSend() {
    const [minD, maxD] = delayRange;
    const estimateMin = totalRecipients
      ? Math.max(1, Math.round((totalRecipients * ((minD + maxD) / 2)) / 60))
      : 0;
    if (
      !confirm(
        `Confirma o disparo desta mensagem para todos os ${totalRecipients ?? ""} numeros cadastrados?\n\nIntervalo entre envios: ${minD}-${maxD}s (tempo estimado: ~${estimateMin} min).\n\nMantenha esta aba aberta ate o final.`
      )
    ) {
      return;
    }
    cancelRef.current = false;
    setIsSending(true);
    setResult(null);
    setProgress({ sent: 0, failed: 0, total: totalRecipients ?? 0 });

    const accLog: SendResult["log"] = [];
    let sent = 0;
    let failed = 0;
    let offset = 0;
    let total = totalRecipients ?? 0;
    const batchSize = 5;

    try {
      // Itera lote a lote ate cobrir todos os destinatarios. Cada chamada
      // processa poucos numeros e retorna rapido, evitando o limite de tempo.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (cancelRef.current) break;

        const res = await fetch("/api/admin/whatsapp-campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            minDelay: minD,
            maxDelay: maxD,
            offset,
            limit: batchSize,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Falha em um dos lotes");
        }

        const data = await res.json();
        sent += data.sent ?? 0;
        failed += data.failed ?? 0;
        total = data.total ?? total;
        if (Array.isArray(data.log)) accLog.push(...data.log);

        setProgress({ sent, failed, total });

        if (data.done || !data.nextOffset || data.nextOffset <= offset) break;
        offset = data.nextOffset;
      }

      setResult({
        success: sent > 0,
        message: cancelRef.current
          ? `Disparo interrompido. ${sent} de ${total} enviados.`
          : `Campanha enviada para ${sent} de ${total} numeros`,
        sent,
        failed,
        total,
        log: accLog,
      });
    } catch (e) {
      setResult({
        success: sent > 0,
        error:
          (e instanceof Error ? e.message : "Erro ao disparar a campanha") +
          ` (parou em ${sent} de ${total})`,
        sent,
        failed,
        total,
        log: accLog,
      });
    } finally {
      setIsSending(false);
      setProgress(null);
    }
  }

  function handleCancelSend() {
    cancelRef.current = true;
  }

  // Renderiza a mensagem com {nome} substituido e *negrito* do WhatsApp
  const previewMessage = message
    .replace(/\{nome\}/g, "Joao")
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Disparo de WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Envie uma mensagem para todos os numeros cadastrados via Evolution API
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
            <p className="text-xs text-muted-foreground mt-1">Numeros</p>
          </div>
        </div>
      </div>

      {/* Aviso de configuracao */}
      {configured === false && (
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-amber-400/30 bg-amber-400/5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-white font-medium">Evolution API nao configurada</p>
            <p className="text-muted-foreground mt-1">
              Defina as variaveis{" "}
              <code className="text-amber-300">EVOLUTION_API_URL</code>,{" "}
              <code className="text-amber-300">EVOLUTION_API_KEY</code> e{" "}
              <code className="text-amber-300">EVOLUTION_INSTANCE</code> nas
              configuracoes do projeto para habilitar o envio.
            </p>
          </div>
        </div>
      )}

      {/* Biblioteca de predefinicoes */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">
              Predefinicoes de mensagem
            </h2>
            <span className="text-xs text-muted-foreground">
              ({WHATSAPP_PRESETS.length} modelos)
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={presetSearch}
              onChange={(e) => setPresetSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="bg-secondary pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <span
              key={cat}
              className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {cat}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`text-left rounded-xl p-4 border transition-colors ${
                activePreset === preset.id
                  ? "bg-primary/10 border-primary"
                  : "bg-secondary border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                  {preset.category}
                </span>
                {activePreset === preset.id && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-sm font-medium text-white leading-tight">
                {preset.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {preset.message.replace(/\{nome\}/g, "").replace(/\*/g, "")}
              </p>
            </button>
          ))}
          {filteredPresets.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full py-6 text-center">
              Nenhum modelo encontrado para &quot;{presetSearch}&quot;.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Mensagem</h2>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Texto da mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setActivePreset(null);
              }}
              rows={10}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use <code className="text-primary">{"{nome}"}</code> para inserir o
              nome do cliente e <code className="text-primary">*texto*</code> para
              negrito.
            </p>
          </div>

          {/* Teste */}
          <div className="border-t border-border pt-4">
            <label className="text-sm text-muted-foreground mb-1 block">
              Enviar teste para (com DDI, ex: 5534999999999)
            </label>
            <div className="flex gap-2">
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5534999999999"
                className="bg-secondary"
              />
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={isSendingTest || configured === false}
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FlaskConical className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">
                Intervalo entre envios (anti-spam)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Espacar os disparos reduz o risco do numero cair por spam. Quanto
              maior o intervalo, mais seguro.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DELAY_PRESETS.map((opt) => {
                const active =
                  delayRange[0] === opt.min && delayRange[1] === opt.max;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDelayRange([opt.min, opt.max])}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/40 hover:border-primary/50"
                    }`}
                  >
                    <span className="block text-sm font-medium text-white">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {opt.min}-{opt.max}s
                    </span>
                  </button>
                );
              })}
            </div>
            {totalRecipients ? (
              <p className="text-xs text-muted-foreground">
                Tempo estimado para {totalRecipients} numeros: ~
                {Math.max(
                  1,
                  Math.round(
                    (totalRecipients * ((delayRange[0] + delayRange[1]) / 2)) /
                      60
                  )
                )}{" "}
                min
              </p>
            ) : null}
          </div>

          <Button
            onClick={handleSend}
            disabled={isSending || configured === false}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Disparar para todos ({totalRecipients ?? 0})
          </Button>

          {/* Barra de progresso do disparo em lotes */}
          {isSending && progress && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white font-medium">
                  Enviando... {progress.sent + progress.failed} de{" "}
                  {progress.total}
                </span>
                <span className="text-muted-foreground">
                  {progress.total
                    ? Math.round(
                        ((progress.sent + progress.failed) / progress.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-background overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${
                      progress.total
                        ? ((progress.sent + progress.failed) / progress.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {progress.sent} enviados &middot; {progress.failed} falhas
                </span>
                <button
                  type="button"
                  onClick={handleCancelSend}
                  className="text-xs font-medium text-red-400 hover:text-red-300"
                >
                  Interromper
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mantenha esta aba aberta ate concluir.
              </p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div
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
                        ? "Mensagem de teste enviada!"
                        : "Falha ao enviar teste"
                      : result.message || result.error || "Disparo concluido"}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Enviados: {result.sent} &middot; Falhas: {result.failed}
                  </p>
                </div>
              </div>

              {/* Status detalhado por destinatario */}
              {result.log && result.log.length > 0 && (
                <div className="rounded-xl border border-border bg-secondary/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/40">
                    <span className="text-xs font-semibold text-white">
                      Status do envio
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {result.sent}/{result.total} enviados
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                    {result.log.map((item, idx) => (
                      <div
                        key={`${item.phone}-${idx}`}
                        className="flex items-center justify-between gap-3 px-4 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">
                            {item.name || item.phone}
                          </p>
                          {item.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.phone}
                            </p>
                          )}
                        </div>
                        {item.ok ? (
                          <span className="flex items-center gap-1 text-xs text-green-400 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400 shrink-0">
                            <XCircle className="w-3.5 h-3.5" /> Falha
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            <div className="rounded-2xl overflow-hidden border border-border bg-[#0b141a] p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Hyperion Pay</p>
                  <p className="text-xs text-green-400">online</p>
                </div>
              </div>
              <div className="flex-1 flex items-end pt-6">
                <div className="bg-[#005c4b] text-white text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] leading-relaxed">
                  <span
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: previewMessage }}
                  />
                  <span className="block text-[10px] text-white/50 text-right mt-1">
                    12:00
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
