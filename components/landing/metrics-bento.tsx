import { Zap, ShieldOff, Clock, Gauge, Layers, TrendingUp } from "lucide-react";

const METRICS = [
  {
    id: "med",
    value: "0",
    unit: "MED",
    label: "Menos travas no seu saldo",
    desc: "Rotas próprias e liquidação direta. Seu dinheiro nunca fica preso.",
    icon: ShieldOff,
    span: "lg:col-span-2 lg:row-span-1",
    highlight: true,
  },
  {
    id: "latency",
    value: "0.4",
    unit: "ms",
    label: "Latência média",
    desc: "Resposta de API praticamente instantânea.",
    icon: Gauge,
    span: "",
  },
  {
    id: "support",
    value: "24",
    unit: "horas",
    label: "Suporte dedicado",
    desc: "Atendimento humano todos os dias, sem fila.",
    icon: Clock,
    span: "",
  },
  {
    id: "uptime",
    value: "99,9",
    unit: "%",
    label: "Uptime garantido",
    desc: "Infraestrutura redundante e sempre disponível.",
    icon: TrendingUp,
    span: "",
  },
  {
    id: "integrations",
    value: "+12",
    unit: "",
    label: "Integrações prontas",
    desc: "Plugue nos principais checkouts do Brasil.",
    icon: Layers,
    span: "",
  },
  {
    id: "activation",
    value: "< 5",
    unit: "min",
    label: "Ativação da conta",
    desc: "Crie, integre e comece a receber no mesmo dia.",
    icon: Zap,
    span: "lg:col-span-2",
    highlight: true,
  },
];

export function MetricsBento() {
  return (
    <section id="numeros" className="relative px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 md:px-12 py-14 md:py-20">
          {/* glow + grid */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-blue-600/25 blur-[140px]" />
            <div className="absolute bottom-0 right-1/5 h-[360px] w-[360px] rounded-full bg-sky-500/15 blur-[140px]" />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(96,165,250,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.08) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
                WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
              }}
            />
          </div>

          <div className="relative">
            <div className="max-w-2xl mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-blue-400/20 bg-blue-400/10">
                <span className="text-xs font-medium tracking-wider text-blue-300">INFRAESTRUTURA</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                Números que sustentam a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
                  sua operação.
                </span>
              </h2>
              <p className="mt-4 text-base md:text-lg text-slate-400 text-pretty leading-relaxed">
                Cada transação passa por uma arquitetura pensada para não falhar. Velocidade,
                estabilidade e transparência — sem letras miúdas.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {METRICS.map((m) => (
                <div
                  key={m.id}
                  className={`group relative overflow-hidden rounded-2xl border p-5 md:p-6 transition-colors ${m.span} ${
                    m.highlight
                      ? "border-blue-400/30 bg-gradient-to-br from-blue-600/20 to-slate-900/40"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <span
                    className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${
                      m.highlight ? "bg-blue-500/20" : "bg-white/5"
                    }`}
                  >
                    <m.icon className="h-5 w-5 text-blue-300" />
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl md:text-5xl font-bold tracking-tight text-white tabular-nums">
                      {m.value}
                    </span>
                    {m.unit && (
                      <span className="text-lg md:text-xl font-semibold text-blue-300">{m.unit}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">{m.label}</p>
                  <p className="mt-1 text-xs md:text-sm text-slate-400 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
