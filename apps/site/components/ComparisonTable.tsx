"use client";

import { Check, Sparkles, X } from "lucide-react";

interface FeatureRow {
  name: string;
  category?: string;
  cadence: boolean | string;
  wispr: boolean | string;
  superwhisper: boolean | string;
  apple: boolean | string;
  highlight?: boolean;
}

const features: FeatureRow[] = [
  {
    name: "100% Local Offline Dictation",
    cadence: "Whisper.cpp & MLX (0 bytes cloud)",
    wispr: false, // Wispr Flow streams audio to cloud servers
    superwhisper: "Whisper.cpp & Parakeet",
    apple: "Basic on-device engine",
    highlight: true,
  },
  {
    name: "Audio Privacy & Telemetry",
    cadence: "Zero cloud egress (Air-gapped)",
    wispr: "Cloud audio streaming",
    superwhisper: "Local on-device",
    apple: "Proprietary Apple telemetry",
    highlight: true,
  },
  {
    name: "Linux Support (AppImage / .deb)",
    cadence: true,
    wispr: false, // macOS, Windows, iOS, Android only
    superwhisper: false, // macOS, Windows, iOS, Android only
    apple: false,
    highlight: true,
  },
  {
    name: "Supported Platforms",
    cadence: "macOS • Windows • Linux • Mobile",
    wispr: "macOS • Windows • iOS • Android",
    superwhisper: "macOS • Windows • iOS • Android",
    apple: "macOS & iOS only",
  },
  {
    name: "Magic Edit (Spoken In-Place Rewriting)",
    cadence: true,
    wispr: true,
    superwhisper: "Writing Modes only",
    apple: false,
  },
  {
    name: "Bring Your Own Key (Groq, Claude, OpenAI)",
    cadence: "Free & Unlimited",
    wispr: false, // Locked to Wispr cloud
    superwhisper: "Pro plan required ($8.49/mo)",
    apple: false,
    highlight: true,
  },
  {
    name: "Universal Cursor Paste in Any App",
    cadence: true,
    wispr: true,
    superwhisper: true,
    apple: true,
  },
  {
    name: "Custom Acronym & Jargon Dictionary",
    cadence: true,
    wispr: true,
    superwhisper: true,
    apple: false,
  },
  {
    name: "Extensible Plugin SDK (TypeScript)",
    cadence: true,
    wispr: false,
    superwhisper: false,
    apple: false,
  },
  {
    name: "Open Source (Auditable MIT Code)",
    cadence: "MIT Licensed",
    wispr: false,
    superwhisper: false,
    apple: false,
    highlight: true,
  },
  {
    name: "Free Tier Limits",
    cadence: "Unlimited & Unmetered",
    wispr: "2,000 words / week cap",
    superwhisper: "Small models only",
    apple: "Unlimited (bundled)",
  },
  {
    name: "Pricing",
    cadence: "100% Free & Open Source",
    wispr: "$12 - $15 / month ($144/yr)",
    superwhisper: "$8.49/mo or $249.99 lifetime",
    apple: "Free (bundled with hardware)",
    highlight: true,
  },
];

export function ComparisonTable() {
  return (
    <section
      id="compare"
      className="scroll-mt-24 py-24 bg-[#F5EFE6]/60 dark:bg-[#16140F]/80 border-y border-[#E2DBD0] dark:border-[#2B2823]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Latest 2025/2026 Competitive Analysis</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Why choose <span className="italic text-[#C15F3D]">Cadence</span>?
          </h2>
          <p className="mt-4 text-[#787368] dark:text-[#A19B8E] text-base sm:text-lg">
            See how Cadence stacks up against the latest releases of Wispr Flow,
            Superwhisper, and Apple Dictation.
          </p>
        </div>

        {/* Mobile scroll indicator */}
        <div className="md:hidden flex items-center justify-center gap-1.5 text-xs font-mono text-[#787368] dark:text-[#A19B8E] mb-3 animate-pulse">
          <span>&larr; Swipe to compare all platforms &rarr;</span>
        </div>

        {/* Table Container */}
        <div className="max-w-5xl mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E2DBD0] dark:border-[#2B2823] bg-[#FAF7F2] dark:bg-[#1A1916] shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2DBD0] dark:border-[#2B2823] bg-white/70 dark:bg-black/30 text-xs">
                  <th className="py-4 sm:py-5 px-4 sm:px-6 font-semibold uppercase tracking-wider text-[#787368] dark:text-[#A19B8E] w-2/5">
                    Feature & Capability
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 font-bold text-[#C15F3D] bg-[#C15F3D]/8 border-x border-[#C15F3D]/25 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-[#1A1815] dark:text-[#EDE9DF]">
                        CADENCE
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C15F3D] text-white">
                        v0.7.1 • Open Source
                      </span>
                    </div>
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 font-semibold text-[#1A1815] dark:text-[#EDE9DF] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm">Wispr Flow</span>
                      <span className="text-[10px] text-[#787368] dark:text-[#A19B8E]">
                        Cloud-first
                      </span>
                    </div>
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 font-semibold text-[#1A1815] dark:text-[#EDE9DF] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm">Superwhisper</span>
                      <span className="text-[10px] text-[#787368] dark:text-[#A19B8E]">
                        Freemium
                      </span>
                    </div>
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 font-semibold text-[#1A1815] dark:text-[#EDE9DF] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm">Apple Dictation</span>
                      <span className="text-[10px] text-[#787368] dark:text-[#A19B8E]">
                        OS Bundled
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#2B2823] text-sm">
                {features.map((f, i) => (
                  <tr
                    key={i}
                    className={`transition-colors hover:bg-black/2 dark:hover:bg-white/2 ${
                      f.highlight ? "bg-[#C15F3D]/2 dark:bg-[#C15F3D]/5" : ""
                    }`}
                  >
                    {/* Feature name */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-medium text-[#1A1815] dark:text-[#EDE9DF]">
                      {f.name}
                    </td>

                    {/* Cadence Column */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center bg-[#C15F3D]/8 border-x border-[#C15F3D]/25 font-semibold text-[#1A1815] dark:text-[#EDE9DF]">
                      {typeof f.cadence === "boolean" ? (
                        f.cadence ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-500">
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-[#C15F3D] dark:text-[#D97757]">
                          {f.cadence}
                        </span>
                      )}
                    </td>

                    {/* Wispr Column */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center text-[#787368] dark:text-[#A19B8E]">
                      {typeof f.wispr === "boolean" ? (
                        f.wispr ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4 text-[#787368]/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs text-[#787368] dark:text-[#A19B8E]">
                          {f.wispr}
                        </span>
                      )}
                    </td>

                    {/* Superwhisper Column */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center text-[#787368] dark:text-[#A19B8E]">
                      {typeof f.superwhisper === "boolean" ? (
                        f.superwhisper ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4 text-[#787368]/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs text-[#787368] dark:text-[#A19B8E]">
                          {f.superwhisper}
                        </span>
                      )}
                    </td>

                    {/* Apple Column */}
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-center text-[#787368] dark:text-[#A19B8E]">
                      {typeof f.apple === "boolean" ? (
                        f.apple ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4 text-[#787368]/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs text-[#787368] dark:text-[#A19B8E]">
                          {f.apple}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
