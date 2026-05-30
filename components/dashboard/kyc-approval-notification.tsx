"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CheckCircle, X, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";

interface KYCApprovalNotificationProps {
  userId: string;
  userName?: string | null;
  kycApprovalNotified?: boolean;
}

export function KYCApprovalNotification({ userId, userName, kycApprovalNotified }: KYCApprovalNotificationProps) {
  const [showModal, setShowModal] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Atualizar tamanho da janela para o confetti
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    // Só mostrar se ainda não foi notificado no banco de dados
    if (kycApprovalNotified === false) {
      // Mostrar modal e confetti
      setShowModal(true);
      setShowConfetti(true);
      
      // Parar confetti após 5 segundos
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  }, [kycApprovalNotified]);

  const handleClose = async () => {
    setShowModal(false);
    setShowConfetti(false);
    
    // Marcar como notificado no banco de dados
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_approval_notified: true }),
      });
    } catch (error) {
      console.error("Erro ao marcar notificacao como vista:", error);
    }
  };

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
            colors={["#6366f1", "#818cf8", "#a5b4fc", "#00ff88", "#00ccff", "#c084fc"]}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
        />
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-foreground mb-2"
                >
                  Parabéns{userName ? `, ${userName}` : ""}!
                </motion.h2>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 mb-4"
                >
                  <PartyPopper className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">Sua conta foi aprovada!</span>
                  <PartyPopper className="w-5 h-5 text-primary" />
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-6"
                >
                  Sua verificação KYC foi concluída com sucesso. Agora você tem acesso completo a todas as funcionalidades da plataforma Hyperion Pay.
                </motion.p>

                {/* Features unlocked */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-secondary/50 rounded-xl p-4 mb-6"
                >
                  <p className="text-sm font-medium text-foreground mb-3">Funcionalidades desbloqueadas:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Receber PIX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Enviar PIX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Saques</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>API Gateway</span>
                    </div>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={handleClose}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Começar a usar
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
