"use client";

import { useEffect, useRef } from "react";

export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rafId = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let width = window.innerWidth;
    let height = window.innerHeight;

    let mouseX = width / 2;
    let mouseY = height / 3;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Floating acoustic harmonic dust particles
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.15,
      alpha: Math.random() * 0.35 + 0.1,
      freq: Math.random() * 2 + 1,
    }));

    let time = 0;
    let isVisible = true;

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const render = () => {
      if (!isVisible) {
        rafId = requestAnimationFrame(render);
        return;
      }

      time += 0.012;

      // Mouse smoothing
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing acoustic wave ribbons in the upper 45% of page
      const ribbonCount = 3;
      for (let r = 0; r < ribbonCount; r++) {
        ctx.beginPath();
        const baseElevation = height * (0.18 + r * 0.08);
        const mouseInfluence =
          (1 - Math.abs(mouseY - baseElevation) / height) * 35;
        const phase = time * (0.8 + r * 0.3) + r * 1.5;

        for (let x = 0; x <= width; x += 15) {
          const normX = x / width;
          const wave1 = Math.sin(normX * 4 + phase) * 28;
          const wave2 = Math.cos(normX * 2.5 - phase * 0.7) * 18;
          const mouseDisplace =
            Math.exp(-(((normX - mouseX / width) / 0.25) ** 2)) *
            mouseInfluence *
            Math.sin(phase * 1.5);
          const y = baseElevation + wave1 + wave2 + mouseDisplace;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "rgba(193, 95, 61, 0)");
        gradient.addColorStop(
          0.3,
          r === 0 ? "rgba(217, 119, 87, 0.12)" : "rgba(193, 95, 61, 0.08)",
        );
        gradient.addColorStop(
          0.5,
          r === 0 ? "rgba(232, 140, 111, 0.18)" : "rgba(217, 119, 87, 0.12)",
        );
        gradient.addColorStop(
          0.7,
          r === 0 ? "rgba(193, 95, 61, 0.12)" : "rgba(217, 119, 87, 0.06)",
        );
        gradient.addColorStop(1, "rgba(193, 95, 61, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5 - r * 0.5;
        ctx.stroke();
      }

      // 2. Draw subtle floating acoustic particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX + Math.sin(time * p.freq) * 0.3;
        p.y += p.speedY;

        // Wrap around
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        // Distance from cursor
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let alpha = p.alpha;
        if (dist < 180) {
          alpha += (1 - dist / 180) * 0.4;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217, 119, 87, ${alpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full opacity-70 dark:opacity-90"
    />
  );
}
