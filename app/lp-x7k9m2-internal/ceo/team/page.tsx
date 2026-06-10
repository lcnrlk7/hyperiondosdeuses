"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Users,
  Headphones,
  DollarSign,
  Copy,
  Check,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "ceo" | "manager" | "support" | "finance" | "tech";
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  ceo: "CEO",
  manager: "Gerente",
  support: "Suporte",
  finance: "Financeiro",
  tech: "Tecnico",
};

const roleColors: Record<string, string> = {
  ceo: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  support: "bg-green-500/10 text-green-400 border-green-500/20",
  finance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  tech: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const roleIcons: Record<string, React.ReactNode> = {
  ceo: <Shield className="w-5 h-5" />,
  manager: <Users className="w-5 h-5" />,
  support: <Headphones className="w-5 h-5" />,
  finance: <DollarSign className="w-5 h-5" />,
  tech: <Code className="w-5 h-5" />,
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "support" as "ceo" | "manager" | "support" | "finance" | "tech",
  });

  useEffect(() => {
    // Verificar permissões do usuário logado
    const email = localStorage.getItem("lp_admin_email");
    setCurrentUserEmail(email);
    
    if (email) {
      checkPermissions(email);
    }
    loadMembers();
  }, []);

  async function checkPermissions(email: string) {
    try {
      const res = await fetch(`/api/admin/team/check-permission?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setCanManageTeam(data.canManageTeam || false);
    } catch {
      setCanManageTeam(false);
    }
  }

  async function loadMembers() {
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Error loading team:", error);
      toast.error("Erro ao carregar equipe");
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!formData.name || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (!editingMember && !formData.password) {
      toast.error("Senha é obrigatória para novos membros");
      return;
    }

    if (!editingMember && formData.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSaving(true);

    try {
      const payload = editingMember
        ? {
            id: editingMember.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password || undefined,
            requestedBy: currentUserEmail,
          }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            requestedBy: currentUserEmail,
          };

      const res = await fetch("/api/admin/team", {
        method: editingMember ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      toast.success(
        editingMember
          ? "Membro atualizado com sucesso!"
          : "Membro criado com sucesso!"
      );
      await loadMembers();
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar membro");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(member: TeamMember) {
    try {
      const res = await fetch("/api/admin/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          is_active: !member.is_active,
        }),
      });

      if (res.ok) {
        toast.success(
          member.is_active ? "Membro desativado" : "Membro ativado"
        );
        await loadMembers();
      }
    } catch (error) {
      console.error("Error toggling active:", error);
      toast.error("Erro ao alterar status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;

    try {
      const res = await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Membro removido");
        await loadMembers();
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao remover membro");
    }
  }

  function openEditModal(member: TeamMember) {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: "",
      role: member.role,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "support",
    });
    setShowPassword(false);
  }

  function copyLoginInfo(member: TeamMember) {
    const info = `Email: ${member.email}\nURL: ${window.location.origin}/lp-x7k9m2-internal/login`;
    navigator.clipboard.writeText(info);
    setCopiedId(member.id);
    toast.success("Informações copiadas!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatDate(date: string | null) {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Gestao de Equipe
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe e suas permissoes
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setShowModal(true)} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        )}
      </div>

      {/* Login Info */}
      <div className="glass rounded-xl p-4 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          <strong className="text-primary">URL de Login da Equipe:</strong>{" "}
          <code className="bg-secondary px-2 py-1 rounded text-xs">
            {typeof window !== "undefined" ? window.location.origin : ""}/lp-x7k9m2-internal/login
          </code>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(["ceo", "manager", "support", "finance", "tech"] as const).map((role) => {
          const count = members.filter(
            (m) => m.role === role && m.is_active
          ).length;
          return (
            <div key={role} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${roleColors[role]}`}>
                  {roleIcons[role]}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[role]}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-white">Membros da Equipe</h2>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum membro cadastrado. Clique em &quot;Adicionar Membro&quot; para comecar.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      member.is_active
                        ? roleColors[member.role]
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {roleIcons[member.role]}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        member.is_active ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      {member.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ultimo login: {formatDate(member.last_login)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${roleColors[member.role]}`}
                  >
                    {roleLabels[member.role]}
                  </span>

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      member.is_active
                        ? "bg-green-400/10 text-green-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {member.is_active ? "Ativo" : "Inativo"}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLoginInfo(member)}
                    title="Copiar informacoes de login"
                  >
                    {copiedId === member.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(member)}
                    title={member.is_active ? "Desativar" : "Ativar"}
                  >
                    {member.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(member)}
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  {member.role !== "ceo" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {editingMember ? "Editar Membro" : "Novo Membro"}
                </h3>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Nome Completo *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Joao Silva"
                    className="bg-secondary"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                    className="bg-secondary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este email sera usado para fazer login
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Senha {editingMember ? "(deixe vazio para manter)" : "*"}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Minimo 6 caracteres"
                      className="bg-secondary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Cargo *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as typeof formData.role,
                      })
                    }
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    <option value="support">Suporte - Atendimento e tickets</option>
                    <option value="finance">Financeiro - Transacoes e saques</option>
                    <option value="tech">Tecnico - Sistema e logs</option>
                    <option value="manager">Gerente - Acesso amplo</option>
                    <option value="ceo">CEO - Acesso total</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cada cargo tem permissoes diferentes no sistema
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingMember ? "Salvar Alteracoes" : "Criar Membro"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
