"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, MapPin, Loader2, Gift, Play, ChevronLeft, ChevronRight, RotateCcw, Award, Star, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Mapeamento de imagens das premiacoes
const rewardImages: Record<string, string> = {
  bracelet: "/rewards/pulseira.png",
  plaque_50k: "/rewards/placa-50k.png",
  plaque_100k: "/rewards/placa-100k.png",
  plaque_500k: "/rewards/placa-50k.png", // Usando imagem disponivel
  plaque_1m: "/rewards/placa-1m-v1.png",
};

// Opcoes de variacao para premiacoes
const rewardVariations: Record<string, { id: string; name: string; image: string }[]> = {
  bracelet: [
    { id: "pulseira", name: "Pulseira", image: "/rewards/pulseira.png" },
    { id: "garrafa", name: "Garrafa", image: "/rewards/garrafa-caneca.png" },
    { id: "caneca", name: "Caneca", image: "/rewards/garrafa-caneca.png" },
  ],
  plaque_1m: [
    { id: "classica", name: "Placa Clássica", image: "/rewards/placa-1m-v1.png" },
    { id: "mascote", name: "Placa com Mascote", image: "/rewards/placa-1m-v2.png" },
  ],
};

interface Reward {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface GoalsRoadmapProps {
  totalRevenue: number;
  userId: string;
}

// Recompensas da simulacao
const simulationRewards = [
  { 
    id: 1, 
    type: "bracelet", 
    name: "Pulseira Exclusiva", 
    value: 20000, 
    label: "R$ 20K Faturados",
    description: "Uma pulseira exclusiva Hyperion Pay para celebrar seus primeiros R$ 20K!",
    icon: "bracelet",
    level: "Conquista Bronze"
  },
  { 
    id: 2, 
    type: "plaque_100k", 
    name: "Placa 100K", 
    value: 100000, 
    label: "R$ 100K Faturados",
    description: "Placa comemorativa pelos R$ 100K faturados na plataforma!",
    icon: "plaque",
    level: "Conquista Prata"
  },
  { 
    id: 3, 
    type: "plaque_500k", 
    name: "Placa 500K", 
    value: 500000, 
    label: "R$ 500K Faturados",
    description: "Placa de reconhecimento pelo meio milhao faturado!",
    icon: "plaque",
    level: "Conquista Ouro"
  },
  { 
    id: 4, 
    type: "plaque_1m", 
    name: "Placa 1M", 
    value: 1000000, 
    label: "R$ 1M Faturados",
    description: "Placa premium pelo primeiro milhao faturado na Hyperion Pay!",
    icon: "plaque",
    level: "Conquista Diamante"
  },
  { 
    id: 5, 
    type: "event", 
    name: "Evento Top Sellers", 
    value: 1000000, 
    label: "Evento Exclusivo",
    description: "Convite para o evento anual dos maiores sellers da plataforma Hyperion Pay!",
    icon: "event",
    level: "Conquista Lendario"
  },
];

const milestones = [
  { value: 1000, label: "R$ 1K", row: 1, col: 1 },
  { value: 10000, label: "R$ 10K", row: 1, col: 2 },
  { value: 20000, label: "R$ 20K", row: 1, col: 3, hasBadge: true, badgeType: "bracelet" },
  { value: 50000, label: "R$ 50K", row: 1, col: 5 },
  { value: 75000, label: "R$ 75K", row: 2, col: 5 },
  { value: 100000, label: "R$ 100K", row: 2, col: 4, hasBadge: true, badgeType: "plaque_100k" },
  { value: 250000, label: "R$ 250K", row: 2, col: 2 },
  { value: 375000, label: "R$ 375K", row: 2, col: 1 },
  { value: 500000, label: "R$ 500K", row: 3, col: 1, hasBadge: true, badgeType: "plaque_500k" },
  { value: 750000, label: "R$ 750K", row: 3, col: 3 },
  { value: 1000000, label: "R$ 1M", row: 3, col: 4, hasBadge: true, badgeType: "plaque_1m" },
];

const achievementNames: Record<string, string> = {
  bracelet: "Pulseira Exclusiva",
  plaque_100k: "Placa 100K",
  plaque_500k: "Placa 500K",
  plaque_1m: "Placa 1M",
  event: "Evento Top Sellers",
};

const achievementLevels = [
  { name: "Conquista Bronze", minValue: 0, maxValue: 20000, color: "from-indigo-600 to-indigo-800" },
  { name: "Conquista Prata", minValue: 20000, maxValue: 100000, color: "from-gray-400 to-gray-600" },
  { name: "Conquista Ouro", minValue: 100000, maxValue: 500000, color: "from-yellow-500 to-yellow-700" },
  { name: "Conquista Diamante", minValue: 500000, maxValue: 1000000, color: "from-cyan-400 to-blue-600" },
  { name: "Conquista Lendario", minValue: 1000000, maxValue: Infinity, color: "from-purple-500 to-pink-600" },
];

export function GoalsRoadmap({ totalRevenue, userId }: GoalsRoadmapProps) {
  const [userRewards, setUserRewards] = useState<Reward[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMilestone, setPreviewMilestone] = useState<typeof milestones[0] | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<typeof milestones[0] | null>(null);
  const [address, setAddress] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSimulation, setShowSimulation] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<string>("");

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
    if (!selectedMilestone || !address || !selectedMilestone.badgeType) return;

    setIsClaiming(true);
    try {
      const response = await fetch('/api/user/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardType: selectedMilestone.badgeType,
          amount: selectedMilestone.value,
          address,
          variation: selectedVariation || undefined,
        }),
      });

      if (response.ok) {
        await loadRewards();
        setShowModal(false);
        setSelectedMilestone(null);
        setAddress("");
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao solicitar premiacao');
      }
    } catch (error) {
      console.error("Erro ao solicitar premiacao:", error);
      alert("Erro ao solicitar premiacao. Tente novamente.");
    } finally {
      setIsClaiming(false);
    }
  }

  const getMilestoneStatus = (milestone: typeof milestones[0]) => {
    if (milestone.hasBadge && milestone.badgeType) {
      const reward = userRewards.find(r => r.type === milestone.badgeType);
      if (reward) return reward.status;
    }
    if (totalRevenue >= milestone.value) return "completed";
    return "locked";
  };

  // Encontrar nivel atual e proxima meta
  const currentLevel = achievementLevels.find(
    level => totalRevenue >= level.minValue && totalRevenue < level.maxValue
  ) || achievementLevels[0];

  const nextMilestone = milestones.find(m => totalRevenue < m.value);
  const progressPercent = nextMilestone 
    ? Math.min((totalRevenue / nextMilestone.value) * 100, 100)
    : 100;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value}`;
  };

  // Encontrar recompensas disponiveis para resgate (atingidas mas nao solicitadas)
  const availableRewards = milestones.filter(m => {
    if (!m.hasBadge || !m.badgeType) return false;
    if (totalRevenue < m.value) return false;
    const reward = userRewards.find(r => r.type === m.badgeType);
    return !reward; // Disponivel se ainda nao foi solicitada
  });

  const hasAvailableReward = availableRewards.length > 0;
  const nextAvailableReward = availableRewards[0];

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Metas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Acompanhe as metas de faturamento e obtenha recompensas.
        </p>

        <div className="flex flex-col gap-4">
          {/* Roadmap Grid - Mobile: vertical list, Desktop: snake layout */}
          <div className="w-full overflow-hidden">
            {/* Mobile Layout - Grid 3x4 */}
            <div className="grid grid-cols-3 gap-3 sm:hidden">
              {/* Row 1 */}
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 1000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 1000 ? "text-primary" : "text-gray-400"}`}>R$ 1K</span>
              </div>
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 10000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 10000 ? "text-primary" : "text-gray-400"}`}>R$ 10K</span>
              </div>
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 20000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 20000 ? "text-primary" : "text-gray-400"}`}>R$ 20K</span>
              </div>
              
              {/* Row 2 */}
              <button
                onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "bracelet")!); setShowPreview(true); }}
                className={`aspect-square rounded-full border-2 overflow-hidden relative ${totalRevenue >= 20000 ? "border-primary" : "border-primary/40"}`}
              >
                <Image src="/rewards/pulseira.png" alt="Pulseira 20K" fill className={`object-cover ${totalRevenue >= 20000 ? "" : "grayscale opacity-50"}`} />
              </button>
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 50000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 50000 ? "text-primary" : "text-gray-400"}`}>R$ 50K</span>
              </div>
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 75000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 75000 ? "text-primary" : "text-gray-400"}`}>R$ 75K</span>
              </div>
              
              {/* Row 3 */}
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 100000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 100000 ? "text-primary" : "text-gray-400"}`}>R$ 100K</span>
              </div>
              <button
                onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "plaque_100k")!); setShowPreview(true); }}
                className={`aspect-square rounded-full border-2 overflow-hidden relative ${totalRevenue >= 100000 ? "border-primary" : "border-primary/40"}`}
              >
                <Image src="/rewards/placa-100k.png" alt="Placa 100K" fill className={`object-cover ${totalRevenue >= 100000 ? "" : "grayscale opacity-50"}`} />
              </button>
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 250000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 250000 ? "text-primary" : "text-gray-400"}`}>R$ 250K</span>
              </div>
              
              {/* Row 4 */}
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 500000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 500000 ? "text-primary" : "text-gray-400"}`}>R$ 500K</span>
              </div>
              <button
                onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "plaque_500k")!); setShowPreview(true); }}
                className={`aspect-square rounded-full border-2 overflow-hidden relative ${totalRevenue >= 500000 ? "border-primary" : "border-primary/40"}`}
              >
                <Image src="/rewards/placa-50k.png" alt="Placa 500K" fill className={`object-cover ${totalRevenue >= 500000 ? "" : "grayscale opacity-50"}`} />
              </button>
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 750000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 750000 ? "text-primary" : "text-gray-400"}`}>R$ 750K</span>
              </div>
              
              {/* Row 5 */}
              <div className={`aspect-square rounded-full border-2 flex items-center justify-center ${totalRevenue >= 1000000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                <span className={`text-xs font-bold ${totalRevenue >= 1000000 ? "text-primary" : "text-gray-400"}`}>R$ 1M</span>
              </div>
              <button
                onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "plaque_1m")!); setShowPreview(true); }}
                className={`aspect-square rounded-full border-2 overflow-hidden relative ${totalRevenue >= 1000000 ? "border-primary" : "border-primary/40"}`}
              >
                <Image src="/rewards/placa-1m-v1.png" alt="Placa 1M" fill className={`object-cover ${totalRevenue >= 1000000 ? "" : "grayscale opacity-50"}`} />
              </button>
              <div className="aspect-square" /> {/* Empty cell */}
            </div>
            
            {/* Desktop Layout - Snake Pattern */}
            <div className="hidden sm:block w-full space-y-2">
              {/* Row 1: R$ 1K -> R$ 10K -> R$ 20K -> [Pulseira] -> R$ 50K */}
              <div className="flex items-center justify-between w-full">
                {/* R$ 1K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 1000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 1000 ? "text-primary" : "text-gray-400"}`}>R$ 1K</span>
                </div>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 10000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 10K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 10000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 10000 ? "text-primary" : "text-gray-400"}`}>R$ 10K</span>
                </div>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 20000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 20K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 20000 ? "border-primary bg-primary/20" : "border-primary/40 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 20000 ? "text-primary" : "text-gray-400"}`}>R$ 20K</span>
                </div>
                
                <div className={`h-0.5 w-2 md:w-4 mx-0.5 md:mx-1 flex-shrink-0 ${totalRevenue >= 20000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* Pulseira Image */}
                <button
                  onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "bracelet")!); setShowPreview(true); }}
                  className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 overflow-hidden relative flex-shrink-0 transition-transform hover:scale-105 ${totalRevenue >= 20000 ? "border-primary" : "border-primary/40"}`}
                >
                  <Image src="/rewards/pulseira.png" alt="Pulseira 20K" fill className={`object-cover ${totalRevenue >= 20000 ? "" : "grayscale opacity-50"}`} />
                </button>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 50000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 50K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 50000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 50000 ? "text-primary" : "text-gray-400"}`}>R$ 50K</span>
                </div>
              </div>
              
              {/* Vertical connector Row 1 -> Row 2 (right side) */}
              <div className="flex justify-end pr-[32px] md:pr-[42px]">
                <div className={`w-0.5 h-4 md:h-6 ${totalRevenue >= 75000 ? "bg-primary" : "bg-gray-700"}`} />
              </div>

              {/* Row 2: R$ 375K <- R$ 250K <- [100K Placa] <- R$ 100K <- R$ 75K */}
              <div className="flex items-center justify-between w-full flex-row-reverse">
                {/* R$ 75K (right) */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 75000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 75000 ? "text-primary" : "text-gray-400"}`}>R$ 75K</span>
                </div>
                
                <div className={`h-0.5 w-2 md:w-4 mx-0.5 md:mx-1 flex-shrink-0 ${totalRevenue >= 100000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 100K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 100000 ? "border-primary bg-primary/20" : "border-primary/40 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 100000 ? "text-primary" : "text-gray-400"}`}>R$ 100K</span>
                </div>
                
                <div className={`h-0.5 w-2 md:w-4 mx-0.5 md:mx-1 flex-shrink-0 ${totalRevenue >= 100000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* 100K Placa Image */}
                <button
                  onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "plaque_100k")!); setShowPreview(true); }}
                  className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 overflow-hidden relative flex-shrink-0 transition-transform hover:scale-105 ${totalRevenue >= 100000 ? "border-primary" : "border-primary/40"}`}
                >
                  <Image src="/rewards/placa-100k.png" alt="Placa 100K" fill className={`object-cover ${totalRevenue >= 100000 ? "" : "grayscale opacity-50"}`} />
                </button>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 250000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 250K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 250000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 250000 ? "text-primary" : "text-gray-400"}`}>R$ 250K</span>
                </div>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 375000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 375K (left) */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 375000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 375000 ? "text-primary" : "text-gray-400"}`}>R$ 375K</span>
                </div>
              </div>
              
              {/* Vertical connector Row 2 -> Row 3 (left side) */}
              <div className="flex justify-start pl-[32px] md:pl-[42px]">
                <div className={`w-0.5 h-4 md:h-6 ${totalRevenue >= 500000 ? "bg-primary" : "bg-gray-700"}`} />
              </div>

              {/* Row 3: R$ 500K -> [500K Placa] -> R$ 750K -> R$ 1M -> [1M Placa] */}
              <div className="flex items-center justify-between w-full">
                {/* R$ 500K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 500000 ? "border-primary bg-primary/20" : "border-primary/40 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 500000 ? "text-primary" : "text-gray-400"}`}>R$ 500K</span>
                </div>
                
                <div className={`h-0.5 w-2 md:w-4 mx-0.5 md:mx-1 flex-shrink-0 ${totalRevenue >= 500000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* 500K Placa Image */}
                <button
                  onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "plaque_500k")!); setShowPreview(true); }}
                  className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 overflow-hidden relative flex-shrink-0 transition-transform hover:scale-105 ${totalRevenue >= 500000 ? "border-primary" : "border-primary/40"}`}
                >
                  <Image src="/rewards/placa-50k.png" alt="Placa 500K" fill className={`object-cover ${totalRevenue >= 500000 ? "" : "grayscale opacity-50"}`} />
                </button>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 750000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 750K */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 750000 ? "border-primary bg-primary/20" : "border-gray-600 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 750000 ? "text-primary" : "text-gray-400"}`}>R$ 750K</span>
                </div>
                
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 ${totalRevenue >= 1000000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* R$ 1M */}
                <div className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${totalRevenue >= 1000000 ? "border-primary bg-primary/20" : "border-primary/40 bg-gray-800/50"}`}>
                  <span className={`text-xs md:text-sm font-bold ${totalRevenue >= 1000000 ? "text-primary" : "text-gray-400"}`}>R$ 1M</span>
                </div>
                
                <div className={`h-0.5 w-2 md:w-4 mx-0.5 md:mx-1 flex-shrink-0 ${totalRevenue >= 1000000 ? "bg-primary" : "bg-gray-700"}`} />
                
                {/* 1M Placa Image */}
                <button
                  onClick={() => { setPreviewMilestone(milestones.find(m => m.badgeType === "plaque_1m")!); setShowPreview(true); }}
                  className={`w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-2 overflow-hidden relative flex-shrink-0 transition-transform hover:scale-105 ${totalRevenue >= 1000000 ? "border-primary" : "border-primary/40"}`}
                >
                  <Image src="/rewards/placa-1m-v1.png" alt="Placa 1M" fill className={`object-cover ${totalRevenue >= 1000000 ? "" : "grayscale opacity-50"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Panel - Grid layout below roadmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Current Progress Card */}
            <div className={`bg-secondary rounded-xl p-4 border ${hasAvailableReward ? "border-primary" : "border-border"}`}>
              <p className="text-sm text-muted-foreground mb-3">Progresso Atual</p>
              
              {/* Achievement Badge ou Proxima Premiacao */}
              {(() => {
                // Encontrar proxima premiacao nao conquistada
                const rewardMilestones = milestones.filter(m => m.hasBadge && m.badgeType);
                const nextRewardMilestone = rewardMilestones.find(m => totalRevenue < m.value);
                const hasImage = nextRewardMilestone && rewardImages[nextRewardMilestone.badgeType!];
                
                if (hasImage && nextRewardMilestone) {
                  return (
                    <>
                      <div className="w-full aspect-[16/9] rounded-lg mb-4 relative overflow-hidden border border-primary/30">
                        <Image 
                          src={rewardImages[nextRewardMilestone.badgeType!]} 
                          alt={achievementNames[nextRewardMilestone.badgeType!]}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="text-lg font-bold text-foreground text-center mb-1">
                        Proxima Premiacao
                      </h3>
                      <p className="text-sm text-primary font-medium text-center mb-1">
                        {achievementNames[nextRewardMilestone.badgeType!]}
                      </p>
                      <p className="text-xs text-muted-foreground text-center mb-4">
                        Meta: {nextRewardMilestone.label} em faturamento
                      </p>
                    </>
                  );
                }
                
                // Se ja conquistou todas as premiacoes
                return (
                  <>
                    <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${currentLevel.color} flex items-center justify-center mb-4`}>
                      <Trophy className="w-12 h-12 text-white/80" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground text-center mb-1">
                      {currentLevel.name}
                    </h3>
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      {totalRevenue >= 1000000 ? "Parabens! Voce conquistou todas as premiacoes!" : "Continue faturando para desbloquear premiacoes!"}
                    </p>
                  </>
                );
              })()}
              
              {/* Mensagem de recompensa disponivel */}
              {hasAvailableReward && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-primary font-medium text-center mb-1">
                    Voce atingiu uma meta!
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {nextAvailableReward && achievementNames[nextAvailableReward.badgeType!]} disponivel para resgate
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-primary font-medium">
                  {hasAvailableReward ? "Recompensa Disponivel" : "Em Progresso"}
                </span>
              </div>

              {/* Botao Resgatar Premiacao */}
              {hasAvailableReward && nextAvailableReward && (
                <Button
                  onClick={() => {
                    setSelectedMilestone(nextAvailableReward);
                    setSelectedVariation("");
                    setShowModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 mb-4"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Resgatar Premiacao
                </Button>
              )}

              {/* Progress bar */}
              {nextMilestone && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{formatCurrency(totalRevenue)}</span>
                    <span>{formatCurrency(nextMilestone.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {progressPercent.toFixed(0)}% completo
                  </p>
                </div>
              )}
            </div>

            {/* Simulation Card */}
            <div className="bg-secondary rounded-xl p-4 border border-primary/30">
              <p className="text-primary font-medium mb-2">Simulacao</p>
              <p className="text-xs text-muted-foreground mb-4">
                Clique em &quot;Iniciar Simulacao&quot; para ver como ficaria o caminho ao completar cada recompensa.
              </p>
              <Button 
                onClick={() => {
                  setShowSimulation(true);
                  setCurrentRewardIndex(0);
                }}
                className="w-full bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Simulacao
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showModal && selectedMilestone && selectedMilestone.badgeType && (
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
                      Resgatar Premiacao
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {achievementNames[selectedMilestone.badgeType]}
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
                    Meta atingida: {selectedMilestone.label}
                  </p>
                </div>

                {/* Selecao de variacao */}
                {rewardVariations[selectedMilestone.badgeType] && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Escolha sua premiação *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {rewardVariations[selectedMilestone.badgeType].map((variation) => (
                        <button
                          key={variation.id}
                          onClick={() => setSelectedVariation(variation.id)}
                          className={`relative p-2 rounded-lg border-2 transition-all ${
                            selectedVariation === variation.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="aspect-square relative rounded-md overflow-hidden mb-2">
                            <Image
                              src={variation.image}
                              alt={variation.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs font-medium text-center">{variation.name}</p>
                          {selectedVariation === variation.id && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                  disabled={!address || isClaiming || (rewardVariations[selectedMilestone.badgeType] && !selectedVariation)}
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

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSimulation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowSimulation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-border p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Simulacao</h3>
                <button
                  onClick={() => {
                    setCurrentRewardIndex(0);
                  }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetar
                </button>
              </div>

              {/* Active Mode Badge */}
              <div className="bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground text-center py-2 px-4 rounded-lg text-sm font-medium mb-6">
                Modo Simulacao Ativo
              </div>

              {/* Reward Display */}
              <div className="flex flex-col items-center mb-6">
                {/* Reward Icon */}
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center mb-4 relative overflow-hidden">
                  {simulationRewards[currentRewardIndex].icon === "bracelet" && (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-4 rounded-full border-4 border-primary bg-primary/20 mb-2" />
                      <span className="text-xs text-primary font-bold">20K</span>
                      <span className="text-[10px] text-muted-foreground">FATURADOS</span>
                    </div>
                  )}
                  {simulationRewards[currentRewardIndex].icon === "plaque" && (
                    <div className="flex flex-col items-center p-2 bg-gradient-to-b from-primary/30 to-primary/10 rounded-lg border border-primary/50">
                      <Award className="w-8 h-8 text-primary mb-1" />
                      <span className="text-lg font-bold text-primary">
                        {simulationRewards[currentRewardIndex].value >= 1000000 
                          ? "1M" 
                          : `${simulationRewards[currentRewardIndex].value / 1000}K`}
                      </span>
                      <span className="text-[8px] text-muted-foreground">FATURADOS</span>
                    </div>
                  )}
                  {simulationRewards[currentRewardIndex].icon === "event" && (
                    <div className="flex flex-col items-center">
                      <Users className="w-10 h-10 text-primary mb-1" />
                      <Star className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                      <Star className="w-3 h-3 text-yellow-500 absolute top-4 left-3" />
                      <span className="text-xs text-primary font-bold">TOP SELLERS</span>
                    </div>
                  )}
                </div>

                {/* Reward Name */}
                <h4 className="text-xl font-bold text-foreground mb-1">
                  {simulationRewards[currentRewardIndex].level}
                </h4>
                <p className="text-sm text-muted-foreground text-center mb-2">
                  {simulationRewards[currentRewardIndex].description}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentRewardIndex(Math.max(0, currentRewardIndex - 1))}
                  disabled={currentRewardIndex === 0}
                  className="flex-1 border-border"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  onClick={() => setCurrentRewardIndex(Math.min(simulationRewards.length - 1, currentRewardIndex + 1))}
                  disabled={currentRewardIndex === simulationRewards.length - 1}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Proxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Progress Indicator */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Recompensa {currentRewardIndex + 1} de {simulationRewards.length}
                </p>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentRewardIndex + 1) / simulationRewards.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full"
                  />
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                onClick={() => setShowSimulation(false)}
                className="w-full mt-4 text-muted-foreground hover:text-foreground"
              >
                Fechar Simulacao
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal - Mostra imagem da premiacao */}
      <AnimatePresence>
        {showPreview && previewMilestone && previewMilestone.badgeType && rewardImages[previewMilestone.badgeType] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {achievementNames[previewMilestone.badgeType]}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Meta: {previewMilestone.label}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Imagem */}
              <div className="relative w-full aspect-square max-h-[400px] bg-black">
                <Image
                  src={rewardImages[previewMilestone.badgeType]}
                  alt={achievementNames[previewMilestone.badgeType]}
                  fill
                  className="object-contain"
                />
              </div>
              
              {/* Footer com status */}
              <div className="p-4 border-t border-border">
                {totalRevenue >= previewMilestone.value ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-500">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Meta Atingida!</span>
                    </div>
                    {(() => {
                      const reward = userRewards.find(r => r.type === previewMilestone.badgeType);
                      if (!reward) {
                        return (
                          <Button
                            onClick={() => {
                              setShowPreview(false);
                              setSelectedMilestone(previewMilestone);
                              setShowModal(true);
                            }}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Resgatar
                          </Button>
                        );
                      }
                      return (
                        <span className="text-sm text-muted-foreground">
                          Status: {reward.status === "pending" ? "Solicitado" : "Entregue"}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Faltam {formatCurrency(previewMilestone.value - totalRevenue)} para desbloquear
                    </p>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all"
                        style={{ width: `${Math.min((totalRevenue / previewMilestone.value) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((totalRevenue / previewMilestone.value) * 100).toFixed(0)}% completo
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
