"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Limits {
  minDeposit: number;
  maxDepositPerTx: number;
  minWithdrawal: number;
  maxWithdrawalPerTx: number;
  dailyWithdrawalLimit: number;
  maxTxPerDay: number;
  autoApproveWithdrawalUnder: number;
  holdNewAccountDays: number;
}

const FIELDS: { key: keyof Limits; label: string; hint: string; prefix?: string; suffix?: string }[] = [
  { key: "minDeposit", label: "Depósito mínimo", hint: "Valor mínimo por depósito PIX", prefix: "R$" },
  { key: "maxDepositPerTx", label: "Depósito máximo por transação", hint: "Teto por depósito individual", prefix: "R$" },
  { key: "minWithdrawal", label: "Saque mínimo", hint: "Valor mínimo por saque", prefix: "R$" },
  { key: "maxWithdrawalPerTx", label: "Saque máximo por transação", hint: "Teto por saque individual", prefix: "R$" },
  { key: "dailyWithdrawalLimit", label: "Limite diário de saque", hint: "Total sacável por usuário por dia", prefix: "R$" },
  { key: "maxTxPerDay", label: "Transações por dia", hint: "Máximo de transações por usuário/dia", suffix: "tx" },
  { key: "autoApproveWithdrawalUnder", label: "Auto-aprovar saques abaixo de", hint: "Saques menores são aprovados automaticamente", prefix: "R$" },
  { key: "holdNewAccountDays", label: "Retenção de conta nova", hint: "Dias de retenção para contas recém-criadas", suffix: "dias" },
];

const groups: { title: string; keys: (keyof Limits)[] }[] = [
  { title: "Depósitos", keys: ["minDeposit", "maxDepositPerTx"] },
  { title: "Saques", keys: ["minWithdrawal", "maxWithdrawalPerTx", "dailyWithdrawalLimit", "autoApproveWithdrawalUnder"] },
  { title: "Antifraude", keys: ["maxTxPerDay", "holdNewAccountDays"] },
];

export default function LimitsPage() {
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/limits")
      .then((r) => r.json())
      .then((d) => setLimits(d.limits))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!limits) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limits),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Erro ao salvar"); return; }
      setLimits(d.limits);
      toast.success("Limites salvos");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !limits) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-primary" /> Limites da plataforma
          </h1>
          <p className="text-muted-foreground">Limites globais de depósito, saque e antifraude</p>
        </div>
        <Button onClick={save} disabled={saving} className="shrink-0">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar alterações
        </Button>
      </header>

      {groups.map((g) => (
        <div key={g.title} className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border"><h2 className="font-semibold text-foreground">{g.title}</h2></div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {g.keys.map((key) => {
              const f = FIELDS.find((x) => x.key === key)!;
              return (
                <div key={key}>
                  <label className="text-sm text-foreground mb-1 block">{f.label}</label>
                  <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3">
                    {f.prefix && <span className="text-sm text-muted-foreground">{f.prefix}</span>}
                    <input
                      type="number"
                      min={0}
                      value={limits[key]}
                      onChange={(e) => setLimits({ ...limits, [key]: Number(e.target.value) })}
                      className="flex-1 bg-transparent py-2 text-foreground outline-none"
                    />
                    {f.suffix && <span className="text-sm text-muted-foreground">{f.suffix}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{f.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
