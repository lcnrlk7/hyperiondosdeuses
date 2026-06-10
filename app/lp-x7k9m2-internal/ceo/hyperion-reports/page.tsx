"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Percent,
  Wallet,
  ArrowUpRight,
  BarChart3,
  Search,
  Download,
  FileText,
  Printer,
  Calendar,
  Clock,
} from "lucide-react";
import {
  monthlyData,
  generateTransactions,
  dailyTransactions,
  hourlyHeatmap,
  weekDays,
  statusColors,
  TOTAL_USERS,
  ACTIVE_TODAY,
  AVG_FEE_PERCENT,
  type DemoTransaction,
} from "./demo-data";

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = (n: number) => n.toLocaleString("pt-BR");

type Tab = "dashboard" | "transactions" | "reports";

export default function HyperionReportsPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const allTx = useMemo(() => generateTransactions(260), []);
  const daily = useMemo(() => dailyTransactions(), []);
  const heatmap = useMemo(() => hourlyHeatmap(), []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Metricas agregadas
  const totalVolume = useMemo(
    () => monthlyData.reduce((s, m) => s + m.volume, 0),
    [],
  );
  const totalProfit = useMemo(
    () => monthlyData.reduce((s, m) => s + m.profit, 0),
    [],
  );
  const monthVolume = monthlyData[monthlyData.length - 1].volume;
  const dayVolume = Math.round(monthVolume / 30);
  const growth =
    ((monthlyData[monthlyData.length - 1].volume - monthlyData[0].volume) /
      monthlyData[0].volume) *
    100;

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allTx.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allTx]);

  const filteredTx = useMemo(() => {
    return allTx.filter((t) => {
      const matchSearch =
        !search ||
        t.userName.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.reference.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allTx, search, statusFilter]);

  const exportCSV = useCallback(() => {
    const headers = [
      "ID",
      "Hash",
      "Usuario",
      "Valor",
      "Taxa",
      "Tipo",
      "Status",
      "Data",
      "IP",
      "Metodo",
      "Referencia",
    ];
    const rows = filteredTx.map((t) =>
      [
        t.id,
        t.hash,
        t.userName,
        t.amount.toFixed(2),
        t.fee.toFixed(2),
        t.type,
        t.status,
        new Date(t.date).toLocaleString("pt-BR"),
        t.ip,
        t.method,
        t.reference,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hyperion-reports-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredTx]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-emerald-500/10 bg-gradient-to-br from-[#0a0f0c] via-[#070a08] to-[#050608]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #22c55e 0%, transparent 40%), radial-gradient(circle at 80% 70%, #10b981 0%, transparent 40%)",
          }}
        />
        <div className="relative px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <BarChart3 className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Hyperion Reports
                </h1>
                <p className="text-sm text-zinc-400">
                  Relatorios financeiros e analytics em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 backdrop-blur sm:w-fit">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "transactions", label: "Movimentacoes", icon: Activity },
              { id: "reports", label: "Relatorios Fiscais", icon: FileText },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none ${
                    active
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {tab === "dashboard" && (
          <DashboardTab
            totalVolume={totalVolume}
            totalProfit={totalProfit}
            monthVolume={monthVolume}
            dayVolume={dayVolume}
            growth={growth}
            daily={daily}
            heatmap={heatmap}
            statusBreakdown={statusBreakdown}
          />
        )}
        {tab === "transactions" && (
          <TransactionsTab
            transactions={filteredTx}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            exportCSV={exportCSV}
          />
        )}
        {tab === "reports" && <ReportsTab totalVolume={totalVolume} totalProfit={totalProfit} exportCSV={exportCSV} printReport={printReport} />}
      </div>
    </div>
  );
}

// ============================ DASHBOARD ============================
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "emerald",
  delay = 0,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "blue" | "amber" | "violet";
  delay?: number;
}) {
  const accents: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur"
    >
      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accents[accent]} blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-gradient-to-br ${accents[accent]}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-white">
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur"
    >
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">{title}</h3>
      {children}
    </motion.div>
  );
}

function DashboardTab({
  totalVolume,
  totalProfit,
  monthVolume,
  dayVolume,
  growth,
  daily,
  heatmap,
  statusBreakdown,
}: {
  totalVolume: number;
  totalProfit: number;
  monthVolume: number;
  dayVolume: number;
  growth: number;
  daily: { day: string; transactions: number; volume: number }[];
  heatmap: number[][];
  statusBreakdown: { name: string; value: number }[];
}) {
  return (
    <div className="space-y-6">
      {/* Cards de metricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Total Movimentado"
          value={fmtBRL(totalVolume)}
          sub="Desde marco"
          accent="emerald"
          delay={0}
        />
        <MetricCard
          icon={Users}
          label="Total de Usuarios"
          value={fmtNum(TOTAL_USERS)}
          sub="Cadastrados"
          accent="blue"
          delay={0.05}
        />
        <MetricCard
          icon={Activity}
          label="Ativos Hoje"
          value={fmtNum(ACTIVE_TODAY)}
          sub="Em tempo real"
          accent="violet"
          delay={0.1}
        />
        <MetricCard
          icon={TrendingUp}
          label="Crescimento"
          value={`+${growth.toFixed(1)}%`}
          sub="Mar/25 a Mai/26"
          accent="amber"
          delay={0.15}
        />
        <MetricCard
          icon={Wallet}
          label="Volume Mensal"
          value={fmtBRL(monthVolume)}
          sub="Mes atual"
          accent="emerald"
          delay={0.2}
        />
        <MetricCard
          icon={Calendar}
          label="Volume Diario"
          value={fmtBRL(dayVolume)}
          sub="Media/dia"
          accent="blue"
          delay={0.25}
        />
        <MetricCard
          icon={Percent}
          label="Taxa Media"
          value={`${AVG_FEE_PERCENT}%`}
          sub="Por transacao"
          accent="violet"
          delay={0.3}
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Lucro Estimado"
          value={fmtBRL(totalProfit)}
          sub="Receita de taxas"
          accent="amber"
          delay={0.35}
        />
      </div>

      {/* Graficos linha 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Movimentacao Mensal" delay={0.1}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a0f0c",
                  border: "1px solid #22c55e33",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v: number) => [fmtBRL(v), "Volume"]}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#volGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Usuarios Ativos" delay={0.15}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0a0f0c",
                  border: "1px solid #3b82f633",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v: number) => [fmtNum(v), "Usuarios"]}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Graficos linha 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Lucro Mensal" delay={0.2}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a0f0c",
                  border: "1px solid #eab30833",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v: number) => [fmtBRL(v), "Lucro"]}
              />
              <Bar dataKey="profit" fill="#eab308" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status das Transacoes" delay={0.25}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {statusBreakdown.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      statusColors[entry.name as keyof typeof statusColors] ||
                      "#71717a"
                    }
                  />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }}
                iconType="circle"
              />
              <Tooltip
                contentStyle={{
                  background: "#0a0f0c",
                  border: "1px solid #ffffff22",
                  borderRadius: 12,
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crescimento Acumulado" delay={0.3}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0a0f0c",
                  border: "1px solid #8b5cf633",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v: number) => [fmtNum(v), "Transacoes"]}
              />
              <Area
                type="monotone"
                dataKey="transactions"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#growthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Transacoes por dia */}
      <ChartCard title="Transacoes por Dia (14 dias)" delay={0.35}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#0a0f0c",
                border: "1px solid #22c55e33",
                borderRadius: 12,
                color: "#fff",
              }}
            />
            <Bar dataKey="transactions" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Mapa de calor */}
      <ChartCard title="Mapa de Calor - Horarios de Pico" delay={0.4}>
        <Heatmap grid={heatmap} />
      </ChartCard>
    </div>
  );
}

function Heatmap({ grid }: { grid: number[][] }) {
  const cell = (v: number) => {
    const alpha = Math.max(0.05, v / 100);
    return `rgba(34, 197, 94, ${alpha})`;
  };
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-1 flex gap-1 pl-10">
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              className="flex-1 text-center text-[9px] text-zinc-600"
            >
              {h % 3 === 0 ? `${h}h` : ""}
            </div>
          ))}
        </div>
        {grid.map((row, day) => (
          <div key={day} className="mb-1 flex items-center gap-1">
            <div className="w-9 text-[10px] text-zinc-500">{weekDays[day]}</div>
            {row.map((v, hour) => (
              <div
                key={hour}
                className="group relative h-5 flex-1 rounded-sm"
                style={{ background: cell(v) }}
                title={`${weekDays[day]} ${hour}h: ${v}% atividade`}
              />
            ))}
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-zinc-500">
          Menos
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.95].map((a) => (
              <div
                key={a}
                className="h-3 w-3 rounded-sm"
                style={{ background: `rgba(34, 197, 94, ${a})` }}
              />
            ))}
          </div>
          Mais
        </div>
      </div>
    </div>
  );
}

// ============================ TRANSACOES ============================
function StatusBadge({ status }: { status: DemoTransaction["status"] }) {
  const color = statusColors[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `${color}1a`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {status}
    </span>
  );
}

function TransactionsTab({
  transactions,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  exportCSV,
}: {
  transactions: DemoTransaction[];
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  exportCSV: () => void;
}) {
  const statuses = ["all", "Aprovado", "Pendente", "Em analise", "Cancelado", "Chargeback"];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario, ID ou referencia..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="bg-zinc-900">
                {s === "all" ? "Todos os status" : s}
              </option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">ID / Hash</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Taxa</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Metodo</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 60).map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-zinc-300">{t.id}</div>
                    <div className="font-mono text-[10px] text-zinc-600">
                      {t.hash}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{t.userName}</td>
                  <td className="px-4 py-3 text-zinc-400">{t.type}</td>
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    {fmtBRL(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-emerald-400">{fmtBRL(t.fee)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{t.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {t.ip}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(t.date).toLocaleDateString("pt-BR")}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          Exibindo {Math.min(60, transactions.length)} de {transactions.length}{" "}
          transacoes
        </div>
      </div>
    </div>
  );
}

// ============================ RELATORIOS ============================
function ReportsTab({
  totalVolume,
  totalProfit,
  exportCSV,
  printReport,
}: {
  totalVolume: number;
  totalProfit: number;
  exportCSV: () => void;
  printReport: () => void;
}) {
  const reports = [
    {
      title: "Relatorio Mensal",
      desc: "Consolidado de movimentacoes e taxas do mes",
      icon: Calendar,
      accent: "emerald",
    },
    {
      title: "Relatorio Trimestral",
      desc: "Visao agregada dos ultimos 3 meses",
      icon: BarChart3,
      accent: "blue",
    },
    {
      title: "Relatorio Anual",
      desc: "Demonstrativo completo do ano corrente",
      icon: TrendingUp,
      accent: "violet",
    },
    {
      title: "Extrato Detalhado",
      desc: "Lista completa de todas as transacoes",
      icon: FileText,
      accent: "amber",
    },
    {
      title: "Relatorio de Taxas",
      desc: "Detalhamento da receita de taxas",
      icon: Percent,
      accent: "emerald",
    },
    {
      title: "Relatorio de Lucro",
      desc: "Margem e lucratividade por periodo",
      icon: DollarSign,
      accent: "blue",
    },
  ];
  const accents: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <p className="text-xs uppercase tracking-wider text-emerald-400/70">
            Volume Total
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {fmtBRL(totalVolume)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <p className="text-xs uppercase tracking-wider text-amber-400/70">
            Receita de Taxas
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {fmtBRL(totalProfit)}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5">
          <p className="text-xs uppercase tracking-wider text-blue-400/70">
            Periodo
          </p>
          <p className="mt-2 text-2xl font-bold text-white">Mar - Hoje</p>
        </div>
      </div>

      {/* Acoes globais */}
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400">
          <FileText className="h-4 w-4" />
          Gerar Relatorio
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          Baixar PDF
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      {/* Lista de relatorios */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur transition hover:border-zinc-700"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${accents[r.accent]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">{r.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{r.desc}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={printReport}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Gerar
                </button>
                <button
                  onClick={printReport}
                  className="flex items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
