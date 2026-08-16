"use client";

import { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, Loader2, X, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Endpoint {
  id: string; url: string; description: string | null; events: string[];
  is_active: boolean; failure_count: number; last_delivery_at: string | null; created_at: string;
}
interface Delivery {
  id: string; url: string; response_status: number; success: boolean; attempts: number; created_at: string;
}
interface WebhooksData {
  endpoints: Endpoint[];
  deliveries: Delivery[];
  stats: { total: number; success: number; failed: number };
}

const EVENT_OPTIONS = ["transaction.approved", "transaction.refused", "transaction.refunded", "withdrawal.completed", "kyc.approved"];

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function WebhooksPage() {
  const [data, setData] = useState<WebhooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ url: string; description: string; events: string[] }>({ url: "", description: "", events: [] });
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/webhooks");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!/^https?:\/\//.test(form.url)) { toast.error("Informe uma URL válida (https://...)"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Erro ao criar"); return; }
      toast.success("Webhook criado");
      setShowModal(false);
      setForm({ url: "", description: "", events: [] });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(ep: Endpoint) {
    await fetch("/api/admin/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ep.id, is_active: !ep.is_active }),
    });
    await load();
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/admin/webhooks?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Webhook removido"); await load(); }
    } finally {
      setRemovingId(null);
    }
  }

  function toggleEvent(ev: string) {
    setForm((f) => ({ ...f, events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev] }));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Webhooks</h1>
          <p className="text-muted-foreground">Endpoints de notificação e histórico de entregas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Novo endpoint
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4"><p className="text-xl font-bold text-foreground">{data?.stats.total ?? 0}</p><p className="text-xs text-muted-foreground">Entregas 7d</p></div>
        <div className="glass rounded-2xl p-4"><p className="text-xl font-bold text-green-400">{data?.stats.success ?? 0}</p><p className="text-xs text-muted-foreground">Sucesso</p></div>
        <div className="glass rounded-2xl p-4"><p className="text-xl font-bold text-red-400">{data?.stats.failed ?? 0}</p><p className="text-xs text-muted-foreground">Falhas</p></div>
      </div>

      {/* Endpoints */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="font-semibold text-foreground">Endpoints</h2></div>
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : data && data.endpoints.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.endpoints.map((ep) => (
              <div key={ep.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-secondary shrink-0"><Webhook className="w-4 h-4 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">{ep.url}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(ep.events || []).length ? (ep.events || []).join(", ") : "Todos os eventos"} • Última entrega: {fmtDate(ep.last_delivery_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(ep)}
                    className={`text-xs px-2 py-1 rounded-full ${ep.is_active ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}
                  >
                    {ep.is_active ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    onClick={() => handleRemove(ep.id)}
                    disabled={removingId === ep.id}
                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {removingId === ep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhum endpoint configurado</p>
            <p className="text-sm text-muted-foreground">Adicione um endpoint para receber notificações.</p>
          </div>
        )}
      </div>

      {/* Entregas recentes */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="font-semibold text-foreground">Entregas recentes</h2></div>
        {data && data.deliveries.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.deliveries.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {d.success ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <p className="text-sm font-mono text-muted-foreground truncate">{d.url}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {d.response_status || "-"}
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDate(d.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma entrega registrada ainda.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Novo endpoint</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL *</label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://exemplo.com/webhook" className="bg-secondary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional" className="bg-secondary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Eventos</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_OPTIONS.map((ev) => (
                    <button
                      key={ev}
                      onClick={() => toggleEvent(ev)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.events.includes(ev) ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Nenhum selecionado = todos os eventos.</p>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar endpoint
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
