"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface SalesChartProps {
  transactions: Transaction[];
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

type ChartPeriod = "month" | "year";

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
};

export function SalesChart({ transactions }: SalesChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>("year");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (period === "year") {
      // Agrupar transacoes por mes do ano atual
      const monthlyData: Record<string, number> = {};
      
      // Inicializar todos os meses do ano atual
      for (let i = 0; i < 12; i++) {
        const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
      }

      // Somar transacoes de deposito por mes (incluir pendentes tambem)
      transactions
        .filter(t => 
          ["deposit", "transfer_in", "pix_in", "received"].includes(t.type) && 
          ["completed", "pending", "processing"].includes(t.status)
        )
        .forEach(t => {
          const date = new Date(t.created_at);
          if (date.getFullYear() === currentYear) {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key] !== undefined) {
              // Valor ja esta em reais
              monthlyData[key] += (Number(t.amount) || 0);
            }
          }
        });

      // Converter para array de dados do grafico
      return Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => {
          const [, month] = key.split('-');
          return {
            name: monthNames[parseInt(month) - 1],
            vendas: value,
          };
        });
    } else {
      // Agrupar por dia do mes atual
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyData: Record<number, number> = {};
      
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = 0;
      }

      transactions
        .filter(t => 
          ["deposit", "transfer_in", "pix_in", "received"].includes(t.type) && 
          ["completed", "pending", "processing"].includes(t.status)
        )
        .forEach(t => {
          const date = new Date(t.created_at);
          if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
            const day = date.getDate();
            dailyData[day] += (Number(t.amount) || 0);
          }
        });

      return Object.entries(dailyData).map(([day, value]) => ({
        name: day,
        vendas: value,
      }));
    }
  }, [transactions, period]);

  const totalVendas = chartData.reduce((sum, item) => sum + item.vendas, 0);
  const maxValue = Math.max(...chartData.map(d => d.vendas), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Vendas por Hora</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Acompanhe o volume horario da sua empresa
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          {/* Period Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-secondary border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="whitespace-nowrap">{period === "year" ? "Este ano" : "Este mes"}</span>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`} />
            </button>
            {showPeriodDropdown && (
              <div className="absolute right-0 top-full mt-2 w-32 sm:w-36 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => { setPeriod("month"); setShowPeriodDropdown(false); }}
                  className={`w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-secondary transition-colors ${period === "month" ? "bg-primary/10 text-primary" : "text-foreground"}`}
                >
                  Este mes
                </button>
                <button
                  onClick={() => { setPeriod("year"); setShowPeriodDropdown(false); }}
                  className={`w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-secondary transition-colors ${period === "year" ? "bg-primary/10 text-primary" : "text-foreground"}`}
                >
                  Este ano
                </button>
              </div>
            )}
          </div>
          <div className="text-right min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-primary truncate">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalVendas)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Total {period === "year" ? "no ano" : "no mes"}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto" style={{ minHeight: "300px", height: "300px" }}>
        <ResponsiveContainer width="100%" height={300} minWidth={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 10 }}
              tickFormatter={(value) => formatCurrency(value)}
              width={50}
              domain={[0, maxValue * 1.1]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #1f1f1f',
                borderRadius: '6px',
                padding: '10px 12px',
              }}
              labelStyle={{ color: '#fafafa', fontWeight: '600', marginBottom: '4px' }}
              formatter={(value: number) => [
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value),
                "Receita"
              ]}
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorVendas)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
