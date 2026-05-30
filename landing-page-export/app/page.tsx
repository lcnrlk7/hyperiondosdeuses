import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, BarChart3, Users, LineChart, Code2, Shield, Server, Headphones, Eye, Clock, Check } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050614] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050614]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={32} height={32} className="h-6 w-6 md:h-7 md:w-7" />
            <span className="text-base md:text-lg font-semibold text-white">Hyperion<span className="text-indigo-500">Pay</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#inicio" className="text-sm text-gray-400 hover:text-white transition-colors">Início</Link>
            <Link href="#solucoes" className="text-sm text-gray-400 hover:text-white transition-colors">Soluções</Link>
            <Link href="#taxas" className="text-sm text-gray-400 hover:text-white transition-colors">Taxas</Link>
            <a href="https://app.hyperionpay.com.br/dashboard/integration" className="text-sm text-gray-400 hover:text-white transition-colors">Documentação</a>
            <Link href="#sobre" className="text-sm text-gray-400 hover:text-white transition-colors">Sobre nós</Link>
          </nav>
          
          <div className="flex items-center gap-2 md:gap-3">
            <a href="https://app.hyperionpay.com.br/auth/login" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-300 hover:text-white transition-colors">
              Entrar
            </a>
            <a href="https://app.hyperionpay.com.br/auth/register" className="px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full text-xs md:text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
              Criar conta
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative pt-24 md:pt-32 pb-8 md:pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left content */}
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 md:mb-6">
                A nova geração de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">pagamentos</span>
                {" "}começa aqui.
              </h1>
              
              <p className="text-sm md:text-base lg:text-lg text-gray-400 mb-6 md:mb-8 max-w-lg">
                Sua própria gateway de pagamentos PIX. Rápida, segura e totalmente escalável para o seu negócio.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-12">
                <a href="https://app.hyperionpay.com.br/auth/register" className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-indigo-500/30 transition-all">
                  Começar agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link href="#solucoes" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-3 border border-white/20 rounded-full text-sm md:text-base font-medium hover:bg-white/5 transition-all">
                  Conhecer soluções
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-xs md:text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                  <span>Ativação rápida</span>
                  <span className="text-gray-600">em até 5 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                  <span>Sem mensalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                  <span>Suporte 24h</span>
                </div>
              </div>
            </div>
            
            {/* Right - Mascot with floating badges */}
            <div className="relative flex items-center justify-center min-h-[400px] md:min-h-[500px]">
              {/* Mascot Image with float animation */}
              <div className="relative animate-float">
                <Image 
                  src="/images/mascote-hyperion.png" 
                  alt="Hyperion Pay Mascot" 
                  width={400} 
                  height={500}
                  className="w-[280px] md:w-[350px] lg:w-[400px] h-auto drop-shadow-2xl"
                  priority
                />
              </div>
              
              {/* Floating Feature Badges */}
              {/* Badge 1 - Suporte 24/h */}
              <div className="absolute top-4 right-0 md:top-8 md:-right-4 animate-float-delay-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d1a]/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Na Hyperion Pay tem</div>
                    <div className="text-xs font-semibold text-white">Suporte 24/h</div>
                  </div>
                </div>
              </div>
              
              {/* Badge 2 - Integracoes */}
              <div className="absolute top-1/3 -left-4 md:left-0 animate-float-delay-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d1a]/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Server className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Na Hyperion Pay tem</div>
                    <div className="text-xs font-semibold text-white">Integrações facilitadas</div>
                  </div>
                </div>
              </div>
              
              {/* Badge 3 - Multiplas rotas */}
              <div className="absolute top-1/2 right-0 md:-right-8 animate-float-delay-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d1a]/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Na Hyperion Pay tem</div>
                    <div className="text-xs font-semibold text-white">Múltiplas rotas</div>
                  </div>
                </div>
              </div>
              
              {/* Badge 4 - Saque em PIX */}
              <div className="absolute bottom-1/4 -left-4 md:left-4 animate-float-delay-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d1a]/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center p-1.5">
                    <Image src="/images/pix-icon.png" alt="PIX" width={20} height={20} className="w-full h-full object-contain brightness-0 invert" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Na Hyperion Pay tem</div>
                    <div className="text-xs font-semibold text-white">Saque em PIX.</div>
                  </div>
                </div>
              </div>
              
              {/* Glow effect under mascot */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[60px] bg-indigo-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[150px] h-[40px] bg-indigo-400/40 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="solucoes" className="relative py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Tudo que você precisa para escalar seu negócio
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {/* Feature 1 */}
            <div className="group bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0f1225] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold mb-1">Pagamentos Instantâneos</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                Receba via PIX com processamento rápido e seguro.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0f1225] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold mb-1">Automação de Vendas</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                Automatize entregas e processos digitais.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0f1225] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold mb-1">Gestão de Afiliados</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                Crie seu programa de afiliados.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="group bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0f1225] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <LineChart className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold mb-1">Analytics em Tempo Real</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                Acompanhe vendas e desempenho.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="group bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0f1225] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold mb-1">PIX Seguro</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                Máxima segurança nas transações.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="group bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0f1225] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <Code2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold mb-1">API Completa</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                Integração simples e documentada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0a0d1a] border border-white/5 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Controle total da sua operação em{" "}
                  <span className="text-indigo-500">tempo real</span>
                </h2>
                <p className="text-gray-400 mb-8">
                  Dashboards avançados, gráficos inteligentes e dados em tempo real para você tomar decisões rápidas e aumentar seus resultados.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-sm">Gráficos em tempo real</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-sm">Relatórios personalizados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-sm">Exportação de dados</span>
                  </div>
                </div>
              </div>
              
              {/* Right - Dashboard Preview */}
              <div className="bg-[#080a14] rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm font-medium">Relatorio de Vendas</div>
                  <div className="px-3 py-1 bg-[#0f1225] rounded text-xs">Hoje</div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-gray-500">Volume total</div>
                    <div className="text-lg font-bold">R$ 98.765,43</div>
                    <div className="text-xs text-green-500">+12.5%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Transações</div>
                    <div className="text-lg font-bold">12.543</div>
                    <div className="text-xs text-green-500">+8.2%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Ticket médio</div>
                    <div className="text-lg font-bold">R$ 78,90</div>
                    <div className="text-xs text-green-500">+5.4%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Novos clientes</div>
                    <div className="text-lg font-bold">2.356</div>
                    <div className="text-xs text-green-500">+15.3%</div>
                  </div>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-[#0d1020] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Volume de Vendas</div>
                    <div className="h-32 flex items-end gap-1">
                      {[30, 45, 35, 50, 40, 60, 45, 55, 65, 50, 70, 55, 75, 60, 80, 65, 85, 70, 90, 75, 85, 80, 95, 85].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>
                  <div className="bg-[#0d1020] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Transações por Status</div>
                    <div className="flex items-center justify-center h-28">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#1a1f35" strokeWidth="8" fill="none" />
                          <circle cx="48" cy="48" r="40" stroke="#4f46e5" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="8" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold">12.543</span>
                          <span className="text-xs text-gray-500">Total</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                          <span className="text-gray-500">Aprovadas</span>
                        </div>
                        <span>96.8%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span className="text-gray-500">Pendentes</span>
                        </div>
                        <span>2.7%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-gray-500">Reprovadas</span>
                        </div>
                        <span>0.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing/Fees Section */}
      <section id="taxas" className="relative py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Taxas transparentes que cabem no seu bolso
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-3xl mx-auto">
            {/* PIX - Highlighted */}
            <div className="relative bg-gradient-to-b from-indigo-500/20 to-[#0a0d1a] border border-indigo-500/30 rounded-xl md:rounded-2xl p-4 md:p-8">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 md:px-3 py-0.5 md:py-1 bg-indigo-500 rounded-full text-[10px] md:text-xs font-medium text-white whitespace-nowrap">
                MELHOR CONDIÇÃO
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-500/20 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mt-2">
                <svg className="w-5 h-5 md:w-7 md:h-7 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2">PIX Instantâneo</h3>
              <div className="text-2xl md:text-4xl font-bold text-indigo-500 mb-1 md:mb-2">R$0,50</div>
              <p className="text-xs md:text-sm text-gray-500">Taxa fixa por transação.</p>
              <p className="text-[10px] md:text-xs text-gray-600 mt-1 md:mt-2">Receba na hora.</p>
            </div>
            
            {/* API PIX */}
            <div className="bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-8 hover:border-indigo-500/20 transition-all">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-500/10 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4">
                <Code2 className="w-5 h-5 md:w-7 md:h-7 text-indigo-500" />
              </div>
              <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2">API PIX</h3>
              <div className="text-2xl md:text-4xl font-bold text-indigo-500 mb-1 md:mb-2">R$0,50</div>
              <p className="text-xs md:text-sm text-gray-500">Integração via API.</p>
              <p className="text-[10px] md:text-xs text-gray-600 mt-1 md:mt-2">Documentação completa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="sobre" className="relative py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Por que escolher a Hyperion Pay?
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Shield className="w-5 h-5 md:w-8 md:h-8 text-indigo-500" />
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1">Segurança Máxima</h3>
              <p className="text-[10px] md:text-xs text-gray-500 hidden md:block">Dados protegidos com criptografia.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Server className="w-5 h-5 md:w-8 md:h-8 text-indigo-500" />
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1">Infraestrutura Robusta</h3>
              <p className="text-[10px] md:text-xs text-gray-500 hidden md:block">Alta disponibilidade garantida.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Headphones className="w-5 h-5 md:w-8 md:h-8 text-indigo-500" />
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1">Suporte 24/7</h3>
              <p className="text-[10px] md:text-xs text-gray-500 hidden md:block">Time sempre à disposição.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Eye className="w-5 h-5 md:w-8 md:h-8 text-indigo-500" />
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1">Sem Taxas Escondidas</h3>
              <p className="text-[10px] md:text-xs text-gray-500 hidden md:block">Transparencia total.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0a0d1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Clock className="w-5 h-5 md:w-8 md:h-8 text-indigo-500" />
              </div>
              <h3 className="text-xs md:text-base font-semibold mb-1">Ativação Rápida</h3>
              <p className="text-[10px] md:text-xs text-gray-500 hidden md:block">Comece em minutos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-[#0a0614] to-[#050614] border border-indigo-500/20 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 overflow-hidden">
            {/* Background glow */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent" />
            <div className="absolute bottom-0 left-1/4 w-[200px] md:w-[400px] h-[100px] md:h-[200px] bg-indigo-500/20 rounded-full blur-[80px] md:blur-[100px]" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                  Hyperion Pay — não é só uma gateway, é o{" "}
                  <span className="text-indigo-500">próximo nível.</span>
                </h2>
                <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6">
                  Transforme sua operação, aumente suas conversões e escale seu negócio com tecnologia de ponta.
                </p>
                <Link href="/auth/register" className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-indigo-500/30 transition-all">
                  Criar minha conta agora
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-xl md:text-3xl lg:text-4xl font-bold text-indigo-500">+25K</div>
                  <div className="text-[10px] md:text-sm text-gray-500">Negócios ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-3xl lg:text-4xl font-bold text-indigo-500">+2.5M</div>
                  <div className="text-[10px] md:text-sm text-gray-500">Transações/mês</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-3xl lg:text-4xl font-bold text-indigo-500">+R$1B</div>
                  <div className="text-[10px] md:text-sm text-gray-500">Processados/mes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Awards / Premiações Section */}
      <section className="relative py-12 md:py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-balance">
              Quem vende com a Hyperion Pay,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
                colhe resultados reais
              </span>
            </h2>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto text-pretty">
              Reconhecemos a dedicacao dos nossos parceiros. A cada meta de faturamento alcancada, 
              voce desbloqueia premiacoes exclusivas da Hyperion Pay.
            </p>
          </div>

          {/* Awards Stack - Overlapping cards */}
          <div className="relative max-w-5xl mx-auto">
            {/* Row 1: Three main plaques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
              {/* 50K Plaque */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0d1a] transition-all duration-500 hover:border-indigo-500/30 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src="/images/awards/placa-50k.png"
                    alt="Placa 50K de Faturamento"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1a] via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="text-xs text-indigo-400 font-medium mb-1">Meta Bronze</div>
                  <h3 className="text-base md:text-lg font-bold">R$ 50.000</h3>
                  <p className="text-xs text-gray-500 mt-1">Placa exclusiva de reconhecimento</p>
                </div>
              </div>

              {/* 100K Plaque */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0d1a] transition-all duration-500 hover:border-indigo-500/30 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src="/images/awards/placa-100k.png"
                    alt="Placa 100K de Faturamento"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1a] via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="text-xs text-indigo-400 font-medium mb-1">Meta Prata</div>
                  <h3 className="text-base md:text-lg font-bold">R$ 100.000</h3>
                  <p className="text-xs text-gray-500 mt-1">Placa premium com acabamento especial</p>
                </div>
              </div>

              {/* 1M Plaque */}
              <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0a0d1a] transition-all duration-500 hover:border-indigo-500/40 hover:-translate-y-1">
                <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-medium text-indigo-300">
                  Elite
                </div>
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src="/images/awards/placa-1m.png"
                    alt="Placa 1 Milhao de Faturamento"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1a] via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="text-xs text-indigo-400 font-medium mb-1">Meta Diamante</div>
                  <h3 className="text-base md:text-lg font-bold">R$ 1.000.000</h3>
                  <p className="text-xs text-gray-500 mt-1">Placa de cristal com mascote exclusivo</p>
                </div>
              </div>
            </div>

            {/* Row 2: 20K Meta - Merch items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Bracelet */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0d1a] transition-all duration-500 hover:border-indigo-500/30 hover:-translate-y-1">
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-semibold text-indigo-300">
                  R$ 20K
                </div>
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src="/images/awards/pulseira.png"
                    alt="Pulseira Hyperion Pay"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1a] via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="text-xs text-indigo-400 font-medium mb-1">Meta Inicial</div>
                  <h3 className="text-base md:text-lg font-bold">Pulseira Hyperion Pay</h3>
                  <p className="text-xs text-gray-500 mt-1">Ao atingir R$ 20K, escolha: pulseira, caneca ou garrafa</p>
                </div>
              </div>

              {/* Merch Kit */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0d1a] transition-all duration-500 hover:border-indigo-500/30 hover:-translate-y-1">
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-semibold text-indigo-300">
                  R$ 20K
                </div>
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src="/images/awards/merch.png"
                    alt="Kit Merchandise Hyperion Pay"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1a] via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="text-xs text-indigo-400 font-medium mb-1">Meta Inicial</div>
                  <h3 className="text-base md:text-lg font-bold">Garrafa ou Caneca</h3>
                  <p className="text-xs text-gray-500 mt-1">Merch oficial exclusivo para parceiros Hyperion Pay</p>
                </div>
              </div>
            </div>

            {/* Bottom text */}
            <div className="text-center mt-8 md:mt-12">
              <p className="text-xs md:text-sm text-gray-500 mb-4">
                Todas as premiacoes sao enviadas gratuitamente para os parceiros que atingem as metas.
              </p>
              <a 
                href="https://app.hyperionpay.com.br/auth/register" 
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full text-sm md:text-base font-medium text-white hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
              >
                Comecar a faturar agora
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 md:py-16 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-12 mb-8 md:mb-12">
            {/* Logo & Description */}
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3 md:mb-4">
                <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={32} height={32} className="h-6 w-6 md:h-7 md:w-7" />
                <span className="text-base md:text-lg font-semibold text-white">Hyperion<span className="text-indigo-500">Pay</span></span>
              </Link>
              <p className="text-xs md:text-sm text-gray-500 max-w-sm">
                A plataforma completa de pagamentos PIX para negocios digitais.
              </p>
            </div>
            
            {/* Products */}
            <div>
              <h4 className="text-sm md:text-base font-semibold mb-2 md:mb-4">Produtos</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-500">
                <li><Link href="#solucoes" className="hover:text-white transition-colors">Pagamentos PIX</Link></li>
                <li><Link href="#taxas" className="hover:text-white transition-colors">Taxas</Link></li>
                <li><a href="https://app.hyperionpay.com.br/dashboard/integration" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-sm md:text-base font-semibold mb-2 md:mb-4">Suporte</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-500">
                <li><a href="https://app.hyperionpay.com.br/dashboard/integration" className="hover:text-white transition-colors">Documentação</a></li>
                <li><Link href="https://wa.me/5534999353187" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</Link></li>
              </ul>
            </div>
            
            {/* Company - Hidden on mobile */}
            <div className="hidden lg:block">
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="#sobre" className="hover:text-white transition-colors">Sobre nós</Link></li>
                <li><Link href="https://www.instagram.com/hyperion_pay/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</Link></li>
                <li><Link href="https://discord.gg/sGmMSYjdnA" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Discord</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 md:pt-8 border-t border-white/5">
            <div className="text-xs md:text-sm text-gray-500 mb-3 md:mb-0">
              Siga nossas redes
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              {/* Instagram */}
              <Link href="https://www.instagram.com/hyperion_pay/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-[#0a0d1a] border border-white/5 rounded-full flex items-center justify-center hover:border-indigo-500/30 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </Link>
              {/* Discord */}
              <Link href="https://discord.gg/sGmMSYjdnA" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-[#0a0d1a] border border-white/5 rounded-full flex items-center justify-center hover:border-indigo-500/30 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </Link>
              {/* WhatsApp */}
              <Link href="https://wa.me/5534999353187" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-[#0a0d1a] border border-white/5 rounded-full flex items-center justify-center hover:border-indigo-500/30 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </Link>
              
            </div>
            <div className="text-[10px] md:text-sm text-gray-500 mt-3 md:mt-0">
              © 2024 Hyperion Pay. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
