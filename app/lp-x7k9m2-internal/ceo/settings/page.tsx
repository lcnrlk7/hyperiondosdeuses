"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Percent, DollarSign, Shield, Bell, Palette } from "lucide-react";
import { ThemeToggleWithLabel } from "@/components/theme-toggle";

interface SystemSettings {
  // Taxas de Deposito (PIX In)
  pix_percentage_fee: string;
  pix_fixed_fee: string;
  white_pix_percentage_fee: string;
  white_pix_fixed_fee: string;
  // Taxas de Saque (PIX Out)
  withdrawal_fee: string;
  withdrawal_fee_white: string;
  withdrawal_fee_black: string;
  // Limites de Deposito
  min_deposit: string;
  max_deposit: string;
  // Limites de Saque
  min_withdrawal: string;
  max_withdrawal: string;
  daily_withdrawal_limit: string;
  auto_withdraw_limit: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    // Taxas de Deposito (PIX In)
    pix_percentage_fee: "5.00",
    pix_fixed_fee: "0.75",
    white_pix_percentage_fee: "2.00",
    white_pix_fixed_fee: "0.75",
    // Taxas de Saque (PIX Out)
    withdrawal_fee: "7.00",
    withdrawal_fee_white: "7.00",
    withdrawal_fee_black: "7.00",
    // Limites de Deposito
    min_deposit: "3.00",
    max_deposit: "100000.00",
    // Limites de Saque
    min_withdrawal: "20.00",
    max_withdrawal: "50000.00",
    daily_withdrawal_limit: "100000.00",
    auto_withdraw_limit: "150.00",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data && typeof data === "object" && !data.error) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  }

  async function saveSettings() {
    setIsSaving(true);
    
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Configure as taxas e limites do sistema
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <Shield className="w-5 h-5" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* Taxas de Deposito (PIX In) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-green-500/10">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Taxas de Deposito (PIX In)</h2>
            <p className="text-sm text-muted-foreground">
              Taxas cobradas quando o cliente faz um pagamento PIX
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rota Black - PIX In */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              Rota Black (PIX In)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Taxa Percentual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.pix_percentage_fee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pix_percentage_fee: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Valor Fixo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.pix_fixed_fee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pix_fixed_fee: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Rota White - PIX In */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-zinc-400" />
              Rota White (PIX In)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Taxa Percentual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.white_pix_percentage_fee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      white_pix_percentage_fee: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Valor Fixo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.white_pix_fixed_fee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      white_pix_fixed_fee: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Taxas de Saque (PIX Out) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-500/10">
            <Percent className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Taxas de Saque (PIX Out)</h2>
            <p className="text-sm text-muted-foreground">
              Taxas cobradas quando o usuario solicita saque
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <label className="text-sm text-muted-foreground mb-2 block">
              Taxa Padrao de Saque (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.withdrawal_fee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  withdrawal_fee: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Valor fixo cobrado por saque
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <label className="text-sm text-muted-foreground mb-2 block">
              Taxa Saque Rota White (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.withdrawal_fee_white}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  withdrawal_fee_white: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <label className="text-sm text-muted-foreground mb-2 block">
              Taxa Saque Rota Black (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.withdrawal_fee_black}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  withdrawal_fee_black: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Limites de Depósito */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-400/10">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Limites de Depósito</h2>
            <p className="text-sm text-muted-foreground">
              Configure os limites para depósitos PIX
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Mínimo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.min_deposit}
              onChange={(e) =>
                setSettings({ ...settings, min_deposit: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Máximo por Depósito (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.max_deposit}
              onChange={(e) =>
                setSettings({ ...settings, max_deposit: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Limites de Saque */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-purple-400/10">
            <DollarSign className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Limites de Saque</h2>
            <p className="text-sm text-muted-foreground">
              Configure os limites para solicitacoes de saque
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Minimo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.min_withdrawal}
              onChange={(e) =>
                setSettings({ ...settings, min_withdrawal: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Maximo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.max_withdrawal}
              onChange={(e) =>
                setSettings({ ...settings, max_withdrawal: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Limite Diario (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.daily_withdrawal_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  daily_withdrawal_limit: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Automatico ate (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.auto_withdraw_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  auto_withdraw_limit: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Acima deste valor requer aprovacao
            </p>
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Aparencia</h2>
            <p className="text-sm text-muted-foreground">
              Personalize a interface do painel administrativo
            </p>
          </div>
        </div>

        <ThemeToggleWithLabel />
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
      >
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-400 font-medium">
              Alteracoes em tempo real
            </p>
            <p className="text-sm text-blue-300/70">
              As configuracoes sao aplicadas imediatamente apos salvar. Taxas
              personalizadas de usuarios tem prioridade sobre as taxas padrao.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
