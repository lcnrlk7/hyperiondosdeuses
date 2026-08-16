"use client";

import { useState, useEffect } from "react";
import { Banknote, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WithdrawModal } from "@/components/wallet/withdraw-modal";

export interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
}

interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  is_primary: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const formatDateTime = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(d);
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Concluido", cls: "bg-success-bg text-success" },
    processing: { label: "Processando", cls: "bg-info-bg text-info-foreground" },
    pending: { label: "Pendente", cls: "bg-warning-bg text-warning-foreground" },
    failed: { label: "Falhou", cls: "bg-danger-bg text-danger-foreground" },
    rejected: { label: "Recusado", cls: "bg-danger-bg text-danger-foreground" },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${s.cls}`}>{s.label}</span>;
}

export function WithdrawalsContent({ withdrawals: initial }: { withdrawals: Withdrawal[] }) {
  const [withdrawals] = useState<Withdrawal[]>(initial);
  const [balance, setBalance] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [savedPixKeys, setSavedPixKeys] = useState<PixKey[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState({
    minWithdrawal: 25,
    maxWithdrawal: 50000,
    withdrawalFee: 5,
    autoWithdrawalLimit: 500,
  });

  useEffect(() => {
    loadBalance();
    loadPixKeys();
    loadUserFees();
  }, []);

  async function loadBalance() {
    try {
      const res = await fetch("/api/user/balance");
      const data = await res.json();
      if (data.balance !== undefined) setBalance(data.balance);
      if (data.pendingWithdrawals !== undefined) setPendingWithdrawals(data.pendingWithdrawals);
    } catch (e) {
      console.error("[v0] balance error", e);
    }
  }

  async function loadPixKeys() {
    try {
      const res = await fetch("/api/pix-keys");
      const data = await res.json();
      if (data.pixKeys) setSavedPixKeys(data.pixKeys);
    } catch (e) {
      console.error("[v0] pixkeys error", e);
    }
  }

  async function loadUserFees() {
    try {
      const res = await fetch("/api/user/fees");
      const data = await res.json();
      if (data.fees) {
        const route = data.fees.route_type || "black";
        setSystemSettings((prev) => ({
          ...prev,
          withdrawalFee: data.fees.withdrawal_fee || (route === "black" ? 5 : 2),
          minWithdrawal: data.fees.min_withdrawal || (route === "black" ? 25 : 15),
          maxWithdrawal: data.fees.max_withdrawal || prev.maxWithdrawal,
        }));
      }
    } catch (e) {
      console.error("[v0] fees error", e);
    }
  }

  const handleWithdraw = async (amount: number, pixKey: string, pixKeyType: string, faceChallengeId?: string) => {
    if (!amount || amount <= 0 || !pixKey) {
      setError("Preencha todos os campos");
      return;
    }
    if (amount < systemSettings.minWithdrawal) {
      setError(`Valor minimo: ${formatCurrency(systemSettings.minWithdrawal)}`);
      return;
    }
    const totalDebit = amount + (systemSettings.withdrawalFee || 5);
    if (totalDebit > balance) {
      setError(`Saldo insuficiente. Para receber ${formatCurrency(amount)}, voce precisa de ${formatCurrency(totalDebit)}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch("/api/withdrawals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, pixKey, pixKeyType, faceChallengeId }),
      });
      const data = await res.json();

      // Saque exige verificacao facial (Didit)
      if (res.status === 403 && data.requiresFaceAuth) {
        try {
          const chRes = await fetch("/api/verify/face-challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ purpose: "withdrawal" }),
          });
          const chData = await chRes.json();
          if (chRes.ok && chData.url) {
            sessionStorage.setItem(
              "face_withdraw",
              JSON.stringify({ amount, pixKey, pixKeyType, returnTo: window.location.pathname })
            );
            window.location.href = chData.url;
            return;
          }
          setError("Nao foi possivel iniciar a verificacao facial.");
        } catch {
          setError("Nao foi possivel iniciar a verificacao facial.");
        }
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Erro ao processar saque");
        setLoading(false);
        return;
      }

      setWithdrawalData({
        id: data.withdrawal?.id || `WD-${Date.now()}`,
        amount,
        fee: systemSettings.withdrawalFee || 5,
        netAmount: amount,
        pixKey,
        pixKeyType,
        status: data.withdrawal?.status || "pending",
        createdAt: new Date().toISOString(),
      });
      setWithdrawSuccess(true);
      loadBalance();
    } catch (e) {
      setError("Falha na conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Retoma o saque apos verificacao facial aprovada
  useEffect(() => {
    const url = new URL(window.location.href);
    const faceChallenge = url.searchParams.get("faceChallenge");
    if (!faceChallenge) return;
    const raw = sessionStorage.getItem("face_withdraw");
    url.searchParams.delete("faceChallenge");
    window.history.replaceState({}, "", url.toString());
    if (raw) {
      try {
        const pending = JSON.parse(raw);
        sessionStorage.removeItem("face_withdraw");
        setModalOpen(true);
        handleWithdraw(pending.amount, pending.pixKey, pending.pixKeyType, faceChallenge);
      } catch {
        // ignora
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = [
    { label: "Saldo disponivel", value: formatCurrency(balance), icon: Banknote, cls: "text-primary" },
    { label: "Saques pendentes", value: formatCurrency(pendingWithdrawals), icon: Clock, cls: "text-warning-foreground" },
    {
      label: "Total sacado",
      value: formatCurrency(
        withdrawals.filter((w) => w.status === "completed").reduce((a, w) => a + Number(w.net_amount || 0), 0)
      ),
      icon: ArrowUpRight,
      cls: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saques</h1>
          <p className="text-sm text-muted-foreground mt-1">Solicite e acompanhe seus saques via PIX</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Solicitar saque
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.cls}`}>{s.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.cls}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Historico de saques</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum saque solicitado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Chave PIX</th>
                  <th className="pb-3 font-medium">Valor liquido</th>
                  <th className="pb-3 font-medium">Taxa</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 text-muted-foreground font-mono text-xs">#{w.id.slice(0, 6)}</td>
                    <td className="py-3 text-foreground">{w.pix_key}</td>
                    <td className="py-3 font-medium text-foreground">{formatCurrency(Number(w.net_amount || 0))}</td>
                    <td className="py-3 text-muted-foreground">{formatCurrency(Number(w.fee || 0))}</td>
                    <td className="py-3"><StatusBadge status={w.status} /></td>
                    <td className="py-3 text-muted-foreground text-xs">{formatDateTime(w.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setError(null);
            setWithdrawSuccess(false);
            setWithdrawalData(null);
          }
        }}
      >
        <DialogContent className="!bg-card border-border max-w-md sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-foreground">Solicitar saque</DialogTitle>
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
              setModalOpen(false);
              setError(null);
              setWithdrawSuccess(false);
              setWithdrawalData(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
