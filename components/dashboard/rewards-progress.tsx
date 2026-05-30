"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Trophy, X, MapPin, Loader2, CheckCircle, Watch, Award, Medal, Crown, Gem, Star, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Reward {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface RewardsProgressProps {
  totalRevenue: number;
  userId: string;
}

const rewardMilestones: { target: number; name: string; type: string; icon: LucideIcon }[] = [
  { target: 10000, name: "Pulseira Hyperion Pay", type: "bracelet", icon: Watch },
  { target: 50000, name: "Placa 50K", type: "plaque_50k", icon: Award },
  { target: 100000, name: "Placa 100K", type: "plaque_100k", icon: Medal },
  { target: 500000, name: "Placa 500K", type: "plaque_500k", icon: Trophy },
  { target: 1000000, name: "Placa 1M", type: "plaque_1m", icon: Crown },
  { target: 5000000, name: "Placa 5M", type: "plaque_5m", icon: Gem },
  { target: 10000000, name: "Placa 10M", type: "plaque_10m", icon: Star },
];

export function RewardsProgress({ totalRevenue, userId }: RewardsProgressProps) {
  const [userRewards, setUserRewards] = useState<Reward[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<typeof rewardMilestones[0] | null>(null);
  const [address, setAddress] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRewards();
  }, [userId]);

  async function loadRewards() {
    try {
      const response = await fetch('/api/user/rewards');
      if (response.ok) {
        const data = await response.json();
        setUserRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
    setIsLoading(false);
  }

  async function claimReward() {
    if (!selectedMilestone || !address) return;

    setIsClaiming(true);
    try {
      const response = await fetch('/api/user/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardType: selectedMilestone.type,
          amount: selectedMilestone.target,
          address,
        }),
      });

      if (response.ok) {
        await loadRewards();
        setShowModal(false);
        setSelectedMilestone(null);
        setAddress("");
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao solicitar premiação');
      }
    } catch (error) {
      console.error("Erro ao solicitar premiação:", error);
      alert("Erro ao solicitar premiação. Tente novamente.");
    } finally {
      setIsClaiming(false);
    }
  }

  const getRewardStatus = (milestone: typeof rewardMilestones[0]) => {
    const userReward = userRewards.find((ur) => ur.type === milestone.type);
    if (userReward) return userReward.status;
    if (totalRevenue >= milestone.target) return "available";
    return "locked";
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Encontrar próxima premiação
  const nextMilestone = rewardMilestones.find((r) => totalRevenue < r.target);
  const progressToNext = nextMilestone
    ? Math.min((totalRevenue / nextMilestone.target) * 100, 100)
    : 100;

  if (isLoading) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 flex-shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Programa de Premiações</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Faturamento: {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
          {nextMilestone && (
            <div className="text-left sm:text-right ml-11 sm:ml-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Próxima meta</p>
              <p className="font-semibold text-primary text-sm sm:text-base">{formatCurrency(nextMilestone.target)}</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {nextMilestone && (
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-2">
              <span>{formatCurrency(totalRevenue)}</span>
              <span className="text-right truncate ml-2">{formatCurrency(nextMilestone.target)}</span>
            </div>
            <div className="h-2 sm:h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center truncate">
              Faltam {formatCurrency(nextMilestone.target - totalRevenue)} para {nextMilestone.name}
            </p>
          </div>
        )}

        {/* Rewards List */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-2 sm:px-2 scrollbar-hide">
          {rewardMilestones.map((milestone) => {
            const status = getRewardStatus(milestone);
            const isAvailable = status === "available";
            const isClaimed = status === "pending" || status === "credited";
            const isLocked = status === "locked";

            return (
              <motion.button
                key={milestone.type}
                onClick={() => {
                  if (isAvailable) {
                    setSelectedMilestone(milestone);
                    setShowModal(true);
                  }
                }}
                disabled={!isAvailable}
                className={`flex-shrink-0 p-2 sm:p-4 rounded-xl border transition-all ${
                  isAvailable
                    ? "bg-primary/10 border-primary cursor-pointer hover:bg-primary/20"
                    : isClaimed
                    ? "bg-green-400/10 border-green-400/30"
                    : "bg-secondary border-border opacity-50"
                }`}
                whileHover={isAvailable ? { scale: 1.02 } : {}}
                whileTap={isAvailable ? { scale: 0.98 } : {}}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-[60px] sm:min-w-[80px]">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${isAvailable ? "bg-primary/20" : isClaimed ? "bg-green-400/20" : "bg-secondary"}`}>
                    {isClaimed ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    ) : (
                      <milestone.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isLocked ? "text-muted-foreground opacity-50" : "text-primary"}`} />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium text-center whitespace-nowrap ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                    {formatCurrency(milestone.target)}
                  </span>
                  {isAvailable && (
                    <span className="text-[9px] sm:text-[10px] text-primary font-medium">Resgatar</span>
                  )}
                  {isClaimed && (
                    <span className="text-[9px] sm:text-[10px] text-green-400 font-medium">
                      {status === "credited" ? "Entregue" : "Solicitado"}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showModal && selectedMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Resgatar Premiação
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedMilestone.name}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    Parabéns por atingir essa meta!
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Meta atingida: {formatCurrency(selectedMilestone.target)}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereço de Entrega *
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  />
                </div>

                <Button
                  onClick={claimReward}
                  disabled={!address || isClaiming}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isClaiming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Gift className="w-4 h-4 mr-2" />
                  Solicitar Premiação
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Sua premiação será enviada em até 15 dias úteis após a solicitação.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
