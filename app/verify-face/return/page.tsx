"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Loader2, ScanFace, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "checking" | "approved" | "declined" | "error";

function VerifyFaceReturnInner() {
  const params = useSearchParams();
  const router = useRouter();
  const challengeId = params.get("challenge");
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("Confirmando sua verificacao...");

  useEffect(() => {
    if (!challengeId) {
      setPhase("error");
      setMessage("Verificacao invalida.");
      return;
    }

    let attempts = 0;
    let stopped = false;

    async function finishLogin() {
      const raw = sessionStorage.getItem("face_login");
      if (!raw) {
        // Sem ticket de login -> provavelmente fluxo de saque
        return false;
      }
      try {
        const { ticket } = JSON.parse(raw);
        const res = await fetch("/api/auth/face-login/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket, challengeId }),
        });
        const data = await res.json();
        if (res.ok && data.token && data.user) {
          localStorage.setItem("auth-token", data.token);
          localStorage.setItem("auth-user", JSON.stringify(data.user));
          sessionStorage.removeItem("face_login");
          setPhase("approved");
          setMessage("Identidade confirmada! Entrando...");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1200);
          return true;
        }
      } catch {
        // ignora — tenta de novo
      }
      return false;
    }

    function finishWithdrawal() {
      const raw = sessionStorage.getItem("face_withdraw");
      if (!raw) return false;
      try {
        const { returnTo } = JSON.parse(raw);
        sessionStorage.removeItem("face_withdraw");
        setPhase("approved");
        setMessage("Identidade confirmada! Retomando o saque...");
        const dest = returnTo || "/dashboard/carteira";
        const sep = dest.includes("?") ? "&" : "?";
        setTimeout(() => {
          window.location.href = `${dest}${sep}faceChallenge=${challengeId}`;
        }, 1000);
        return true;
      } catch {
        return false;
      }
    }

    async function poll() {
      if (stopped) return;
      attempts++;
      try {
        const res = await fetch(
          `/api/verify/face-challenge?challengeId=${challengeId}`,
        );
        const data = await res.json();

        if (data.status === "approved") {
          stopped = true;
          const didLogin = await finishLogin();
          if (!didLogin) finishWithdrawal();
          return;
        }

        if (
          data.status === "declined" ||
          data.status === "expired" ||
          data.status === "abandoned"
        ) {
          stopped = true;
          setPhase("declined");
          setMessage(
            "Nao foi possivel confirmar sua identidade. Tente novamente.",
          );
          return;
        }
      } catch {
        // erro de rede — continua tentando
      }

      if (attempts > 60) {
        stopped = true;
        setPhase("error");
        setMessage(
          "A verificacao esta demorando. Atualize a pagina para tentar novamente.",
        );
        return;
      }

      setTimeout(poll, 3000);
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [challengeId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/images/logo-hyperion.png"
              alt="Hyperion Pay"
              width={40}
              height={40}
            />
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-white">Hyperion</span>
              <span className="text-xl font-bold text-primary">Pay</span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                phase === "approved"
                  ? "bg-green-500/10"
                  : phase === "declined" || phase === "error"
                    ? "bg-destructive/10"
                    : "bg-primary/10"
              }`}
            >
              {phase === "checking" && (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              )}
              {phase === "approved" && (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              )}
              {(phase === "declined" || phase === "error") && (
                <XCircle className="w-10 h-10 text-destructive" />
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <ScanFace className="w-5 h-5" />
            Verificacao Facial
          </h1>
          <p className="text-muted-foreground mb-6 text-pretty">{message}</p>

          {(phase === "declined" || phase === "error") && (
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Voltar ao login
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyFaceReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyFaceReturnInner />
    </Suspense>
  );
}
