"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TeamLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "email-code">("credentials");
  const [emailCode, setEmailCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        toast.success("Enviamos um codigo de acesso para o seu email.");
        return;
      }

      if (!response.ok) {
        toast.error(data.error || "Erro ao fazer login");
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const persistSessionAndRedirect = (data: {
    member: { name: string; email: string; role: string; permissions?: unknown };
    loginTime: number;
    redirectUrl: string;
  }) => {
    localStorage.setItem("lp_admin_session", "active");
    localStorage.setItem("lp_admin_user", data.member.name);
    localStorage.setItem("lp_admin_email", data.member.email);
    localStorage.setItem("lp_admin_role", data.member.role);
    localStorage.setItem("lp_admin_permissions", JSON.stringify(data.member.permissions || {}));
    localStorage.setItem("lp_admin_login_time", data.loginTime.toString());
    toast.success(`Bem-vindo, ${data.member.name}!`);
    router.push(data.redirectUrl);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/team/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: emailCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Codigo invalido");
        return;
      }

      persistSessionAndRedirect(data);
    } catch (error) {
      console.error("Verify code error:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown || loading) return;
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
        toast.error(data.error || "Nao foi possivel reenviar o codigo");
      } else {
        toast.success("Novo codigo enviado para o seu email.");
      }
    } catch {
      toast.error("Erro ao reenviar o codigo");
    }
  };

  const handleBack = () => {
    setStep("credentials");
    setEmailCode("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={48} height={48} />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-foreground">Hyperion</span>
              <span className="text-2xl font-bold text-primary">Pay</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Painel Interno</h1>
          <p className="text-muted-foreground mt-1">
            Acesso restrito para equipe Hyperion Pay
          </p>
        </div>

        {step === "credentials" ? (
          /* Form credenciais */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Form codigo de acesso */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex items-center justify-center py-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">Codigo de Acesso</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enviamos um codigo de 6 digitos para{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Codigo de 6 digitos
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="pl-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || emailCode.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar e entrar"
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
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Acesso exclusivo para membros autorizados.
          <br />
          Todas as atividades são registradas.
        </p>
      </motion.div>
    </div>
  );
}
