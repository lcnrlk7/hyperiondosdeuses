"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Building, Loader2, Save, CheckCircle2, Shield, Lock, Eye, EyeOff, KeyRound, X, Monitor, Smartphone, Globe, Clock, LogOut, Trash2, AlertTriangle, Bell, BellRing, Send, Calendar, Moon, Sun, Palette, Camera, ImagePlus } from "lucide-react";
import Image from "next/image";
import { ThemeToggleWithLabel } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Profile {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  email_verified: boolean;
  kyc_status: string;
  avatar_url: string | null;
  bio: string | null;
}

export function SettingsContent() {
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    email_verified: false,
    kyc_status: "pending",
    avatar_url: null,
    bio: null,
  });



  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"request" | "verify" | "change">("request");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Sessions modal states
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>>([]);

  // Delete account modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notification states
  const [notificationsPush, setNotificationsPush] = useState(false);
  const [notificationsEmail, setNotificationsEmail] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<"daily" | "weekly">("daily");
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationTestLoading, setNotificationTestLoading] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
    checkPushSupport();
  }, []);

  async function checkPushSupport() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      const permission = Notification.permission;
      setPushPermission(permission);
    }
  }

  async function loadNotificationSettings() {
    try {
      const response = await fetch("/api/user/notifications/settings");
      const data = await response.json();
      
      if (data.notifications_push !== undefined) {
        setNotificationsPush(data.notifications_push);
        setNotificationsEmail(data.notifications_email);
        setEmailFrequency(data.notifications_email_frequency || "daily");
      }
    } catch (err) {
      console.error("Erro ao carregar configuracoes de notificacao:", err);
    }
  }

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  async function loadProfile() {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      
      if (data.profile) {
        setProfile({
          name: data.profile.name || "",
          email: data.profile.email || "",
          phone: formatPhone(data.profile.phone || ""),
          cpf: formatCPF(data.profile.cpf || ""),
          email_verified: data.profile.email_verified || false,
          kyc_status: data.profile.kyc_status || "pending",
          avatar_url: data.profile.avatar_url || null,
          bio: data.profile.bio || null,
        });

      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  function formatCPF(cpf: string): string {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  function formatPhone(phone: string): string {
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone.replace(/\D/g, ""),
          bio: profile.bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao salvar");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Password change functions
  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordStep("request");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordStep("request");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const handleSendPasswordCode = async () => {
    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const response = await fetch("/api/auth/password-reset/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Erro ao enviar código");
        return;
      }

      setPasswordStep("verify");
      setResendTimer(60);
    } catch {
      setPasswordError("Erro de conexão. Tente novamente.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyPasswordCode = async () => {
    if (verificationCode.length !== 6) {
      setPasswordError("Digite o código de 6 dígitos");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const response = await fetch("/api/auth/password-reset/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Código inválido");
        return;
      }

      setPasswordStep("change");
    } catch {
      setPasswordError("Erro de conexão. Tente novamente.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const response = await fetch("/api/auth/password-reset/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: profile.email, 
          code: verificationCode,
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Erro ao alterar senha");
        return;
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        closePasswordModal();
      }, 2000);
    } catch {
      setPasswordError("Erro de conexão. Tente novamente.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Sessions functions
  const openSessionsModal = () => {
    setShowSessionsModal(true);
    // Mock sessions - em producao buscaria do banco
    setSessions([
      {
        id: "1",
        device: "Windows PC",
        browser: "Chrome 120",
        location: "Sao Paulo, BR",
        lastActive: "Agora",
        isCurrent: true,
      },
    ]);
  };

  const handleLogoutSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  // Notification functions
  const handleTogglePush = async (enabled: boolean) => {
    setNotificationLoading(true);
    setNotificationMessage(null);
    
    try {
      if (enabled) {
        // Pedir permissao e registrar service worker
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        
        if (permission !== "granted") {
          setNotificationMessage({ type: "error", text: "Permissao de notificacao negada" });
          setNotificationLoading(false);
          return;
        }

        // Registrar service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // Obter subscription
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        });

        // Salvar no backend
        await fetch("/api/user/notifications/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications_push: true,
            push_subscription: subscription.toJSON()
          })
        });

        setNotificationsPush(true);
        setNotificationMessage({ type: "success", text: "Notificacoes push ativadas com sucesso!" });
      } else {
        // Desativar
        await fetch("/api/user/notifications/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notifications_push: false })
        });
        setNotificationsPush(false);
        setNotificationMessage({ type: "success", text: "Notificacoes push desativadas" });
      }
    } catch (err) {
      console.error("Erro ao configurar push:", err);
      setNotificationMessage({ type: "error", text: "Erro ao configurar notificacoes" });
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleToggleEmail = async (enabled: boolean) => {
    setNotificationLoading(true);
    setNotificationMessage(null);
    
    try {
      await fetch("/api/user/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications_email: enabled })
      });
      setNotificationsEmail(enabled);
      setNotificationMessage({ 
        type: "success", 
        text: enabled ? "Relatorios por email ativados!" : "Relatorios por email desativados" 
      });
    } catch (err) {
      console.error("Erro ao configurar email:", err);
      setNotificationMessage({ type: "error", text: "Erro ao configurar email" });
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleChangeFrequency = async (frequency: "daily" | "weekly") => {
    try {
      await fetch("/api/user/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications_email_frequency: frequency })
      });
      setEmailFrequency(frequency);
    } catch (err) {
      console.error("Erro ao alterar frequencia:", err);
    }
  };

  const handleTestNotification = async (type: "push" | "email") => {
    setNotificationTestLoading(type);
    setNotificationMessage(null);
    
    try {
      const response = await fetch("/api/user/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotificationMessage({ type: "success", text: data.message });
      } else {
        setNotificationMessage({ type: "error", text: data.error });
      }
    } catch (err) {
      setNotificationMessage({ type: "error", text: "Erro ao enviar teste" });
    } finally {
      setNotificationTestLoading(null);
    }
  };

  // Delete account functions
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch("/api/user/delete", { method: "DELETE" });
      if (response.ok) {
        router.push("/auth/login");
      }
    } catch {
      console.error("Erro ao excluir conta");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Informações Pessoais
          </h2>
          {profile.email_verified && (
            <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Email verificado
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Informações salvas com sucesso!
          </div>
        )}

        <div className="grid gap-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={profile.email}
                disabled
                className="pl-9 bg-secondary/50 border-border text-muted-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CPF</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={profile.cpf}
                disabled
                className="pl-9 bg-secondary/50 border-border text-muted-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O CPF não pode ser alterado após o cadastro
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={profile.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setProfile({ ...profile, phone: formatted });
                }}
                placeholder="(11) 99999-9999"
                className="pl-9 bg-secondary border-border"
                maxLength={15}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </motion.div>

      {/* KYC Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Verificação de Identidade (KYC)
        </h2>

        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              profile.kyc_status === "approved" 
                ? "bg-green-500/10" 
                : profile.kyc_status === "pending" 
                  ? "bg-yellow-500/10" 
                  : "bg-red-500/10"
            }`}>
              <Shield className={`w-6 h-6 ${
                profile.kyc_status === "approved" 
                  ? "text-green-500" 
                  : profile.kyc_status === "pending" 
                    ? "text-yellow-500" 
                    : "text-red-500"
              }`} />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {profile.kyc_status === "approved" 
                  ? "Verificação Aprovada" 
                  : profile.kyc_status === "pending" 
                    ? "Verificação Pendente" 
                    : "Verificação Necessária"}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.kyc_status === "approved" 
                  ? "Sua identidade foi verificada com sucesso" 
                  : profile.kyc_status === "pending" 
                    ? "Aguardando análise dos documentos" 
                    : "Complete a verificação para habilitar saques"}
              </p>
            </div>
          </div>
          {profile.kyc_status === "approved" ? (
            <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Aprovado
            </div>
          ) : (
            <Button variant="outline" onClick={() => window.location.href = "/dashboard/kyc"}>
              {profile.kyc_status === "pending" ? "Ver Status" : "Verificar"}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Notifications Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificacoes
        </h2>

        {notificationMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            notificationMessage.type === "success" 
              ? "bg-green-500/10 border border-green-500/20 text-green-500" 
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}>
            {notificationMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {notificationMessage.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Push Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 rounded-xl gap-3">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${notificationsPush ? "bg-green-500/10" : "bg-muted/50"}`}>
                <BellRing className={`w-6 h-6 ${notificationsPush ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">Notificacoes Push</p>
                <p className="text-sm text-muted-foreground">
                  Receba alertas de vendas em tempo real no navegador
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationsPush && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestNotification("push")}
                  disabled={notificationTestLoading === "push"}
                >
                  {notificationTestLoading === "push" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Testar
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant={notificationsPush ? "destructive" : "default"}
                onClick={() => handleTogglePush(!notificationsPush)}
                disabled={notificationLoading || !pushSupported}
              >
                {notificationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : notificationsPush ? (
                  "Desativar"
                ) : (
                  "Ativar"
                )}
              </Button>
            </div>
          </div>
          {!pushSupported && (
            <p className="text-xs text-muted-foreground px-4">
              Seu navegador nao suporta notificacoes push.
            </p>
          )}
          {pushPermission === "denied" && (
            <p className="text-xs text-destructive px-4">
              Permissao de notificacao bloqueada. Habilite nas configuracoes do navegador.
            </p>
          )}

          {/* Email Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 rounded-xl gap-3">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${notificationsEmail ? "bg-primary/10" : "bg-muted/50"}`}>
                <Mail className={`w-6 h-6 ${notificationsEmail ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">Relatorios por Email</p>
                <p className="text-sm text-muted-foreground">
                  Receba resumos de vendas e metricas por email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationsEmail && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestNotification("email")}
                  disabled={notificationTestLoading === "email"}
                >
                  {notificationTestLoading === "email" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Testar
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant={notificationsEmail ? "destructive" : "default"}
                onClick={() => handleToggleEmail(!notificationsEmail)}
                disabled={notificationLoading}
              >
                {notificationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : notificationsEmail ? (
                  "Desativar"
                ) : (
                  "Ativar"
                )}
              </Button>
            </div>
          </div>

          {/* Email Frequency */}
          {notificationsEmail && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/30 rounded-xl gap-3 ml-4 sm:ml-12">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Frequencia dos Relatorios</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={emailFrequency === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChangeFrequency("daily")}
                >
                  Diario
                </Button>
                <Button 
                  variant={emailFrequency === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChangeFrequency("weekly")}
                >
                  Semanal
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Aparencia
            </h2>
            <p className="text-sm text-muted-foreground">
              Personalize a interface do sistema
            </p>
          </div>
        </div>

        <ThemeToggleWithLabel />
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Seguranca
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Alterar Senha</p>
                <p className="text-sm text-muted-foreground">
                  Um codigo sera enviado para seu email
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={openPasswordModal}>
              <KeyRound className="w-4 h-4 mr-2" />
              Alterar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3 sm:gap-4">
  <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10">
  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
  </div>
  <div>
  <p className="font-medium text-foreground text-sm sm:text-base">
  Autenticacao de Dois Fatores
  </p>
  <p className="text-xs sm:text-sm text-muted-foreground">
  Proteja sua conta com codigo do app
  </p>
  </div>
  </div>
  <Button variant="outline" className="text-xs sm:text-sm" disabled>Em breve</Button>
  </div>

          {/* Sessoes Ativas */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-500/10">
                <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm sm:text-base">Sessoes Ativas</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gerencie seus dispositivos conectados
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={openSessionsModal} className="text-xs sm:text-sm">
              Ver Sessoes
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-destructive/20 rounded-2xl p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          Zona de Perigo
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-destructive/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Excluir Conta</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Esta acao e irreversivel
              </p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Excluir
          </Button>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 relative"
          >
            <button
              onClick={closePasswordModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {passwordStep === "request" && "Alterar Senha"}
                {passwordStep === "verify" && "Verificar Código"}
                {passwordStep === "change" && "Nova Senha"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {passwordStep === "request" && "Enviaremos um código para seu email"}
                {passwordStep === "verify" && `Código enviado para ${profile.email}`}
                {passwordStep === "change" && "Digite sua nova senha"}
              </p>
            </div>

            {passwordError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Senha alterada com sucesso!
              </div>
            )}

            {passwordStep === "request" && (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Email de destino:</p>
                  <p className="font-medium text-foreground">{profile.email}</p>
                </div>
                <Button
                  onClick={handleSendPasswordCode}
                  disabled={passwordLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar Código
                </Button>
              </div>
            )}

            {passwordStep === "verify" && (
              <div className="space-y-4">
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] bg-secondary border-border font-mono"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerifyPasswordCode}
                  disabled={passwordLoading || verificationCode.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Verificar Código
                </Button>
                <button
                  onClick={handleSendPasswordCode}
                  disabled={resendTimer > 0 || passwordLoading}
                  className="w-full text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar código"}
                </button>
              </div>
            )}

            {passwordStep === "change" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      className="pl-9 pr-10 bg-secondary border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      className="pl-9 pr-10 bg-secondary border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Alterar Senha
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md relative max-h-[80vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowSessionsModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Monitor className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Sessoes Ativas
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Dispositivos conectados a sua conta
              </p>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="p-3 sm:p-4 bg-secondary/50 rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {session.device}
                          {session.isCurrent && (
                            <span className="ml-2 text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                              Atual
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.browser}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleLogoutSession(session.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {sessions.length > 1 && (
              <Button
                variant="outline"
                className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setSessions(sessions.filter(s => s.isCurrent))}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Encerrar Outras Sessoes
              </Button>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-destructive/30 rounded-2xl p-4 sm:p-6 w-full max-w-md relative"
          >
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText("");
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-destructive">
                Excluir Conta
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 px-2">
                Esta acao e <strong>permanente e irreversivel</strong>. 
                Todos os seus dados serao excluidos.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 text-center">
                  Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  className="bg-secondary border-border text-center font-mono"
                  placeholder="EXCLUIR"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteConfirmText !== "EXCLUIR" || deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Excluir Conta
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
