'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroLiquidFinance() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / scrollHeight;
      setScrollProgress(Math.min(scrolled, 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 z-20">
      <div className="relative w-full max-w-6xl mx-auto px-4 text-center">
        {/* Glowing orbs around hero - LARANJA */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Badge/Pill - LARANJA */}
        <div className="inline-block mb-8 animate-slide-up">
          <div className="px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 backdrop-blur-sm hover:border-indigo-500/60 transition-colors duration-300">
            <span className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
              <span className="flex items-center justify-center w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              Novo jeito de transferir dinheiro
            </span>
          </div>
        </div>

        {/* Main title with animated gradient - LARANJA PREDOMINANTE */}
        <div className="mb-8 space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 animate-gradient-shift leading-tight animate-slide-up">
            Transferências PIX<br />Instantâneas e Seguras
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            Faça transferências PIX com segurança, velocidade e a melhor taxa do mercado. Sem complicações, sem burocracias.
          </p>
        </div>

        {/* CTA Buttons - LARANJA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/auth/register"
            className="relative px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white transition-all duration-300 overflow-hidden group shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Começar Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          <button
            className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/70 transition-all duration-300 backdrop-blur-sm"
          >
            Ver Demo
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 text-indigo-400/70 animate-bounce">
          <p className="text-sm">Deslize para explorar</p>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Progress bar - LARANJA */}
        <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 z-50 transition-all duration-100 shadow-lg shadow-indigo-500/50" style={{ width: `${scrollProgress * 100}%` }}></div>
      </div>
    </section>
  );
}
