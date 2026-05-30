'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Zap, Shield, Smartphone, Lock, TrendingUp, Globe } from 'lucide-react';

interface Card {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FloatingPhysicsCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const animationRef = useRef<number | null>(null);
  const physicsRef = useRef<Card[]>([]);

  const cardData = [
    { icon: <Zap className="w-8 h-8" />, title: 'Instantâneo', description: 'Transferências em tempo real' },
    { icon: <Shield className="w-8 h-8" />, title: 'Seguro', description: 'Criptografia de ponta a ponta' },
    { icon: <Smartphone className="w-8 h-8" />, title: 'Mobile First', description: 'Funciona em qualquer dispositivo' },
    { icon: <Lock className="w-8 h-8" />, title: 'Privado', description: 'Seus dados são seus' },
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Escalável', description: 'Cresce com você' },
    { icon: <Globe className="w-8 h-8" />, title: 'Global', description: 'Sem fronteiras' },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Initialize cards with random positions
    const initialCards: Card[] = cardData.map((data, i) => ({
      id: i,
      x: Math.random() * (width - 200) + 100,
      y: Math.random() * (height - 200) + 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      ...data,
    }));

    physicsRef.current = initialCards;
    setCards(initialCards);

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const animate = () => {
      const cards = physicsRef.current;
      const friction = 0.98;
      const attractStrength = 0.0001;
      const repelRadius = 150;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        // Apply friction
        card.vx *= friction;
        card.vy *= friction;

        // Add gravity effect
        card.vy += 0.1;

        // Boundaries - bounce
        if (card.x < 0 || card.x > width - 200) {
          card.vx *= -0.8;
          card.x = Math.max(0, Math.min(width - 200, card.x));
        }
        if (card.y < 0 || card.y > height - 200) {
          card.vy *= -0.8;
          card.y = Math.max(0, Math.min(height - 200, card.y));
        }

        // Repel from mouse
        const dx = card.x + 100 - mouseX;
        const dy = card.y + 100 - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < repelRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (1 - distance / repelRadius) * 3;
          card.vx += Math.cos(angle) * force;
          card.vy += Math.sin(angle) * force;
        }

        // Cards attract each other slightly
        for (let j = i + 1; j < cards.length; j++) {
          const other = cards[j];
          const dx = other.x - card.x;
          const dy = other.y - card.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 400) {
            const force = attractStrength / (distance * distance);
            card.vx += dx * force;
            card.vy += dy * force;
            other.vx -= dx * force;
            other.vy -= dy * force;
          }
        }

        // Update position
        card.x += card.vx;
        card.y += card.vy;

        // Rotation
        card.rotation += Math.sqrt(card.vx * card.vx + card.vy * card.vy) * 0.5;
      }

      setCards([...cards]);
      animationRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-b from-background via-background to-background/50 overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-600 pointer-events-none z-0">
          Mova os cards
        </h2>
      </div>

      {cards.map((card) => (
        <div
          key={card.id}
          className="absolute w-48 h-48 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing hover:border-blue-400/50 transition-colors z-20"
          style={{
            transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg) scale(${1 + Math.abs(Math.sin(card.rotation * Math.PI / 180)) * 0.05})`,
            transition: 'box-shadow 0.3s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(100, 200, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          <div className="text-blue-400 mb-3">{card.icon}</div>
          <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
          <p className="text-sm text-gray-300">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
