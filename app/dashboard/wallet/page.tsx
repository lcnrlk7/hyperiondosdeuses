"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WithdrawModal } from "@/components/wallet/withdraw-modal";

interface PixTransaction {
  id: string;
  qrCode: string;
  qrCodeBase64: string;
  copyPaste: string;
  amount: number;
  expiresAt: string;
  status: string;
}

interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  is_primary: boolean;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPixKey, setWithdrawPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [pixTransaction, setPixTransaction] = useState<PixTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState<{
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    pixKey: string;
    pixKeyType: string;
    recipientName?: string;
    recipientBank?: string;
    status: string;
    createdAt: string;
  } | null>(null);
  const [savedPixKeys, setSavedPixKeys] = useState<PixKey[]>([]);
  const [systemSettings, setSystemSettings] = useState({
    minDeposit: 5,
    maxDeposit: 100000,
    minWithdrawal: 25, // Minimo R$ 25 para rota black
    maxWithdrawal: 50000,
    autoWithdrawalLimit: 500,
    withdrawalFee: 5, // Taxa de saque (Medusa R$ 5)
  });
  const [userRoute, setUserRoute] = useState<string>('black');

  useEffect(() => {
    loadBalance();
    loadPixKeys();
    loadSettings();
    loadUserFees();
  }, []);

  async function loadUserFees() {
    try {
      const response = await fetch("/api/user/fees");
      const data = await response.json();
      if (data.fees) {
        const route = data.fees.route_type || 'black';
        // Usar taxa de saque da API (considera taxa individual do usuario ou padrao da rota)
        const withdrawFee = data.fees.withdrawal_fee || (route === 'black' ? 5 : 2);
        // Minimo de saque da API ou padrao
        const minWithdraw = data.fees.min_withdrawal || (route === 'black' ? 25 : 15);
        
        setUserRoute(route);
        setSystemSettings(prev => ({
          ...prev,
          withdrawalFee: withdrawFee,
          minWithdrawal: minWithdraw,
          maxWithdrawal: data.fees.max_withdrawal || prev.maxWithdrawal,
        }));
      }
    } catch (err) {
      console.error("Error loading user fees:", err);
    }
  }

  async function loadSettings() {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.settings) {
        // Manter valores locais e apenas atualizar os que vem da API
        setSystemSettings(prev => ({
          ...prev,
          minDeposit: data.settings.minDeposit || prev.minDeposit,
          maxDeposit: data.settings.maxDeposit || prev.maxDeposit,
          maxWithdrawal: data.settings.maxWithdrawal || prev.maxWithdrawal,
          autoWithdrawalLimit: data.settings.autoWithdrawalLimit || prev.autoWithdrawalLimit,
        }));
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }

  async function loadPixKeys() {
    try {
      const response = await fetch("/api/pix-keys");
      const data = await response.json();
      if (data.pixKeys) {
        setSavedPixKeys(data.pixKeys);
      }
    } catch (err) {
      console.error("Error loading pix keys:", err);
    }
  }

  function handlePixKeySelect(keyId: string) {
    if (keyId === "custom") {
      setWithdrawPixKey("");
    } else {
      const key = savedPixKeys.find(k => k.id === keyId);
      if (key) {
        setWithdrawPixKey(key.key_value);
      }
    }
  }

  async function loadBalance() {
    setLoadingBalance(true);
    try {
      const response = await fetch("/api/user/balance");
      const data = await response.json();
      
      if (data.balance !== undefined) {
        setBalance(data.balance);
      }
      if (data.pendingWithdrawals !== undefined) {
        setPendingWithdrawals(data.pendingWithdrawals);
      }
    } catch (err) {
      console.error("Error loading balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  }

const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!depositAmount || amount <= 0) {
      setError("Informe um valor valido");
      return;
    }
    
    if (amount < systemSettings.minDeposit) {
      setError(`Valor minimo: R$ ${systemSettings.minDeposit.toFixed(2).replace('.', ',')}`);
      return;
    }

    if (amount > 1000) {
      setError("Limite de R$ 1.000,00 por transacao. Para valores maiores, use o Pagamento Dividido.");
      return;
    }
    
    if (amount > systemSettings.maxDeposit) {
      setError(`Valor maximo: R$ ${systemSettings.maxDeposit.toFixed(2).replace('.', ',')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          description: "Deposito via PIX - Hyperion Pay",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar mensagem amigavel com codigo
        const code = data.code || "ERRO";
        setError(`${data.error || "Erro ao gerar QR Code"} (${code})`);
        return;
      }

      setPixTransaction({
        id: data.transactionId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        copyPaste: data.copyPaste,
        amount: amount,
        expiresAt: data.expiresAt,
        status: "pending",
      });
    } catch (err) {
      setError("Falha na conexao. Tente novamente. (REDE-001)");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount: number, pixKey: string, pixKeyType: string) => {
    if (!amount || amount <= 0 || !pixKey) {
      setError("Preencha todos os campos");
      return;
    }

    if (amount < systemSettings.minWithdrawal) {
      setError(`Valor minimo: R$ ${systemSettings.minWithdrawal.toFixed(2).replace('.', ',')}`);
      return;
    }

    // Taxa fixa de saque
    const withdrawalFee = systemSettings.withdrawalFee || 5;
    const totalDebit = amount + withdrawalFee;

    if (amount <= 0) {
      setError("Informe um valor valido para receber");
      return;
    }

    if (totalDebit > balance) {
      setError(`Saldo insuficiente. Para receber R$ ${amount.toFixed(2)}, voce precisa de R$ ${totalDebit.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch("/api/withdrawals/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          pixKey: pixKey,
          pixKeyType: pixKeyType, // Tipo selecionado pelo usuário
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const code = data.code || "SAQUE-ERR";
        setError(`${data.error || "Erro ao processar saque"} (${code})`);
        setLoading(false);
        return;
      }

      // Salvar dados do saque para o comprovante
      setWithdrawalData({
        id: data.withdrawal?.id || data.id || `WD-${Date.now()}`,
        amount: amount,
        fee: withdrawalFee,
        netAmount: amount,
        pixKey: pixKey,
        pixKeyType: pixKeyType,
        recipientName: data.withdrawal?.recipient_name || undefined,
        recipientBank: data.withdrawal?.recipient_bank || undefined,
        status: data.withdrawal?.status || 'pending',
        createdAt: new Date().toISOString(),
      });

      setWithdrawSuccess(true);
      setWithdrawAmount("");
      setWithdrawPixKey("");
      loadBalance();
    } catch (err) {
      setError("Falha na conexao. Tente novamente. (REDE-002)");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDeposit = () => {
    setPixTransaction(null);
    setDepositAmount("");
    setError(null);
  };

  const checkPaymentStatus = async () => {
    if (!pixTransaction) return;

    try {
      const response = await fetch(`/api/pix/status?transactionId=${pixTransaction.id}`);
      const data = await response.json();

      if (data.status === "completed" || data.status === "paid") {
        setPixTransaction(prev => prev ? { ...prev, status: "completed" } : null);
        loadBalance();
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Carteira
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu saldo, depósitos e saques
        </p>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center glow-primary-sm">
              <Wallet className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              {loadingBalance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <p className="text-3xl lg:text-4xl font-bold text-foreground">
                  {formatCurrency(balance)}
                </p>
              )}
            </div>
          </div>
          {pendingWithdrawals > 0 && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-yellow-500/80">Saques Pendentes</p>
                <p className="text-lg font-semibold text-yellow-500">
                  {formatCurrency(pendingWithdrawals)}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Dialog open={depositDialogOpen} onOpenChange={(open) => {
            setDepositDialogOpen(open);
            if (!open) resetDeposit();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm">
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Depositar
              </Button>
            </DialogTrigger>
            <DialogContent className="!bg-[#1a1a1a] border-border max-w-md sm:max-w-lg overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-foreground">Depositar via PIX</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {!pixTransaction ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Valor do depósito
                      </label>
<Input
                  type="number"
                  placeholder="0,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-[#252525] border-border"
                  min={systemSettings.minDeposit}
                  max={1000}
                />
                {parseFloat(depositAmount) > 1000 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Limite de R$ 1.000,00 por transacao. Para valores maiores, use o <a href="/dashboard/split-payment" className="underline font-semibold">Pagamento Dividido</a>.</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimo: R$ {systemSettings.minDeposit.toFixed(2).replace('.', ',')} | Maximo: R$ 1.000,00 por transacao
                </p>
                    </div>
                    <Button
                      onClick={handleDeposit}
                      disabled={loading || !depositAmount}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Gerando QR Code...
                        </>
                      ) : (
                        "Gerar QR Code"
                      )}
                    </Button>
                  </>
                ) : pixTransaction.status === "completed" ? (
                  <div className="text-center space-y-4 py-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Pagamento Confirmado!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(pixTransaction.amount)} foi creditado em sua conta
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetDeposit();
                        setDepositDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Fechar
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
<div className="bg-white rounded-xl p-4 inline-block mx-auto">
                                      {pixTransaction.copyPaste ? (
                                        <img
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixTransaction.copyPaste)}`}
                                          alt="QR Code PIX"
                                          width={180}
                                          height={180}
                                          className="mx-auto"
                                        />
                                      ) : (
                                        <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded-lg">
                                          <span className="text-gray-500 text-sm">QR Code</span>
                                        </div>
                                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground text-lg">
                        Valor: {formatCurrency(pixTransaction.amount)}
                      </p>
                      <p className="mt-1">Escaneie o QR Code ou copie o código abaixo</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-[#252525] rounded-lg p-3 max-w-full overflow-hidden">
                        <code className="flex-1 text-xs text-muted-foreground break-all line-clamp-2 text-left">
                          {pixTransaction.copyPaste}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => copyToClipboard(pixTransaction.copyPaste)}
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={checkPaymentStatus}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar Pagamento
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={resetDeposit}
                      className="w-full text-sm text-muted-foreground"
                    >
                      Gerar novo QR Code
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawDialogOpen} onOpenChange={(open) => {
            setWithdrawDialogOpen(open);
            if (!open) {
              setError(null);
              setWithdrawSuccess(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Sacar
              </Button>
            </DialogTrigger>
            <DialogContent className="!bg-[#1a1a1a] border-border max-w-md sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Sacar via PIX</DialogTitle>
              </DialogHeader>
              <WithdrawModal
                balance={balance}
                savedPixKeys={savedPixKeys}
                systemSettings={systemSettings}
                loading={loading}
                error={error}
                withdrawSuccess={withdrawSuccess}
                withdrawalData={withdrawalData}
                onWithdraw={handleWithdraw}
                onClose={() => {
                  setWithdrawDialogOpen(false);
                  setError(null);
                  setWithdrawSuccess(false);
                  setWithdrawAmount("");
                  setWithdrawPixKey("");
                  setWithdrawalData(null);
                }}
              />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" onClick={loadBalance} disabled={loadingBalance}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingBalance ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">
            Sobre Depósitos
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Depósitos via PIX são creditados instantaneamente
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Sem taxas para depósitos
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              QR Code válido por 30 minutos
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Valor mínimo: R$ {systemSettings.minDeposit.toFixed(2).replace('.', ',')}
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Sobre Saques</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Taxa de saque: R$ {(systemSettings.withdrawalFee || 5).toFixed(2).replace('.', ',')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Valor minimo: R$ {(systemSettings.minWithdrawal || 25).toFixed(2).replace('.', ',')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Processamento em ate 5 minutos
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Saques 24h por dia, 7 dias por semana
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
