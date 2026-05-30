'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatedCounter } from './animated-counter';

export function BenefitsNew() {
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      label: 'Transações Realizadas',
      value: 2500000,
      suffix: '+',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Dinheiro Transferido',
      value: 150000000,
      prefix: 'R$ ',
      suffix: '',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Taxa Média',
      value: 0.5,
      prefix: '',
      suffix: '%',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Usuários Satisfeitos',
      value: 98,
      prefix: '',
      suffix: '%',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Números que Falam
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Confie em uma plataforma com milhões de transações bem-sucedidas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group relative transform transition-all duration-500 ${
                hasStarted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {/* Glow background */}
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${benefit.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300`}
              />

              {/* Card */}
              <div className="relative bg-slate-900 rounded-2xl p-8 border border-slate-800 group-hover:border-slate-700 transition-all">
                {/* Label */}
                <p className="text-slate-400 text-sm font-medium mb-4 group-hover:text-slate-300 transition-colors">
                  {benefit.label}
                </p>

                {/* Counter */}
                <div className={`text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r ${benefit.gradient} mb-2`}>
                  {hasStarted ? (
                    <AnimatedCounter
                      from={0}
                      to={benefit.value}
                      duration={2.5}
                      prefix={benefit.prefix}
                      suffix={benefit.suffix}
                    />
                  ) : (
                    <span>{benefit.prefix}0{benefit.suffix}</span>
                  )}
                </div>

                {/* Bottom line */}
                <div
                  className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${benefit.gradient} rounded-full transition-all duration-300`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
