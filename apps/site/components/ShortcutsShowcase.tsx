"use client";

import { Keyboard } from "lucide-react";

interface ShortcutCard {
  title: string;
  keys: string[];
  description: string;
  badge: string;
}

const shortcuts: ShortcutCard[] = [
  {
    title: "Instant Voice Dictation",
    keys: ["Ctrl", "Space"],
    description:
      "Hold down, speak whatever comes to mind, and release. Clean, formatted text drops right at your cursor.",
    badge: "Primary Action",
  },
  {
    title: "Magic Edit Transformation",
    keys: ["Alt", "X"],
    description:
      "Highlight any clumsy sentence, hold the keys, and speak instructions like 'make it formal' or 'format as bullet list'.",
    badge: "Rewrite in-place",
  },
  {
    title: "Cancel / Discard Session",
    keys: ["Escape"],
    description:
      "Changed your mind or interrupted mid-sentence? Press Escape to immediately abort audio transcription.",
    badge: "Instant Abort",
  },
];

export function ShortcutsShowcase() {
  return (
    <section id="shortcuts" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Frictionless Muscle Memory</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Effortless shortcuts.{" "}
            <span className="italic text-[#C15F3D]">Full customization.</span>
          </h2>
          <p className="mt-4 text-[#787368] dark:text-[#A19B8E] text-base sm:text-lg">
            Keep your hands on the keyboard. Zero mouse clicks required to
            dictate or edit.
          </p>
        </div>

        {/* Shortcuts Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between hover:border-[#C15F3D]/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] font-semibold">
                    {sc.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  {sc.keys.map((k, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      <kbd className="px-3 py-1.5 text-base font-mono font-semibold bg-white dark:bg-[#2A2720] border border-[#E2DBD0] dark:border-[#2B2823] rounded-xl shadow-xs text-[#1A1815] dark:text-[#EDE9DF]">
                        {k}
                      </kbd>
                      {idx < sc.keys.length - 1 && (
                        <span className="text-[#787368] text-xs font-mono">
                          +
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                <h3 className="text-xl font-semibold text-[#1A1815] dark:text-[#EDE9DF] mb-2">
                  {sc.title}
                </h3>
                <p className="text-sm text-[#787368] dark:text-[#A19B8E] leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E2DBD0] dark:border-[#2B2823] text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
                * Remap to any key combination in Settings
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
