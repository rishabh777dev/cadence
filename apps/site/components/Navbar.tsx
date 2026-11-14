"use client";

import { Download, Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLatestRelease } from "@/lib/useLatestRelease";
import { GithubIcon } from "./GithubIcon";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [osName, setOsName] = useState<"mac" | "windows" | "linux">("mac");

  useEffect(() => {
    let lastScrolled = false;
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Detect OS
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes("win")) setOsName("windows");
      else if (userAgent.includes("linux")) setOsName("linux");
      else setOsName("mac");
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const latestRelease = useLatestRelease();
  const directDownloadUrl = `/api/download?platform=${osName}`;

  const handleMobileNav = (hash: string) => {
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.location.hash = hash;
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF7F2]/85 dark:bg-[#11100E]/85 backdrop-blur-md border-b border-[#E2DBD0] dark:border-[#2B2823] shadow-xs"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-[#E2DBD0] dark:border-[#2B2823] bg-white dark:bg-[#1A1916] p-1 flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/cadence-logo-square.png"
                alt="Cadence Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-semibold tracking-tight text-[#1A1815] dark:text-[#EDE9DF]">
                  Cadence
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] dark:bg-[#D97757]/15 dark:text-[#D97757] font-medium">
                  {latestRelease.tag}
                </span>
              </div>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#787368] dark:text-[#A19B8E]">
            <a
              href="#demo"
              className="hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors flex items-center gap-1"
            >
              <span>Playground</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C15F3D] animate-pulse" />
            </a>
            <a
              href="#features"
              className="hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors"
            >
              Features
            </a>
            <a
              href="#magic-edit"
              className="hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors"
            >
              Magic Edit
            </a>
            <a
              href="#compare"
              className="hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors"
            >
              Compare
            </a>
            <a
              href="#shortcuts"
              className="hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors"
            >
              Shortcuts
            </a>
            <a
              href="#faq"
              className="hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://github.com/rishabh777dev/cadence"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E2DBD0] dark:border-[#2B2823] bg-white/60 dark:bg-[#1A1916]/60 text-[#1A1815] dark:text-[#EDE9DF] hover:bg-white dark:hover:bg-[#1A1916] transition-colors shadow-2xs"
            >
              <GithubIcon className="w-3.5 h-3.5 text-[#787368]" />
              <span>GitHub</span>
              <span className="text-[#C15F3D] font-bold">★ Open Source</span>
            </a>

            <a
              href={directDownloadUrl}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[#C15F3D] hover:bg-[#AA4E2F] text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>
                Download for{" "}
                {osName === "mac"
                  ? "macOS"
                  : osName === "windows"
                    ? "Windows"
                    : "Linux"}
              </span>
            </a>
          </div>

          {/* Mobile & Tablet hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <a
              href={directDownloadUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C15F3D] text-white shadow-xs"
              title="Download Cadence"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Download</span>
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-[#E2DBD0] dark:border-[#2B2823] text-[#1A1815] dark:text-[#EDE9DF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 bg-[#FAF7F2] dark:bg-[#11100E] border-b border-[#E2DBD0] dark:border-[#2B2823] space-y-3 shadow-lg">
          <nav className="flex flex-col gap-1 text-base font-medium text-[#787368] dark:text-[#A19B8E] pt-2 text-left">
            <button
              type="button"
              onClick={() => handleMobileNav("#demo")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between"
            >
              <span>Interactive Playground</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C15F3D]/10 text-[#C15F3D]">
                Live
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav("#features")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
            >
              Features & Architecture
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav("#magic-edit")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
            >
              Magic Edit
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav("#compare")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
            >
              Compare with Wispr & Superwhisper
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav("#shortcuts")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
            >
              Shortcuts
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav("#download")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-[#C15F3D] text-left"
            >
              Download App (
              {osName === "mac"
                ? "macOS"
                : osName === "windows"
                  ? "Windows"
                  : "Linux"}
              )
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav("#faq")}
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
            >
              FAQ
            </button>
          </nav>
          <div className="pt-3 border-t border-[#E2DBD0] dark:border-[#2B2823] flex flex-col gap-2">
            <a
              href="https://github.com/rishabh777dev/cadence"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-mono rounded-lg border border-[#E2DBD0] dark:border-[#2B2823] bg-white/60 dark:bg-[#1A1916]/60 text-[#1A1815] dark:text-[#EDE9DF]"
            >
              <GithubIcon className="w-4 h-4 text-[#787368]" />
              <span>GitHub Repository ({latestRelease.tag})</span>
              <span className="text-[#C15F3D] font-bold">★ Open Source</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
