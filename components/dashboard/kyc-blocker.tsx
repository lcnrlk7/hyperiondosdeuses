"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, FileCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KYCBlockerProps {
  kycStatus: string;
}

export function KYCBlocker({ kycStatus }: KYCBlockerProps) {
  const pathname = usePathname();
  
  // Se aprovado, não mostrar nada
  if (kycStatus === "approved") {
    return null;
  }
  
  // Permitir acesso à página de KYC mesmo sem aprovação
  if (pathname === "/dashboard/kyc") {
    return null;
  }

  const statusConfig = {
    pending: {
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      title: "Verificação KYC Pendente",
      description: "Para utilizar todas as funcionalidades da Hyperion Pay, você precisa completar a verificação de identidade (KYC).",
      showButton: true,
      buttonText: "Completar Verificação",
    },
    submitted: {
      icon: Clock,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      title: "Verificação em Análise",
      description: "Seus documentos foram enviados e estão sendo analisados. Você receberá uma notificação assim que a verificação for concluída. Prazo: 24-48 horas.",
      showButton: false,
      buttonText: "",
    },
    rejected: {
      icon: XCircle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      title: "Verificação Rejeitada",
      description: "Infelizmente sua verificação foi rejeitada. Por favor, envie novamente seus documentos seguindo as instruções corretamente.",
      showButton: true,
      buttonText: "Enviar Novamente",
    },
  };

  const config = statusConfig[kycStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

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
            <span className="text-xl font-bold text-white">Hyperion</span>
            <span className="text-xl font-bold text-primary">Pay</span>
          </div>
        </div>

        {/* Icon */}
        <div className={`w-20 h-20 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center mx-auto mb-6`}>
          <StatusIcon className={`w-10 h-10 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {config.title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {config.description}
        </p>

        {/* Status Badge */}
        {kycStatus === "submitted" && (
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mx-auto w-fit">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm text-blue-400 font-medium">Em análise</span>
          </div>
        )}

        {/* Action Button */}
        {config.showButton && (
          <Link href="/dashboard/kyc">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
              <FileCheck className="w-4 h-4 mr-2" />
              {config.buttonText}
            </Button>
          </Link>
        )}

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            A verificação KYC é necessária para garantir a segurança de todas as transações e cumprir com as regulamentações vigentes.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
