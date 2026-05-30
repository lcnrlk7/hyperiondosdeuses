'use client';

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

// Formatação manual para evitar hydration mismatch entre servidor e cliente
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function AnimatedCounter({
  from,
  to,
  duration = 2,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateCounter = () => {
      const now = Date.now();
      if (now >= endTime) {
        setCount(to);
        return;
      }

      const progress = (now - startTime) / (duration * 1000);
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const newCount = Math.floor(from + (to - from) * easeOutQuad);
      setCount(newCount);
      requestAnimationFrame(updateCounter);
    };

    requestAnimationFrame(updateCounter);
  }, [from, to, duration, mounted]);

  // Renderizar valor inicial no servidor para evitar hydration mismatch
  if (!mounted) {
    return (
      <span>
        {prefix}
        {formatNumber(from)}
        {suffix}
      </span>
    );
  }

  return (
    <span>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
