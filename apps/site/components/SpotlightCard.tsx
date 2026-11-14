"use client";

import { type ReactNode, useCallback, useRef } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SpotlightCard({
  children,
  className = "",
  id,
}: SpotlightCardProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (sectionRef.current) {
      rectRef.current = sectionRef.current.getBoundingClientRect();
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = "1";
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!glowRef.current) return;
    const rect = rectRef.current;
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.background = `radial-gradient(550px circle at ${x}px ${y}px, rgba(193, 95, 61, 0.12), transparent 70%)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
    rectRef.current = null;
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label="Feature spotlight card"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Spotlight dynamic hover glow (zero React re-renders) */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 will-change-[background]"
        aria-hidden="true"
      />
      {children}
    </section>
  );
}
