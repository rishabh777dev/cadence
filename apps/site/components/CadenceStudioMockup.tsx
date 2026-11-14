"use client";

import {
  Book,
  BookOpen,
  CircleHelp,
  Cpu,
  FileText,
  PanelLeftClose,
  PanelRightClose,
  Puzzle,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GithubIcon } from "./GithubIcon";

export function CadenceStudioMockup() {
  const [activeNav, setActiveNav] = useState("Transcriptions");
  const wavePathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate the terracotta waveform smoothly only when visible in viewport
  useEffect(() => {
    const node = wavePathRef.current;
    if (!node) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let rafId = 0;
    let isRunning = false;
    let isIntersecting = false;
    const start = performance.now();
    const W = 520;
    const H = 70;
    const N = 80;

    const draw = () => {
      if (!isIntersecting || document.hidden) {
        isRunning = false;
        return;
      }

      const t = (performance.now() - start) / 1000;
      // Organic breathing amplitude
      const amp =
        (0.65 + 0.35 * Math.sin(t * 1.6)) *
        (0.78 + 0.22 * Math.sin(t * 2.7 + 0.6));

      // Dynamic modulated peaks
      const pCenter = 0.95 + 0.12 * Math.sin(t * 4.0);
      const pMidL = 0.72 + 0.15 * Math.sin(t * 3.4 + 1.2);
      const pMidR = 0.72 + 0.15 * Math.cos(t * 3.7 + 0.8);
      const pOutL = 0.42 + 0.1 * Math.sin(t * 4.9 + 2.0);
      const pOutR = 0.42 + 0.1 * Math.cos(t * 4.5 + 1.7);

      const top: string[] = [];
      const bot: string[] = [];

      for (let i = 0; i <= N; i++) {
        const tt = i / N;
        const x = (tt * W).toFixed(1);

        // Gaussian lobe synthesis
        const gCenter = Math.exp(-(((tt - 0.5) / 0.095) ** 2)) * pCenter;
        const gMidL = Math.exp(-(((tt - 0.33) / 0.075) ** 2)) * pMidL;
        const gMidR = Math.exp(-(((tt - 0.67) / 0.075) ** 2)) * pMidR;
        const gOutL = Math.exp(-(((tt - 0.18) / 0.055) ** 2)) * pOutL;
        const gOutR = Math.exp(-(((tt - 0.82) / 0.055) ** 2)) * pOutR;

        const baseFloor = 0.08 * Math.sin(Math.PI * tt);
        const combined = Math.max(
          baseFloor,
          gCenter + gMidL + gMidR + gOutL + gOutR,
        );

        const taper = Math.sin(Math.PI * tt) ** 1.2;
        const h = Math.max(0.6, H * 0.44 * amp * combined * taper);

        top.push(`${x},${(H / 2 - h).toFixed(2)}`);
        bot.unshift(`${x},${(H / 2 + h).toFixed(2)}`);
      }

      node.setAttribute("d", `M ${top.join(" L ")} L ${bot.join(" L ")} Z`);
      rafId = requestAnimationFrame(draw);
    };

    const startAnimation = () => {
      if (!isRunning && isIntersecting && !document.hidden) {
        isRunning = true;
        rafId = requestAnimationFrame(draw);
      }
    };

    const stopAnimation = () => {
      if (isRunning) {
        cancelAnimationFrame(rafId);
        isRunning = false;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0.05 },
    );

    const el = containerRef.current || node;
    observer.observe(el);

    const handleVisibility = () => {
      if (document.hidden) {
        stopAnimation();
      } else if (isIntersecting) {
        startAnimation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopAnimation();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const navItems = [
    { name: "Transcriptions", icon: BookOpen, shortcut: "Ctrl+1" },
    { name: "Vocabulary", icon: Book, shortcut: "Ctrl+2" },
    { name: "Shortcuts", icon: Zap, shortcut: "Ctrl+3" },
    { name: "Tone", icon: FileText, shortcut: "Ctrl+4" },
    { name: "Magic Edit", icon: Sparkles, shortcut: "Ctrl+5" },
    { name: "Models", icon: Cpu, shortcut: "Ctrl+6" },
    { name: "Plugins", icon: Puzzle, shortcut: "Ctrl+7" },
  ];

  // Heatmap generation matching the screenshot activity pattern
  // 7 rows (days of week) x 14 columns (weeks)
  const heatmapCols = 14;
  const heatmapRows = 7;
  const getActivityLevel = (col: number, row: number) => {
    // September active streak around columns 5-8
    if (col === 5 && (row === 1 || row === 2 || row === 3 || row === 4))
      return 3;
    if (col === 6 && (row === 0 || row === 1 || row === 2 || row === 3))
      return 4;
    if (col === 6 && (row === 4 || row === 5)) return 2;
    if (col === 7 && (row === 2 || row === 3 || row === 4)) return 3;
    if (col === 7 && row === 5) return 2;
    if (col === 8 && row === 3) return 1;
    if (col === 4 && row === 2) return 1;
    return 0;
  };

  const activityColors = [
    "bg-[#1A1815]", // Level 0: Inactive
    "bg-[#6B3420]", // Level 1: Low
    "bg-[#9E472A]", // Level 2: Medium
    "bg-[#C15F3D]", // Level 3: High
    "bg-[#E88C6F]", // Level 4: Max
  ];

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl md:rounded-3xl border border-[#3A332B] bg-[#12110F] text-[#EDE9DF] shadow-2xl overflow-hidden font-sans select-none text-left"
    >
      {/* 1. Window Chrome Header */}
      <div className="h-10 px-3 sm:px-4 bg-[#181614] border-b border-[#28241F] flex items-center justify-between">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-14 sm:w-24 shrink-0">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56] shadow-xs" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E] shadow-xs" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F] shadow-xs" />
        </div>

        {/* Center Title & Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono truncate">
          <span className="text-[#A19B8E] font-medium hidden sm:inline">
            Cadence Voice Studio
          </span>
          <span className="text-[#4E4942] hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[9px] sm:text-[10px] font-semibold border border-emerald-700/40 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE • LOCAL MLX</span>
          </span>
        </div>

        {/* Window Controls / Version Tag */}
        <div className="w-14 sm:w-24 text-right shrink-0">
          <span className="text-[9px] sm:text-[10px] font-mono text-[#787368] px-1.5 sm:px-2 py-0.5 rounded-md bg-[#211E1A] border border-[#2D2924]">
            v0.7.1
          </span>
        </div>
      </div>

      {/* 2. Main Studio Body: 3-Column Layout */}
      <div className="flex min-h-[580px] md:min-h-[640px] max-h-[800px] overflow-hidden">
        {/* ================= COLUMN 1: LEFT SIDEBAR ================= */}
        <div className="w-48 lg:w-56 shrink-0 bg-[#141210] border-r border-[#24201A] p-3 flex flex-col justify-between hidden md:flex">
          {/* Top Brand Header */}
          <div>
            <div className="flex items-center justify-between px-2 py-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#241F1A] border border-[#3D3328] flex items-center justify-center p-0.5">
                  <Image
                    src="/cadence-logo-square.png"
                    alt="Logo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <span className="font-serif text-lg font-normal tracking-tight text-[#EDE9DF]">
                  Cadence
                </span>
              </div>
              <button
                type="button"
                className="p-1 rounded-md text-[#787368] hover:text-[#EDE9DF] hover:bg-[#201D19] transition-colors"
                title="Toggle Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#2A211B] text-[#EDE9DF] border border-[#443126] shadow-xs"
                        : "text-[#8E877B] hover:text-[#EDE9DF] hover:bg-[#1C1915]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-[#D97757]" : "text-[#787368]"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        isActive ? "text-[#D97757]" : "text-[#58534C]"
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Settings & Sign in Box */}
          <div className="space-y-3 pt-3 border-t border-[#221F1A]">
            <div className="space-y-1">
              <button
                type="button"
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#8E877B] hover:text-[#EDE9DF] hover:bg-[#1C1915] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[#787368]" />
                  <span>Settings</span>
                </div>
                <span className="text-[10px] font-mono text-[#58534C]">
                  Ctrl+8
                </span>
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#8E877B] hover:text-[#EDE9DF] hover:bg-[#1C1915] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CircleHelp className="w-4 h-4 text-[#787368]" />
                  <span>Help</span>
                </div>
                <span className="text-[10px] font-mono text-[#58534C]">
                  Ctrl+9
                </span>
              </button>
            </div>

            {/* Cadence Transcribe Mini-Card */}
            <div className="p-3 rounded-2xl bg-[#1C1915] border border-[#2D2821] text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#EDE9DF] mb-1">
                <span className="w-2 h-2 rounded-full border border-[#D97757] bg-[#D97757]/30" />
                <span>Cadence Transcribe</span>
              </div>
              <p className="text-[11px] text-[#787368] leading-tight mb-2.5">
                Fast, accurate transcription, no API key required.
              </p>
              <button
                type="button"
                className="w-full py-1.5 px-2.5 rounded-xl bg-[#28231D] hover:bg-[#342D25] border border-[#3A3228] text-xs font-medium text-[#D97757] flex items-center justify-center gap-1 transition-colors"
              >
                <span>&rarr;]</span>
                <span>Sign in</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: CENTER CANVAS ================= */}
        <div className="flex-1 bg-[#100E0C] p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Listening Tutorial Hero Card */}
          <div className="relative rounded-2xl md:rounded-3xl border border-[#332A22] bg-[#191613]/90 backdrop-blur-md p-4 sm:p-7 text-center shadow-lg">
            <button
              type="button"
              className="absolute top-3.5 right-3.5 p-1 text-[#6E685F] hover:text-[#EDE9DF] transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Instruction Headline */}
            <div className="text-lg sm:text-2xl md:text-3xl font-serif italic font-normal text-[#EDE9DF] tracking-tight mb-3 sm:mb-4">
              Press{" "}
              <span className="inline-flex items-center align-middle mx-0.5 sm:mx-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#24201A] border border-[#40352A] shadow-xs text-[11px] sm:text-xs font-mono not-italic text-[#EDE9DF] font-semibold">
                Ctrl
              </span>{" "}
              <span className="inline-flex items-center align-middle mx-0.5 sm:mx-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-[#24201A] border border-[#40352A] shadow-xs text-[11px] sm:text-xs font-mono not-italic text-[#EDE9DF] font-semibold">
                ␣
              </span>{" "}
              , speak, release.
            </div>

            {/* Listening Wave Capsule */}
            <div className="max-w-md mx-auto rounded-full border border-[#4A382A] bg-[#141210]/95 px-3 sm:px-6 py-2 sm:py-3 shadow-inner">
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97757] animate-ping" />
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-[#D97757] uppercase font-bold">
                  ● LISTENING..
                </span>
              </div>

              {/* Fluid Terracotta Waveform SVG */}
              <div className="h-8 sm:h-10 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 520 70"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                  aria-label="Voice waveform"
                  role="img"
                >
                  <title>Live Audio Waveform</title>
                  <path
                    ref={wavePathRef}
                    fill="#D97757"
                    fillOpacity="0.95"
                    stroke="none"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar & Filter Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-[#171512] border border-[#2B2620] text-xs text-[#787368]">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6E685F] shrink-0" />
                <span className="text-[#6E685F] text-[11px] sm:text-xs truncate">
                  Search 793 transcripts...
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#58534C] px-1.5 py-0.5 rounded bg-[#211E19] border border-[#2E2922] shrink-0">
                Ctrl+K
              </span>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#171512] hover:bg-[#201D18] border border-[#2B2620] text-xs text-[#A19B8E] transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#787368]" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Timeline Date Divider */}
          <div className="text-[11px] font-mono text-[#6E685F] pt-1">
            Wed, Sep 23
          </div>

          {/* Transcription Cards */}
          <div className="space-y-3 sm:space-y-3.5">
            {/* Card 1 */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-[#151310] border border-[#2B261F] hover:border-[#3D3328] transition-all text-left">
              <div className="flex flex-wrap items-center justify-between text-xs font-mono text-[#787368] mb-2 sm:mb-2.5 gap-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[#A19B8E] font-medium">6:46 pm</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#241F1A] border border-[#382E24] text-[10px] text-[#D97757]">
                    voice-instruction
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1C1A16] border border-[#2B2620] text-[10px] text-[#8E877B] hidden sm:inline">
                    gpt-oss-120b
                  </span>
                </div>
                <span className="text-[11px] text-[#6E685F]">1.5s</span>
              </div>
              <p className="font-serif text-sm sm:text-base leading-relaxed text-[#D6D0C4] font-normal">
                &ldquo;Dear Me, I acknowledge that I am currently feeling
                uncertain, and I accept that I do not have all the answers at
                this moment. I will take a moment to breathe, identify the
                aspects that are clear, and break the unknowns into small,
                manageable steps. I will seek guidance where appropriate, trust
                that each effort contributes to my learning, and remind myself
                that uncertainty is a natural component of growth. I have
                successfully navigated challenges in the past and emerged
                stronger; I am confident that I will do the same now. I will
                continue to move forward, one step at a time. Sincerely, [Your
                Name]&rdquo;
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#151310] border border-[#2B261F] hover:border-[#3D3328] transition-all text-left">
              <div className="flex items-center justify-between text-xs font-mono text-[#787368] mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[#A19B8E] font-medium">6:45 pm</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#241F1A] border border-[#382E24] text-[10px] text-[#D97757]">
                    voice-instruction
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1C1A16] border border-[#2B2620] text-[10px] text-[#8E877B] hidden sm:inline">
                    gpt-oss-120b
                  </span>
                </div>
                <span className="text-[11px] text-[#6E685F]">4.2s</span>
              </div>
              <p className="font-serif text-sm sm:text-base leading-relaxed text-[#D6D0C4] font-normal">
                &ldquo;Dear Me, I know I&apos;m feeling lost right now and
                it&apos;s okay to admit that I don&apos;t have all the answers.
                I&apos;ll take a moment to breathe, list the things that are
                clear, and break the unknowns into small, manageable steps.
                I&apos;ll reach out for guidance where I can, trust that
                I&apos;m learning with each attempt, and remind myself that
                uncertainty is a natural part of growth. I&apos;ve faced
                challenges before and come out stronger—this time will be no
                different. Keep moving forward, one step at a time. Sincerely,
                [Your Name]&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: RIGHT STATS & HEATMAP ================= */}
        <div className="w-60 lg:w-72 shrink-0 bg-[#141210] border-l border-[#24201A] p-4 flex flex-col justify-between hidden xl:flex">
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-end gap-2 text-[#787368]">
              <a
                href="https://github.com/rishabh777dev/cadence"
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:text-[#EDE9DF] transition-colors"
                title="Cadence GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <button
                type="button"
                className="p-1 hover:text-[#EDE9DF] transition-colors"
                title="Toggle Right Panel"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* WPM Big Metric */}
            <div className="p-4 rounded-2xl bg-[#181613] border border-[#2A241E]">
              <div className="font-serif text-3xl lg:text-4xl font-normal text-[#EDE9DF] leading-none mb-1">
                119
              </div>
              <div className="text-xs text-[#A19B8E] font-medium">
                Words per minute
              </div>
              <div className="text-[10px] font-mono text-[#6E685F]">
                All time
              </div>
            </div>

            {/* Split Metrics: Words & AI Fixes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#181613] border border-[#2A241E]">
                <div className="font-serif text-xl font-normal text-[#EDE9DF] leading-none mb-1">
                  23,421
                </div>
                <div className="text-[11px] text-[#A19B8E]">Words</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181613] border border-[#2A241E]">
                <div className="font-serif text-xl font-normal text-[#EDE9DF] leading-none mb-1">
                  14,165
                </div>
                <div className="text-[11px] text-[#A19B8E]">AI fixes</div>
              </div>
            </div>

            {/* Heatmap Card */}
            <div className="p-4 rounded-2xl bg-[#181613] border border-[#2A241E]">
              <div className="text-xs font-semibold text-[#A19B8E] mb-3">
                Daily activity
              </div>

              {/* Month Header */}
              <div className="flex justify-between text-[10px] font-mono text-[#6E685F] px-4 mb-1.5">
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
              </div>

              {/* Day Labels + Grid */}
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[9px] font-mono text-[#58534C] py-0.5">
                  <span>M</span>
                  <span>W</span>
                  <span>F</span>
                </div>

                {/* Heatmap Grid */}
                <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1">
                  {Array.from({ length: heatmapCols }).map((_, c) =>
                    Array.from({ length: heatmapRows }).map((_, r) => {
                      const level = getActivityLevel(c, r);
                      return (
                        <div
                          key={`cell-${c}-${r}`}
                          className={`w-2.5 h-2.5 rounded-[2px] ${activityColors[level]} transition-colors hover:ring-1 hover:ring-[#D97757]`}
                          title={`Week ${c + 1}, Day ${r + 1}`}
                        />
                      );
                    }),
                  )}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] font-mono text-[#6E685F]">
                <span>Less</span>
                <div className="flex gap-1">
                  {activityColors.map((color, i) => (
                    <div
                      key={`legend-${i}`}
                      className={`w-2 h-2 rounded-[2px] ${color}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="text-[10px] font-mono text-[#58534C] text-center pt-2 border-t border-[#221F1A]">
            100% On-device storage • encrypted
          </div>
        </div>
      </div>
    </div>
  );
}
