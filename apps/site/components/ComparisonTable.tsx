"use client";

import { Check, Sparkles, X } from "lucide-react";

interface FeatureRow {
  name: string;
  cadence: boolean | string;
  wispr: boolean | string;
  superwhisper: boolean | string;
  apple: boolean | string;
  highlight?: boolean;
}

const features: FeatureRow[] = [
  {
    name: "100% Local Offline Dictation",
    cadence: "Whisper.cpp & MLX",
    wispr: false,
    superwhisper: "Whisper.cpp",
    apple: "Limited on-device",
    highlight: true,
  },
  {
    name: "Zero Audio Telemetry (Air-Gapped)",
    cadence: true,
    wispr: false,
    superwhisper: true,
    apple: false,
    highlight: true,
  },
  {
    name: "Magic Edit (Spoken In-Place Rewriting)",
    cadence: true,
    wispr: true,
    superwhisper: "Basic",
    apple: false,
  },
  {
    name: "Bring Your Own Key (Groq, Claude, OpenAI)",
    cadence: true,
    wispr: false,
    superwhisper: false,
    apple: false,
    highlight: true,
  },
  {
    name: "Operating Systems",
    cadence: "macOS • Windows • Linux • Mobile",
    wispr: "macOS & Windows only",
    superwhisper: "macOS only",
    apple: "Apple devices only",
  },
  {
    name: "Universal Cursor Paste (Any App)",
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
    name: "Open Source Codebase",
    cadence: "MIT Licensed",
    wispr: false,
    superwhisper: false,
    apple: false,
  },
  {
    name: "Pricing",
    cadence: "Free & Open Source",
    wispr: "$12 / month",
    superwhisper: "$8 / month",
    apple: "Free (bundled)",
    highlight: true,
  },
];

export function ComparisonTable() {
  return (
    <section
      id="compare"
      className="py-24 bg-[#F5EFE6]/60 dark:bg-[#16140F]/80 border-y border-[#E2DBD0] dark:border-[#2B2823]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Competitive Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Why choose <span className="italic text-[#C15F3D]">Cadence</span>?
          </h2>
          <p className="mt-4 text-[#787368] dark:text-[#A19B8E] text-base sm:text-lg">
            See how Cadence compares with proprietary cloud tools like Wispr
            Flow and Superwhisper.
          </p>
        </div>

        {/* Table Container */}
        <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl border border-[#E2DBD0] dark:border-[#2B2823] bg-[#FAF7F2] dark:bg-[#1A1916] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2DBD0] dark:border-[#2B2823] bg-white/60 dark:bg-black/20 text-xs font-mono">
                  <th className="py-5 px-6 font-medium text-[#787368] dark:text-[#A19B8E] w-2/5">
                    CAPABILITY
                  </th>
                  <th className="py-5 px-6 font-bold text-[#C15F3D] bg-[#C15F3D]/5 border-x border-[#C15F3D]/20 text-center">
                    CADENCE (v0.7.1)
                  </th>
                  <th className="py-5 px-6 font-medium text-[#787368] dark:text-[#A19B8E] text-center">
                    Wispr Flow
                  </th>
                  <th className="py-5 px-6 font-medium text-[#787368] dark:text-[#A19B8E] text-center">
                    Superwhisper
                  </th>
                  <th className="py-5 px-6 font-medium text-[#787368] dark:text-[#A19B8E] text-center">
                    Apple Dictation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#2B2823] text-sm">
                {features.map((f, i) => (
                  <tr
                    key={i}
                    className={`transition-colors hover:bg-black/2 dark:hover:bg-white/2 ${
                      f.highlight ? "bg-amber-500/5 dark:bg-amber-500/2" : ""
                    }`}
                  >
                    <td className="py-4 px-6 font-medium text-[#1A1815] dark:text-[#EDE9DF]">
                      {f.name}
                    </td>

                    {/* Cadence Column */}
                    <td className="py-4 px-6 text-center bg-[#C15F3D]/5 border-x border-[#C15F3D]/20 font-semibold text-[#1A1815] dark:text-[#EDE9DF]">
                      {typeof f.cadence === "boolean" ? (
                        f.cadence ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <X className="w-4 h-4 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-xs text-[#C15F3D] font-bold">
                          {f.cadence}
                        </span>
                      )}
                    </td>

                    {/* Wispr Column */}
                    <td className="py-4 px-6 text-center text-[#787368] dark:text-[#A19B8E]">
                      {typeof f.wispr === "boolean" ? (
                        f.wispr ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-[#787368]/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs font-mono">{f.wispr}</span>
                      )}
                    </td>

                    {/* Superwhisper Column */}
                    <td className="py-4 px-6 text-center text-[#787368] dark:text-[#A19B8E]">
                      {typeof f.superwhisper === "boolean" ? (
                        f.superwhisper ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-[#787368]/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs font-mono">
                          {f.superwhisper}
                        </span>
                      )}
                    </td>

                    {/* Apple Column */}
                    <td className="py-4 px-6 text-center text-[#787368] dark:text-[#A19B8E]">
                      {typeof f.apple === "boolean" ? (
                        f.apple ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-[#787368]/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs font-mono">{f.apple}</span>
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
