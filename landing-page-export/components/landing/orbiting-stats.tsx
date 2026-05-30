'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Stat {
  label: string;
  value: string;
  color: string;
}

export function OrbitingStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stats: Stat[] = [
    { label: 'Transferências/Segundo', value: '1M+', color: 'from-blue-500' },
    { label: 'Usuários Globais', value: '500K+', color: 'from-purple-500' },
    { label: 'Taxa Média', value: '0.5%', color: 'from-pink-500' },
    { label: 'Uptime', value: '99.99%', color: 'from-green-500' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setRotation(scrolled * 0.2);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center py-20 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-2xl aspect-square"
      >
        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-2xl"></div>
          <div className="absolute text-center">
            <div className="text-4xl font-bold text-white">Hyperion Pay</div>
            <p className="text-sm text-gray-400 mt-2">Ecossistema Financeiro</p>
          </div>
        </div>

        {/* Orbital circles */}
        {[1, 2, 3].map((ring) => (
          <div
            key={ring}
            className="absolute inset-0 rounded-full border border-blue-500/20"
            style={{
              width: `${(ring * 25)}%`,
              height: `${(ring * 25)}%`,
              left: `${50 - (ring * 12.5)}%`,
              top: `${50 - (ring * 12.5)}%`,
            }}
          ></div>
        ))}

        {/* Orbiting stats */}
        {stats.map((stat, index) => {
          const angle = (rotation + (index * 90)) * (Math.PI / 180);
          const radius = 200;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={index}
              className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) scale(${hoveredIndex === index ? 1.2 : 1})`,
                transition: 'transform 0.3s ease-out',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`w-full h-full rounded-xl bg-gradient-to-br ${stat.color} to-transparent opacity-20 blur-lg`}></div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
                <div className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color} to-white`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 text-center px-2 mt-1">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {stats.map((_, index) => {
            const angle1 = (rotation + (index * 90)) * (Math.PI / 180);
            const angle2 = (rotation + ((index + 1) * 90)) * (Math.PI / 180);
            const radius = 200;
            const x1 = 50 + (Math.cos(angle1) * radius) / (containerRef.current?.clientWidth || 1) * 100;
            const y1 = 50 + (Math.sin(angle1) * radius) / (containerRef.current?.clientHeight || 1) * 100;
            const x2 = 50 + (Math.cos(angle2) * radius) / (containerRef.current?.clientWidth || 1) * 100;
            const y2 = 50 + (Math.sin(angle2) * radius) / (containerRef.current?.clientHeight || 1) * 100;

            return (
              <line
                key={`line-${index}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="rgba(100, 200, 255, 0.2)"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* Info text */}
      <div className="absolute bottom-10 left-0 right-0 text-center text-gray-400 text-sm">
        <p>Passe o mouse pelos dados para mais informações</p>
      </div>
    </section>
  );
}
