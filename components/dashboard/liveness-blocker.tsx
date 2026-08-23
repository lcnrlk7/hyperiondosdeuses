"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ScanFace, Clock, ShieldCheck, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LivenessBlockerProps {
  livenessStatus: string;
  onRefresh?: () => void;
}

export function LivenessBlocker({ livenessStatus, onRefresh }: LivenessBlockerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Liberação automática: no retorno da Didit, envia o verificationSessionId
  // imediatamente para o servidor reconciliar a decisão oficial. Continua
  // consultando enquanto estiver em análise para liberar sem recarregar a página.
  useEffect(() => {
    if (livenessStatus === "approved" || !onRefresh) return;

    let cancelled = false;
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("verificationSessionId");
        const endpoint = sessionId
          ? `/api/verify/liveness?sessionId=${encodeURIComponent(sessionId)}`
          : "/api/verify/liveness";
        const res = await fetch(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.status && data.status !== livenessStatus) {
          await onRefresh();
        }
        if (data.status === "approved") {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("liveness");
          cleanUrl.searchParams.delete("verificationSessionId");
          cleanUrl.searchParams.delete("status");
          window.history.replaceState({}, "", cleanUrl.toString());
        }
      } catch {
        // Silencioso — tenta novamente no próximo ciclo.
      }
    };

    void checkStatus();
    const interval = window.setInterval(checkStatus, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [livenessStatus, onRefresh]);

  // Se aprovado, nao bloqueia
  if (livenessStatus === "approved") {
    return null;
  }

  const statusConfig: Record<
    string,
    {
      icon: typeof ScanFace;
      iconColor: string;
      bgColor: string;
      borderColor: string;
      title: string;
      description: string;
      showButton: boolean;
      buttonText: string;
      inReview: boolean;
    }
  > = {
    not_started: {
      icon: ScanFace,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      title: "Verificação Obrigatória",
      description:
        "Para começar a usar a Hyperion Pay, conclua sua verificação de identidade por prova de vida. O processo é rápido, seguro e a liberação é automática.",
      showButton: true,
      buttonText: "Iniciar Verificação",
      inReview: false,
    },
    abandoned: {
      icon: ScanFace,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      title: "Verificação Não Concluída",
      description:
        "Você não finalizou sua verificação de prova de vida. Conclua o processo para liberar o acesso à sua conta. A liberação é automática.",
      showButton: true,
      buttonText: "Continuar Verificação",
      inReview: false,
    },
    in_progress: {
      icon: ScanFace,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      title: "Conclua sua Verificação",
      description:
        "Sua verificação de prova de vida foi iniciada mas ainda não foi finalizada. Continue de onde parou para liberar o acesso.",
      showButton: true,
      buttonText: "Continuar Verificação",
      inReview: false,
    },
    resubmitted: {
      icon: ScanFace,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      title: "Reenvio Necessário",
      description:
        "Precisamos que você refaça sua verificação de prova de vida. Assim que aprovada, sua conta será liberada automaticamente.",
      showButton: true,
      buttonText: "Refazer Verificação",
      inReview: false,
    },
    in_review: {
      icon: Clock,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      title: "Verificação em Análise",
      description:
        "Sua prova de vida foi enviada e está em análise. Assim que aprovada, o acesso à sua conta será liberado automaticamente. Isso costuma levar apenas alguns instantes.",
      showButton: false,
      buttonText: "",
      inReview: true,
    },
    declined: {
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      title: "Verificação Recusada",
      description:
        "Não foi possível confirmar sua identidade na verificação anterior. Por favor, tente novamente em um ambiente bem iluminado e com o rosto totalmente visível.",
      showButton: true,
      buttonText: "Tentar Novamente",
      inReview: false,
    },
    expired: {
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      title: "Verificação Expirada",
      description:
        "Sua verificação de prova de vida expirou. Refaça o processo para liberar o acesso à sua conta. A liberação é automática.",
      showButton: true,
      buttonText: "Refazer Verificação",
      inReview: false,
    },
  };

  const config = statusConfig[livenessStatus] || statusConfig.not_started;
  const StatusIcon = config.icon;

  async function startVerification() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const response = await fetch("/api/verify/liveness", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();

      if (response.ok && data.status === "approved") {
        await onRefresh?.();
        setLoading(false);
        return;
      }

      if (!response.ok || !data.url) {
        setError(
          data.error || "Não foi possível iniciar a verificação. Tente novamente.",
        );
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Erro ao iniciar verificação:", err);
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  const handleRefresh = useCallback(() => {
    if (onRefresh) onRefresh();
  }, [onRefresh]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`max-w-md w-full rounded-2xl border ${config.borderColor} ${config.bgColor} p-8 text-center`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={40} height={40} />
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-foreground">Hyperion</span>
            <span className="text-xl font-bold text-primary">Pay</span>
          </div>
        </div>

        {/* Icon */}
        <div
          className={`w-20 h-20 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center mx-auto mb-6`}
        >
          <StatusIcon className={`w-10 h-10 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">{config.title}</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed text-pretty">
          {config.description}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* In review badge */}
        {config.inReview && (
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 mx-auto w-fit">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm text-yellow-500 font-medium">Em análise</span>
          </div>
        )}

        {/* Action Button */}
        {config.showButton ? (
          <Button
            onClick={startVerification}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ScanFace className="w-4 h-4 mr-2" />
            )}
            {config.buttonText}
          </Button>
        ) : (
          <Button onClick={handleRefresh} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar status
          </Button>
        )}

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Verificação automática e segura, exigida para a segurança de todas as transações.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
