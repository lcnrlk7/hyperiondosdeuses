'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export function HeroNew() {
  const [displayedText, setDisplayedText] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fullText = 'Transferências PIX Instantâneas e Seguras';

  useEffect(() => {
    setIsVisible(true);
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-4"
    >
      {/* Background com gradiente e blur */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-5xl mx-auto text-center space-y-8">
        {/* Badge com animação */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full backdrop-blur-sm hover:border-blue-500/60 transition-all duration-300 cursor-pointer group">
          <Zap className="w-4 h-4 text-blue-400 group-hover:animate-spin" />
          <span className="text-sm text-blue-300">
            Novo jeito de transferir dinheiro
          </span>
        </div>

        {/* Título com efeito de escrita */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 leading-tight">
            {displayedText}
            <span className="animate-pulse">_</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Faça transferências PIX com segurança, velocidade e a melhor taxa do mercado. Sem complicações, sem burocracias.
          </p>
        </div>

        {/* Botões com efeito magnético */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <MagneticButton
            href="/auth/register"
            variant="primary"
            mousePos={mousePos}
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </MagneticButton>

          <MagneticButton
            href="#features"
            variant="secondary"
            mousePos={mousePos}
          >
            Ver Funcionalidades
          </MagneticButton>
        </div>

        {/* Stats com animação */}
        <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { number: '100K+', label: 'Usuários' },
            { number: '24/7', label: 'Disponível' },
            { number: '0.5%', label: 'Taxa' },
          ].map((stat, index) => (
            <div
              key={index}
              className="group cursor-pointer"
            >
              <div className="text-3xl md:text-4xl font-bold text-blue-400 group-hover:text-purple-400 transition-colors">
                {stat.number}
              </div>
              <div className="text-sm text-slate-400 mt-2 group-hover:text-slate-300 transition-colors">
                {stat.label}
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 scale-x-0 group-hover:scale-x-100 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur border border-blue-500/30 p-4 animate-float hidden md:flex flex-col items-start justify-between">
        <Zap className="w-8 h-8 text-blue-400" />
        <div className="text-right">
          <div className="text-sm font-bold text-blue-300">Taxa</div>
          <div className="text-lg font-black text-blue-400">0.5%</div>
        </div>
      </div>

      <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur border border-purple-500/30 p-4 animate-float animation-delay-2000 hidden md:flex flex-col items-start justify-between">
        <div className="w-8 h-8 rounded-full bg-purple-500/50" />
        <div className="text-right">
          <div className="text-sm font-bold text-purple-300">Seguro</div>
          <div className="text-lg font-black text-purple-400">100%</div>
        </div>
      </div>
    </div>
  );
}

interface MagneticButtonProps {
  href: string;
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  mousePos: { x: number; y: number };
}

function MagneticButton({
  href,
  variant,
  children,
  mousePos,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!buttonRef.current) return;

    const handleMouseMove = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(mousePos.x - buttonCenterX, 2) +
          Math.pow(mousePos.y - buttonCenterY, 2)
      );

      if (distance < 100) {
        const angle = Math.atan2(
          buttonCenterY - mousePos.y,
          buttonCenterX - mousePos.x
        );
        setOffset({
          x: Math.cos(angle) * (100 - distance) * 0.3,
          y: Math.sin(angle) * (100 - distance) * 0.3,
        });
      } else {
        setOffset({ x: 0, y: 0 });
      }
    };

    handleMouseMove();
  }, [mousePos]);

  return (
    <Link
      ref={buttonRef}
      href={href}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.3s ease-out',
      }}
      className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 group ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105'
          : 'border-2 border-slate-500 text-slate-300 hover:border-purple-500 hover:text-purple-300 hover:bg-purple-500/10'
      }`}
    >
      {children}
    </Link>
  );
}
