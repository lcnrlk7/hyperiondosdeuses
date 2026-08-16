"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Send,
  X,
  Loader2,
  User,
  Trash2,
  Search,
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_global: boolean;
  read: boolean;
  created_at: string;
  profiles?: { name: string; email: string } | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const typeOptions = [
  { value: "info", label: "Informação", icon: Info, color: "text-blue-400" },
  { value: "success", label: "Sucesso", icon: CheckCircle, color: "text-green-400" },
  { value: "warning", label: "Aviso", icon: AlertCircle, color: "text-yellow-400" },
  { value: "error", label: "Erro", icon: AlertCircle, color: "text-red-400" },
  { value: "reward", label: "Premiação", icon: Gift, color: "text-purple-400" },
  { value: "transaction", label: "Transação", icon: Bell, color: "text-primary" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    isGlobal: true,
    selectedUserId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchUser && !formData.isGlobal) {
      const filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchUser.toLowerCase())
      );
      setFilteredUsers(filtered.slice(0, 5));
    } else {
      setFilteredUsers([]);
    }
  }, [searchUser, users, formData.isGlobal]);

  async function loadData() {
    try {
      const [notificationsRes, usersRes] = await Promise.all([
        fetch("/api/admin/notifications"),
        fetch("/api/admin/users"),
      ]);

      const notificationsData = await notificationsRes.json();
      const usersData = await usersRes.json();

      // A API retorna { notifications, motivationalMessages, ... }.
      // Mantemos compatibilidade caso algum dia retorne um array direto.
      const list = Array.isArray(notificationsData)
        ? notificationsData
        : notificationsData?.notifications;
      if (Array.isArray(list)) {
        setNotifications(list);
      }
      if (usersData?.users) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }

  async function handleSend() {
    if (!formData.title || !formData.message) {
      alert("Preencha o título e a mensagem");
      return;
    }

    if (!formData.isGlobal && !formData.selectedUserId) {
      alert("Selecione um usuário ou marque como notificação global");
      return;
    }

    setIsSending(true);

    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: formData.isGlobal ? null : formData.selectedUserId,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          is_global: formData.isGlobal,
        }),
      });

      await loadData();
      closeModal();
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao enviar notificação");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta notificação?")) return;

    await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
    await loadData();
  }

  function closeModal() {
    setShowModal(false);
    setFormData({
      title: "",
      message: "",
      type: "info",
      isGlobal: true,
      selectedUserId: "",
    });
    setSearchUser("");
  }

  function selectUser(user: UserProfile) {
    setFormData({ ...formData, selectedUserId: user.id });
    setSearchUser(user.name || user.email);
    setFilteredUsers([]);
  }

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find((t) => t.value === type);
    if (!option) return <Bell className="w-5 h-5 text-primary" />;
    const Icon = option.icon;
    return <Icon className={`w-5 h-5 ${option.color}`} />;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Notificações</h1>
          <p className="text-muted-foreground">
            Envie notificações para usuários do sistema
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4 mr-2" />
          Nova Notificação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {notifications.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Enviadas</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-400/10">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {notifications.filter((n) => !n.user_id).length}
              </p>
              <p className="text-sm text-muted-foreground">Globais</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-400/10">
              <User className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {notifications.filter((n) => n.user_id).length}
              </p>
              <p className="text-sm text-muted-foreground">Individuais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Notificações Enviadas
          </h2>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma notificação enviada
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-secondary transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-secondary">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {notification.title}
                        </p>
                        {!notification.user_id ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400">
                            Global
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">
                            Individual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(notification.created_at).toLocaleString("pt-BR")}
                        </span>
                        {notification.profiles && (
                          <span>
                            Para: {notification.profiles.name || notification.profiles.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
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
                <h3 className="text-lg font-semibold text-foreground">
                  Nova Notificação
                </h3>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Título *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Título da notificação"
                    className="bg-secondary"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Mensagem *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Digite a mensagem..."
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    {typeOptions.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isGlobal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isGlobal: e.target.checked,
                          selectedUserId: "",
                        })
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      Enviar para todos os usuários
                    </span>
                  </label>
                </div>

                {!formData.isGlobal && (
                  <div className="relative">
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Selecionar Usuário
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        placeholder="Buscar usuário..."
                        className="bg-secondary pl-10"
                      />
                    </div>
                    {filteredUsers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-10">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => selectUser(user)}
                            className="w-full px-4 py-2 text-left hover:bg-secondary transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground">
                              {user.name || "Sem nome"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Notificação
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
