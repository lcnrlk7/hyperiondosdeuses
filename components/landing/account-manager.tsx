import { MessageCircle, BadgeCheck, Clock, Sparkles, ArrowUpRight } from "lucide-react";

const WHATSAPP_NUMBER = "5598981502071";
const WHATSAPP_DISPLAY = "(98) 98150-2071";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Vim pela HyperionPay e gostaria de falar com meu gerente de contas.",
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const PERKS = [
  { icon: BadgeCheck, t: "Atendimento nominal", d: "Uma pessoa dedicada que conhece a sua operação pelo nome." },
  { icon: Clock, t: "Resposta em minutos", d: "Fila prioritária no WhatsApp, sem robô e sem espera." },
  { icon: Sparkles, t: "Taxas sob medida", d: "Condições exclusivas conforme o volume do seu negócio." },
];

export function AccountManager() {
  return (
    <section id="gerente" className="relative px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center">
          {/* Left — pitch */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-blue-50 border border-blue-100 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-blue-700">Atendimento exclusivo · Online agora</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
              O topo aguarda.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">
                Fale com seu gerente.
              </span>
            </h2>
            <p className="text-base md:text-lg text-slate-600 mb-8 max-w-lg text-pretty leading-relaxed">
              Na HyperionPay você não fala com atendente genérico. Cada conta tem um gerente de
              contas dedicado no WhatsApp — para resolver rápido, negociar taxas e destravar o seu
              crescimento.
            </p>

            <div className="grid gap-4 mb-9">
              {PERKS.map((p) => (
                <div key={p.t} className="flex gap-4">
                  <span className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-600/10">
                    <p.icon className="h-5 w-5 text-blue-600" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{p.t}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{p.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-sm md:text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              Chamar meu gerente no WhatsApp
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Right — manager card */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[320px] w-[320px] rounded-full bg-gradient-to-br from-blue-400/25 to-sky-300/20 blur-3xl" />
            </div>

            <div className="relative rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 md:p-8 shadow-2xl shadow-slate-900/10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-xl font-bold text-white">
                    HP
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Seu gerente HyperionPay</p>
                  <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online · responde rápido
                  </p>
                </div>
              </div>

              {/* chat bubbles */}
              <div className="mt-6 space-y-3">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-700">
                  Olá! Bora aumentar sua aprovação e ajustar suas taxas?
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                  Quero sim! Como começamos?
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-700">
                  É só me chamar no WhatsApp que eu cuido de tudo por aqui. 🚀
                </div>
              </div>

              {/* number pill */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 transition-colors hover:bg-emerald-100"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                  </span>
                  <span>
                    <span className="block text-xs text-slate-500">WhatsApp direto</span>
                    <span className="block text-sm font-semibold text-slate-900">{WHATSAPP_DISPLAY}</span>
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
