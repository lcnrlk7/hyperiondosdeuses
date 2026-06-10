"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Copy,
  User,
  Building2,
  Mail,
  Phone,
  Key,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
}

const keyTypeIcons: Record<string, LucideIcon> = {
  cpf: User,
  cnpj: Building2,
  email: Mail,
  phone: Phone,
  random: Key,
};

const keyTypeLabels: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "Email",
  phone: "Telefone",
  random: "Chave Aleatoria",
};

export function PixKeysContentClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [keyType, setKeyType] = useState<string>("email");
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadPixKeys();
  }, []);

  async function loadPixKeys() {
    try {
      const response = await fetch("/api/pix-keys");
      const data = await response.json();
      if (data.pixKeys) {
        setKeys(data.pixKeys);
      }
    } catch (error) {
      console.error("Error loading pix keys:", error);
    } finally {
      setLoadingKeys(false);
    }
  }

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!keyValue && keyType !== "random") return;
    setLoading(true);

    try {
      const response = await fetch("/api/pix-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyType,
          keyValue: keyType === "random" ? null : keyValue,
          isPrimary: keys.length === 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.pixKey) {
        setKeys((prev) => [data.pixKey, ...prev]);
        setIsOpen(false);
        setKeyValue("");
        setKeyType("email");
        showToast("Chave PIX criada com sucesso!", "success");
      } else {
        showToast(data.error || "Erro ao criar chave PIX", "error");
      }
    } catch (error) {
      console.error("Erro ao criar chave:", error);
      showToast("Erro ao criar chave PIX", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/pix-keys?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        showToast("Chave PIX excluida com sucesso!", "success");
      } else {
        const data = await response.json();
        showToast(data.error || "Erro ao excluir chave", "error");
      }
    } catch (error) {
      console.error("Erro ao excluir chave:", error);
      showToast("Erro ao excluir chave PIX", "error");
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Chave copiada!", "success");
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  if (loadingKeys) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            Cadastre suas chaves para receber seus saques
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Nova Chave
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Criar Chave PIX</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tipo de Chave
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(keyTypeLabels).map(([type, label]) => {
                    const IconComponent = keyTypeIcons[type] || Key;
                    return (
                      <button
                        key={type}
                        onClick={() => setKeyType(type)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          keyType === type
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {keyType !== "random" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Valor da Chave
                  </label>
                  <Input
                    placeholder={
                      keyType === "cpf"
                        ? "000.000.000-00"
                        : keyType === "cnpj"
                        ? "00.000.000/0000-00"
                        : keyType === "email"
                        ? "seu@email.com"
                        : "+55 11 99999-9999"
                    }
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              )}

              {keyType === "random" && (
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <Key className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Uma chave aleatoria sera gerada automaticamente
                  </p>
                </div>
              )}

              <Button
                onClick={handleCreate}
                disabled={loading || (keyType !== "random" && !keyValue)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar Chave"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
            toast.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : "bg-red-500/20 border border-red-500/30 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </motion.div>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-foreground font-medium">
            Nenhuma chave PIX cadastrada
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre uma chave para receber seus saques
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {keys.map((key, index) => {
            const IconComponent = keyTypeIcons[key.key_type] || Key;
            return (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {keyTypeLabels[key.key_type]}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {key.key_value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada em {formatDate(key.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(key.key_value)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(key.id)}
                    disabled={deleting === key.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deleting === key.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
