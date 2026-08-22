"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Copy,
  Check,
  AlertCircle,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  QrCode,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCode from "qrcode";

/**
 * Retorna a cor de texto (claro ou escuro) com melhor contraste sobre a cor de fundo.
 * Permite que o lojista escolha qualquer paleta sem quebrar a legibilidade.
 */
function readableOn(hex: string): string {
  const clean = (hex || "").replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (full.length !== 6) return "#ffffff";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

interface PaymentLink {
  id: string;
  code: string;
  title: string;
  description: string | null;
  amount: number | null;
  amount_type: "fixed" | "open";
  min_amount: number | null;
  max_amount: number | null;
  logo_url: string | null;
  primary_color: string;
  background_color: string;
  success_message: string | null;
  require_name: boolean;
  require_email: boolean;
  require_phone: boolean;
  require_cpf: boolean;
  seller_name: string;
  seller_avatar: string | null;
}

interface PaymentData {
  transaction_id: string;
  amount: number;
  pix_code: string;
  qr_code: string | null;
  expires_at: string;
}

export default function PayLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    payer_name: "",
    payer_email: "",
    payer_phone: "",
    payer_cpf: "",
  });

  useEffect(() => {
    loadLink();
  }, [resolvedParams.code]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === "payment" && paymentData) {
      interval = setInterval(checkPaymentStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, paymentData]);

  // Gerar QR Code quando paymentData mudar
  useEffect(() => {
    if (paymentData?.pix_code) {
      QRCode.toDataURL(paymentData.pix_code, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeImage(url))
        .catch((err) => console.error("Erro ao gerar QR Code:", err));
    }
  }, [paymentData?.pix_code]);

  async function loadLink() {
    try {
      const response = await fetch(`/api/payment-links/${resolvedParams.code}`);
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Link nao encontrado");
        return;
      }

      const data = await response.json();
      setLink(data.link);
      
      if (data.link.amount_type === "fixed") {
        setFormData((prev) => ({ ...prev, amount: data.link.amount?.toString() || "" }));
      }
    } catch (err) {
      setError("Erro ao carregar pagamento");
    } finally {
      setLoading(false);
    }
  }

  async function checkPaymentStatus() {
    if (!paymentData || checkingPayment) return;

    setCheckingPayment(true);
    try {
      const response = await fetch(`/api/transactions/${paymentData.transaction_id}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "completed") {
          setStep("success");
        }
      }
    } catch (err) {
      console.error("Error checking payment:", err);
    } finally {
      setCheckingPayment(false);
    }
  }

  async function handleSubmit() {
    if (!link) return;

    setFormError(null);

    // Validacoes
    if (link.require_name && !formData.payer_name.trim()) {
      setFormError("Informe seu nome completo.");
      return;
    }
    if (link.require_email && !formData.payer_email.trim()) {
      setFormError("Informe seu email.");
      return;
    }
    if (link.require_phone && !formData.payer_phone.trim()) {
      setFormError("Informe seu telefone.");
      return;
    }
    if (link.require_cpf && !formData.payer_cpf.trim()) {
      setFormError("Informe seu CPF.");
      return;
    }

    const amount = link.amount_type === "fixed" ? Number(link.amount) : Number(formData.amount);

    if (!amount || amount <= 0) {
      setFormError("Informe um valor valido.");
      return;
    }

    if (link.min_amount && amount < Number(link.min_amount)) {
      setFormError(`Valor minimo: R$ ${Number(link.min_amount).toFixed(2)}`);
      return;
    }

    if (link.max_amount && amount > Number(link.max_amount)) {
      setFormError(`Valor maximo: R$ ${Number(link.max_amount).toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/payment-links/${resolvedParams.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setFormError(data.error || "Nao foi possivel gerar o PIX. Tente novamente.");
        return;
      }

      const data = await response.json();
      setPaymentData(data);
      setStep("payment");
    } catch (err) {
      console.error("Error processing payment:", err);
      setFormError("Nao foi possivel gerar o PIX. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  function copyPixCode() {
    if (paymentData?.pix_code) {
      navigator.clipboard.writeText(paymentData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function formatCPF(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }

  function formatPhone(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold mb-2" style={{ color: "#ffffff" }}>
            Link Indisponivel
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>
            {error || "Este link de pagamento nao existe ou expirou."}
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = link.primary_color || "#f97316";
  const bgColor = link.background_color || "#0a0a0a";
  const textColor = readableOn(bgColor);
  const isLightBg = textColor !== "#ffffff";

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={
        {
          backgroundColor: bgColor,
          color: textColor,
          "--ck-surface": isLightBg ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)",
          "--ck-border": isLightBg ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.10)",
        } as React.CSSProperties
      }
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {link.logo_url ? (
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-[var(--ck-surface)]">
              <img
                src={link.logo_url}
                alt={link.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor + "20" }}
            >
              <DollarSign className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2">{link.title}</h1>
          {link.description && (
            <p className="opacity-70">{link.description}</p>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--ck-surface)] backdrop-blur-lg border border-[var(--ck-border)] rounded-2xl overflow-hidden"
        >
          {step === "form" && (
            <div className="p-6 space-y-4">
              {/* Valor */}
              {link.amount_type === "fixed" ? (
                <div className="text-center py-4 bg-[var(--ck-surface)] rounded-xl">
                  <p className="text-sm opacity-70 mb-1">Valor do pagamento</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(Number(link.amount))}
                  </p>
                </div>
              ) : (
                <div>
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor *
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min={link.min_amount || 0}
                      max={link.max_amount || undefined}
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="pl-10 bg-[var(--ck-surface)] border-[var(--ck-border)]"
                    />
                  </div>
                  {(link.min_amount || link.max_amount) && (
                    <p className="text-xs opacity-70 mt-1">
                      {link.min_amount && `Min: ${formatCurrency(Number(link.min_amount))}`}
                      {link.min_amount && link.max_amount && " | "}
                      {link.max_amount && `Max: ${formatCurrency(Number(link.max_amount))}`}
                    </p>
                  )}
                </div>
              )}

              {/* Nome */}
              {link.require_name && (
                <div>
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome *
                  </Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.payer_name}
                    onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                    className="mt-1 bg-[var(--ck-surface)] border-[var(--ck-border)]"
                  />
                </div>
              )}

              {/* Email */}
              {link.require_email && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.payer_email}
                    onChange={(e) => setFormData({ ...formData, payer_email: e.target.value })}
                    className="mt-1 bg-[var(--ck-surface)] border-[var(--ck-border)]"
                  />
                </div>
              )}

              {/* Telefone */}
              {link.require_phone && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone *
                  </Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.payer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, payer_phone: formatPhone(e.target.value) })
                    }
                    maxLength={15}
                    className="mt-1 bg-[var(--ck-surface)] border-[var(--ck-border)]"
                  />
                </div>
              )}

              {/* CPF */}
              {link.require_cpf && (
                <div>
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CPF *
                  </Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.payer_cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, payer_cpf: formatCPF(e.target.value) })
                    }
                    maxLength={14}
                    className="mt-1 bg-[var(--ck-surface)] border-[var(--ck-border)]"
                  />
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="w-full h-12 text-lg font-semibold"
                style={{ backgroundColor: primaryColor, color: readableOn(primaryColor) }}
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Gerar PIX
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs opacity-70">
                <Shield className="w-4 h-4" />
                Pagamento seguro via PIX
              </div>
            </div>
          )}

          {step === "payment" && paymentData && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm opacity-70 mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(paymentData.amount)}
                </p>
              </div>

              {/* QR Code */}
              {qrCodeImage && (
                <div className="bg-white rounded-2xl p-4 mx-auto w-fit">
                  <img
                    src={qrCodeImage}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              )}
              {!qrCodeImage && paymentData.pix_code && (
                <div className="bg-white rounded-2xl p-4 mx-auto w-fit flex items-center justify-center w-48 h-48">
                  <Loader2 className="w-8 h-8 animate-spin opacity-70" />
                </div>
              )}

              {/* Codigo PIX */}
              <div>
                <Label className="text-sm mb-2 block">Codigo PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentData.pix_code}
                    readOnly
                    className="bg-[var(--ck-surface)] border-[var(--ck-border)] text-xs"
                  />
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    aria-label="Copiar codigo PIX"
                    className="border-[var(--ck-border)] bg-[var(--ck-surface)] shrink-0 hover:bg-[var(--ck-surface)]"
                    style={{ color: textColor }}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm opacity-70">
                <Clock className="w-4 h-4 animate-pulse" />
                Aguardando pagamento...
              </div>

              <div className="text-center text-xs opacity-60">
                <p>Abra o app do seu banco</p>
                <p>Escolha pagar com PIX</p>
                <p>Escaneie o QR Code ou cole o codigo</p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="p-6 text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor + "20" }}
              >
                <Check className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-xl font-bold mb-2">Pagamento Confirmado!</h2>
              <p className="opacity-70">
                {link.success_message || "Obrigado pelo seu pagamento."}
              </p>
              {paymentData && (
                <p className="text-2xl font-bold mt-4">
                  {formatCurrency(paymentData.amount)}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-6"
        >
          <p className="text-xs opacity-60">
            Pagamento processado por{" "}
            <span className="font-semibold opacity-70">Hyperion Pay</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
