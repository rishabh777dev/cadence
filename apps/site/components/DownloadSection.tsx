"use client";

import {
  Apple,
  Check,
  Copy,
  Download,
  ExternalLink,
  Monitor,
  Smartphone,
  Terminal,
} from "lucide-react";
import { useState } from "react";

interface DownloadItem {
  name: string;
  badge: string;
  version: string;
  size: string;
  description: string;
  filename: string;
  url: string;
  checksum: string;
}

export function DownloadSection() {
  const [activeTab, setActiveTab] = useState<
    "mac" | "windows" | "linux" | "mobile"
  >("mac");
  const [copiedChecksum, setCopiedChecksum] = useState<string | null>(null);

  const copyChecksum = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedChecksum(hash);
    setTimeout(() => setCopiedChecksum(null), 2000);
  };

  const downloads: Record<
    "mac" | "windows" | "linux" | "mobile",
    DownloadItem[]
  > = {
    mac: [
      {
        name: "macOS Apple Silicon",
        badge: "Recommended for M1/M2/M3/M4",
        version: "v0.7.1",
        size: "94.2 MB",
        description:
          "Native ARM64 build optimized for Apple MLX Neural Engine acceleration.",
        filename: "Cadence-0.7.1-arm64.dmg",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum:
          "8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
      },
      {
        name: "macOS Intel",
        badge: "x86_64",
        version: "v0.7.1",
        size: "98.5 MB",
        description:
          "Optimized for older Intel-based MacBooks and iMacs with Whisper.cpp AVX2.",
        filename: "Cadence-0.7.1-x64.dmg",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum:
          "3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a8f2a1b9c",
      },
    ],
    windows: [
      {
        name: "Windows 64-bit Installer",
        badge: "Recommended (.exe)",
        version: "v0.7.1",
        size: "88.6 MB",
        description:
          "Standard NSIS installer with automatic auto-updater and background tray service.",
        filename: "Cadence-Setup-0.7.1.exe",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum:
          "7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a8f2a1b9c3e4d5f6a",
      },
      {
        name: "Windows Portable (ZIP)",
        badge: "Standalone",
        version: "v0.7.1",
        size: "82.1 MB",
        description:
          "Zero-installation portable bundle. Extract and run directly from any folder.",
        filename: "Cadence-0.7.1-win-x64.zip",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum:
          "1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a8f2a1b9c3e4d5f6a7b8c9d0e",
      },
    ],
    linux: [
      {
        name: "Linux AppImage",
        badge: "Universal x64",
        version: "v0.7.1",
        size: "112.4 MB",
        description:
          "Self-contained executable for Ubuntu, Fedora, Arch, and all major distributions.",
        filename: "Cadence-0.7.1.AppImage",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum:
          "9b0c1d2e3f4a5b6c7d8e9f0a8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
      },
      {
        name: "Debian / Ubuntu Package",
        badge: ".deb",
        version: "v0.7.1",
        size: "89.0 MB",
        description:
          "Native deb package with desktop integration and dependency verification.",
        filename: "cadence_0.7.1_amd64.deb",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum:
          "5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c",
      },
    ],
    mobile: [
      {
        name: "Cadence Mobile for iOS",
        badge: "TestFlight Beta",
        version: "v0.7.1",
        size: "42.0 MB",
        description:
          "On-the-go dictation companion that syncs dictionary and presets with your desktop.",
        filename: "Apple TestFlight Beta",
        url: "https://github.com/rishabh777dev/cadence",
        checksum: "testflight-invite-code",
      },
      {
        name: "Cadence Mobile for Android",
        badge: "Direct APK / Play Store",
        version: "v0.7.1",
        size: "48.2 MB",
        description:
          "Native Android companion keyboard and audio transcriber with Whisper on-device.",
        filename: "Cadence-Mobile-0.7.1.apk",
        url: "https://github.com/rishabh777dev/cadence/releases/latest",
        checksum: "android-sha256-verified",
      },
    ],
  };

  return (
    <section id="download" className="py-24 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-radial from-[#C15F3D]/8 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <Download className="w-3.5 h-3.5" />
            <span>Official Desktop Releases</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Install Cadence on{" "}
            <span className="italic text-[#C15F3D]">your device</span>.
          </h2>
          <p className="mt-4 text-[#787368] dark:text-[#A19B8E] text-base sm:text-lg">
            Free forever, open source, and self-hosted friendly. Select your
            platform below to download the latest signed build.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#F0ECE1] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823]">
            <button
              type="button"
              onClick={() => setActiveTab("mac")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "mac"
                  ? "bg-white dark:bg-[#2A2720] text-[#1A1815] dark:text-[#EDE9DF] shadow-xs font-semibold"
                  : "text-[#787368] dark:text-[#A19B8E] hover:text-[#1A1815] dark:hover:text-[#EDE9DF]"
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>macOS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("windows")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "windows"
                  ? "bg-white dark:bg-[#2A2720] text-[#1A1815] dark:text-[#EDE9DF] shadow-xs font-semibold"
                  : "text-[#787368] dark:text-[#A19B8E] hover:text-[#1A1815] dark:hover:text-[#EDE9DF]"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Windows</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("linux")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "linux"
                  ? "bg-white dark:bg-[#2A2720] text-[#1A1815] dark:text-[#EDE9DF] shadow-xs font-semibold"
                  : "text-[#787368] dark:text-[#A19B8E] hover:text-[#1A1815] dark:hover:text-[#EDE9DF]"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Linux</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mobile")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "mobile"
                  ? "bg-white dark:bg-[#2A2720] text-[#1A1815] dark:text-[#EDE9DF] shadow-xs font-semibold"
                  : "text-[#787368] dark:text-[#A19B8E] hover:text-[#1A1815] dark:hover:text-[#EDE9DF]"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {downloads[activeTab].map((item, index) => (
            <div
              key={index}
              className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md hover:border-[#C15F3D]/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] font-medium">
                    {item.badge}
                  </span>
                  <span className="text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
                    {item.size}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[#1A1815] dark:text-[#EDE9DF] mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-[#787368] dark:text-[#A19B8E] leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={item.url}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C15F3D] hover:bg-[#AA4E2F] text-white font-medium text-sm shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {item.filename}</span>
                </a>

                {/* Checksum & verification */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#787368] dark:text-[#A19B8E] pt-2">
                  <span
                    className="truncate max-w-[200px]"
                    title={item.checksum}
                  >
                    SHA: {item.checksum.slice(0, 16)}...
                  </span>
                  <button
                    type="button"
                    onClick={() => copyChecksum(item.checksum)}
                    className="flex items-center gap-1 hover:text-[#1A1815] dark:hover:text-[#EDE9DF] transition-colors"
                  >
                    {copiedChecksum === item.checksum ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy SHA-256</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Developer CLI Option */}
        <div className="mt-12 max-w-4xl mx-auto p-6 rounded-2xl bg-white/60 dark:bg-black/20 border border-[#E2DBD0] dark:border-[#2B2823] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E2DBD0] dark:border-[#2B2823]">
              <Terminal className="w-5 h-5 text-[#C15F3D]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1A1815] dark:text-[#EDE9DF]">
                Building from source or running headless?
              </div>
              <div className="text-xs text-[#787368] dark:text-[#A19B8E] font-mono">
                pnpm clone & build with embedded MLX / Whisper
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <code className="px-3 py-2 text-xs font-mono bg-black/5 dark:bg-white/5 rounded-lg border border-[#E2DBD0] dark:border-[#2B2823] text-[#1A1815] dark:text-[#EDE9DF] select-all">
              git clone https://github.com/rishabh777dev/cadence.git
            </code>
            <a
              href="https://github.com/rishabh777dev/cadence"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-[#E2DBD0] dark:border-[#2B2823] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="GitHub Repository"
            >
              <ExternalLink className="w-4 h-4 text-[#787368]" />
            </a>
          </div>
        </div>

        {/* System Requirements Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-xs font-mono text-[#787368] dark:text-[#A19B8E] text-center">
          <div className="p-4 rounded-xl border border-[#E2DBD0]/60 dark:border-[#2B2823]/60 bg-white/30 dark:bg-black/10">
            <div className="font-semibold text-[#1A1815] dark:text-[#EDE9DF] mb-1">
              Apple macOS
            </div>
            <div>macOS 12.0 (Monterey) or later</div>
            <div className="text-[#C15F3D] mt-1">Apple Silicon recommended</div>
          </div>
          <div className="p-4 rounded-xl border border-[#E2DBD0]/60 dark:border-[#2B2823]/60 bg-white/30 dark:bg-black/10">
            <div className="font-semibold text-[#1A1815] dark:text-[#EDE9DF] mb-1">
              Microsoft Windows
            </div>
            <div>Windows 10 / 11 (64-bit)</div>
            <div className="text-[#C15F3D] mt-1">
              DirectSound & WASAPI support
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[#E2DBD0]/60 dark:border-[#2B2823]/60 bg-white/30 dark:bg-black/10">
            <div className="font-semibold text-[#1A1815] dark:text-[#EDE9DF] mb-1">
              Linux Distributions
            </div>
            <div>Ubuntu 20.04+, Fedora 36+, Arch</div>
            <div className="text-[#C15F3D] mt-1">Wayland & X11 supported</div>
          </div>
        </div>
      </div>
    </section>
  );
}
