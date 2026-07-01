"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function ServiceWorkerRegister() {
  const { user } = useAuth();
  const [, setPermissionState] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Registrar Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("[SW] Service Worker registration failed:", error);
      });

    // Verificar permissão atual
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Solicitar permissão e registrar subscription quando o usuário estiver logado
  useEffect(() => {
    if (!user?.id || !VAPID_PUBLIC_KEY) {
      return;
    }

    async function subscribeToNotifications() {
      try {
        // Verificar se já tem permissão
        if (Notification.permission === "denied") {
          console.log("[SW] Notification permission denied");
          return;
        }

        // Solicitar permissão se ainda não foi concedida
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          setPermissionState(permission);
          if (permission !== "granted") {
            console.log("[SW] Notification permission not granted");
            return;
          }
        }

        // Obter registration do SW
        const registration = await navigator.serviceWorker.ready;

        // Verificar se já tem uma subscription
        let subscription = await registration.pushManager.getSubscription();

        // Se a subscription existente foi criada com OUTRA chave VAPID
        // (ex.: chave de demonstracao antiga), ela e inutilizavel pelo servidor.
        // Nesse caso, cancelamos e criamos uma nova com a chave correta.
        if (subscription) {
          const currentKey = subscription.options?.applicationServerKey;
          const expectedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          const keysMatch =
            currentKey &&
            new Uint8Array(currentKey as ArrayBuffer).toString() ===
              expectedKey.toString();
          if (!keysMatch) {
            try {
              await subscription.unsubscribe();
            } catch {
              /* ignora erro ao cancelar */
            }
            subscription = null;
          }
        }

        if (!subscription && VAPID_PUBLIC_KEY) {
          // Criar nova subscription
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
        
        if (!subscription) {
          console.log("[SW] No subscription available");
          return;
        }

        // Enviar subscription para o servidor
        const subscriptionJSON = subscription.toJSON();
        
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscriptionJSON.endpoint,
            p256dh: subscriptionJSON.keys?.p256dh,
            auth: subscriptionJSON.keys?.auth,
          }),
        });

        console.log("[SW] Push subscription registered successfully");
      } catch (error) {
        console.error("[SW] Error subscribing to push notifications:", error);
      }
    }

    subscribeToNotifications();
  }, [user?.id]);

  return null;
}
