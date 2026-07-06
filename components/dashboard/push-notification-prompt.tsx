"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

interface PushNotificationPromptProps {
  userId: string;
}

export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    // Verificar se já tem permissão ou já foi negado
    if (Notification.permission === "granted") {
      checkExistingSubscription();
      return;
    }

    if (Notification.permission === "denied") {
      return;
    }

    // Verificar se já mostrou o prompt recentemente
    const lastPrompt = localStorage.getItem("push_prompt_shown");
    if (lastPrompt) {
      const daysSincePrompt = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < 7) {
        return;
      }
    }

    // Mostrar prompt após 3 segundos
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId]);

  async function checkExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("[v0] Error checking subscription:", error);
    }
  }

  async function subscribeToPush() {
    if (!VAPID_PUBLIC_KEY) {
      console.error("[v0] VAPID public key not configured");
      return;
    }

    setIsSubscribing(true);

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        setShowPrompt(false);
        localStorage.setItem("push_prompt_shown", Date.now().toString());
        return;
      }

      // Registrar service worker se necessário
      const registration = await navigator.serviceWorker.ready;

      // Verificar se já está inscrito
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Criar nova subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Enviar subscription para o servidor
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("[v0] Error subscribing to push:", error);
    } finally {
      setIsSubscribing(false);
    }
  }

  function dismissPrompt() {
    setShowPrompt(false);
    localStorage.setItem("push_prompt_shown", Date.now().toString());
  }

  // Não mostrar se já está inscrito ou se o prompt não deve aparecer
  if (isSubscribed || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Ativar notificacoes
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Receba alertas quando um pagamento for confirmado ou quando houver atualizacoes importantes.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={subscribeToPush}
                  disabled={isSubscribing}
                  className="bg-primary hover:bg-primary/90 text-xs"
                >
                  {isSubscribing ? (
                    "Ativando..."
                  ) : (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissPrompt}
                  className="text-xs"
                >
                  Agora nao
                </Button>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper para converter a VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
  .replace(/-/g, "+")
  .replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
  outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
