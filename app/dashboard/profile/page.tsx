"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/profile-provider";
import Image from "next/image";
import {
  User,
  Camera,
  Edit,
  Save,
  Trophy,
  Target,
  Gift,
  Star,
  CheckCircle,
  Lock,
  Loader2,
  X,
  Crown,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Mail,
  Phone,
  FileText,
} from "lucide-react";

// Avatares padrão predefinidos
const DEFAULT_AVATARS = [
  { id: 1, url: "/avatars/avatar-1.jpg", name: "Astronauta" },
  { id: 2, url: "/avatars/avatar-2.jpg", name: "Hacker" },
  { id: 3, url: "/avatars/avatar-3.jpg", name: "Gamer" },
  { id: 4, url: "/avatars/avatar-4.jpg", name: "Empresario" },
  { id: 5, url: "/avatars/avatar-5.jpg", name: "Investidor" },
  { id: 6, url: "/avatars/avatar-6.jpg", name: "Trader" },
  { id: 7, url: "/avatars/avatar-7.jpg", name: "Developer" },
  { id: 8, url: "/avatars/avatar-8.jpg", name: "Designer" },
];

// Gerar avatar com iniciais como fallback
const GRADIENT_AVATARS = [
  { id: "g1", gradient: "from-indigo-500 to-violet-500" },
  { id: "g2", gradient: "from-blue-500 to-purple-500" },
  { id: "g3", gradient: "from-green-500 to-teal-500" },
  { id: "g4", gradient: "from-pink-500 to-rose-500" },
  { id: "g5", gradient: "from-yellow-500 to-amber-500" },
  { id: "g6", gradient: "from-indigo-500 to-blue-500" },
];

interface Reward {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_progress: number;
  progress_percent: number;
  reward_type: string;
  reward_name: string | null;
  status: "locked" | "in_progress" | "completed" | "claimed";
  icon: string;
  has_reward: boolean;
  is_delivered: boolean;
}

interface ProfileStats {
  total_transactions: number;
  total_volume: number;
  total_withdrawn: number;
  member_since: string;
  referral_count: number;
  rewards_claimed: number;
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: (profile.name as string) || "",
        bio: (profile.bio as string) || "",
        phone: (profile.phone as string) || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    loadRewardsAndStats();
  }, []);

  async function loadRewardsAndStats() {
    setLoadingRewards(true);
    try {
      const [rewardsRes, statsRes] = await Promise.all([
        fetch("/api/user/rewards/progress"),
        fetch("/api/user/profile/stats"),
      ]);

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingRewards(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("[v0] Avatar upload response:", data);

      if (response.ok) {
        await refreshProfile();
        setShowAvatarModal(false);
      } else {
        console.error("[v0] Avatar upload error:", data.error);
      }
    } catch (error) {
      console.error("[v0] Erro ao fazer upload:", error);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSelectDefaultAvatar(avatarUrl: string) {
    setUploadingAvatar(true);
    try {
      const response = await fetch("/api/user/avatar/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      if (response.ok) {
        await refreshProfile();
        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error("Erro ao selecionar avatar:", error);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function getRewardIcon(icon: string) {
    switch (icon) {
      case "trophy":
        return <Trophy className="w-5 h-5" />;
      case "star":
        return <Star className="w-5 h-5" />;
      case "gift":
        return <Gift className="w-5 h-5" />;
      case "crown":
        return <Crown className="w-5 h-5" />;
      case "zap":
        return <Zap className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
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
      month: "long",
      year: "numeric",
    });
  }

  const avatarUrl = profile?.avatar_url as string | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informacoes e acompanhe suas conquistas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass rounded-2xl p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-4 border-primary/30">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-primary">
                      {(profile?.name || profile?.email)?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-foreground mt-4">
                {profile?.name || "Usuario"}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>

              {profile?.bio && (
                <p className="text-sm text-center text-muted-foreground mt-3 px-4">
                  {profile.bio as string}
                </p>
              )}

              {/* KYC Status */}
              <div className="mt-4 flex items-center gap-2">
                {profile?.kyc_status === "approved" ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                    <Lock className="w-3 h-3" />
                    Pendente verificacao
                  </span>
                )}
              </div>
            </div>

            {/* Informacoes */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Informacoes
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  {isEditing ? "Cancelar" : "Editar"}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Nome</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      maxLength={500}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="Conte um pouco sobre voce..."
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {form.bio.length}/500
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Alteracoes
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm text-foreground">
                        {(profile?.phone as string) || "Nao informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">CPF</p>
                      <p className="text-sm text-foreground">
                        {profile?.cpf ? `***.***.${String(profile.cpf).slice(-6)}` : "Nao informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Membro desde</p>
                      <p className="text-sm text-foreground">
                        {stats?.member_since
                          ? formatDate(stats.member_since)
                          : "..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Estatisticas e Premiacoes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4">
              <TrendingUp className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {stats?.total_transactions || 0}
              </p>
              <p className="text-xs text-muted-foreground">Transacoes</p>
            </div>
            <div className="glass rounded-xl p-4">
              <Zap className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats?.total_volume || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Volume Total</p>
            </div>
            <div className="glass rounded-xl p-4">
              <User className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {stats?.referral_count || 0}
              </p>
              <p className="text-xs text-muted-foreground">Indicados</p>
            </div>
            <div className="glass rounded-xl p-4">
              <Trophy className="w-5 h-5 text-yellow-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {stats?.rewards_claimed || 0}
              </p>
              <p className="text-xs text-muted-foreground">Premios Resgatados</p>
            </div>
          </div>

          {/* Premiacoes em Andamento */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Premiacoes em Andamento
              </h3>
            </div>

            {loadingRewards ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Nenhuma premiacao disponivel no momento
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Continue usando a plataforma para desbloquear recompensas!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => {
                  const progress = reward.progress_percent;
                  const isCompleted = reward.status === "completed";
                  const isClaimed = reward.status === "claimed";

                  return (
                    <div
                      key={reward.id}
                      className={`p-4 rounded-xl border ${
                        isClaimed
                          ? "bg-green-500/5 border-green-500/20"
                          : isCompleted
                          ? "bg-primary/5 border-primary/20"
                          : "bg-secondary/50 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isClaimed
                                ? "bg-green-500/20 text-green-400"
                                : isCompleted
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {getRewardIcon(reward.icon)}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground flex items-center gap-2">
                              Meta {reward.name}
                              {reward.has_reward && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                                  {reward.reward_name}
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {reward.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {reward.has_reward && (
                            <p className="text-sm font-bold text-primary">
                              {reward.reward_name}
                            </p>
                          )}
                          {isClaimed ? (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Entregue
                            </span>
                          ) : isCompleted ? (
                            <span className="text-xs text-primary font-medium">
                              Conquistado!
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {!isClaimed && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>
                              {formatCurrency(reward.current_progress)}
                            </span>
                            <span>{formatCurrency(reward.target_amount)}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                isCompleted
                                  ? "bg-primary"
                                  : "bg-gradient-to-r from-primary/50 to-primary"
                              }`}
                            />
                          </div>
                        </div>
                      )}


                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal de Avatar */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Escolher Foto de Perfil
                </h2>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Custom */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Fazer upload de foto
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadAvatar(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Clique para fazer upload
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF. Max 5MB
                  </span>
                </button>
              </div>

              {/* Avatares com Gradiente */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Avatares com cor
                </p>
                <div className="grid grid-cols-6 gap-3">
                  {GRADIENT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() =>
                        handleSelectDefaultAvatar(`gradient:${avatar.gradient}`)
                      }
                      disabled={uploadingAvatar}
                      className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors disabled:opacity-50"
                    >
                      <div
                        className={`w-full h-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-lg">
                          {(profile?.name || profile?.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatares Padrao */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Avatares predefinidos
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectDefaultAvatar(avatar.url)}
                      disabled={uploadingAvatar}
                      className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-colors disabled:opacity-50"
                    >
                      <div className="aspect-square bg-secondary overflow-hidden">
                        <Image
                          src={avatar.url}
                          alt={avatar.name}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {avatar.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
