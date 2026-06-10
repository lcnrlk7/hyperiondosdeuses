"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  Key,
  FileText,
  Wallet,
  Zap,
  Gift,
  X,
} from "lucide-react";
import { useOnboarding } from "./onboarding-provider";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  isComplete: boolean;
}

interface ActivationChecklistProps {
  userId: string;
  kycStatus?: string;
  hasApiKey?: boolean;
  hasPixKey?: boolean;
  hasWithdrawal?: boolean;
  hasTransaction?: boolean;
  has2FA?: boolean;
}

export function ActivationChecklist({
  userId,
  kycStatus = "pending",
  hasApiKey = false,
  hasPixKey = false,
  hasWithdrawal = false,
  hasTransaction = false,
  has2FA = false,
}: ActivationChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const { startOnboarding, hasCompletedOnboarding } = useOnboarding();

  useEffect(() => {
    const dismissed = localStorage.getItem(`lp_checklist_dismissed_${userId}`);
    setIsDismissed(dismissed === "true");
  }, [userId]);

  const checklistItems: ChecklistItem[] = [
    {
      id: "profile",
      title: "Complete seu perfil",
      description: "Adicione suas informacoes pessoais",
      href: "/dashboard/profile",
      icon: User,
      isComplete: true, // Assumimos que o cadastro esta completo
    },
    {
      id: "kyc",
      title: "Verificacao KYC",
      description: "Envie seus documentos para verificacao",
      href: "/dashboard/kyc",
      icon: FileText,
      isComplete: kycStatus === "approved",
    },
    {
      id: "pix_key",
      title: "Cadastre uma chave PIX",
      description: "Adicione sua chave para receber pagamentos",
      href: "/dashboard/wallet",
      icon: Key,
      isComplete: hasPixKey,
    },
    {
      id: "2fa",
      title: "Ative a autenticacao 2FA",
      description: "Proteja sua conta com verificacao em duas etapas",
      href: "/dashboard/settings",
      icon: Shield,
      isComplete: has2FA,
    },
    {
      id: "api_key",
      title: "Configure a integracao",
      description: "Copie sua chave API e integre seu sistema",
      href: "/dashboard/integration",
      icon: Zap,
      isComplete: hasApiKey,
    },
    {
      id: "first_transaction",
      title: "Receba seu primeiro pagamento",
      description: "Faca uma transacao de teste ou real",
      href: "/dashboard/checkout",
      icon: Wallet,
      isComplete: hasTransaction,
    },
  ];

  const completedCount = checklistItems.filter((item) => item.isComplete).length;
  const totalCount = checklistItems.length;
  const progress = (completedCount / totalCount) * 100;
  const isAllComplete = completedCount === totalCount;

  const handleDismiss = () => {
    localStorage.setItem(`lp_checklist_dismissed_${userId}`, "true");
    setIsDismissed(true);
  };

  if (isDismissed || isAllComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Ativar sua conta</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} de {totalCount} passos completos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-border"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                className="text-primary transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {Math.round(progress)}%
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-2">
              {checklistItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    item.isComplete
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.isComplete ? "bg-green-500/20" : "bg-border"
                    }`}
                  >
                    {item.isComplete ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.isComplete ? "text-green-500 line-through" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                  {!item.isComplete && (
                    <span className="text-xs text-primary font-medium">Fazer</span>
                  )}
                </Link>
              ))}

              {/* Tour Button */}
              {!hasCompletedOnboarding && (
                <Button
                  variant="outline"
                  className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={startOnboarding}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Fazer tour guiado
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
