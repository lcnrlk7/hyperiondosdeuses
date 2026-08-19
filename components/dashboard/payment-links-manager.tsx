"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2,
  Plus,
  Copy,
  Check,
  Pencil,
  Trash2,
  X,
  Loader2,
  Calendar,
  Hash,
  DollarSign,
  ExternalLink,
  Ban,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Dominio publico dos links de pagamento (checkout)
const CHECKOUT_BASE_URL = "https://pay-checkout-pagamentoseguros.online";

interface PaymentLink {
  id: string;
  code: string;
  title: string;
  description: string | null;
  amount: number | null;
  amount_type: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  status: string;
  total_received: number | null;
  created_at: string;
}

interface FormState {
  id?: string;
  title: string;
  description: string;
  amount: string;
  expires_at: string;
  max_uses: string;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  amount: "",
  expires_at: "",
  max_uses: "",
};

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0)
  );

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
};

export function PaymentLinksManager() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;

  const loadLinks = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch("/api/payment-links", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error("[v0] loadLinks error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Estatisticas
  const activeLinks = links.filter((l) => l.status === "active");
  const cancelledLinks = links.filter((l) => l.status !== "active");
  const openValue = activeLinks.reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const totalUses = links.reduce((acc, l) => acc + Number(l.current_uses || 0), 0);

  const stats = [
    {
      label: "Links ativos",
      value: String(activeLinks.length),
      hint: `${links.length} no total`,
      icon: Link2,
    },
    {
      label: "Valor em aberto",
      value: formatCurrency(openValue),
      hint: "soma dos links ativos",
      icon: DollarSign,
    },
    {
      label: "Usos totais",
      value: String(totalUses),
      hint: "cliques que pagaram",
      icon: Hash,
    },
    {
      label: "Cancelados",
      value: String(cancelledLinks.length),
      hint: "links inativos",
      icon: Trash2,
    },
  ];

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(link: PaymentLink) {
    setForm({
      id: link.id,
      title: link.title,
      description: link.description || "",
      amount: link.amount != null ? String(link.amount) : "",
      expires_at: link.expires_at ? link.expires_at.slice(0, 10) : "",
      max_uses: link.max_uses != null ? String(link.max_uses) : "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    setError(null);

    if (!form.title.trim()) {
      setError("O titulo e obrigatorio.");
      return;
    }
    const amountNumber = Number(form.amount.replace(",", "."));
    if (!amountNumber || amountNumber <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        amount: amountNumber,
        amount_type: "fixed",
        expires_at: form.expires_at || null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
      };

      const res = await fetch("/api/payment-links", {
        method: form.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar link");
      }

      setModalOpen(false);
      setForm(emptyForm);
      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar link");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(link: PaymentLink) {
    setBusyId(link.id);
    try {
      const token = getToken();
      await fetch("/api/payment-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: link.id,
          status: link.status === "active" ? "cancelled" : "active",
        }),
      });
      await loadLinks();
    } catch (err) {
      console.error("[v0] toggleStatus error:", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(link: PaymentLink) {
    if (!confirm(`Excluir o link "${link.title}"? Esta acao nao pode ser desfeita.`))
      return;
    setBusyId(link.id);
    try {
      const token = getToken();
      await fetch(`/api/payment-links?id=${link.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadLinks();
    } catch (err) {
      console.error("[v0] handleDelete error:", err);
    } finally {
      setBusyId(null);
    }
  }

  function copyLink(link: PaymentLink) {
    const url = `${CHECKOUT_BASE_URL}/link/${link.code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(link.code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            Links de Pagamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie links rapidos para cobrar seus clientes.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo link
        </Button>
      </div>

      {/* Cards de estatisticas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* Lista de links */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Nenhum link ainda
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu primeiro link de pagamento para comecar a cobrar.
          </p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Criar link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const isActive = link.status === "active";
            return (
              <div
                key={link.id}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-accent flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground truncate">
                      {link.title}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isActive
                          ? "bg-success-bg text-success"
                          : "bg-danger-bg text-danger"
                      }`}
                    >
                      {isActive ? "Ativo" : "Cancelado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
                    <span className="font-mono uppercase">{link.code}</span>
                    {link.description && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate max-w-[180px]">
                          {link.description}
                        </span>
                      </>
                    )}
                    <span aria-hidden>·</span>
                    <span>
                      {link.current_uses} uso(s) ·{" "}
                      {link.max_uses ? `${link.max_uses} max` : "ilimitado"}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(link.created_at)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-foreground tabular-nums">
                    {formatCurrency(link.amount)}
                  </p>
                  {link.expires_at && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      exp. {formatDate(link.expires_at)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyLink(link)}
                    title="Copiar link"
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {copiedCode === link.code ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`${CHECKOUT_BASE_URL}/link/${link.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir link"
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openEdit(link)}
                    title="Editar"
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(link)}
                    disabled={busyId === link.id}
                    title={isActive ? "Cancelar link" : "Reativar link"}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {busyId === link.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link)}
                    disabled={busyId === link.id}
                    title="Excluir"
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger-bg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => !saving && setModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                <h2 className="font-semibold text-foreground">
                  {form.id ? "Editar Link" : "Novo Link de Pagamento"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Titulo *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Produto X — Pagamento"
                  className="w-full rounded-lg border border-border bg-input-solid px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Descricao
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-border bg-input-solid px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-border bg-input-solid px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Expira em
                  </label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) =>
                      setForm({ ...form, expires_at: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-input-solid px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Max. usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) =>
                      setForm({ ...form, max_uses: e.target.value })
                    }
                    placeholder="Ilimitado"
                    className="w-full rounded-lg border border-border bg-input-solid px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : form.id ? (
                  "Salvar"
                ) : (
                  "Criar Link"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
