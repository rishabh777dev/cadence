"use client";

import {
  Apple,
  ChevronDown,
  Download,
  Lock,
  Monitor,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface DownloadOption {
  platform: string;
  arch: string;
  filename: string;
  url: string;
  icon: "apple" | "windows" | "linux";
}

export function Hero() {
  const [osName, setOsName] = useState<"mac" | "windows" | "linux">("mac");
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
        arch: "Apple Silicon (M1/M2/M3/M4)",
        filename: "Cadence-0.7.1-arm64.dmg",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        icon: "apple",
      },
      {
        platform: "macOS",
        arch: "Intel (x64)",
        filename: "Cadence-0.7.1-x64.dmg",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        icon: "apple",
      },
    ],
    windows: [
      {
        platform: "Windows",
        arch: "x64 (.exe Installer)",
        filename: "Cadence-Setup-0.7.1.exe",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        icon: "windows",
      },
    ],
    linux: [
      {
        platform: "Linux",
        arch: ".AppImage (x64)",
        filename: "Cadence-0.7.1.AppImage",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        icon: "linux",
      },
      {
        platform: "Linux",
        arch: ".deb (Debian/Ubuntu)",
        filename: "cadence_0.7.1_amd64.deb",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
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
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#E2DBD0] dark:border-[#2B2823] bg-white/70 dark:bg-[#1A1916]/70 shadow-2xs backdrop-blur-md mb-8 animate-fade-in">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C15F3D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C15F3D]"></span>
          </span>
          <span className="text-xs font-mono font-medium tracking-wide text-[#787368] dark:text-[#A19B8E] uppercase">
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
          instantly pastes wherever your cursor is.
          <span className="text-[#1A1815] dark:text-[#EDE9DF] font-medium">
            {" "}
            4X faster than typing
          </span>
          , with 100% offline local privacy or ultra-fast cloud AI.
        </p>

        {/* Primary CTA and Platform Selector */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto relative z-20">
          <div className="relative w-full sm:w-auto flex-1">
            <div className="flex rounded-2xl shadow-md border border-[#C15F3D]/20 overflow-hidden">
              <a
                href={primaryDownload.url}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 text-base font-semibold bg-[#C15F3D] hover:bg-[#AA4E2F] text-white transition-all text-center"
              >
                <Download className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="leading-tight">
                    Download for {primaryDownload.platform}
                  </div>
                  <div className="text-[11px] font-normal text-white/80 font-mono">
                    {primaryDownload.arch}
                  </div>
                </div>
              </a>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-3 bg-[#AA4E2F] hover:bg-[#8F3F24] text-white transition-colors border-l border-white/15 flex items-center justify-center"
                title="Choose another platform"
                aria-label="Choose another platform"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown for other platforms */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] rounded-2xl shadow-xl z-50 text-left space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#787368] dark:text-[#A19B8E]">
                  Select your architecture
                </div>
                {Object.entries(downloadOptions).flatMap(([os, opts]) =>
                  opts.map((opt, i) => (
                    <a
                      key={`${os}-${i}`}
                      href={opt.url}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#1A1815] dark:text-[#EDE9DF]"
                    >
                      <div className="flex items-center gap-2">
                        {opt.icon === "apple" ? (
                          <Apple className="w-4 h-4 text-[#787368]" />
                        ) : (
                          <Monitor className="w-4 h-4 text-[#787368]" />
                        )}
                        <span className="font-medium">{opt.platform}</span>
                        <span className="text-[#787368] dark:text-[#A19B8E] font-mono text-[10px]">
                          ({opt.arch})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#C15F3D]">
                        v0.7.1
                      </span>
                    </a>
                  )),
                )}
              </div>
            )}
          </div>

          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-medium rounded-2xl border border-[#E2DBD0] dark:border-[#2B2823] bg-white/70 dark:bg-[#1A1916]/70 hover:bg-white dark:hover:bg-[#1A1916] text-[#1A1815] dark:text-[#EDE9DF] transition-all shadow-2xs"
          >
            <Play className="w-4 h-4 text-[#C15F3D] fill-[#C15F3D]" />
            <span>Try Interactive Demo</span>
          </a>
        </div>

        {/* Trust & Guarantee Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Offline Local Whisper</span>
          </span>
          <span className="hidden sm:inline text-[#E2DBD0] dark:text-[#2B2823]">
            •
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Zero Audio Telemetry</span>
          </span>
          <span className="hidden sm:inline text-[#E2DBD0] dark:text-[#2B2823]">
            •
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C15F3D]" />
            <span>Free & Open Source</span>
          </span>
        </div>

        {/* Hero Visual Mockup: The Desktop App */}
        <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Outer glowing border card */}
          <div className="relative rounded-2xl sm:rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-[#E2DBD0] via-white/50 to-[#E2DBD0] dark:from-[#2B2823] dark:via-[#1A1916]/50 dark:to-[#2B2823] shadow-2xl border border-[#E2DBD0]/60 dark:border-[#2B2823]/60">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#16140F] shadow-inner">
              {/* Window Title Bar */}
              <div className="h-9 bg-[#1E1C16] border-b border-[#2B2823] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]/80" />
                </div>
                <div className="text-[11px] font-mono text-[#A19B8E] flex items-center gap-1.5">
                  <span>Cadence Voice Studio</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[9px] border border-emerald-800/40">
                    ONLINE • LOCAL MLX
                  </span>
                </div>
                <div className="w-12" />
              </div>

              {/* Main Demo Graphic */}
              <div className="relative">
                <Image
                  src="/home-page-demo.png"
                  alt="Cadence Voice Dictation Desktop Interface"
                  width={1920}
                  height={1080}
                  priority
                  className="w-full h-auto object-cover rounded-b-xl"
                />

                {/* Floating pill simulation: "Control + Space to dictate" */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-[#1A1916]/95 border border-[#C15F3D]/50 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C15F3D] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C15F3D]"></span>
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-[#A19B8E]">Listening...</span>
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-1 bg-[#C15F3D] rounded-full animate-wave-bar h-2"></span>
                      <span className="w-1 bg-[#C15F3D] rounded-full animate-wave-bar h-3.5 delay-75"></span>
                      <span className="w-1 bg-[#C15F3D] rounded-full animate-wave-bar h-1.5 delay-150"></span>
                      <span className="w-1 bg-[#C15F3D] rounded-full animate-wave-bar h-3 delay-200"></span>
                    </div>
                  </div>
                  <div className="h-3 w-px bg-white/20" />
                  <span className="text-[11px] font-mono text-[#A19B8E] hidden sm:inline">
                    Release key to paste
                  </span>
                  <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/10 rounded-md border border-white/20 text-[#EDE9DF]">
                    Ctrl + Space
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
