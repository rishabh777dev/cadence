"use client";

import {
  BookOpen,
  Globe2,
  KeyRound,
  Lock,
  Sliders,
  Wand2,
  Zap,
} from "lucide-react";

export function BentoFeatures() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Architecture & Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Engineered for speed. <br />
            <span className="italic text-[#C15F3D]">
              Built for uncompromised privacy.
            </span>
          </h2>
          <p className="mt-4 text-[#787368] dark:text-[#A19B8E] text-base sm:text-lg">
            Unlike cloud-only dictation tools that stream your microphone audio
            over public internet connections, Cadence gives you true local
            intelligence with the freedom to bring your own cloud models.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: 100% Offline & Local (Spans 2 columns) */}
          <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-[#C15F3D]/50 transition-all">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  Air-Gapped Privacy
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif text-[#1A1815] dark:text-[#EDE9DF] mb-3">
                100% Local Voice Processing. Zero Cloud Required.
              </h3>
              <p className="text-[#787368] dark:text-[#A19B8E] text-sm sm:text-base leading-relaxed max-w-xl">
                Run embedded Whisper (`whisper.cpp`) or Apple MLX directly on
                your Mac or PC hardware. Your private thoughts, client emails,
                code secrets, and confidential conversations never leave your
                device.
              </p>
            </div>

            {/* Micro visual: Local Pipeline telemetry */}
            <div className="mt-8 pt-6 border-t border-[#E2DBD0] dark:border-[#2B2823] grid grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <div className="text-[#787368] dark:text-[#A19B8E]">
                  Processing Mode
                </div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Local On-Device
                </div>
              </div>
              <div>
                <div className="text-[#787368] dark:text-[#A19B8E]">
                  Audio Egress
                </div>
                <div className="font-semibold text-[#1A1815] dark:text-[#EDE9DF] mt-0.5">
                  0 bytes / sec
                </div>
              </div>
              <div>
                <div className="text-[#787368] dark:text-[#A19B8E]">
                  Offline Ready
                </div>
                <div className="font-semibold text-[#C15F3D] mt-0.5">
                  100% Airplane Mode
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Magic Edit (1 column) */}
          <div
            id="magic-edit"
            className="p-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between group hover:border-[#C15F3D]/50 transition-all"
          >
            <div>
              <div className="p-3 rounded-2xl bg-[#C15F3D]/10 text-[#C15F3D] border border-[#C15F3D]/20 w-fit mb-6">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif text-[#1A1815] dark:text-[#EDE9DF] mb-3">
                Magic Edit.{" "}
                <span className="italic text-[#C15F3D]">Rewrite in-place.</span>
              </h3>
              <p className="text-[#787368] dark:text-[#A19B8E] text-sm leading-relaxed">
                Highlight any text in any document or app, hold{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-xs">
                  Alt + X
                </kbd>
                , speak what you want changed, and watch it rewrite in-place.
              </p>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E2DBD0] dark:border-[#2B2823] text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
              <span className="text-[#C15F3D]">Prompt:</span> "Make this concise
              for Slack"
            </div>
          </div>

          {/* Card 3: Bring Your Own Model (BYOK) */}
          <div className="p-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between group hover:border-[#C15F3D]/50 transition-all">
            <div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit mb-6">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif text-[#1A1815] dark:text-[#EDE9DF] mb-3">
                Bring Your Own Key.
              </h3>
              <p className="text-[#787368] dark:text-[#A19B8E] text-sm leading-relaxed">
                Connect your personal API keys for ultra-fast cloud models:
                Groq, OpenAI Whisper & GPT-4o, Anthropic Claude, Google Gemini
                2.0 Flash, and ElevenLabs. No subscriptions or markups.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-[#E2DBD0] dark:border-[#2B2823]">
                Groq LPU (400 WPM)
              </span>
              <span className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-[#E2DBD0] dark:border-[#2B2823]">
                Anthropic Claude
              </span>
              <span className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-[#E2DBD0] dark:border-[#2B2823]">
                Gemini Flash
              </span>
            </div>
          </div>

          {/* Card 4: Custom Dictionary & Tone (Spans 2 columns) */}
          <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between group hover:border-[#C15F3D]/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  Zero Misspellings
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif text-[#1A1815] dark:text-[#EDE9DF] mb-3">
                Custom Vocabulary & Adaptive Tone.
              </h3>
              <p className="text-[#787368] dark:text-[#A19B8E] text-sm sm:text-base leading-relaxed max-w-xl">
                Teach Cadence your team's specific acronyms, company names, and
                technical jargon. Plus, assign automatic tone profiles based on
                the active application window.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/60 dark:bg-black/20 border border-[#E2DBD0] dark:border-[#2B2823] flex items-center justify-between">
                <span className="text-[#787368]">Spoken: "pie torch"</span>
                <span className="text-[#C15F3D] font-bold">&rarr; PyTorch</span>
              </div>
              <div className="p-3 rounded-xl bg-white/60 dark:bg-black/20 border border-[#E2DBD0] dark:border-[#2B2823] flex items-center justify-between">
                <span className="text-[#787368]">Spoken: "post gres"</span>
                <span className="text-[#C15F3D] font-bold">
                  &rarr; PostgreSQL
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: 100+ Languages with Auto-Detect */}
          <div className="p-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between group hover:border-[#C15F3D]/50 transition-all">
            <div>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 w-fit mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif text-[#1A1815] dark:text-[#EDE9DF] mb-3">
                100+ Languages.
              </h3>
              <p className="text-[#787368] dark:text-[#A19B8E] text-sm leading-relaxed">
                Speak in your native language or mix multiple languages in a
                single conversation. Cadence auto-detects language on the fly.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
              <span>English</span> • <span>Español</span> •{" "}
              <span>Français</span> • <span>Deutsch</span> • <span>日本語</span>{" "}
              • <span>हिन्दी</span>
            </div>
          </div>

          {/* Card 6: Extensible Voice Plugin SDK (Spans 2 columns) */}
          <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between group hover:border-[#C15F3D]/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-[#C15F3D]/10 text-[#C15F3D] border border-[#C15F3D]/20">
                  <Sliders className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] font-semibold">
                  Voice Plugin SDK
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif text-[#1A1815] dark:text-[#EDE9DF] mb-3">
                Hackable & Extensible with TypeScript.
              </h3>
              <p className="text-[#787368] dark:text-[#A19B8E] text-sm sm:text-base leading-relaxed max-w-xl">
                Write custom plugins to format dictation before pasting:
                auto-create Linear tickets, trigger Raycast actions, translate
                to SQL, or send transcribed voice notes to your self-hosted
                database.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2DBD0] dark:border-[#2B2823] flex items-center justify-between text-xs font-mono">
              <span className="text-[#787368] dark:text-[#A19B8E]">
                Open SDK:{" "}
                <code className="text-[#1A1815] dark:text-[#EDE9DF]">
                  @cadence-voice/sdk
                </code>
              </span>
              <a
                href="https://github.com/rishabh777dev/cadence"
                target="_blank"
                rel="noreferrer"
                className="text-[#C15F3D] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Read Plugin Docs</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
