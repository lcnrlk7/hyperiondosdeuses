"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Trophy, Target, BarChart3, Loader2 } from "lucide-react";

interface AcquirerStat {
  id: string;
  name: string;
  badge?: string;
  total: number;
  approved: number;
  volume: number;
  conversion: number;
}

interface AnalyticsData {
  byAcquirer: AcquirerStat[];
  series: Array<Record<string, string | number>>;
  acquirerNames: string[];
  totals: { transactions: number; approved: number; volume: number };
  mostUsed: string | null;
  bestConversion: string | null;
}

// Paleta com base nos tokens do tema (3 adquirentes)
const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AcquirerAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/acquirers/analytics");
        const json = await res.json();
        if (json.success) setData(json);
      } catch (e) {
        console.error("Error loading analytics:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.byAcquirer.length === 0) {
    return null;
  }

  const hasData = data.totals.transactions > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Análise de desempenho (30 dias)</h2>
      </div>

      {/* Destaques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Mais usada</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.mostUsed || "—"}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm">Melhor conversão</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.bestConversion || "—"}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm">Volume aprovado (total)</span>
          </div>
          <p className="text-xl font-bold text-foreground">{brl(data.totals.volume)}</p>
        </div>
      </div>

      {!hasData ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
          Ainda não há transações registradas para as adquirentes Medusa Online. Os gráficos aparecerão
          assim que houver movimentação.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Barras: transações x aprovadas por adquirente */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Transações por adquirente</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byAcquirer}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickFormatter={(v: string) => v.split(" ")[0]}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Aprovadas" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversão por adquirente */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Taxa de conversão (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byAcquirer} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  width={110}
                  tickFormatter={(v: string) => v.split(" ")[0]}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Conversão"]}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Bar dataKey="conversion" name="Conversão" fill="var(--color-chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Linha: uso diário (14 dias) */}
          <div className="glass rounded-2xl p-5 lg:col-span-2">
            <h3 className="text-sm font-medium text-foreground mb-4">Uso diário (últimos 14 dias)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {data.acquirerNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    name={name.split(" ")[0]}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
