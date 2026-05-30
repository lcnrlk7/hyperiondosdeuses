"use client"

import { Bell, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/components/profile-provider"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
  total_revenue?: number
}

interface User {
  id: string
  email: string
}

interface HeaderProps {
  user: User
  profile: Profile | null
}

// Milestones for rewards
const milestones = [
  { value: 1000, label: "R$ 1K" },
  { value: 10000, label: "R$ 10K" },
  { value: 20000, label: "R$ 20K" },
  { value: 50000, label: "R$ 50K" },
  { value: 75000, label: "R$ 75K" },
  { value: 100000, label: "R$ 100K" },
  { value: 250000, label: "R$ 250K" },
  { value: 375000, label: "R$ 375K" },
  { value: 500000, label: "R$ 500K" },
  { value: 750000, label: "R$ 750K" },
  { value: 1000000, label: "R$ 1M" },
];

function getNextMilestone(totalRevenue: number) {
  for (const milestone of milestones) {
    if (totalRevenue < milestone.value) {
      return milestone;
    }
  }
  return milestones[milestones.length - 1];
}

function getPreviousMilestone(totalRevenue: number) {
  let prev = { value: 0, label: "R$ 0" };
  for (const milestone of milestones) {
    if (totalRevenue >= milestone.value) {
      prev = milestone;
    } else {
      break;
    }
  }
  return prev;
}

function formatCompact(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export function DashboardHeader({ profile }: HeaderProps) {
  const { totalRevenue: contextTotalRevenue, profile: contextProfile } = useProfile();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Usar o totalRevenue do contexto (calculado das transacoes) - single source of truth
  const totalRevenue = contextTotalRevenue || profile?.total_revenue || 0;
  
  // Usar o saldo do contexto se disponivel
  const currentBalance = contextProfile?.balance ?? profile?.balance ?? 0;
  const previousMilestone = getPreviousMilestone(totalRevenue);
  const nextMilestone = getNextMilestone(totalRevenue);
  
  // Calculate progress between previous and next milestone
  const prevValue = previousMilestone.value;
  const nextValue = nextMilestone.value;
  const progressPercent = nextValue > prevValue
    ? Math.min(100, Math.round(((totalRevenue - prevValue) / (nextValue - prevValue)) * 100))
    : 100;

  return (
    <header className="hidden lg:flex h-16 bg-card border-b border-border items-center justify-end px-8">
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Rewards Progress - hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-500" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-indigo-400">
              {formatCompact(totalRevenue)}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">
              {nextMilestone.label}
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-indigo-400 font-medium">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="text-right">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo Liquido</p>
          <p className="text-sm sm:text-lg font-bold text-primary">
            {formatCurrency(Number(currentBalance))}
          </p>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  )
}
