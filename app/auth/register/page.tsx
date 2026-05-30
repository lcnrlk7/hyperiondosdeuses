"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ArrowLeft, 
  Check, 
  Phone,
  CreditCard,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Função para formatar CPF
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Função para formatar telefone
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

// Validar CPF
function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(numbers[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(numbers[10])) return false;
  
  return true;
}

type Step = "data" | "verification" | "password" | "success";

function RegisterForm() {
  const [step, setStep] = useState<Step>("data");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capturar codigo de referencia da URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  // Enviar código de verificação
  const handleSendCode = async () => {
    setLoading(true);
    setError(null);

    // Validações
    if (!name.trim()) {
      setError("Nome completo é obrigatório");
      setLoading(false);
      return;
    }

    if (name.trim().split(" ").length < 2) {
      setError("Digite seu nome completo");
      setLoading(false);
      return;
    }

    if (!validateCPF(cpf)) {
      setError("CPF inválido");
      setLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Email inválido");
      setLoading(false);
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setError("Telefone inválido");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name.split(" ")[0], cpf }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar código");
        setLoading(false);
        return;
      }

      setStep("verification");
      startResendTimer();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Timer para reenvio
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name.split(" ")[0], cpf }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao reenviar código");
      } else {
        startResendTimer();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Verificar código
  const handleVerifyCode = async () => {
    setLoading(true);
    setError(null);

    if (verificationCode.length !== 6) {
      setError("Digite o código de 6 dígitos");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Código inválido");
        setLoading(false);
        return;
      }

      setStep("password");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Criar conta
  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          cpf: cpf.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      // Salvar token e dados do usuário no localStorage
      if (data.token && data.user) {
        localStorage.setItem("auth-token", data.token);
        localStorage.setItem("auth-user", JSON.stringify(data.user));
      }

      setStep("success");
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center relative z-10"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Conta criada com sucesso!
          </h1>
          <p className="text-muted-foreground mb-6">
            Sua conta Hyperion Pay esta pronta. Clique abaixo para acessar.
          </p>
          <Button 
            onClick={() => window.location.href = "/dashboard"}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
          >
            Acessar Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link
          href={step === "data" ? "/" : "#"}
          onClick={(e) => {
            if (step !== "data") {
              e.preventDefault();
              if (step === "verification") setStep("data");
              if (step === "password") setStep("verification");
            }
          }}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === "data" ? "Voltar" : "Voltar"}
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={48} height={48} />
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">Hyperion</span>
              <span className="text-2xl font-bold text-primary">Pay</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["data", "verification", "password"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : ["data", "verification", "password"].indexOf(step) > i
                      ? "bg-green-500 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {["data", "verification", "password"].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      ["data", "verification", "password"].indexOf(step) > i
                        ? "bg-green-500"
                        : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Dados Pessoais */}
            {step === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-xl font-bold text-foreground text-center mb-2">
                  Criar Conta
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Preencha seus dados pessoais
                </p>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-foreground font-medium">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-foreground font-medium">
                      CPF
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        className="pl-10 bg-secondary border-border"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-foreground font-medium">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-foreground font-medium">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        className="pl-10 bg-secondary border-border"
                        maxLength={15}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
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
                </div>
              </motion.div>
            )}

            {/* Step 2: Verificação de Email */}
            {step === "verification" && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-foreground text-center mb-2">
                  Verificar Email
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Digite o código de 6 dígitos enviado para{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </p>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] bg-secondary border-border font-mono"
                    maxLength={6}
                  />

                  <Button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Verificar Código"
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Não recebeu o código?{" "}
                    {resendTimer > 0 ? (
                      <span>Aguarde {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="text-primary hover:underline"
                        disabled={loading}
                      >
                        Reenviar
                      </button>
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Criar Senha */}
            {step === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-xl font-bold text-foreground text-center mb-2">
                  Email Verificado!
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Agora crie uma senha segura para sua conta
                </p>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-foreground font-medium">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-foreground font-medium">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
