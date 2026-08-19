import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Code2,
  ShieldCheck,
  Server,
  Headphones,
  Clock,
  Check,
  Wallet,
  Layers,
  Lock,
  CircleDollarSign,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { DocsShowcase } from "@/components/landing/docs-showcase";
import { NominalSelector } from "@/components/landing/nominal-selector";
import { MetricsBento } from "@/components/landing/metrics-bento";
import { AccountManager } from "@/components/landing/account-manager";

const WHATSAPP_URL =
  "https://wa.me/5598981502071?text=" +
  encodeURIComponent("Olá! Vim pela HyperionPay e gostaria de falar com meu gerente de contas.");

const REGISTER_URL = "/auth/register";
const LOGIN_URL = "/auth/login";
const DOCS_URL = "/dashboard/integration";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[620px] h-[620px] bg-blue-400/20 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-1/5 w-[520px] h-[520px] bg-sky-300/20 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: `linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black, transparent 75%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/hp-logo.png" alt="Hyperion Pay" width={36} height={36} className="h-7 w-7 md:h-8 md:w-8 object-contain" />
            <span className="text-base md:text-lg font-semibold tracking-tight text-slate-900">
              Hyperion<span className="text-blue-600">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#inicio" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Início</Link>
            <Link href="#solucoes" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Soluções</Link>
            <Link href="#sem-med" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Sem MED</Link>
            <Link href="#nominal" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Nominal</Link>
            <Link href="#numeros" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Infraestrutura</Link>
            <Link href="#gerente" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Gerente</Link>
            <Link href="#docs" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Documentação</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <a href={LOGIN_URL} className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Entrar
            </a>
            <a href={REGISTER_URL} className="px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full text-xs md:text-sm font-medium text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all">
              Criar conta
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="relative pt-28 md:pt-36 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-blue-50 border border-blue-100 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                <span className="text-xs font-medium text-blue-700">Gateway PIX · Rota 100% livre de MED</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-5 text-balance text-slate-900">
                Pagamentos PIX{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400">
                  sem risco
                </span>{" "}
                de bloqueio.
              </h1>

              <p className="text-base md:text-lg text-slate-600 mb-8 max-w-lg text-pretty leading-relaxed">
                A HyperionPay é a infraestrutura de pagamentos que processa seu PIX em
                segundos, com liquidação transparente e rota livre de MED. Integre em
                minutos e receba sem burocracia — seu saldo nunca fica preso.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-9">
                <a href={REGISTER_URL} className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-blue-500/25 transition-all">
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link href="#docs" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 rounded-full text-sm md:text-base font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all">
                  Ver documentação
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs md:text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Ativação em até 5 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Sem mensalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Suporte 24/7</span>
                </div>
              </div>
            </div>

            {/* Right — mascot + floating cards */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[340px] h-[340px] md:w-[440px] md:h-[440px] bg-gradient-to-br from-blue-400/25 to-sky-300/20 rounded-full blur-3xl" />
              </div>

              <Image
                src="/images/mascote-hyperion.png"
                alt="Mascote HyperionPay"
                width={400}
                height={500}
                className="relative z-10 w-[260px] md:w-[340px] lg:w-[400px] h-auto drop-shadow-2xl"
                style={{ height: "auto" }}
                priority
              />

              {/* PIX received toast */}
              <div className="absolute z-20 top-6 -left-2 md:left-0 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-xl shadow-slate-900/5 animate-float">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Check className="h-5 w-5 text-emerald-600" />
                </span>
                <div>
                  <p className="text-xs text-slate-400 leading-none">PIX recebido</p>
                  <p className="text-sm font-semibold text-slate-900">+ R$ 1.240,00</p>
                </div>
              </div>

              {/* Balance card */}
              <div className="absolute z-20 bottom-8 right-0 md:-right-2 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-xl shadow-slate-900/5 animate-float-delay-2">
                <p className="text-xs text-slate-400 leading-none mb-1">Saldo disponível</p>
                <p className="text-lg font-bold text-slate-900">R$ 84.320,50</p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <ArrowRight className="h-3 w-3 -rotate-45" /> +18,4% esta semana
                </div>
              </div>

              {/* API badge */}
              <div className="absolute z-20 top-1/2 -left-3 md:-left-6 hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 backdrop-blur px-3 py-2 shadow-lg animate-float-delay-1">
                <Code2 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-700">API &lt; 2s</span>
              </div>
            </div>
          </div>

          {/* Stats band */}
          <div className="mt-14 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
            {[
              { v: "99,9%", l: "Uptime garantido" },
              { v: "< 2s", l: "Confirmação do PIX" },
              { v: "+2,5M", l: "Transações por mês" },
              { v: "R$ 1B+", l: "Processados na plataforma" },
            ].map((s) => (
              <div key={s.l} className="bg-white px-5 py-6 text-center">
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{s.v}</p>
                <p className="mt-1 text-xs md:text-sm text-slate-500">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Compatibilidade bancária */}
          <div className="mt-10 md:mt-14">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400">
              Seu cliente paga de qualquer banco
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
              {["Nubank", "Itaú", "Banco do Brasil", "Bradesco", "Caixa", "Inter", "Mercado Pago", "C6 Bank"].map(
                (bank) => (
                  <span
                    key={bank}
                    className="text-base md:text-lg font-semibold text-slate-400/90 transition-colors hover:text-slate-600"
                  >
                    {bank}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sem MED — signature section */}
      <section id="sem-med" className="relative px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-br from-blue-500 via-sky-400 to-blue-500">
            <div className="relative rounded-3xl bg-white px-6 md:px-12 py-12 md:py-16">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-blue-50 border border-blue-100 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                    <span className="text-xs font-medium text-blue-700">Nosso diferencial</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
                    Seu dinheiro nunca fica preso.
                  </h2>
                  <p className="text-base md:text-lg text-slate-600 text-pretty leading-relaxed">
                    O MED (Mecanismo Especial de Devolução) é a maior dor de quem vende por
                    PIX — bloqueios e estornos que travam seu caixa sem aviso. A HyperionPay
                    opera com rotas próprias e liquidação direta, mantendo seu saldo{" "}
                    <span className="font-semibold text-slate-900">100% livre de MED</span>.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    { icon: Lock, t: "Saldo sem bloqueios", d: "Nenhuma retenção surpresa. O que entra é seu, na hora." },
                    { icon: Layers, t: "Multiaquirência", d: "Múltiplas rotas de processamento para máxima aprovação." },
                    { icon: RefreshCw, t: "Liquidação transparente", d: "Acompanhe cada centavo em tempo real no extrato." },
                  ].map((f) => (
                    <div key={f.t} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-600/10">
                        <f.icon className="h-5 w-5 text-blue-600" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{f.t}</p>
                        <p className="text-sm text-slate-500">{f.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nominal personalizada */}
      <NominalSelector />

      {/* Métricas / Infraestrutura */}
      <MetricsBento />

      {/* Soluções */}
      <section id="solucoes" className="relative px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-10 md:mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-2">Soluções</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
              Tudo o que sua operação precisa para receber.
            </h2>
            <p className="text-base md:text-lg text-slate-600 text-pretty leading-relaxed">
              Uma plataforma completa de cash-in e cash-out, com painel em tempo real,
              antifraude nativo e a confiabilidade que o seu negócio exige.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              { icon: CircleDollarSign, t: "PIX Cash-in", d: "Gere cobranças PIX com QR Code dinâmico e confirmação em segundos.", featured: true },
              { icon: Wallet, t: "Saques automáticos", d: "Cash-out via PIX com aprovação e agendamento programável." },
              { icon: BarChart3, t: "Dashboard em tempo real", d: "Acompanhe volume, taxas e liquidação em um painel completo." },
              { icon: ShieldCheck, t: "Antifraude nativo", d: "Regras e monitoramento que protegem cada transação." },
              { icon: Server, t: "Webhooks confiáveis", d: "Eventos assinados com re-tentativas automáticas." },
              { icon: Headphones, t: "Suporte humano 24/7", d: "Time técnico dedicado, disponível todos os dias." },
            ].map((f) => (
              <div
                key={f.t}
                className={`group rounded-2xl border p-6 transition-all hover:-translate-y-1 ${
                  f.featured
                    ? "border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg shadow-blue-500/5"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/5"
                }`}
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 group-hover:bg-blue-600 transition-colors">
                  <f.icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{f.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentação */}
      <section id="docs" className="relative px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-slate-50/60 px-6 md:px-12 py-12 md:py-16">
          <DocsShowcase />
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-500 flex-1 text-center sm:text-left">
              Documentação completa, referência da API e SDKs prontos para produção.
            </p>
            <a
              href={DOCS_URL}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Explorar a documentação
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Por que escolher */}
      <section id="sobre" className="relative px-4 md:px-6 py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10">
                <Image
                  src="/images/banner-dashboard.png"
                  alt="Painel HyperionPay"
                  width={900}
                  height={620}
                  className="w-full h-auto"
                  style={{ height: "auto" }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2">Por que a HyperionPay</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
                Feita para escalar junto com você.
              </h2>
              <p className="text-base md:text-lg text-slate-600 mb-8 text-pretty leading-relaxed">
                Da primeira venda ao milhão em volume, a nossa infraestrutura acompanha o
                ritmo do seu negócio — com estabilidade, transparência e taxas justas.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { icon: Zap, t: "Alta performance", d: "Confirmação de PIX em menos de 2 segundos." },
                  { icon: ShieldCheck, t: "Segurança bancária", d: "Criptografia de ponta e monitoramento contínuo." },
                  { icon: CircleDollarSign, t: "Taxas transparentes", d: "Sem letras miúdas, sem surpresas na fatura." },
                  { icon: Server, t: "99,9% de uptime", d: "Infraestrutura redundante e sempre disponível." },
                ].map((f) => (
                  <div key={f.t} className="flex gap-3">
                    <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-600/10">
                      <f.icon className="h-5 w-5 text-blue-600" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{f.t}</p>
                      <p className="text-sm text-slate-500">{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gerente de contas exclusivo */}
      <AccountManager />

      {/* CTA */}
      <section className="relative px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 px-6 md:px-12 py-14 md:py-20 text-center">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 text-balance">
                Comece a receber por PIX hoje.
              </h2>
              <p className="text-base md:text-lg text-blue-50/90 mb-8 max-w-xl mx-auto text-pretty">
                Crie sua conta gratuitamente, integre em minutos e tenha um caixa que nunca para.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href={REGISTER_URL} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white rounded-full text-sm md:text-base font-semibold text-blue-700 hover:shadow-2xl transition-all">
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href={LOGIN_URL} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/40 rounded-full text-sm md:text-base font-medium text-white hover:bg-white/10 transition-all">
                  Já tenho conta
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 px-4 md:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/hp-logo.png" alt="Hyperion Pay" width={32} height={32} className="h-7 w-7 object-contain" />
              <span className="text-base font-semibold tracking-tight text-slate-900">
                Hyperion<span className="text-blue-600">Pay</span>
              </span>
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="#solucoes" className="hover:text-slate-900 transition-colors">Soluções</Link>
              <Link href="#sem-med" className="hover:text-slate-900 transition-colors">Sem MED</Link>
              <Link href="#docs" className="hover:text-slate-900 transition-colors">Documentação</Link>
              <a href={LOGIN_URL} className="hover:text-slate-900 transition-colors">Entrar</a>
            </nav>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} HyperionPay. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Infraestrutura de pagamentos PIX · 100% livre de MED
            </p>
          </div>
        </div>
      </footer>

      {/* Botão flutuante — Fale com seu gerente */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com seu gerente no WhatsApp"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 pl-4 pr-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
          <MessageCircle className="relative h-5 w-5" />
        </span>
        <span className="hidden sm:inline">Fale com seu gerente</span>
      </a>
    </main>
  );
}
