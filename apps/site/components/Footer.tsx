"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useLatestRelease } from "@/lib/useLatestRelease";
import { GithubIcon } from "./GithubIcon";

export function Footer() {
  const release = useLatestRelease();
  return (
    <footer className="border-t border-[#E2DBD0] dark:border-[#2B2823] bg-[#F5EFE6]/60 dark:bg-[#11100E] text-xs text-[#787368] dark:text-[#A19B8E] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-12">
          {/* Brand info */}
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#E2DBD0] dark:border-[#2B2823] bg-white dark:bg-[#1A1916] p-1 flex items-center justify-center">
                <Image
                  src="/cadence-logo-square.png"
                  alt="Cadence"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-serif text-2xl font-semibold tracking-tight text-[#1A1815] dark:text-[#EDE9DF]">
                Cadence
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Local-first AI voice dictation and magic text editing for macOS,
              Windows, and Linux. Speak 4X faster with total privacy.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All systems operational • {release.tag}</span>
            </div>
          </div>

          {/* Downloads Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#1A1815] dark:text-[#EDE9DF] font-semibold mb-4">
              Downloads
            </h4>
            <ul className="space-y-2.5 font-sans text-sm">
              <li>
                <a
                  href="#download"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  macOS Apple Silicon (arm64)
                </a>
              </li>
              <li>
                <a
                  href="#download"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  macOS Intel (x64)
                </a>
              </li>
              <li>
                <a
                  href="#download"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Windows Installer (.exe)
                </a>
              </li>
              <li>
                <a
                  href="#download"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Linux AppImage & .deb
                </a>
              </li>
              <li>
                <a
                  href="#download"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Mobile Companion Beta
                </a>
              </li>
            </ul>
          </div>

          {/* Product & Architecture */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#1A1815] dark:text-[#EDE9DF] font-semibold mb-4">
              Capabilities
            </h4>
            <ul className="space-y-2.5 font-sans text-sm">
              <li>
                <a
                  href="#demo"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Interactive Voice Playground
                </a>
              </li>
              <li>
                <a
                  href="#magic-edit"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Magic Edit (Rewrite in-place)
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Local Whisper.cpp & Apple MLX
                </a>
              </li>
              <li>
                <a
                  href="#compare"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Compare vs Wispr Flow
                </a>
              </li>
              <li>
                <a
                  href="#shortcuts"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Global Shortcuts & Remapping
                </a>
              </li>
            </ul>
          </div>

          {/* Open Source & Community */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#1A1815] dark:text-[#EDE9DF] font-semibold mb-4">
              Open Source
            </h4>
            <ul className="space-y-2.5 font-sans text-sm">
              <li>
                <a
                  href="https://github.com/rishabh777dev/cadence"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C15F3D] transition-colors flex items-center gap-1.5"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rishabh777dev/cadence/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Releases & Changelog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rishabh777dev/cadence/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rishabh777dev/cadence/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C15F3D] transition-colors"
                >
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E2DBD0] dark:border-[#2B2823] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div>
            © {new Date().getFullYear()} Cadence Voice. Distributed under the
            permissive MIT License.
          </div>
          <div className="flex items-center gap-1 text-[#787368] dark:text-[#A19B8E]">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#C15F3D] fill-[#C15F3D]" />
            <span>for frictionless human thought</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
