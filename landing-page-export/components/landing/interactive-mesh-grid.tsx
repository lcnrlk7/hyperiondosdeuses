'use client';

import React, { useEffect, useRef } from 'react';

export function InteractiveMeshGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const gridRef = useRef<Array<Array<{ x: number; y: number; ox: number; oy: number }>>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeGrid();
    };

    const initializeGrid = () => {
      const cellSize = 60;
      const cols = Math.ceil(canvas.width / cellSize) + 1;
      const rows = Math.ceil(canvas.height / cellSize) + 1;
      const grid = [];

      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          const x = j * cellSize;
          const y = i * cellSize;
          row.push({ x, y, ox: x, oy: y });
        }
        grid.push(row);
      }
      gridRef.current = grid;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let prevMouseX = canvas.width / 2;
    let prevMouseY = canvas.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.vx = e.clientX - prevMouseX;
      mouseRef.current.vy = e.clientY - prevMouseY;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleScroll = () => {
      mouseRef.current.y = window.scrollY + window.innerHeight / 2;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    const animate = () => {
      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const grid = gridRef.current;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const influenceRadius = 200;

      // Update grid positions based on mouse proximity
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const point = grid[i][j];
          const dx = mouseX - point.ox;
          const dy = mouseY - point.oy;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - distance / influenceRadius);

          // Repel points away from mouse
          point.x = point.ox - dx * influence * 0.3;
          point.y = point.oy - dy * influence * 0.3;

          // Add smoothing/spring effect
          point.x += (point.ox - point.x) * 0.1;
          point.y += (point.oy - point.y) * 0.1;
        }
      }

      // Draw grid lines with laranja color - more subtle
      ctx.strokeStyle = 'rgba(255, 140, 0, 0.08)';
      ctx.lineWidth = 0.8;

      // Horizontal lines
      for (let i = 0; i < grid.length; i++) {
        ctx.beginPath();
        for (let j = 0; j < grid[i].length; j++) {
          const point = grid[i][j];
          if (j === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let j = 0; j < grid[0].length; j++) {
        ctx.beginPath();
        for (let i = 0; i < grid.length; i++) {
          const point = grid[i][j];
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }

      // Draw intersection points - laranja subtle
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const point = grid[i][j];
          const dx = mouseX - point.ox;
          const dy = mouseY - point.oy;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - distance / influenceRadius);

          ctx.fillStyle = `rgba(255, 140, 0, ${0.1 + influence * 0.2})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1 + influence * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
