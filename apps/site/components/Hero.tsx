"use client";

import { Download, Lock, Play, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLatestRelease } from "@/lib/useLatestRelease";
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
  const release = useLatestRelease();

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
        filename: `Cadence-${release.version}.dmg`,
        url: "/api/download?platform=mac&format=dmg",
        icon: "apple",
      },
      {
        platform: "macOS",
        arch: "ARM64 (.zip)",
        filename: `Cadence-${release.version}-arm64.zip`,
        url: "/api/download?platform=mac&format=zip",
        icon: "apple",
      },
    ],
    windows: [
      {
        platform: "Windows",
        arch: "x64 (.exe Installer)",
        filename: `Cadence-${release.version}-setup.exe`,
        url: "/api/download?platform=windows",
        icon: "windows",
      },
    ],
    linux: [
      {
        platform: "Linux",
        arch: ".AppImage (x64)",
        filename: `Cadence-${release.version}.AppImage`,
        url: "/api/download?platform=linux&format=appimage",
        icon: "linux",
      },
      {
        platform: "Linux",
        arch: ".deb (Debian/Ubuntu)",
        filename: `Cadence-${release.version}.deb`,
        url: "/api/download?platform=linux&format=deb",
        icon: "linux",
      },
    ],
  };

  const primaryDownload = downloadOptions[osName][0];

  const handleDownloadClick = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#C15F3D", "#D97757", "#E88C6F", "#F6EBE5", "#FBBF24"],
      });
    } catch {
      // Ignore if dynamic import fails
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] md:w-[1000px] md:h-[600px] bg-radial from-[#C15F3D]/14 via-[#C15F3D]/5 to-transparent blur-3xl pointer-events-none -z-10 animate-pulse duration-1000" />

      {/* Decorative grain subtle overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release / Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#E2DBD0] dark:border-[#2B2823] bg-white/80 dark:bg-[#1A1916]/80 shadow-2xs backdrop-blur-md mb-8 hover:scale-105 transition-transform"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C15F3D] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C15F3D]" />
          </span>
          <span className="text-xs font-medium tracking-wide text-[#787368] dark:text-[#A19B8E]">
            Cadence {release.tag} is live
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
        </motion.div>

        {/* Main Headline with Staggered Kinetic Animation */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-[#1A1815] dark:text-[#EDE9DF] max-w-5xl mx-auto leading-[1.1] sm:leading-[1.08]"
        >
          Speak naturally. <br className="hidden sm:inline" />
          <span className="font-serif italic font-normal text-[#C15F3D] dark:text-[#D97757] relative inline-block">
            It writes beautifully.
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
              className="absolute -bottom-2 left-0 w-full h-3 text-[#C15F3D]/30 dark:text-[#D97757]/40"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <title>Decorative curve</title>
              <path
                d="M3 9C80 3 220 3 297 9"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </motion.svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="mt-6 sm:mt-7 text-base sm:text-xl md:text-2xl text-[#787368] dark:text-[#A19B8E] max-w-3xl mx-auto font-normal leading-relaxed px-2"
        >
          Hold down your hotkey, speak naturally, and clean, punctuated text
          instantly pastes wherever your cursor is.{" "}
          <span className="text-[#1A1815] dark:text-[#EDE9DF] font-medium">
            4X faster than typing
          </span>
          , with 100% offline local privacy or ultra-fast cloud AI.
        </motion.p>

        {/* Primary CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 relative z-20 w-full max-w-md sm:max-w-none mx-auto"
        >
          <a
            href={primaryDownload.url}
            onClick={handleDownloadClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold rounded-full bg-[#C15F3D] hover:bg-[#AA4E2F] text-white shadow-lg hover:shadow-xl hover:shadow-[#C15F3D]/20 transition-all hover:scale-[1.03] active:scale-[0.97] group"
          >
            <Download className="w-5 h-5 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            <span>Download for {primaryDownload.platform}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono text-white">
              {release.tag}
            </span>
          </a>

          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-medium rounded-full border border-[#E2DBD0] dark:border-[#2B2823] bg-white/80 dark:bg-[#1A1916]/80 hover:bg-white dark:hover:bg-[#1A1916] text-[#1A1815] dark:text-[#EDE9DF] shadow-xs hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <Play className="w-4 h-4 text-[#C15F3D] fill-[#C15F3D] group-hover:scale-110 transition-transform" />
            <span>Try Interactive Demo</span>
          </a>
        </motion.div>

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
        <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[#787368] dark:text-[#A19B8E]">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/70 dark:bg-[#1A1916]/70 border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-[#1A1815] dark:text-[#EDE9DF] text-[11px] sm:text-xs">
              100% On-Device Whisper
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/70 dark:bg-[#1A1916]/70 border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium text-[#1A1815] dark:text-[#EDE9DF] text-[11px] sm:text-xs">
              Zero Audio Telemetry
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/70 dark:bg-[#1A1916]/70 border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C15F3D] shrink-0" />
            <span className="font-medium text-[#1A1815] dark:text-[#EDE9DF] text-[11px] sm:text-xs">
              Free & Open Source
            </span>
          </div>
        </div>

        {/* Studio Mockup Window */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 sm:mt-16 md:mt-20 relative max-w-5xl mx-auto"
        >
          {/* Ambient Acoustic Glow behind window */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#C15F3D]/20 via-amber-500/10 to-[#C15F3D]/20 rounded-3xl blur-2xl opacity-50 pointer-events-none -z-10" />

          {/* Clean Flat Window Container */}
          <section
            aria-label="Cadence Desktop Window Mockup"
            className="relative rounded-2xl sm:rounded-3xl p-1 sm:p-2 md:p-2.5 bg-gradient-to-b from-[#2B2823] via-[#1A1916] to-[#2B2823] shadow-2xl border border-[#C15F3D]/30 overflow-hidden"
          >
            <CadenceStudioMockup />
          </section>
        </motion.div>
      </div>
    </section>
  );
}
