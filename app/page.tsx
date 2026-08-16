import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Zap,
  BarChart3,
  Users,
  LineChart,
  Code2,
  Shield,
  ShieldCheck,
  Server,
  Headphones,
  Eye,
  Clock,
  Check,
  Wallet,
  Layers,
  Lock,
  CircleDollarSign,
} from "lucide-react";

const REGISTER_URL = "https://app.hyperionpay.com.br/auth/register";
const LOGIN_URL = "https://app.hyperionpay.com.br/auth/login";
const DOCS_URL = "https://app.hyperionpay.com.br/dashboard/integration";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#05070f] text-white overflow-x-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[620px] h-[620px] bg-blue-600/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/5 w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(96,165,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.6) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 80%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#05070f]/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/hp-logo.png" alt="Hyperion Pay" width={36} height={36} className="h-7 w-7 md:h-8 md:w-8 object-contain" />
            <span className="text-base md:text-lg font-semibold tracking-tight">
              Hyperion<span className="text-blue-500">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#inicio" className="text-sm text-white/60 hover:text-white transition-colors">Início</Link>
            <Link href="#solucoes" className="text-sm text-white/60 hover:text-white transition-colors">Soluções</Link>
            <Link href="#sem-med" className="text-sm text-white/60 hover:text-white transition-colors">Sem MED</Link>
            <a href={DOCS_URL} className="text-sm text-white/60 hover:text-white transition-colors">Documentação</a>
            <Link href="#sobre" className="text-sm text-white/60 hover:text-white transition-colors">Sobre nós</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <a href={LOGIN_URL} className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/70 hover:text-white transition-colors">
              Entrar
            </a>
            <a href={REGISTER_URL} className="px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full text-xs md:text-sm font-medium text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              Criar conta
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="relative pt-28 md:pt-36 pb-10 md:pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-white/5 border border-white/10 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span className="text-xs font-medium text-white/80">Gateway PIX · Rota 100% sem MED</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-5 text-balance">
                A nova geração de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-sky-300">
                  pagamentos
                </span>{" "}
                começa aqui.
              </h1>

              <p className="text-base md:text-lg text-white/60 mb-8 max-w-lg text-pretty">
                Sua própria gateway de pagamentos PIX — rápida, segura e escalável.
                Receba, gerencie e saque sem burocracia e sem risco de MED.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-9">
                <a href={REGISTER_URL} className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  Começar agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link href="#solucoes" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/15 rounded-full text-sm md:text-base font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all">
                  Conhecer soluções
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs md:text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>Ativação em até 5 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Sem mensalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-blue-400" />
                  <span>Suporte 24h</span>
                </div>
              </div>
            </div>

            {/* Right - Mascot */}
            <div className="relative flex items-center justify-center min-h-[420px] md:min-h-[520px]">
              {/* Glow ring */}
              <div className="absolute w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-full bg-blue-600/20 blur-[90px]" />
              <div className="absolute w-[220px] h-[220px] md:w-[300px] md:h-[300px] rounded-full border border-blue-500/20" />

              <div className="relative animate-float">
                <Image
                  src="/images/mascote-hyperion.png"
                  alt="Mascote Hyperion Pay"
                  width={400}
                  height={500}
                  className="w-[260px] md:w-[360px] lg:w-[400px] h-auto drop-shadow-[0_20px_60px_rgba(37,99,235,0.35)]"
                  style={{ height: "auto" }}
                  priority
                />
              </div>

              {/* Floating badges */}
              <FloatingBadge className="top-2 right-0 md:top-6 animate-float-delay-1" icon={<Headphones className="w-4 h-4 text-white" />} label="Suporte 24/h" />
              <FloatingBadge className="top-1/3 -left-2 md:-left-4 animate-float-delay-2" icon={<Server className="w-4 h-4 text-white" />} label="Integrações fáceis" />
              <FloatingBadge className="top-1/2 right-0 animate-float-delay-3" icon={<BarChart3 className="w-4 h-4 text-white" />} label="Múltiplas rotas" />

              {/* Live PIX toast */}
              <div className="absolute bottom-6 -left-2 md:left-2 animate-float-delay-4">
                <div className="flex items-center gap-3 pl-2 pr-4 py-2 bg-[#0b1122]/90 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl shadow-black/40">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center p-1.5">
                    <Image src="/images/pix-icon.png" alt="PIX" width={20} height={20} className="w-full h-full object-contain brightness-0 invert" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50">PIX recebido agora</div>
                    <div className="text-sm font-semibold text-white">+ R$ 1.240,00</div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-14 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
            {[
              { v: "+25K", l: "Negócios ativos" },
              { v: "+2.5M", l: "Transações/mês" },
              { v: "+R$1B", l: "Processados/mês" },
              { v: "99.9%", l: "Uptime garantido" },
            ].map((s) => (
              <div key={s.l} className="bg-[#070b18] px-4 py-6 md:py-8 text-center">
                <div className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
                  {s.v}
                </div>
                <div className="text-[11px] md:text-sm text-white/50 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sem MED - centerpiece */}
      <section id="sem-med" className="relative py-14 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-600/10 via-[#070b18] to-[#070b18] p-6 md:p-12">
            <div className="absolute -top-24 -right-16 w-[360px] h-[360px] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs md:text-sm font-medium text-blue-300">Diferencial Hyperion</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance mb-4">
                  Rota 100% sem MED.{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
                    Deixa que a gente cuida disso.
                  </span>
                </h2>
                <p className="text-sm md:text-base text-white/60 text-pretty mb-8 max-w-md">
                  Opere com total tranquilidade: seu saldo nunca é bloqueado e a estabilidade das
                  suas transações fica por nossa conta. Menos risco, mais faturamento.
                </p>
                <a href={REGISTER_URL} className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  Quero operar sem MED
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Shield, t: "100% sem MED", d: "Rota totalmente livre de MED. Sem sustos, sem devoluções forçadas." },
                  { icon: Lock, t: "Saldo nunca bloqueado", d: "Você mantém o controle total do seu dinheiro, o tempo todo." },
                  { icon: Layers, t: "Multiaquirência", d: "Mais estabilidade nas transações e aprovação sempre alta." },
                ].map((f) => (
                  <div key={f.t} className="flex items-start gap-4 p-4 md:p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-blue-500/40 transition-colors">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{f.t}</h3>
                      <p className="text-xs md:text-sm text-white/55 mt-0.5">{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="solucoes" className="relative py-14 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
              Tudo que você precisa para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">escalar</span>
            </h2>
            <p className="text-sm md:text-base text-white/55 mt-3 text-pretty">
              Uma infraestrutura completa de pagamentos PIX pensada para negócios digitais que crescem rápido.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
            <FeatureCard featured icon={Zap} title="Pagamentos Instantâneos" desc="Receba via PIX com processamento em tempo real, confirmação imediata e liquidação segura direto na sua carteira." />
            <FeatureCard icon={BarChart3} title="Automação de Vendas" desc="Automatize entregas e processos digitais." />
            <FeatureCard icon={Users} title="Gestão de Afiliados" desc="Crie e gerencie seu programa de afiliados." />
            <FeatureCard icon={LineChart} title="Analytics em Tempo Real" desc="Acompanhe vendas e desempenho ao vivo." />
            <FeatureCard icon={Shield} title="PIX Seguro" desc="Máxima segurança e antifraude nativo." />
            <FeatureCard icon={Code2} title="API Completa" desc="Integração simples, documentada e com webhooks." />
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="relative py-14 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-balance">
                  Controle total da sua operação em{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">tempo real</span>
                </h2>
                <p className="text-sm md:text-base text-white/60 mb-8 text-pretty">
                  Dashboards avançados, gráficos inteligentes e dados ao vivo para você decidir
                  rápido e aumentar seus resultados.
                </p>
                <div className="space-y-3">
                  {["Gráficos em tempo real", "Relatórios personalizados", "Exportação de dados"].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500/15 border border-blue-500/25 rounded-md flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm text-white/80">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="bg-[#070b18] rounded-2xl p-5 md:p-6 border border-white/10 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-sm font-medium text-white/80">Relatório de Vendas</div>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">Hoje</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    { l: "Volume total", v: "R$ 98.765", d: "+12.5%" },
                    { l: "Transações", v: "12.543", d: "+8.2%" },
                    { l: "Ticket médio", v: "R$ 78,90", d: "+5.4%" },
                    { l: "Novos clientes", v: "2.356", d: "+15.3%" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="text-[11px] text-white/50">{s.l}</div>
                      <div className="text-base md:text-lg font-bold">{s.v}</div>
                      <div className="text-[11px] text-emerald-400">{s.d}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-xs text-white/50 mb-3">Volume de Vendas</div>
                  <div className="h-32 flex items-end gap-1">
                    {[30, 45, 35, 50, 40, 60, 45, 55, 65, 50, 70, 55, 75, 60, 80, 65, 85, 70, 90, 75, 85, 80, 95, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-sky-400 opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/40">
                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section id="sobre" className="relative py-14 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Por que escolher a Hyperion Pay?
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
            {[
              { icon: Shield, t: "Segurança Máxima", d: "Dados protegidos com criptografia." },
              { icon: Server, t: "Infra Robusta", d: "Alta disponibilidade garantida." },
              { icon: Headphones, t: "Suporte 24/7", d: "Time sempre à disposição." },
              { icon: Eye, t: "Sem Taxas Ocultas", d: "Transparência total." },
              { icon: Clock, t: "Ativação Rápida", d: "Comece em minutos." },
            ].map((p) => (
              <div key={p.t} className="group text-center rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6 hover:border-blue-500/40 hover:bg-white/[0.04] transition-all">
                <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <p.icon className="w-5 h-5 md:w-7 md:h-7 text-blue-400" />
                </div>
                <h3 className="text-xs md:text-base font-semibold mb-1">{p.t}</h3>
                <p className="text-[10px] md:text-xs text-white/50 hidden md:block">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="relative py-14 md:py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 text-balance">
              Quem vende com a Hyperion Pay,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">colhe resultados reais</span>
            </h2>
            <p className="text-sm md:text-base text-white/55 max-w-2xl mx-auto text-pretty">
              A cada meta de faturamento alcançada, você desbloqueia premiações exclusivas da Hyperion Pay.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
              <AwardCard img="/images/awards/placa-50k.png" tier="Meta Bronze" title="R$ 50.000" desc="Placa exclusiva de reconhecimento" />
              <AwardCard img="/images/awards/placa-100k.png" tier="Meta Prata" title="R$ 100.000" desc="Placa premium com acabamento especial" />
              <AwardCard img="/images/awards/placa-1m.png" tier="Meta Diamante" title="R$ 1.000.000" desc="Placa de cristal com mascote exclusivo" badge="Elite" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <AwardCard wide img="/images/awards/pulseira.png" tier="Meta Inicial" title="Pulseira Hyperion Pay" desc="Ao atingir R$ 20K, escolha: pulseira, caneca ou garrafa" corner="R$ 20K" />
              <AwardCard wide img="/images/awards/merch.png" tier="Meta Inicial" title="Garrafa ou Caneca" desc="Merch oficial exclusivo para parceiros Hyperion Pay" corner="R$ 20K" />
            </div>

            <div className="text-center mt-8 md:mt-12">
              <p className="text-xs md:text-sm text-white/50 mb-4">
                Todas as premiações são enviadas gratuitamente para parceiros que atingem as metas.
              </p>
              <a href={REGISTER_URL} className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                Começar a faturar agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-14 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-600/15 via-[#070b18] to-[#070b18] p-6 md:p-12">
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-blue-600/20 rounded-full blur-[100px]" />
            <div className="relative grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 text-balance">
                  Não é só uma gateway, é o{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">próximo nível.</span>
                </h2>
                <p className="text-sm md:text-base text-white/60 mb-6">
                  Transforme sua operação, aumente conversões e escale seu negócio com tecnologia de ponta.
                </p>
                <a href={REGISTER_URL} className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  Criar minha conta agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 md:gap-6">
                {[
                  { v: "+25K", l: "Negócios ativos" },
                  { v: "+2.5M", l: "Transações/mês" },
                  { v: "+R$1B", l: "Processados/mês" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">{s.v}</div>
                    <div className="text-[10px] md:text-sm text-white/50 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 md:py-16 px-4 md:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 md:gap-12 mb-8 md:mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3 md:mb-4">
                <Image src="/images/hp-logo.png" alt="Hyperion Pay" width={32} height={32} className="h-7 w-7 object-contain" />
                <span className="text-base md:text-lg font-semibold tracking-tight">Hyperion<span className="text-blue-500">Pay</span></span>
              </Link>
              <p className="text-xs md:text-sm text-white/50 max-w-sm">
                A plataforma completa de pagamentos PIX para negócios digitais. Rápida, segura e 100% sem MED.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-300">Liquidação PIX em tempo real</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm md:text-base font-semibold mb-2 md:mb-4">Produtos</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/50">
                <li><Link href="#solucoes" className="hover:text-white transition-colors">Pagamentos PIX</Link></li>
                <li><Link href="#sem-med" className="hover:text-white transition-colors">Sem MED</Link></li>
                <li><a href={DOCS_URL} className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm md:text-base font-semibold mb-2 md:mb-4">Suporte</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/50">
                <li><a href={DOCS_URL} className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="https://wa.me/5534999353187" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
              </ul>
            </div>

            <div className="hidden lg:block">
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="#sobre" className="hover:text-white transition-colors">Sobre nós</Link></li>
                <li><a href="https://www.instagram.com/hyperion_pay/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://discord.gg/sGmMSYjdnA" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 md:pt-8 border-t border-white/10 gap-3">
            <div className="text-xs md:text-sm text-white/50">Siga nossas redes</div>
            <div className="flex items-center gap-3 md:gap-4">
              <a href="https://www.instagram.com/hyperion_pay/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:border-blue-500/40 hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://discord.gg/sGmMSYjdnA" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="w-9 h-9 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:border-blue-500/40 hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="https://wa.me/5534999353187" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:border-blue-500/40 hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
            <div className="text-[10px] md:text-sm text-white/40">© 2024 Hyperion Pay. Todos os direitos reservados.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FloatingBadge({ className, icon, label }: { className?: string; icon: React.ReactNode; label: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0b1122]/90 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl shadow-black/40">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="text-[10px] text-white/45">Na Hyperion Pay tem</div>
          <div className="text-xs font-semibold text-white">{label}</div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  featured,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 md:p-6 transition-all duration-300 ${
        featured
          ? "border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-white/[0.02]"
          : "border-white/10 bg-white/[0.02] hover:border-blue-500/30 hover:bg-white/[0.04]"
      }`}
    >
      {featured && <div className="absolute -top-16 -right-10 w-48 h-48 bg-blue-600/20 rounded-full blur-[70px]" />}
      <div className="relative">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
        </div>
        <h3 className={`font-semibold mb-1.5 ${featured ? "text-lg md:text-2xl" : "text-base md:text-lg"}`}>{title}</h3>
        <p className="text-xs md:text-sm text-white/55">{desc}</p>
        {featured && (
          <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-blue-400 font-medium">
            Saiba mais <ArrowUpRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function AwardCard({
  img,
  tier,
  title,
  desc,
  badge,
  corner,
  wide,
}: {
  img: string;
  tier: string;
  title: string;
  desc: string;
  badge?: string;
  corner?: string;
  wide?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-500 hover:border-blue-500/40 hover:-translate-y-1">
      {badge && (
        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded-full text-[10px] font-medium text-blue-300">
          {badge}
        </div>
      )}
      {corner && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full text-[10px] font-semibold text-blue-300">
          {corner}
        </div>
      )}
      <div className={`relative overflow-hidden ${wide ? "aspect-[16/9]" : "aspect-[3/4]"}`}>
        <Image src={img} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
        <div className="text-xs text-blue-400 font-medium mb-1">{tier}</div>
        <h3 className="text-base md:text-lg font-bold">{title}</h3>
        <p className="text-xs text-white/55 mt-1">{desc}</p>
      </div>
    </div>
  );
}
