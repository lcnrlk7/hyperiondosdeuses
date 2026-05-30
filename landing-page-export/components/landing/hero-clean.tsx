'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Activity, Timer, ShieldCheck } from 'lucide-react';

export function HeroClean() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Orange glow at bottom center */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-t from-indigo-500/15 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
      
      {/* Light points with gradient */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-indigo-500/40 blur-sm" />
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-indigo-400/30 blur-sm" />
      <div className="absolute top-2/3 left-1/3 w-1 h-1 rounded-full bg-indigo-500/50 blur-sm" />
      <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-indigo-400/20 blur-sm" />
      <div className="absolute top-1/2 left-1/5 w-1.5 h-1.5 rounded-full bg-indigo-500/25 blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-40 pb-20">
        {/* Hero Text with gradient effects */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-2 leading-tight tracking-tight">
            Gateway de pagamento
          </h1>
          <h2 
            className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            com a menor taxa do mercado
          </h2>
          
          <p className="mt-8 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Receba pagamentos online com rapidez, simplicidade e baixo custo.
            <br />
            Integração fácil, checkout seguro e suporte sempre disponível.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg shadow-indigo-500/25"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-full border border-gray-800 hover:border-gray-700 transition-all duration-200"
          >
            Ver Documentação
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12 mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-gray-500 text-sm">Uptime</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Timer className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt;1s</p>
              <p className="text-gray-500 text-sm">Resposta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-gray-500 text-sm">Seguro</p>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0d0d0d] rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl shadow-black/50">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
              <div className="flex items-center gap-3">
                {/* Logo Hyperion Pay */}
                <Image 
                  src="/images/logo.png" 
                  alt="Hyperion Pay" 
                  width={24} 
                  height={24}
                  className="object-contain"
                />
                <span className="text-white font-semibold">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-700" />
                <div className="w-3 h-3 rounded-full bg-gray-700" />
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#151515] rounded-xl p-5 border border-gray-800/50">
                  <p className="text-gray-500 text-sm mb-2">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-white">R$ 12.450,00</p>
                </div>
                <div className="bg-[#151515] rounded-xl p-5 border border-gray-800/50">
                  <p className="text-gray-500 text-sm mb-2">Recebido Hoje</p>
                  <p className="text-2xl font-bold text-white">R$ 3.280,50</p>
                </div>
                <div className="bg-[#151515] rounded-xl p-5 border border-gray-800/50">
                  <p className="text-gray-500 text-sm mb-2">Taxa do Mês</p>
                  <p className="text-2xl font-bold text-white">R$ 245,30</p>
                </div>
              </div>
              
              {/* Gradient Bar */}
              <div className="h-24 rounded-xl bg-gradient-to-r from-indigo-600/80 via-indigo-500/50 to-indigo-400/30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
