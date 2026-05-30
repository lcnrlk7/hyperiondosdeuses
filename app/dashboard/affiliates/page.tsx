"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Link as LinkIcon,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  Clock,
  Gift,
  Loader2,
  Share2,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  created_at: string;
  total_transactions: number;
  total_volume: number;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  referred_user_name: string;
  transaction_amount: number;
}

interface Summary {
  total_commissions: number;
  total_earned: number;
  pending_amount: number;
  paid_amount: number;
}

export default function AffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_commissions: 0,
    total_earned: 0,
    pending_amount: 0,
    paid_amount: 0
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAffiliates();
  }, []);

  async function loadAffiliates() {
    try {
      const response = await fetch("/api/user/affiliates");
      const data = await response.json();

      if (response.ok) {
        setReferralCode(data.referralCode);
        setReferralLink(data.referralLink);
        setAffiliates(data.affiliates);
        setCommissions(data.recentCommissions);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Erro ao carregar afiliados:", error);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Programa de Afiliados</h1>
        <p className="text-muted-foreground mt-1">
          Convide amigos e ganhe R$ 0,05 por cada transacao realizada
        </p>
      </div>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 to-indigo-500/10 border border-primary/30 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Seu Link de Convite</h2>
            <p className="text-sm text-muted-foreground">Compartilhe e comece a ganhar</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
          <Input
            value={referralLink}
            readOnly
            className="bg-transparent border-none text-sm"
          />
          <Button
            onClick={() => copyToClipboard(referralLink)}
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="bg-secondary px-3 py-1.5 rounded-lg">
            <span className="text-xs text-muted-foreground">Seu codigo: </span>
            <span className="text-sm font-bold text-primary">{referralCode}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Hyperion Pay - Convite",
                  text: "Use meu codigo de convite e ganhe beneficios!",
                  url: referralLink
                });
              } else {
                copyToClipboard(referralLink);
              }
            }}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Afiliados</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{affiliates.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Ganho</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(summary.total_earned)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Pendente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(summary.pending_amount)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-muted-foreground">Comissoes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{summary.total_commissions}</p>
        </motion.div>
      </div>

      {/* How it Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Como funciona</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Compartilhe seu link</p>
              <p className="text-sm text-muted-foreground">Envie para amigos e conhecidos</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Eles se cadastram</p>
              <p className="text-sm text-muted-foreground">Usando seu codigo de convite</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Voce ganha</p>
              <p className="text-sm text-muted-foreground">R$ 0,05 por transacao deles</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Affiliates List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Seus Afiliados</h3>
        
        {affiliates.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Voce ainda nao tem afiliados</p>
            <p className="text-sm text-muted-foreground">Compartilhe seu link e comece a ganhar!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Usuario</th>
                  <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Cadastro</th>
                  <th className="text-right py-3 px-2 text-xs text-muted-foreground font-medium">Transacoes</th>
                  <th className="text-right py-3 px-2 text-xs text-muted-foreground font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <p className="font-medium text-foreground">{affiliate.name || "Usuario"}</p>
                      <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {formatDate(affiliate.created_at)}
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-foreground">
                      {affiliate.total_transactions}
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-medium text-primary">
                      {formatCurrency(affiliate.total_volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Recent Commissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Comissoes Recentes</h3>
        
        {commissions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma comissao ainda</p>
            <p className="text-sm text-muted-foreground">Suas comissoes aparecerao aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    commission.status === "paid" ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {commission.referred_user_name || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Transacao de {formatCurrency(commission.transaction_amount || 0)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-500">
                    +{formatCurrency(commission.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(commission.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
