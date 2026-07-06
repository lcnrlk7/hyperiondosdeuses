"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  ScanFace,
  Loader2,
  Zap,
  Lock,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type KycStatus =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "resubmitted"
  | "approved"
  | "declined"
  | "expired"
  | "abandoned";

function KYCPageInner() {
  const params = useSearchParams();
  const justReturned = params.get("kyc") === "done";

  const [status, setStatus] = useState<KycStatus>("not_started");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/verify/liveness");
      const data = await res.json();
      if (res.ok && data.status) {
        setStatus(data.status as KycStatus);
      }
    } catch {
      // silencioso — mantem o status atual
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Ao voltar da Didit, faz um polling curto ate o webhook atualizar o status.
  useEffect(() => {
    if (!justReturned) return;
    let attempts = 0;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      attempts++;
      await loadStatus();
      if (attempts < 12 && !stopped) {
        setTimeout(tick, 3000);
      }
    };
    const id = setTimeout(tick, 2000);
    return () => {
      stopped = true;
      clearTimeout(id);
    };
  }, [justReturned, loadStatus]);

  const startVerification = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/verify/liveness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/dashboard/kyc?kyc=done" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Não foi possível iniciar a verificação. Tente novamente.");
        setStarting(false);
        return;
      }
      // Redireciona para o fluxo hospedado da Didit
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStarting(false);
    }
  };

  const isApproved = status === "approved";
  const isPending =
    status === "in_progress" ||
    status === "in_review" ||
    status === "resubmitted" ||
    justReturned;
  const isRejected = status === "declined" || status === "expired" || status === "abandoned";

  const StatusBadge = () => {
    if (isApproved) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Verificado</span>
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-500">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Em análise</span>
        </div>
      );
    }
    if (isRejected) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-500">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Não concluída</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
        <ShieldCheck className="w-5 h-5" />
        <span className="font-medium">Pendente</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Verificação de Identidade</h1>
          <p className="text-muted-foreground mt-1">
            Verificação 100% automática e instantânea
          </p>
        </div>
        <StatusBadge />
      </div>

      {/* Estado: Aprovado */}
      {isApproved && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Verificação Concluída!</h3>
                  <p className="text-muted-foreground max-w-md">
                    Sua identidade foi verificada com sucesso. Você tem acesso completo a todas as
                    funcionalidades da Hyperion Pay, incluindo saques e transferências.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Estado: Em análise (aguardando webhook) */}
      {!isApproved && isPending && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-yellow-500/20">
                  <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Confirmando sua verificação</h3>
                  <p className="text-muted-foreground max-w-md">
                    Estamos processando sua verificação de identidade. Isso costuma levar apenas alguns
                    segundos. Esta página atualiza automaticamente.
                  </p>
                </div>
                <Button variant="outline" onClick={loadStatus}>
                  Atualizar status
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Estado: Não iniciado ou rejeitado -> iniciar verificacao */}
      {!isApproved && !isPending && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={isRejected ? "border-red-500/20 bg-red-500/5" : "border-primary/20 bg-primary/5"}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className={`p-4 rounded-full ${isRejected ? "bg-red-500/20" : "bg-primary/20"}`}>
                    <ScanFace className={`w-12 h-12 ${isRejected ? "text-red-500" : "text-primary"}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {isRejected ? "Vamos tentar novamente" : "Verifique sua identidade"}
                    </h3>
                    <p className="text-muted-foreground max-w-lg text-pretty">
                      {isRejected
                        ? "Não conseguimos concluir sua verificação anterior. Refaça o processo com seu documento em mãos e boa iluminação."
                        : "A verificação é feita de forma segura e automática. Você vai precisar do seu documento de identidade (RG, CNH ou Passaporte) e da câmera do seu dispositivo. Leva menos de 1 minuto."}
                    </p>
                  </div>

                  {error && (
                    <div className="w-full max-w-md p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    size="lg"
                    onClick={startVerification}
                    disabled={starting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[220px]"
                  >
                    {starting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-4 h-4 mr-2" />
                        {isRejected ? "Refazer verificação" : "Iniciar verificação"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Como funciona */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "Documento + Selfie",
                desc: "Você fotografa seu documento e faz uma selfie para comprovar que é você.",
              },
              {
                icon: Zap,
                title: "Aprovação instantânea",
                desc: "A análise é automática e o resultado sai em segundos, sem espera manual.",
              },
              {
                icon: Lock,
                title: "Seguro e criptografado",
                desc: "Seus dados são processados com segurança pelo nosso parceiro de verificação.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function KYCPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KYCPageInner />
    </Suspense>
  );
}
