"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Plus,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  MoreVertical,
  Loader2,
  Check,
  X,
  DollarSign,
  Eye,
  QrCode,
  Palette,
  Clock,
  Users,
  Settings2,
  Image as ImageIcon,
  FileText,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentLink {
  id: string;
  code: string;
  title: string;
  description: string | null;
  amount: number | null;
  amount_type: "fixed" | "open";
  min_amount: number | null;
  max_amount: number | null;
  logo_url: string | null;
  primary_color: string;
  background_color: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  status: "active" | "inactive";
  success_message: string | null;
  redirect_url: string | null;
  require_name: boolean;
  require_email: boolean;
  require_phone: boolean;
  require_cpf: boolean;
  total_received: number;
  created_at: string;
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "customize" | "advanced">("basic");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    amount_type: "fixed" as "fixed" | "open",
    min_amount: "",
    max_amount: "",
    logo_url: "",
    primary_color: "#f97316",
    background_color: "#0a0a0a",
    expires_at: "",
    max_uses: "",
    success_message: "",
    redirect_url: "",
    require_name: true,
    require_email: true,
    require_phone: false,
    require_cpf: false,
  });

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch("/api/payment-links", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.title.trim()) {
      alert("Titulo e obrigatorio");
      return;
    }

    if (formData.amount_type === "fixed" && (!formData.amount || Number(formData.amount) <= 0)) {
      alert("Valor deve ser maior que zero");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      const method = editingLink ? "PUT" : "POST";
      const body = editingLink ? { id: editingLink.id, ...formData } : formData;

      const response = await fetch("/api/payment-links", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...body,
          amount: formData.amount ? Number(formData.amount) : null,
          min_amount: formData.min_amount ? Number(formData.min_amount) : null,
          max_amount: formData.max_amount ? Number(formData.max_amount) : null,
          max_uses: formData.max_uses ? Number(formData.max_uses) : null,
          expires_at: formData.expires_at || null,
        }),
      });

      if (response.ok) {
        loadLinks();
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao salvar link");
      }
    } catch (error) {
      console.error("Error saving link:", error);
      alert("Erro ao salvar link");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este link?")) return;

    try {
      const token = localStorage.getItem("auth-token");
      await fetch(`/api/payment-links?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  }

  async function toggleStatus(link: PaymentLink) {
    try {
      const token = localStorage.getItem("auth-token");
      await fetch("/api/payment-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: link.id,
          status: link.status === "active" ? "inactive" : "active",
        }),
      });
      loadLinks();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }

  function openEditModal(link: PaymentLink) {
    setEditingLink(link);
    setFormData({
      title: link.title,
      description: link.description || "",
      amount: link.amount?.toString() || "",
      amount_type: link.amount_type,
      min_amount: link.min_amount?.toString() || "",
      max_amount: link.max_amount?.toString() || "",
      logo_url: link.logo_url || "",
      primary_color: link.primary_color,
      background_color: link.background_color,
      expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : "",
      max_uses: link.max_uses?.toString() || "",
      success_message: link.success_message || "",
      redirect_url: link.redirect_url || "",
      require_name: link.require_name,
      require_email: link.require_email,
      require_phone: link.require_phone,
      require_cpf: link.require_cpf,
    });
    setActiveTab("basic");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingLink(null);
    setFormData({
      title: "",
      description: "",
      amount: "",
      amount_type: "fixed",
      min_amount: "",
      max_amount: "",
      logo_url: "",
      primary_color: "#f97316",
      background_color: "#0a0a0a",
      expires_at: "",
      max_uses: "",
      success_message: "",
      redirect_url: "",
      require_name: true,
      require_email: true,
      require_phone: false,
      require_cpf: false,
    });
    setActiveTab("basic");
  }

  function copyToClipboard(code: string) {
    const url = `${window.location.origin}/link/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const filteredLinks = links.filter((link) =>
    link.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Links de Pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Crie links personalizados para receber pagamentos
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Link
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">{links.length}</p>
          <p className="text-sm text-muted-foreground">Total de Links</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {links.filter((l) => l.status === "active").length}
          </p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">
            {links.reduce((acc, l) => acc + l.current_uses, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Pagamentos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {formatCurrency(links.reduce((acc, l) => acc + Number(l.total_received || 0), 0))}
          </p>
          <p className="text-sm text-muted-foreground">Total Recebido</p>
        </div>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Link2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            {search ? "Nenhum link encontrado" : "Voce ainda nao criou nenhum link"}
          </p>
          {!search && (
            <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Link
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Logo/Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: link.primary_color + "20" }}
                >
                  {link.logo_url ? (
                    <img
                      src={link.logo_url}
                      alt={link.title}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <Link2 className="w-6 h-6" style={{ color: link.primary_color }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{link.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        link.status === "active"
                          ? "bg-green-400/10 text-green-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {link.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {link.amount_type === "fixed"
                      ? formatCurrency(Number(link.amount))
                      : "Valor aberto"}
                    {link.description && ` - ${link.description}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {link.current_uses} usos
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(Number(link.total_received || 0))}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(link.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(link.code)}
                    className="border-border"
                  >
                    {copied === link.code ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/link/${link.code}`, "_blank")}
                    className="border-border"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-border">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => openEditModal(link)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(link)}>
                        {link.status === "active" ? (
                          <>
                            <ToggleLeft className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(link.id)}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-white">
                  {editingLink ? "Editar Link" : "Novo Link de Pagamento"}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-secondary rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {[
                  { id: "basic", label: "Basico", icon: FileText },
                  { id: "customize", label: "Personalizar", icon: Palette },
                  { id: "advanced", label: "Avancado", icon: Settings2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                {activeTab === "basic" && (
                  <>
                    <div>
                      <Label className="text-white">Titulo *</Label>
                      <Input
                        placeholder="Ex: Pagamento de Servico"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Descricao</Label>
                      <Textarea
                        placeholder="Descricao do pagamento..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Tipo de Valor</Label>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => setFormData({ ...formData, amount_type: "fixed" })}
                          className={`flex-1 p-3 rounded-xl border transition-colors ${
                            formData.amount_type === "fixed"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <DollarSign className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-sm font-medium">Valor Fixo</p>
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, amount_type: "open" })}
                          className={`flex-1 p-3 rounded-xl border transition-colors ${
                            formData.amount_type === "open"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <Edit className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-sm font-medium">Valor Aberto</p>
                        </button>
                      </div>
                    </div>

                    {formData.amount_type === "fixed" ? (
                      <div>
                        <Label className="text-white">Valor *</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="pl-10 bg-secondary border-border"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white">Valor Minimo</Label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={formData.min_amount}
                              onChange={(e) =>
                                setFormData({ ...formData, min_amount: e.target.value })
                              }
                              className="pl-10 bg-secondary border-border"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-white">Valor Maximo</Label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={formData.max_amount}
                              onChange={(e) =>
                                setFormData({ ...formData, max_amount: e.target.value })
                              }
                              className="pl-10 bg-secondary border-border"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "customize" && (
                  <>
                    <div>
                      <Label className="text-white">URL do Logo</Label>
                      <Input
                        placeholder="https://..."
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Recomendado: 200x200px, formato PNG ou JPG
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Cor Principal</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={formData.primary_color}
                            onChange={(e) =>
                              setFormData({ ...formData, primary_color: e.target.value })
                            }
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={formData.primary_color}
                            onChange={(e) =>
                              setFormData({ ...formData, primary_color: e.target.value })
                            }
                            className="bg-secondary border-border"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Cor de Fundo</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={formData.background_color}
                            onChange={(e) =>
                              setFormData({ ...formData, background_color: e.target.value })
                            }
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={formData.background_color}
                            onChange={(e) =>
                              setFormData({ ...formData, background_color: e.target.value })
                            }
                            className="bg-secondary border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Mensagem de Sucesso</Label>
                      <Textarea
                        placeholder="Obrigado pelo seu pagamento!"
                        value={formData.success_message}
                        onChange={(e) =>
                          setFormData({ ...formData, success_message: e.target.value })
                        }
                        className="mt-1 bg-secondary border-border"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label className="text-white">URL de Redirecionamento (apos pagamento)</Label>
                      <Input
                        placeholder="https://seusite.com/obrigado"
                        value={formData.redirect_url}
                        onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                      />
                    </div>
                  </>
                )}

                {activeTab === "advanced" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Expira em</Label>
                        <Input
                          type="datetime-local"
                          value={formData.expires_at}
                          onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                          className="mt-1 bg-secondary border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Limite de Usos</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ilimitado"
                          value={formData.max_uses}
                          onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                          className="mt-1 bg-secondary border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Campos Obrigatorios</Label>
                      <div className="space-y-2">
                        {[
                          { key: "require_name", label: "Nome" },
                          { key: "require_email", label: "Email" },
                          { key: "require_phone", label: "Telefone" },
                          { key: "require_cpf", label: "CPF" },
                        ].map((field) => (
                          <div
                            key={field.key}
                            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                          >
                            <span className="text-sm text-white">{field.label}</span>
                            <Switch
                              checked={formData[field.key as keyof typeof formData] as boolean}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, [field.key]: checked })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                <Button variant="outline" onClick={closeModal} className="border-border">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving} className="bg-primary">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {editingLink ? "Salvar" : "Criar Link"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
