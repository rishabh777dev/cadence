"use client";

import { Download, Lock, Play, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { CadenceStudioMockup } from "./CadenceStudioMockup";

interface DownloadOption {
  platform: string;
  arch: string;
  filename: string;
  url: string;
  icon: "apple" | "windows" | "linux";
}

export function Hero() {
  const [osName, setOsName] = useState<"mac" | "windows" | "linux">("mac");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("win")) setOsName("windows");
      else if (ua.includes("linux")) setOsName("linux");
      else setOsName("mac");
    }
  }, []);

  const downloadOptions: Record<string, DownloadOption[]> = {
    mac: [
      {
        platform: "macOS",
        arch: "Apple Silicon & Intel (.dmg)",
        filename: "Cadence-0.7.1.dmg",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.dmg",
        icon: "apple",
      },
      {
        platform: "macOS",
        arch: "ARM64 (.zip)",
        filename: "Cadence-0.7.1-arm64.zip",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1-arm64.zip",
        icon: "apple",
      },
    ],
    windows: [
      {
        platform: "Windows",
        arch: "x64 (.exe Installer)",
        filename: "Cadence-0.7.1-setup.exe",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1-setup.exe",
        icon: "windows",
      },
    ],
    linux: [
      {
        platform: "Linux",
        arch: ".AppImage (x64)",
        filename: "Cadence-0.7.1.AppImage",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.AppImage",
        icon: "linux",
      },
      {
        platform: "Linux",
        arch: ".deb (Debian/Ubuntu)",
        filename: "Cadence-0.7.1.deb",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.deb",
        icon: "linux",
      },
    ],
  };

  const primaryDownload = downloadOptions[osName][0];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] md:w-[900px] md:h-[550px] bg-radial from-[#C15F3D]/12 via-[#C15F3D]/4 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Decorative grain/grid subtle overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release / Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#E2DBD0] dark:border-[#2B2823] bg-white/80 dark:bg-[#1A1916]/80 shadow-2xs backdrop-blur-md mb-8 animate-fade-in">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C15F3D] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C15F3D]" />
          </span>
          <span className="text-xs font-medium tracking-wide text-[#787368] dark:text-[#A19B8E]">
            Cadence v0.7.1 is live
          </span>
          <span className="text-xs text-[#E2DBD0] dark:text-[#2B2823]">|</span>
          <a
            href="https://github.com/rishabh777dev/cadence/releases"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-[#C15F3D] dark:text-[#D97757] hover:underline flex items-center gap-1"
          >
            <span>What's new</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-[#1A1815] dark:text-[#EDE9DF] max-w-5xl mx-auto leading-[1.08]">
          Speak naturally. <br className="hidden sm:inline" />
          <span className="font-serif italic font-normal text-[#C15F3D] dark:text-[#D97757] relative">
            It writes beautifully.
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#C15F3D]/25 dark:text-[#D97757]/30"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <title>Decorative curve</title>
              <path
                d="M3 9C80 3 220 3 297 9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-7 text-lg sm:text-xl md:text-2xl text-[#787368] dark:text-[#A19B8E] max-w-3xl mx-auto font-normal leading-relaxed">
          Hold down your hotkey, speak naturally, and clean, punctuated text
          instantly pastes wherever your cursor is.{" "}
          <span className="text-[#1A1815] dark:text-[#EDE9DF] font-medium">
            4X faster than typing
          </span>
          , with 100% offline local privacy or ultra-fast cloud AI.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
          <a
            href={primaryDownload.url}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold rounded-full bg-[#C15F3D] hover:bg-[#AA4E2F] text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Download className="w-5 h-5 shrink-0" />
            <span>Download for {primaryDownload.platform}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono text-white">
              v0.7.1
            </span>
          </a>

          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-medium rounded-full border border-[#E2DBD0] dark:border-[#2B2823] bg-white/80 dark:bg-[#1A1916]/80 hover:bg-white dark:hover:bg-[#1A1916] text-[#1A1815] dark:text-[#EDE9DF] shadow-xs hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Play className="w-4 h-4 text-[#C15F3D] fill-[#C15F3D]" />
            <span>Try Interactive Demo</span>
          </a>
        </div>

        {/* Alternate OS Link */}
        <div className="mt-4 text-xs text-[#787368] dark:text-[#A19B8E]">
          <span>Also available for </span>
          <a
            href="#download"
            className="underline underline-offset-4 hover:text-[#C15F3D] transition-colors font-medium"
          >
            macOS, Windows, Linux & Mobile &rarr;
          </a>
        </div>

        {/* Clean Trust & Guarantee Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-[#787368] dark:text-[#A19B8E]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#1A1916]/70 border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-[#1A1815] dark:text-[#EDE9DF]">
              100% On-Device Whisper
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#1A1916]/70 border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-[#1A1815] dark:text-[#EDE9DF]">
              Zero Audio Telemetry
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#1A1916]/70 border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C15F3D]" />
            <span className="font-medium text-[#1A1815] dark:text-[#EDE9DF]">
              Free & Open Source
            </span>
          </div>
        </div>

        {/* Hero Visual Mockup: The Desktop App */}
        <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Ambient Glow behind window */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#C15F3D]/25 via-amber-500/10 to-[#C15F3D]/20 rounded-3xl blur-2xl opacity-60 pointer-events-none -z-10" />

          {/* Outer glowing border card */}
          <div className="relative rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 bg-gradient-to-b from-[#2B2823] via-[#1A1916] to-[#2B2823] shadow-2xl border border-[#C15F3D]/30">
            <CadenceStudioMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
