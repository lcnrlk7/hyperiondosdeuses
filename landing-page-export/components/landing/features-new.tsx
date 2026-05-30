'use client';

import { useRef, useState } from 'react';
import { Zap, Shield, Smartphone, TrendingUp, Lock, Eye } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instantâneo',
    description: 'Transferências em tempo real, 24/7, sem atrasos',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Seguro',
    description: 'Criptografia de ponta a ponta e dados protegidos',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Transferências QR Code diretamente do seu celular',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: TrendingUp,
    title: 'Melhor Taxa',
    description: 'As menores taxas do mercado em transferências PIX',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Lock,
    title: 'Privado',
    description: 'Seus dados nunca são compartilhados com terceiros',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Eye,
    title: 'Transparente',
    description: 'Veja todas as suas transações e taxas em detalhes',
    color: 'from-violet-500 to-blue-500',
  },
];

export function FeaturesNew() {
  return (
    <section id="features" className="relative py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Funcionalidades Incríveis
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar suas finanças com confiança
          </p>
        </div>

        {/* Grid de features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
  });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y - rect.height / 2) / 10;
    const rotateY = (x - rect.width / 2) / 10;

    setTransform({
      rotateX: -rotateX,
      rotateY: rotateY,
    });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setIsHovering(false);
  };

  const Icon = feature.icon;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
      style={{
        transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${
          isHovering ? 1.05 : 1
        })`,
        transformStyle: 'preserve-3d',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      } as React.CSSProperties}
      className="group relative"
    >
      {/* Background glow */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-75 group-hover:opacity-100 transition-all duration-300`}
        style={{
          transform: `scale(${isHovering ? 1.05 : 1})`,
        }}
      />

      {/* Card content */}
      <div className="relative bg-slate-900 rounded-2xl p-8 border border-slate-800 group-hover:border-slate-700 transition-colors">
        {/* Icon container */}
        <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all">
          {feature.title}
        </h3>
        <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
          {feature.description}
        </p>

        {/* Bottom accent line */}
        <div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} rounded-full mt-6 w-0 group-hover:w-full transition-all duration-300`}
        />
      </div>
    </div>
  );
}
