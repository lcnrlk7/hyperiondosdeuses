"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, AlertCircle, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SecretAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "email-code">("credentials");
  const [emailCode, setEmailCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);
  const router = useRouter();

  const persistSessionAndRedirect = (data: {
    member: { name: string; email: string; role: string; permissions?: unknown };
    loginTime?: number;
    redirectUrl?: string;
  }) => {
    localStorage.setItem("lp_admin_session", "active");
    localStorage.setItem("lp_admin_user", data.member.name);
    localStorage.setItem("lp_admin_role", data.member.role);
    localStorage.setItem("lp_admin_email", data.member.email);
    localStorage.setItem("lp_admin_permissions", JSON.stringify(data.member.permissions || {}));
    localStorage.setItem("lp_admin_login_time", (data.loginTime || Date.now()).toString());
    window.location.href = data.redirectUrl || "/lp-x7k9m2-internal/ceo";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.requiresEmailCode) {
        setStep("email-code");
        setEmailCode("");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "Credenciais inválidas");
        setIsLoading(false);
        return;
      }

      setError("Resposta inválida do servidor");
      setIsLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/team/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: emailCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Código inválido");
        setIsLoading(false);
        return;
      }

      persistSessionAndRedirect(data);
    } catch (err) {
      console.error("Verify code error:", err);
      setError("Erro ao verificar o código. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown || isLoading) return;
    setError("");
    setResendCooldown(true);
    setTimeout(() => setResendCooldown(false), 30000);

    try {
      const response = await fetch("/api/auth/team/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, resend: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Não foi possível reenviar o código");
      }
    } catch {
      setError("Erro ao reenviar o código");
    }
  };

  const handleBack = () => {
    setStep("credentials");
    setEmailCode("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-2xl p-8 border border-border shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={40} height={40} />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-foreground">Hyperion</span>
              <span className="text-2xl font-bold text-primary">Pay</span>
            </div>
          </div>

          {step === "credentials" ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h1>
                <p className="text-sm text-muted-foreground">Área exclusiva para administradores</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder="Digite seu email"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder="Digite sua senha"
                      required
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-2">Código de Acesso</h1>
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Código de 6 dígitos</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-center text-lg tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || emailCode.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar e entrar"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {resendCooldown ? "Aguarde para reenviar o código" : "Reenviar código"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Este acesso é monitorado e registrado.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
