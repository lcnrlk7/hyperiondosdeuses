"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Clock, 
  Shield, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  Copy,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Lock,
  FileText,
  MapPin,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compare_price?: number | null;
  custom_price?: number | null;
  image_url?: string | null;
  banner_url?: string | null;
  is_digital?: boolean;
  product_type?: string;
}

interface Checkout {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  primary_color?: string;
  bg_color?: string;
  text_color?: string;
  show_timer?: boolean;
  timer_enabled?: boolean;
  timer_minutes?: number;
  require_name?: boolean;
  require_email?: boolean;
  require_phone?: boolean;
  require_cpf?: boolean;
  require_address?: boolean;
  products?: Product[];
}

export function CheckoutPage({ checkout }: { checkout: Checkout }) {
  const products = checkout.products || [];
  const primaryColor = checkout.primary_color || "#f97316";
  const bgColor = checkout.bg_color || "#0a0a0a";
  const textColor = checkout.text_color || "#ffffff";
  
  // Se tiver apenas 1 produto, ja seleciona automaticamente
  const singleProduct = products.length === 1 ? products[0] : null;
  
  // Verifica se precisa mostrar formulario
  const needsForm = checkout.require_name || checkout.require_email || 
                    checkout.require_phone || checkout.require_cpf || checkout.require_address;
  
  // States
  const [step, setStep] = useState<"checkout" | "pix" | "success">("checkout");
  const [timeLeft, setTimeLeft] = useState((checkout.timer_minutes || 15) * 60);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(singleProduct);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [expandDescription, setExpandDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode?: string; copyPaste?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(15 * 60); // 15 minutos para pagar
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    cep: "",
  });

  // Timer
  useEffect(() => {
    if (!checkout.timer_enabled && !checkout.show_timer) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [checkout.timer_enabled, checkout.show_timer]);

  const formatTimeUnit = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return { h, m, s };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const getProductPrice = (product: Product) => {
    return product.custom_price || product.price;
  };

  // Calculos
  const productPrice = selectedProduct ? getProductPrice(selectedProduct) : 0;
  const subtotal = productPrice * quantity;
  const discount = couponApplied ? couponApplied.discount : 0;
  const total = Math.max(0, subtotal - discount);

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponError("");
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: couponCode, 
          checkout_id: checkout.id,
          subtotal 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setCouponApplied({ code: couponCode, discount: data.discount_amount || data.discount });
      } else {
        setCouponError(data.error || "Cupom invalido");
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    }
  };

  // Validate form
  const validateForm = () => {
    if (checkout.require_name && !formData.name.trim()) return false;
    if (checkout.require_email && !formData.email.trim()) return false;
    if (checkout.require_phone && !formData.phone.trim()) return false;
    if (checkout.require_cpf && !formData.cpf.trim()) return false;
    if (checkout.require_address && (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.cep.trim())) return false;
    return true;
  };

  // Submit order and get PIX
  const handleSubmit = async () => {
    if (!selectedProduct) {
      alert("Selecione um produto");
      return;
    }
    
    if (needsForm && !validateForm()) {
      alert("Por favor, preencha todos os campos obrigatorios");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_id: checkout.id,
          seller_id: checkout.user_id,
          items: [{ 
            product_id: selectedProduct.id, 
            product_name: selectedProduct.name,
            product_price: productPrice,
            quantity, 
            unit_price: productPrice 
          }],
          customer: formData,
          coupon_code: couponApplied?.code,
          subtotal,
          discount,
          total,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrderId(data.order_id);
        if (data.pix && data.pix.qrCode) {
          setPixData({
            qrCode: data.pix.qrCode,
            copyPaste: data.pix.copyPaste || data.pix.qrCode,
          });
          setPixTimeLeft(15 * 60); // Reset timer
          setStep("pix");
        } else {
          setStep("success");
        }
      } else {
        alert(data.error || "Erro ao criar pedido");
      }
    } catch {
      alert("Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Timer do PIX
  useEffect(() => {
    if (step !== "pix") return;
    const timer = setInterval(() => {
      setPixTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Polling automatico do status do pagamento
  useEffect(() => {
    if (step !== "pix" || !orderId) return;

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/orders/status?order_id=${orderId}`);
        const data = await res.json();
        
        if (data.is_paid) {
          setStep("success");
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      }
    };

    // Verificar a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);
    
    return () => clearInterval(interval);
  }, [step, orderId]);

  // Verificar pagamento manualmente
  const checkPaymentManually = async () => {
    if (!orderId) return;
    
    setCheckingPayment(true);
    try {
      const res = await fetch(`/api/checkout/orders/status?order_id=${orderId}`);
      const data = await res.json();
      
      if (data.is_paid) {
        setStep("success");
      } else {
        alert("Pagamento ainda nao confirmado. Por favor, aguarde alguns instantes apos realizar o pagamento.");
      }
    } catch (error) {
      alert("Erro ao verificar pagamento. Tente novamente.");
    } finally {
      setCheckingPayment(false);
    }
  };

  const formatPixTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const time = formatTimeUnit(timeLeft);

  // PIX Screen
  if (step === "pix") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md text-center"
        >
          {/* Timer */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: pixTimeLeft < 60 ? "#ef444420" : primaryColor + "20" }}
          >
            <Clock className="w-4 h-4" style={{ color: pixTimeLeft < 60 ? "#ef4444" : primaryColor }} />
            <span 
              className="text-sm font-medium"
              style={{ color: pixTimeLeft < 60 ? "#ef4444" : primaryColor }}
            >
              Expira em {formatPixTime(pixTimeLeft)}
            </span>
          </div>

          <div 
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: primaryColor + "20" }}
          >
            <CreditCard className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
            Pagamento via PIX
          </h1>
          <p className="text-sm mb-6" style={{ color: textColor + "99" }}>
            Escaneie o QR Code ou copie o codigo para pagar
          </p>

          {/* QR Code */}
          {pixData?.copyPaste && (
            <div className="bg-white p-4 rounded-2xl mb-6 inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.copyPaste)}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>
          )}

          {/* Copy Code */}
          <div className="mb-6">
            <p className="text-xs mb-2" style={{ color: textColor + "99" }}>
              Ou copie o codigo PIX:
            </p>
            <div className="flex gap-2">
              <Input
                value={pixData?.copyPaste || ""}
                readOnly
                className="flex-1 bg-white/10 border-white/20 text-xs"
                style={{ color: textColor }}
              />
              <Button
                style={{ backgroundColor: primaryColor }}
                onClick={copyPixCode}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Total */}
          <div 
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: primaryColor + "15" }}
          >
            <p className="text-sm" style={{ color: textColor + "99" }}>Valor a pagar:</p>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(total)}
            </p>
          </div>

          {/* Status info */}
          <div 
            className="flex items-center justify-center gap-2 mb-4 p-3 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs" style={{ color: textColor + "80" }}>
              Aguardando confirmacao do pagamento...
            </span>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={checkPaymentManually}
            disabled={checkingPayment}
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {checkingPayment ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Ja fiz o pagamento"
            )}
          </Button>

          <p className="text-xs mt-4" style={{ color: textColor + "60" }}>
            O pagamento sera confirmado automaticamente em alguns segundos apos a transferencia.
          </p>
        </motion.div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md text-center"
        >
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "#22c55e20" }}
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
            Pedido Confirmado!
          </h1>
          <p className="text-sm mb-6" style={{ color: textColor + "99" }}>
            Seu pagamento foi processado com sucesso. Voce recebera um email com os detalhes do pedido.
          </p>

          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: "#22c55e10" }}
          >
            <p className="text-sm text-green-500">
              Obrigado pela sua compra!
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // No products
  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4" style={{ color: textColor + "40" }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: textColor }}>Checkout em Configuracao</h1>
          <p style={{ color: textColor + "60" }}>Este checkout ainda nao possui produtos.</p>
        </div>
      </div>
    );
  }

  // Main checkout page - Two column layout
  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <header className="border-b border-white/10 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">{checkout.name}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Title and Description */}
        {selectedProduct && (
          <div className="text-center mb-8">
            <h1 className="text-xl lg:text-2xl font-bold mb-3">{selectedProduct.name}</h1>
            {selectedProduct.description && (
              <p className="text-sm max-w-3xl mx-auto leading-relaxed" style={{ color: textColor + "99" }}>
                {selectedProduct.description}
              </p>
            )}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Product */}
          <div>
            {selectedProduct ? (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                {/* Product Image */}
                {(selectedProduct.image_url || selectedProduct.banner_url) && (
                  <div className="aspect-video relative">
                    <img
                      src={selectedProduct.banner_url || selectedProduct.image_url || ""}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedProduct.is_digital && (
                      <span 
                        className="absolute top-3 right-3 px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: primaryColor, color: "#fff" }}
                      >
                        Digital
                      </span>
                    )}
                  </div>
                )}
                
                {/* Product Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs mb-1" style={{ color: textColor + "60" }}>Total</p>
                      <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {formatCurrency(productPrice)}
                      </p>
                    </div>
                    <div 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <Package className="w-4 h-4" />
                      <span className="text-sm">{quantity} item</span>
                    </div>
                  </div>

                  {/* Product Card */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 mb-5">
                    {(selectedProduct.image_url || selectedProduct.banner_url) ? (
                      <img 
                        src={selectedProduct.image_url || selectedProduct.banner_url || ""} 
                        alt="" 
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div 
                        className="w-14 h-14 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: primaryColor + "20" }}
                      >
                        <Package className="w-7 h-7" style={{ color: primaryColor }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1">{selectedProduct.name}</p>
                      {selectedProduct.description && (
                        <>
                          <p className="text-sm leading-relaxed" style={{ color: textColor + "80" }}>
                            {expandDescription 
                              ? selectedProduct.description 
                              : (selectedProduct.description.length > 120 
                                  ? selectedProduct.description.substring(0, 120) + "..." 
                                  : selectedProduct.description)}
                          </p>
                          {selectedProduct.description.length > 120 && (
                            <button
                              onClick={() => setExpandDescription(!expandDescription)}
                              className="text-sm mt-2 flex items-center gap-1 font-medium"
                              style={{ color: primaryColor }}
                            >
                              {expandDescription ? "Ver menos" : "Ver mais"}
                              {expandDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="text-sm">Qtd. {quantity}</span>
                    <span className="ml-auto font-semibold">{formatCurrency(productPrice)}</span>
                  </div>

                  {/* Coupon */}
                  <div className="mb-5">
                    <p className="text-sm font-medium mb-2">Cupom de Desconto</p>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textColor + "40" }} />
                        <Input
                          placeholder="CODIGO DO CUPOM"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="pl-10 bg-white/5 border-white/10 uppercase h-11"
                          style={{ color: textColor }}
                        />
                      </div>
                      <Button
                        onClick={applyCoupon}
                        className="h-11 px-5"
                        style={{ backgroundColor: primaryColor, color: "#000" }}
                      >
                        Aplicar
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-red-400 text-xs mt-2">{couponError}</p>
                    )}
                    {couponApplied && (
                      <p className="text-green-400 text-xs mt-2">
                        Cupom aplicado: -{formatCurrency(couponApplied.discount)}
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: textColor + "80" }}>Subtotal Produto</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Desconto</span>
                        <span>-{formatCurrency(couponApplied.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span style={{ color: textColor + "80" }}>Subtotal Geral</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-white/10">
                      <span>Total</span>
                      <span style={{ color: primaryColor }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Product Selection */
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4">Selecione um produto</h2>
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="p-4 rounded-xl border cursor-pointer transition-all hover:border-indigo-500"
                    style={{ 
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: selectedProduct?.id === product.id ? primaryColor : "rgba(255,255,255,0.1)"
                    }}
                  >
                    <div className="flex gap-4">
                      {(product.image_url || product.banner_url) && (
                        <img src={product.image_url || product.banner_url || ""} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{product.name}</p>
                        {product.description && (
                          <p className="text-sm mt-1" style={{ color: textColor + "80" }}>{product.description}</p>
                        )}
                        <p className="font-bold mt-2" style={{ color: primaryColor }}>
                          {formatCurrency(getProductPrice(product))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Timer + Form */}
          <div>
            {/* Timer */}
            {(checkout.timer_enabled || checkout.show_timer) && (
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: textColor + "60" }}>
                  Oferta termina em
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    {time.h.toString().padStart(2, "0")}
                  </div>
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>:</span>
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    {time.m.toString().padStart(2, "0")}
                  </div>
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>:</span>
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    {time.s.toString().padStart(2, "0")}
                  </div>
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ 
                      backgroundColor: s === 1 ? primaryColor : "rgba(255,255,255,0.1)",
                      color: s === 1 ? "#000" : textColor + "50"
                    }}
                  >
                    {s}
                  </div>
                  {i < 2 && <div className="w-10 h-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />}
                </div>
              ))}
            </div>

            {/* Form Card */}
            <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Dados pessoais</h2>
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#22c55e" }}>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ambiente seguro</span>
                </div>
              </div>

              {needsForm ? (
                <div className="space-y-4">
                  {(checkout.require_name !== false) && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textColor + "40" }} />
                      <Input
                        placeholder="Nome completo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 bg-white/5 border-white/10 h-12"
                        style={{ color: textColor }}
                      />
                    </div>
                  )}

                  {(checkout.require_email !== false) && (
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textColor + "40" }} />
                      <Input
                        type="email"
                        placeholder="E-mail"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-white/5 border-white/10 h-12"
                        style={{ color: textColor }}
                      />
                    </div>
                  )}

                  {checkout.require_phone && (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textColor + "40" }} />
                      <Input
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        className="pl-10 bg-white/5 border-white/10 h-12"
                        style={{ color: textColor }}
                        maxLength={15}
                      />
                    </div>
                  )}

                  {checkout.require_cpf && (
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textColor + "40" }} />
                      <Input
                        placeholder="CPF ou CNPJ"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                        className="pl-10 bg-white/5 border-white/10 h-12"
                        style={{ color: textColor }}
                        maxLength={18}
                      />
                    </div>
                  )}

                  {checkout.require_address && (
                    <>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textColor + "40" }} />
                        <Input
                          placeholder="CEP"
                          value={formData.cep}
                          onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                          className="pl-10 bg-white/5 border-white/10 h-12"
                          style={{ color: textColor }}
                          maxLength={9}
                        />
                      </div>
                      <Input
                        placeholder="Endereco completo"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="bg-white/5 border-white/10 h-12"
                        style={{ color: textColor }}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="bg-white/5 border-white/10 h-12"
                          style={{ color: textColor }}
                        />
                        <Input
                          placeholder="Estado"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                          className="bg-white/5 border-white/10 h-12"
                          style={{ color: textColor }}
                          maxLength={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Security Info */}
                  <div className="p-4 rounded-xl bg-white/5 text-sm space-y-2.5 mt-4" style={{ color: textColor + "70" }}>
                    <div className="flex items-start gap-2.5">
                      <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                      <span>Usamos seus dados de forma segura para garantir a sua satisfacao;</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                      <span>Enviar o seu comprovante de compra e pagamento;</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                      <span>Ativar sua devolucao caso nao fique satisfeito;</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                      <span>Acompanhar o andamento do seu pedido.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
                  <p className="text-base font-medium mb-2">Pagamento via PIX</p>
                  <p className="text-sm" style={{ color: textColor + "60" }}>
                    Clique em continuar para gerar o QR Code
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full h-14 text-base font-bold mt-6"
                style={{ backgroundColor: primaryColor, color: "#000" }}
                onClick={handleSubmit}
                disabled={loading || !selectedProduct}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Processando...
                  </span>
                ) : (
                  "Continuar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
