'use client';

import React, { useEffect, useRef } from 'react';

export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Liquid rendering function with morphing shapes - SIMPLIFIED FOR CLEANER LOOK
    const renderLiquid = (time: number) => {
      // Clear canvas with solid dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 3 subtle morphing blobs only (less elements)
      const blobCount = 3;
      for (let i = 0; i < blobCount; i++) {
        const angle = (time * 0.00008 + (i / blobCount) * Math.PI * 2);
        const radius = Math.min(canvas.width, canvas.height) * 0.25;
        
        const blobX = canvas.width / 2 + Math.cos(angle) * radius * 1.5;
        const blobY = canvas.height / 2 + Math.sin(angle) * radius * 1.5;

        // Minimal influence from mouse
        const dx = mouseRef.current.x - blobX;
        const dy = mouseRef.current.y - blobY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 600);

        const finalX = blobX + dx * influence * 0.08;
        const finalY = blobY + dy * influence * 0.08;

        // Draw morphing blob with subtle waves
        ctx.beginPath();
        const segments = 60;
        for (let j = 0; j < segments; j++) {
          const segAngle = (j / segments) * Math.PI * 2;
          const waveAmount = Math.sin(time * 0.0008 + j * 0.2) * 25;
          const blobRadius = 90 + waveAmount;
          
          const x = finalX + Math.cos(segAngle) * blobRadius;
          const y = finalY + Math.sin(segAngle) * blobRadius;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Subtle gradient fill - LARANJA
        const blobGradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, 120);
        blobGradient.addColorStop(0, `rgba(255, 140, 0, ${0.08 + influence * 0.04})`);
        blobGradient.addColorStop(0.7, `rgba(255, 100, 0, ${0.03 + influence * 0.02})`);
        blobGradient.addColorStop(1, `rgba(255, 80, 0, 0)`);
        ctx.fillStyle = blobGradient;
        ctx.fill();

        // Subtle outline
        ctx.strokeStyle = `rgba(255, 140, 0, ${0.15 + influence * 0.1})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    // Animation loop
    const animate = () => {
      timeRef.current += 16; // 60fps
      renderLiquid(timeRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: '#0a0a0a' }}
    />
  );
}
