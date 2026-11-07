"use client";

import { type ReactNode, useRef, useState } from "react";

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
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <section
      ref={divRef}
      id={id}
      aria-label="Feature spotlight card"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Spotlight dynamic hover glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(550px circle at ${position.x}px ${position.y}px, rgba(193, 95, 61, 0.12), transparent 70%)`,
        }}
        aria-hidden="true"
      />
      {children}
    </section>
  );
}
