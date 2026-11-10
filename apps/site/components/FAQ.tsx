"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Does my voice audio or text ever leave my computer?",
    answer:
      "When running in Local Mode (the default), absolutely not. Cadence runs embedded Whisper.cpp or Apple MLX directly on your CPU/GPU/Neural Engine. Audio is transcribed locally and pasted straight into your active application. No audio data, transcripts, or telemetry are ever uploaded to remote servers.",
  },
  {
    question:
      "How is Cadence different from built-in Apple Dictation or Windows Voice Typing?",
    answer:
      "Built-in OS dictation simply dumps literal words without context, leaving 'ums', 'ahs', grammar errors, and poor formatting. Cadence performs intelligent post-processing: it automatically strips verbal fillers, formats punctuation, understands software terms (like 'TypeScript' or 'Docker'), and provides Magic Edit (in-place rewriting via spoken prompt).",
  },
  {
    question: "Can I bring my own Cloud AI keys?",
    answer:
      "Yes! If you prefer cloud models or want extreme speed, you can plug your own API keys directly for Groq (Whisper at 400+ WPM), OpenAI (Whisper + GPT-4o), Anthropic (Claude 3.7 Sonnet), Google Gemini 2.0 Flash, Deepgram, and ElevenLabs. You pay standard provider rates directly with zero middleman markup.",
  },
  {
    question: "How does Magic Edit work in any application?",
    answer:
      "Select any text anywhere (Notion, Slack, VS Code, Google Docs, Apple Mail, etc.), press Alt + X (or your custom shortcut), speak your instructions (e.g. 'turn into bullet points' or 'translate to German'), and release. Cadence captures the highlighted text, transforms it, and replaces the selection instantly.",
  },
  {
    question: "What are the minimum hardware requirements?",
    answer:
      "For macOS: Any Apple Silicon Mac (M1/M2/M3/M4) or Intel Mac running macOS 12+ (Apple Silicon provides the best MLX acceleration). For Windows: 64-bit Windows 10/11 with 8GB RAM. For Linux: Any modern 64-bit x86_64 distribution with AVX2 support.",
  },
  {
    question: "Is Cadence completely free and open source?",
    answer:
      "Yes. Cadence is released under the permissive MIT License. You can inspect the code, compile it yourself, build plugins with our Voice Plugin SDK, or run it completely air-gapped.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Frequently asked{" "}
            <span className="italic text-[#C15F3D]">questions</span>.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-[#E2DBD0] dark:border-[#2B2823] bg-[#FAF7F2] dark:bg-[#1A1916] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-lg text-[#1A1815] dark:text-[#EDE9DF]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#787368] transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-[#C15F3D]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-xs sm:text-sm text-[#787368] dark:text-[#A19B8E] leading-relaxed border-t border-[#E2DBD0]/50 dark:border-[#2B2823]/50 pt-3 sm:pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
