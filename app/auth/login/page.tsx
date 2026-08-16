"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Lock, Loader2, ArrowLeft, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "credentials" | "2fa" | "email-code";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("credentials");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          twoFactorCode: step === "2fa" ? twoFactorCode : undefined,
          isBackupCode: step === "2fa" ? isBackupCode : undefined,
        }),
      });

      const data = await response.json();

      // Verificar se precisa de 2FA
      if (data.requires2FA && step !== "2fa") {
        setStep("2fa");
        setLoading(false);
        return;
      }

      // Verificar se precisa do codigo de acesso por email
      if (data.requiresEmailCode) {
        setStep("email-code");
        setEmailCode("");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "Erro ao fazer login");
        if (data.requires2FA) {
          setTwoFactorCode("");
        }
        return;
      }

      setError("Resposta invalida do servidor");
    } catch {
      setError("Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Codigo invalido");
        return;
      }

      // Salvar token e dados do usuario no localStorage
      if (data.token && data.user) {
        localStorage.setItem("auth-token", data.token);
        localStorage.setItem("auth-user", JSON.stringify(data.user));
        window.location.href = "/dashboard";
      } else {
        setError("Resposta invalida do servidor");
      }
    } catch {
      setError("Ocorreu um erro ao verificar o codigo");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown || loading) return;
    setError(null);
    setResendCooldown(true);
    setTimeout(() => setResendCooldown(false), 30000);

    try {
      const response = await fetch("/api/auth/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, resend: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Nao foi possivel reenviar o codigo");
      }
    } catch {
      setError("Erro ao reenviar o codigo");
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setTwoFactorCode("");
    setIsBackupCode(false);
    setEmailCode("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={48} height={48} />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-foreground">Hyperion</span>
              <span className="text-2xl font-bold text-primary">Pay</span>
            </div>
          </div>

          {step === "credentials" && (
            <>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                Bem-vindo de volta
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Entre na sua conta para continuar
              </p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-foreground font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 bg-secondary border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground font-medium">Senha</label>
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-secondary border-border"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </>
          )}

          {step === "2fa" && (
            <>
              <button
                onClick={handleBackToCredentials}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                Verificacao em Duas Etapas
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Digite o codigo do seu app autenticador
              </p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-foreground font-medium">
                    {isBackupCode ? "Codigo de Backup" : "Codigo de 6 digitos"}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) =>
                        setTwoFactorCode(
                          isBackupCode
                            ? e.target.value.toUpperCase()
                            : e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder={isBackupCode ? "XXXX-XXXX" : "000000"}
                      className="pl-10 bg-secondary border-border text-center text-lg tracking-widest"
                      maxLength={isBackupCode ? 9 : 6}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || (!isBackupCode && twoFactorCode.length !== 6)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCode(!isBackupCode);
                    setTwoFactorCode("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isBackupCode ? "Usar codigo do app" : "Usar codigo de backup"}
                </button>
              </form>
            </>
          )}

          {step === "email-code" && (
            <>
              <button
                onClick={handleBackToCredentials}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                Codigo de Acesso
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Enviamos um codigo de 6 digitos para{" "}
                <span className="text-foreground font-medium">{email}</span>
              </p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyEmailCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-foreground font-medium">Codigo de 6 digitos</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="pl-10 bg-secondary border-border text-center text-lg tracking-widest"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || emailCode.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verificar e entrar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {resendCooldown ? "Aguarde para reenviar o codigo" : "Reenviar codigo"}
                </button>
              </form>
            </>
          )}

          {step === "credentials" && (
            <p className="text-center text-muted-foreground text-sm mt-6">
              Não tem uma conta?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
