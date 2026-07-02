"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
}

const COLORS = [
  "rgba(255, 20, 147, VAR)",  // pink
  "rgba(0, 255, 255, VAR)",   // cyan
  "rgba(139, 0, 255, VAR)",   // purple
  "rgba(83, 252, 24, VAR)",   // green
];

/**
 * ParticleBackground — Lightweight animated floating particles.
 * Uses CSS-animated divs instead of canvas for performance and simplicity.
 */
export default function ParticleBackground({ count = 30 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.3 + 0.1),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.4 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    particlesRef.current = particles;
  }, [count]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => {
        const delay = Math.random() * 8;
        const duration = Math.random() * 12 + 10;
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const opacity = Math.random() * 0.35 + 0.05;
        const color = COLORS[i % COLORS.length].replace("VAR", String(opacity));

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: `-${size}px`,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              animation: `particle-rise ${duration}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes particle-rise {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? "" : "-"}${Math.random() * 40 + 10}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
