// =====================================================================
// DADOS DE DEMONSTRACAO VISUAL - "Hyperion Reports"
// =====================================================================
// IMPORTANTE: Estes dados sao 100% gerados no cliente, apenas para
// apresentacao visual do sistema a potenciais compradores (modo demo).
// NAO sao gravados no banco de dados real e NAO devem ser usados para
// fins fiscais, contabeis ou declaracao de imposto.
// =====================================================================

export interface DemoTransaction {
  id: string;
  hash: string;
  userName: string;
  amount: number;
  fee: number;
  type: "PIX Cash-in" | "PIX Cash-out" | "Saque" | "Transferencia";
  status: "Aprovado" | "Pendente" | "Cancelado" | "Chargeback" | "Em analise";
  date: string;
  ip: string;
  method: string;
  reference: string;
}

export interface MonthlyData {
  month: string;
  volume: number;
  profit: number;
  users: number;
  transactions: number;
}

// Distribuicao de movimentacao mensal (valores de demonstracao)
export const monthlyData: MonthlyData[] = [
  { month: "Mar", volume: 37000, profit: 3145, users: 420, transactions: 1840 },
  { month: "Abr", volume: 46000, profit: 3910, users: 760, transactions: 2380 },
  { month: "Mai", volume: 69000, profit: 5865, users: 1280, transactions: 3420 },
  { month: "Jun", volume: 58400, profit: 4964, users: 1900, transactions: 2980 },
];

export const TOTAL_USERS = 1908;
export const ACTIVE_TODAY = 1247;
export const AVG_FEE_PERCENT = 8.5;

const firstNames = [
  "Lucas", "Maria", "Joao", "Ana", "Pedro", "Carla", "Rafael", "Juliana",
  "Bruno", "Fernanda", "Gabriel", "Mariana", "Felipe", "Camila", "Thiago",
  "Beatriz", "Rodrigo", "Larissa", "Gustavo", "Amanda", "Diego", "Patricia",
  "Marcelo", "Vanessa", "Leonardo", "Aline", "Vinicius", "Bruna", "Eduardo", "Leticia",
];
const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Costa", "Pereira", "Almeida",
  "Ferreira", "Rodrigues", "Gomes", "Martins", "Araujo", "Barbosa", "Ribeiro",
  "Carvalho", "Nascimento", "Cardoso", "Rocha", "Dias",
];
const methods = ["PIX", "PIX QR Code", "PIX Copia e Cola", "TED", "Carteira"];
const types: DemoTransaction["type"][] = ["PIX Cash-in", "PIX Cash-out", "Saque", "Transferencia"];

// Pesos de status para parecer realista (maioria aprovada)
const statusPool: DemoTransaction["status"][] = [
  ...Array(70).fill("Aprovado"),
  ...Array(12).fill("Pendente"),
  ...Array(8).fill("Em analise"),
  ...Array(6).fill("Cancelado"),
  ...Array(4).fill("Chargeback"),
];

// Gerador deterministico simples (mesmos dados a cada render)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomIp(rng: () => number): string {
  return `${Math.floor(rng() * 223) + 1}.${Math.floor(rng() * 255)}.${Math.floor(
    rng() * 255,
  )}.${Math.floor(rng() * 254) + 1}`;
}

export function generateTransactions(count = 240): DemoTransaction[] {
  const rng = mulberry32(20240315);
  const txs: DemoTransaction[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), 2, 1).getTime(); // 1 de marco
  const span = now.getTime() - start;

  for (let i = 0; i < count; i++) {
    const amount = Math.round((rng() * 1480 + 20) * 100) / 100;
    const fee = Math.round(amount * (AVG_FEE_PERCENT / 100) * 100) / 100;
    const d = new Date(start + rng() * span);
    const name = `${pick(firstNames, rng)} ${pick(lastNames, rng)}`;
    txs.push({
      id: `TX${(1000000 + Math.floor(rng() * 8999999)).toString()}`,
      hash: `0x${Math.floor(rng() * 0xffffffffff).toString(16).padStart(10, "0")}`,
      userName: name,
      amount,
      fee,
      type: pick(types, rng),
      status: pick(statusPool, rng),
      date: d.toISOString(),
      ip: randomIp(rng),
      method: pick(methods, rng),
      reference: `REF-${Math.floor(rng() * 900000 + 100000)}`,
    });
  }
  return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Transacoes por dia (ultimos 14 dias)
export function dailyTransactions(): { day: string; transactions: number; volume: number }[] {
  const rng = mulberry32(777);
  const out: { day: string; transactions: number; volume: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const t = Math.floor(rng() * 180 + 90);
    out.push({
      day: `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`,
      transactions: t,
      volume: Math.round(t * (rng() * 400 + 200)),
    });
  }
  return out;
}

// Mapa de calor de horarios (7 dias x 24h) - intensidade 0..100
export function hourlyHeatmap(): number[][] {
  const rng = mulberry32(424242);
  const grid: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      // Picos entre 9h-12h e 18h-22h
      let base = 12;
      if (hour >= 9 && hour <= 12) base = 60;
      else if (hour >= 18 && hour <= 22) base = 85;
      else if (hour >= 13 && hour <= 17) base = 45;
      else if (hour >= 0 && hour <= 6) base = 8;
      const weekendBoost = day >= 5 ? 1.15 : 1;
      row.push(Math.min(100, Math.round(base * weekendBoost + rng() * 18)));
    }
    grid.push(row);
  }
  return grid;
}

export const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export const statusColors: Record<DemoTransaction["status"], string> = {
  Aprovado: "#22c55e",
  Pendente: "#eab308",
  "Em analise": "#3b82f6",
  Cancelado: "#94a3b8",
  Chargeback: "#ef4444",
};
