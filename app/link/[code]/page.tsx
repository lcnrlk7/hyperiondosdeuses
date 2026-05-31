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

    // Validacoes
    if (link.require_name && !formData.payer_name.trim()) {
      alert("Nome e obrigatorio");
      return;
    }
    if (link.require_email && !formData.payer_email.trim()) {
      alert("Email e obrigatorio");
      return;
    }
    if (link.require_phone && !formData.payer_phone.trim()) {
      alert("Telefone e obrigatorio");
      return;
    }
    if (link.require_cpf && !formData.payer_cpf.trim()) {
      alert("CPF e obrigatorio");
      return;
    }

    const amount = link.amount_type === "fixed" ? Number(link.amount) : Number(formData.amount);
    
    if (!amount || amount <= 0) {
      alert("Valor invalido");
      return;
    }

    if (link.min_amount && amount < Number(link.min_amount)) {
      alert(`Valor minimo: R$ ${Number(link.min_amount).toFixed(2)}`);
      return;
    }

    if (link.max_amount && amount > Number(link.max_amount)) {
      alert(`Valor maximo: R$ ${Number(link.max_amount).toFixed(2)}`);
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
        const data = await response.json();
        alert(data.error || "Erro ao processar pagamento");
        return;
      }

      const data = await response.json();
      setPaymentData(data);
      setStep("payment");
    } catch (err) {
      console.error("Error processing payment:", err);
      alert("Erro ao processar pagamento");
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
          <h1 className="text-xl font-bold text-white mb-2">Link Indisponivel</h1>
          <p className="text-gray-400">{error || "Este link de pagamento nao existe ou expirou."}</p>
        </div>
      </div>
    );
  }

  const primaryColor = link.primary_color || "#f97316";
  const bgColor = link.background_color || "#0a0a0a";

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {link.logo_url ? (
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-white/10">
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
          <h1 className="text-2xl font-bold text-white mb-2">{link.title}</h1>
          {link.description && (
            <p className="text-gray-400">{link.description}</p>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
        >
          {step === "form" && (
            <div className="p-6 space-y-4">
              {/* Valor */}
              {link.amount_type === "fixed" ? (
                <div className="text-center py-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Valor do pagamento</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(Number(link.amount))}
                  </p>
                </div>
              ) : (
                <div>
                  <Label className="text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor *
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                      className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  {(link.min_amount || link.max_amount) && (
                    <p className="text-xs text-gray-400 mt-1">
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
                  <Label className="text-white flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome *
                  </Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.payer_name}
                    onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              {/* Email */}
              {link.require_email && (
                <div>
                  <Label className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.payer_email}
                    onChange={(e) => setFormData({ ...formData, payer_email: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              {/* Telefone */}
              {link.require_phone && (
                <div>
                  <Label className="text-white flex items-center gap-2">
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
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              {/* CPF */}
              {link.require_cpf && (
                <div>
                  <Label className="text-white flex items-center gap-2">
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
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="w-full h-12 text-lg font-semibold"
                style={{ backgroundColor: primaryColor }}
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

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="w-4 h-4" />
                Pagamento seguro via PIX
              </div>
            </div>
          )}

          {step === "payment" && paymentData && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold text-white">
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
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {/* Codigo PIX */}
              <div>
                <Label className="text-white text-sm mb-2 block">Codigo PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentData.pix_code}
                    readOnly
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    className="border-white/10 shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 animate-pulse" />
                Aguardando pagamento...
              </div>

              <div className="text-center text-xs text-gray-500">
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
              <h2 className="text-xl font-bold text-white mb-2">Pagamento Confirmado!</h2>
              <p className="text-gray-400">
                {link.success_message || "Obrigado pelo seu pagamento."}
              </p>
              {paymentData && (
                <p className="text-2xl font-bold text-white mt-4">
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
          <p className="text-xs text-gray-500">
            Pagamento processado por{" "}
            <span className="font-semibold text-gray-400">Hyperion Pay</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
