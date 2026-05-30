'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedTimelineProps {
  items: Array<{
    title: string;
    description: string;
    year: string;
  }>;
}

export function AnimatedTimeline({ items }: AnimatedTimelineProps) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    new Array(items.length).fill(false)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems((prev) => {
                const newVisible = [...prev];
                newVisible[index] = true;
                return newVisible;
              });
            }, index * 200);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      const children = containerRef.current.querySelectorAll('[data-timeline-item]');
      children.forEach((child) => observer.observe(child));
    }

    return () => observer.disconnect();
  }, [items.length]);

  return (
    <div ref={containerRef} className="relative">
      {/* Linha central */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500 -translate-x-1/2" />

      <div className="space-y-12">
        {items.map((item, index) => (
          <div
            key={index}
            data-timeline-item
            className={`transition-all duration-700 ${
              visibleItems[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div
              className={`flex gap-8 ${
                index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Conteúdo */}
              <div className="flex-1">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                  <div className="text-sm font-bold text-blue-400 mb-2">
                    {item.year}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Ponto na linha */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
                  <div className="relative w-4 h-4 bg-blue-500 rounded-full border-4 border-slate-900" />
                </div>
              </div>

              {/* Espaço vazio */}
              <div className="flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
