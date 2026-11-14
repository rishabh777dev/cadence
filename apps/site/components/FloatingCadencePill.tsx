"use client";

import { Check, Copy, Download, Mic, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type DictationStep = "idle" | "listening" | "rewriting" | "done";

export function FloatingCadencePill() {
  const [step, setStep] = useState<DictationStep>("idle");
  const [minimized, setMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streamText, setStreamText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const rawTranscript =
    "Hey Sarah, um, could you send over the updated Q4 design deck by tomorrow morning, actually make it afternoon so you have time to finish the user research notes.";

  const magicEditedText =
    "Hi Sarah, could you please send the updated Q4 design deck by tomorrow afternoon? That will give you enough time to finalize the user research notes.";

  const startDemo = () => {
    if (step === "listening" || step === "rewriting") return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setStep("listening");
    setStreamText("");
    setCopied(false);

    // Stream text word-by-word
    const words = rawTranscript.split(" ");
    let i = 0;

    intervalRef.current = setInterval(() => {
      if (i < words.length) {
        setStreamText((prev) => (prev ? `${prev} ${words[i]}` : words[i]));
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Switch to rewriting
        setStep("rewriting");

        timerRef.current = setTimeout(async () => {
          setStep("done");
          try {
            const confetti = (await import("canvas-confetti")).default;
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.85, x: 0.8 },
              colors: ["#C15F3D", "#D97757", "#E88C6F", "#FBBF24"],
            });
          } catch {
            // Ignore
          }
        }, 1200);
      }
    }, 110);
  };

  const resetDemo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStep("idle");
    setStreamText("");
    setCopied(false);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(magicEditedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 p-3 sm:p-3.5 rounded-full bg-[#1A1815] text-[#EDE9DF] border border-[#C15F3D]/50 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 group backdrop-blur-md"
        title="Open Cadence Voice Simulator"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C15F3D] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C15F3D]" />
        </span>
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-[#C15F3D] group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-mono pr-1 text-[#EDE9DF] hidden sm:inline">
          Try Voice
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-40 max-w-[calc(100vw-24px)] sm:max-w-md w-full">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative rounded-2xl md:rounded-3xl border border-[#3E342B] bg-[#141210]/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl text-[#EDE9DF] overflow-hidden"
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C15F3D]/60 to-transparent" />

        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  step === "listening"
                    ? "bg-rose-500"
                    : step === "rewriting"
                      ? "bg-amber-500"
                      : "bg-[#C15F3D]"
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  step === "listening"
                    ? "bg-rose-500"
                    : step === "rewriting"
                      ? "bg-amber-500"
                      : "bg-[#C15F3D]"
                }`}
              />
            </span>
            <span className="font-mono font-medium text-[11px] text-[#A19B8E] uppercase tracking-wider">
              {step === "idle" && "Cadence Voice Simulator"}
              {step === "listening" && "Listening • Whisper Local"}
              {step === "rewriting" && "Magic Edit • In-Place Rewrite"}
              {step === "done" && "Clean Output Ready"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 text-[#787368] hover:text-[#EDE9DF] transition-colors rounded-md"
            title="Minimize"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-3">
          {step === "idle" && (
            <div className="space-y-3">
              <p className="text-xs text-[#A19B8E] leading-relaxed">
                Experience how Cadence transcribes thoughts and formats them
                instantly without typing:
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startDemo}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#C15F3D] hover:bg-[#AA4E2F] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Start Live Dictation Simulation</span>
                </button>
              </div>
            </div>
          )}

          {step === "listening" && (
            <div className="space-y-3">
              {/* Audio Wave Bars */}
              <div className="h-6 flex items-center justify-center gap-1">
                {[12, 22, 16, 28, 14, 24, 18, 10, 26, 16].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [h * 0.4, h, h * 0.3],
                    }}
                    transition={{
                      duration: 0.6 + (i % 3) * 0.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="w-1 rounded-full bg-[#D97757]"
                  />
                ))}
              </div>

              {/* Streaming Text */}
              <div className="p-3 rounded-xl bg-[#1A1815] border border-[#2B2721] text-xs font-serif italic text-[#D6D0C4] min-h-[50px] leading-relaxed">
                &ldquo;{streamText}&rdquo;
                <span className="inline-block w-1.5 h-3 bg-[#D97757] ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {step === "rewriting" && (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Removing fillers & formatting punctuation...</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1A1815] border border-amber-600/30 text-xs text-[#787368] line-through">
                &ldquo;{rawTranscript}&rdquo;
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#1D1A16] border border-[#3E342B] text-xs leading-relaxed text-[#EDE9DF]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-semibold mb-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Pasted into your app (0.28s)</span>
                </div>
                <p className="font-sans font-medium text-[13px] text-[#EDE9DF]">
                  &ldquo;{magicEditedText}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyResult}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#24201A] hover:bg-[#2D2720] border border-[#3A3228] text-xs font-medium text-[#EDE9DF] flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#787368]" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetDemo}
                  className="py-2 px-3 rounded-xl bg-[#24201A] hover:bg-[#2D2720] border border-[#3A3228] text-xs font-medium text-[#A19B8E] hover:text-[#EDE9DF] transition-colors"
                >
                  Reset
                </button>

                <a
                  href="#download"
                  className="py-2 px-3 rounded-xl bg-[#C15F3D] hover:bg-[#AA4E2F] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
