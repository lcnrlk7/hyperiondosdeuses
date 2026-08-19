"use client";

import { useState } from "react";
import { Check, ShieldCheck, Search, Building2, ArrowUpRight } from "lucide-react";

type Nominal = {
  id: string;
  name: string;
  cnpj: string;
  tag: string;
  initials: string;
};

const NOMINAIS: Nominal[] = [
  { id: "nominal-1", name: "Nominal 01", cnpj: "••.•••.•••/0001-••", tag: "Instituição de Pagamento", initials: "01" },
  { id: "nominal-2", name: "Nominal 02", cnpj: "••.•••.•••/0001-••", tag: "Adquirência", initials: "02" },
  { id: "nominal-3", name: "Nominal 03", cnpj: "••.•••.•••/0001-••", tag: "Banking as a Service", initials: "03" },
  { id: "nominal-4", name: "Nominal 04", cnpj: "••.•••.•••/0001-••", tag: "Adquirência", initials: "04" },
  { id: "nominal-5", name: "Nominal 05", cnpj: "••.•••.•••/0001-••", tag: "Marca própria", initials: "05" },
];

const AVATAR_STYLES: Record<string, string> = {
  "nominal-1": "from-pink-600 to-pink-400",
  "nominal-2": "from-fuchsia-600 to-pink-500",
  "nominal-3": "from-fuchsia-600 to-pink-400",
  "nominal-4": "from-pink-700 to-pink-500",
  "nominal-5": "from-pink-600 to-fuchsia-500",
};

export function NominalSelector() {
  const [selected, setSelected] = useState<Nominal>(NOMINAIS[0]);

  return (
    <section id="nominal" className="relative px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 md:mb-14">
          <p className="text-sm font-semibold text-pink-600 mb-2">Nominal personalizada</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
            Você escolhe o nome que aparece no extrato do cliente.
          </h2>
          <p className="text-base md:text-lg text-slate-600 text-pretty leading-relaxed">
            Selecione entre as nossas instituições liquidantes disponíveis. A nominal
            define a razão social e o CNPJ que o seu comprador enxerga no comprovante do
            PIX — total transparência, menos chargeback e mais confiança na hora de pagar.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 items-start">
          {/* Selector list */}
          <div>
            <div className="flex items-center gap-2 mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-400">
              <Search className="h-4 w-4" />
              <span className="text-sm">Nominais disponíveis para a sua conta</span>
              <span className="ml-auto text-xs font-medium text-pink-600 bg-pink-50 rounded-full px-2.5 py-1">
                {NOMINAIS.length} ativas
              </span>
            </div>

            <div className="grid gap-3" role="radiogroup" aria-label="Escolha a nominal">
              {NOMINAIS.map((n) => {
                const active = selected.id === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(n)}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-pink-500 bg-pink-50/70 shadow-lg shadow-pink-500/10"
                        : "border-slate-200 bg-white hover:border-pink-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br ${AVATAR_STYLES[n.id]} text-sm font-bold text-white shadow-sm`}
                    >
                      {n.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{n.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="h-3 w-3 flex-none" />
                        <span className="font-mono">{n.cnpj}</span>
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex flex-none rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 group-hover:border-pink-200">
                      {n.tag}
                    </span>
                    <span
                      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border transition-colors ${
                        active ? "border-pink-600 bg-pink-600 text-white" : "border-slate-300 text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Precisa de uma nominal exclusiva com a sua própria marca? Fale com o time
              comercial após criar a conta.
            </p>
          </div>

          {/* Live receipt preview */}
          <div className="lg:sticky lg:top-24">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -inset-4 bg-gradient-to-br from-pink-400/20 to-pink-300/10 blur-3xl rounded-full" />
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Receipt header */}
                <div className="bg-gradient-to-br from-pink-600 to-pink-400 px-6 pt-7 pb-8 text-center text-white">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <p className="text-sm text-pink-50/90">Comprovante de pagamento</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">R$ 297,00</p>
                  <p className="mt-1 text-xs text-pink-50/70">PIX concluído · agora há pouco</p>
                </div>

                {/* Receipt body */}
                <div className="px-6 py-6">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Pago para
                  </p>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <span
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br ${AVATAR_STYLES[selected.id]} text-xs font-bold text-white`}
                    >
                      {selected.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{selected.name}</p>
                      <p className="font-mono text-xs text-slate-500">{selected.cnpj}</p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Instituição</dt>
                      <dd className="font-medium text-slate-900">{selected.tag}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Tipo</dt>
                      <dd className="font-medium text-slate-900">PIX · Transferência</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Status</dt>
                      <dd className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Concluído
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50/70 px-3 py-2.5 text-xs text-pink-700">
                    <ShieldCheck className="h-4 w-4 flex-none" />
                    <span>É exatamente assim que aparece no app do banco do seu cliente.</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Pré-visualização atualiza conforme a nominal escolhida
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
