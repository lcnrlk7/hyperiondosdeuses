"use client";

import { useState, useEffect } from "react";
import { KeyRound, Plus, Trash2, Loader2, Copy, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKey {
  id: string; name: string; environment: string; key_masked: string;
  is_active: boolean; last_used_at: string | null; created_by: string;
  created_at: string; revoked_at: string | null;
}

function fmtDate(d: string | null) {
  if (!d) return "Nunca";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", environment: "live" });
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/api-keys");
    const d = await res.json();
    setKeys(d.keys || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Erro ao criar"); return; }
      setNewSecret(d.secret);
      setForm({ name: "", environment: "live" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Chave revogada"); await load(); }
      else toast.error("Erro ao revogar");
    } finally {
      setRevokingId(null);
    }
  }

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setCopied(true);
    toast.success("Chave copiada");
    setTimeout(() => setCopied(false), 2000);
  }

  function closeModal() {
    setShowModal(false);
    setNewSecret(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">API Keys</h1>
          <p className="text-muted-foreground">Chaves de acesso à API da plataforma</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Gerar chave
        </Button>
      </header>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <KeyRound className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhuma chave criada</p>
            <p className="text-sm text-muted-foreground">Gere uma chave para integrar com a API.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((k) => (
              <div key={k.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-secondary shrink-0"><KeyRound className="w-4 h-4 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{k.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${k.environment === "live" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {k.environment}
                      </span>
                      {!k.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">Revogada</span>}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{k.key_masked}</p>
                    <p className="text-[11px] text-muted-foreground">Criada {fmtDate(k.created_at)} • Último uso: {fmtDate(k.last_used_at)}</p>
                  </div>
                </div>
                {k.is_active && (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    disabled={revokingId === k.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50 shrink-0"
                  >
                    {revokingId === k.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Revogar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeModal}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">{newSecret ? "Chave criada" : "Gerar nova chave"}</h3>
              <Button variant="ghost" size="sm" onClick={closeModal}><X className="w-4 h-4" /></Button>
            </div>

            {newSecret ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">Copie agora. Por segurança, esta chave não será exibida novamente.</p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary">
                  <code className="text-xs font-mono text-foreground break-all flex-1">{newSecret}</code>
                  <button onClick={copySecret} className="p-2 hover:bg-white/10 rounded shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <Button onClick={closeModal} className="w-full">Concluir</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nome *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Integração loja X" className="bg-secondary" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Ambiente</label>
                  <select
                    value={form.environment}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    <option value="live" className="bg-card">Produção (live)</option>
                    <option value="test" className="bg-card">Teste (test)</option>
                  </select>
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Gerar chave
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
