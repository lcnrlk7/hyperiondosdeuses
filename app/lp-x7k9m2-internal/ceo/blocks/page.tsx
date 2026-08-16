"use client";

import { useState, useEffect } from "react";
import { Ban, Plus, Trash2, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Block {
  id: string; type: string; value: string; reason: string; notes: string | null;
  is_active: boolean; created_at: string; expires_at: string | null;
  blocked_user_email?: string | null;
}
interface Stats {
  active_blocks: number; cpf_blocks: number; ip_blocks: number;
  email_blocks: number; device_blocks: number; phone_blocks: number; total_blocks: number;
}

const typeLabels: Record<string, string> = {
  cpf: "CPF", ip: "IP", email: "E-mail", device: "Dispositivo", phone: "Telefone",
};

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "cpf", value: "", reason: "", notes: "" });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search) params.set("search", search);
    params.set("status", "active");
    const res = await fetch(`/api/admin/blacklist?${params}`);
    const d = await res.json();
    setBlocks(d.blocks || []);
    setStats(d.stats || null);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [typeFilter]);

  async function handleAdd() {
    if (!form.value || !form.reason) {
      toast.error("Valor e motivo são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const blockedBy = typeof window !== "undefined" ? localStorage.getItem("lp_admin_user") || "CEO" : "CEO";
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, blocked_by: blockedBy }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Erro ao adicionar"); return; }
      toast.success("Bloqueio adicionado");
      setShowModal(false);
      setForm({ type: "cpf", value: "", reason: "", notes: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/admin/blacklist?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Bloqueio removido"); await load(); }
      else toast.error("Erro ao remover");
    } finally {
      setRemovingId(null);
    }
  }

  const cards = [
    { label: "Ativos", value: stats?.active_blocks ?? 0 },
    { label: "CPF", value: stats?.cpf_blocks ?? 0 },
    { label: "IP", value: stats?.ip_blocks ?? 0 },
    { label: "E-mail", value: stats?.email_blocks ?? 0 },
    { label: "Telefone", value: stats?.phone_blocks ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Bloqueios</h1>
          <p className="text-muted-foreground">Lista negra de CPF, IP, e-mail, telefone e dispositivos</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Adicionar bloqueio
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) load(); }}
            placeholder="Buscar por valor ou motivo..."
            className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground"
        >
          <option value="all" className="bg-card">Todos os tipos</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k} className="bg-card">{v}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : blocks.length === 0 ? (
          <div className="p-12 text-center">
            <Ban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhum bloqueio ativo</p>
            <p className="text-sm text-muted-foreground">Adicione um bloqueio para proteger a plataforma.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {blocks.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground shrink-0">
                    {typeLabels[b.type] || b.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">{b.value}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.reason}{b.blocked_user_email ? ` • ${b.blocked_user_email}` : ""} • {fmtDate(b.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(b.id)}
                  disabled={removingId === b.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50 shrink-0"
                >
                  {removingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Novo bloqueio</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k} className="bg-card">{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Valor *</label>
                <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Ex: 123.456.789-00" className="bg-secondary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Motivo *</label>
                <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ex: Fraude confirmada" className="bg-secondary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" className="bg-secondary" />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar bloqueio
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
