"use client";

import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface Slice {
  name: string;
  value: number;
}

const COLORS = ["#2563eb", "#16a34a", "#7c3aed", "#f59e0b", "#0ea5e9", "#ec4899"];

export function MethodsDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
          <PieIcon className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Distribuição por Operação</h2>
      </div>

      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Sem dados suficientes
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sorted}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {sorted.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{total}</span>
                <span className="text-[11px] text-muted-foreground">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {sorted.map((s, i) => {
                const pct = total > 0 ? (s.value / total) * 100 : 0;
                return (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-foreground">{s.name}</span>
                    <span className="font-medium text-muted-foreground">{pct.toFixed(1)}%</span>
                    <span className="w-8 text-right font-semibold text-foreground">{s.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {top && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Operação mais usada</p>
                <p className="text-sm font-semibold text-foreground">{top.name}</p>
              </div>
              <span className="ml-auto rounded-lg bg-secondary-foreground/5 px-2.5 py-1 text-xs font-semibold text-foreground">
                {((top.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
