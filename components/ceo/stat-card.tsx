"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  growth: number;
  sparkData: { v: number }[];
  color: "blue" | "green" | "purple" | "emerald";
  index: number;
}

const palette: Record<
  StatCardProps["color"],
  { text: string; iconBg: string; icon: string; stroke: string; gradId: string }
> = {
  blue: {
    text: "text-blue-600",
    iconBg: "bg-blue-500/10",
    icon: "text-blue-600",
    stroke: "#2563eb",
    gradId: "sparkBlue",
  },
  green: {
    text: "text-green-600",
    iconBg: "bg-green-500/10",
    icon: "text-green-600",
    stroke: "#16a34a",
    gradId: "sparkGreen",
  },
  purple: {
    text: "text-purple-600",
    iconBg: "bg-purple-500/10",
    icon: "text-purple-600",
    stroke: "#7c3aed",
    gradId: "sparkPurple",
  },
  emerald: {
    text: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    icon: "text-emerald-600",
    stroke: "#059669",
    gradId: "sparkEmerald",
  },
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  growth,
  sparkData,
  color,
  index,
}: StatCardProps) {
  const c = palette[color];
  const isUp = growth >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${c.text}`}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground truncate">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
            isUp ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          }`}
        >
          {isUp ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(growth).toFixed(1)}%
        </span>
        <span className="text-[11px] text-muted-foreground">vs. período anterior</span>
      </div>

      <div className="mt-3 h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={c.gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={c.stroke}
              strokeWidth={2}
              fill={`url(#${c.gradId})`}
              dot={false}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
