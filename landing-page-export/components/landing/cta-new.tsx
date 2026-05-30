'use client';

import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CTANew() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden cursor-pointer group"
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-80"
          style={{
            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
            backgroundSize: '200% 200%',
          }}
        />

        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000 translate-x-1/2 translate-y-1/2" />

        {/* Content */}
        <div className="relative z-10 px-8 md:px-16 py-16 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            <span className="text-sm font-semibold text-white">
              Últimas 24 horas
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Pronto para Revolucionar suas Finanças?
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Junte-se a milhares de usuários que já estão economizando com Hyperion Pay
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/auth/register"
              className="group/btn px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 justify-center"
            >
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#"
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300"
            >
              Ver Documentação
            </Link>
          </div>

          {/* Features list */}
          <div className="pt-8 flex flex-col sm:flex-row gap-8 justify-center text-white/90">
            {[
              '✓ Sem cartão de crédito',
              '✓ Verificação instantânea',
              '✓ Suporte 24/7',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Border gradient */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
      </div>
    </section>
  );
}
