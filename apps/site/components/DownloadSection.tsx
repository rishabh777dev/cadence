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
        name: "macOS Apple Silicon & Intel",
        badge: "Recommended (.dmg)",
        version: "v0.7.1",
        size: "179.0 MB",
        description:
          "Universal DMG installer with embedded Whisper.cpp and Apple MLX acceleration.",
        filename: "Cadence-0.7.1.dmg",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.dmg",
        checksum:
          "d3cbf988950c22e6b0004206742c4f072b7272ab1964f1f2b2c72713dd650c7c",
      },
      {
        name: "macOS Standalone Archive",
        badge: "ARM64 (.zip)",
        version: "v0.7.1",
        size: "171.7 MB",
        description:
          "Portable standalone zip for Apple Silicon (M1/M2/M3/M4) without installer.",
        filename: "Cadence-0.7.1-arm64.zip",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1-arm64.zip",
        checksum:
          "077a6020ddc6816536746253e2d4c382467b14aa66ccc97363d939716256c94f",
      },
    ],
    windows: [
      {
        name: "Windows 64-bit Installer",
        badge: "Recommended (.exe)",
        version: "v0.7.1",
        size: "143.9 MB",
        description:
          "Official NSIS installer with automatic background tray service and instant hotkeys.",
        filename: "Cadence-0.7.1-setup.exe",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1-setup.exe",
        checksum:
          "afca1d3fd5d208786619869bd91a74a72100ffde60758f18fdccdeb7a96c0ab1",
      },
      {
        name: "Source & Offline Bundle",
        badge: "Full Bundle (.zip)",
        version: "v0.7.1",
        size: "38.5 MB",
        description:
          "Full release source archive for custom builds, self-hosting, and inspection.",
        filename: "cadence-v0.7.1.zip",
        url: "https://github.com/rishabh777dev/cadence/archive/refs/tags/v0.7.1.zip",
        checksum:
          "8b0b190b646732b97cc51b2875e77aab86fa86e29732e33ac14dc111129e7b5d",
      },
    ],
    linux: [
      {
        name: "Linux AppImage",
        badge: "Universal x64",
        version: "v0.7.1",
        size: "187.3 MB",
        description:
          "Self-contained executable for Ubuntu, Fedora, Arch, and all major distributions.",
        filename: "Cadence-0.7.1.AppImage",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.AppImage",
        checksum:
          "317f7c489f96b9213d0dc489486e76a4db74c6d7f3a214d17286de94c0b94d25",
      },
      {
        name: "Debian / Ubuntu Package",
        badge: ".deb",
        version: "v0.7.1",
        size: "133.1 MB",
        description:
          "Native deb package with desktop shortcut, tray integration, and system services.",
        filename: "Cadence-0.7.1.deb",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.deb",
        checksum:
          "15e305c5673a2b6b4796cbe480eb09b25b4b641b4bc3dc8bcb59b718cb12d6c2",
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
        url: "https://github.com/rishabh777dev/cadence#mobile-companions",
        checksum: "testflight-invite-cadence",
      },
      {
        name: "Cadence Mobile for Android",
        badge: "Direct APK (.apk)",
        version: "v0.7.1",
        size: "110.6 MB",
        description:
          "Native Android companion keyboard and audio transcriber with Whisper on-device.",
        filename: "Cadence-0.7.1.apk",
        url: "https://github.com/rishabh777dev/cadence/releases/latest/download/Cadence-0.7.1.apk",
        checksum:
          "f1c2e5266f32d769a318dea2d8359be410df1ee4dd08ec0f330e2be11444709d",
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
