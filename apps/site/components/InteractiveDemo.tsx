"use client";

import confetti from "canvas-confetti";
import {
  Check,
  Code2,
  Copy,
  Mail,
  MessageSquare,
  Mic,
  RotateCcw,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Scenario {
  id: string;
  name: string;
  icon: "slack" | "vscode" | "email" | "magic";
  targetApp: string;
  rawVoice: string;
  fillerWords: string[];
  cleanText: string;
  tone: string;
  shortcut: string;
}

const scenarios: Scenario[] = [
  {
    id: "slack",
    name: "Slack Standup Update",
    icon: "slack",
    targetApp: "Slack #product-team",
    rawVoice:
      "uh hey team so basically like we just finished the whisper integration and um it runs super fast now like under fifty milliseconds",
    fillerWords: ["uh", "so basically", "like", "um", "like"],
    cleanText:
      "Hey team! We just shipped the on-device Whisper integration. Latency dropped to <50ms with zero cloud overhead.",
    tone: "Casual & Concise",
    shortcut: "Ctrl + Space",
  },
  {
    id: "vscode",
    name: "VS Code PR Description",
    icon: "vscode",
    targetApp: "VS Code • pull_request_template.md",
    rawVoice:
      "so we refactored the audio pipeline in type script to use worker threads and fixed the memory leak in web audio context",
    fillerWords: ["so", "we"],
    cleanText:
      "feat(stt): refactor audio pipeline to worker threads in TypeScript\n\n- Fixes memory leak in WebAudio AudioContext\n- Benchmarked 40% lower idle CPU usage",
    tone: "Technical & Structured",
    shortcut: "Ctrl + Space",
  },
  {
    id: "email",
    name: "Client Executive Email",
    icon: "email",
    targetApp: "Superhuman / Apple Mail",
    rawVoice:
      "uh hi sarah i was thinking maybe we could push the roadmap review to thursday afternoon if you are free let me know what works",
    fillerWords: ["uh", "i was thinking", "maybe"],
    cleanText:
      "Hi Sarah,\n\nCould we reschedule our roadmap review to Thursday afternoon? Let me know if 2:00 PM or 3:30 PM works best for your schedule.",
    tone: "Polished & Executive",
    shortcut: "Ctrl + Space",
  },
  {
    id: "magic",
    name: "Magic Edit (Rewrite in-place)",
    icon: "magic",
    targetApp: "Notion • Architecture RFC",
    rawVoice:
      "highlighted: 'This system is slow because network requests take too long.'\nvoice instruction: 'Make this an engineering bullet point with latency metrics.'",
    fillerWords: [],
    cleanText:
      "• Bottleneck identified in remote network roundtrips (+280ms p95); migrating to local embedded Whisper eliminates WAN latency entirely.",
    tone: "Magic Edit Transformation",
    shortcut: "Alt + X",
  },
];

export function InteractiveDemo() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [step, setStep] = useState<
    "idle" | "listening" | "processing" | "done"
  >("idle");
  const [displayedText, setDisplayedText] = useState("");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = (scenario: Scenario = activeScenario) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRecording(true);
    setStep("listening");
    setDisplayedText("");

    // Step 1: Listening / soundwave (1.4s)
    timerRef.current = setTimeout(() => {
      setStep("processing");

      // Step 2: Processing & stripping fillers (1.0s)
      timerRef.current = setTimeout(() => {
        setStep("done");
        setIsRecording(false);
        // Typewriter effect for final clean text
        typewriteText(scenario.cleanText);
      }, 1000);
    }, 1400);
  };

  const typewriteText = (fullText: string) => {
    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      if (index >= fullText.length) {
        setDisplayedText(fullText);
        clearInterval(interval);
      } else {
        setDisplayedText(fullText.slice(0, index));
      }
    }, 15);
  };

  const handleSelectScenario = (sc: Scenario) => {
    setActiveScenario(sc);
    startSimulation(sc);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayedText || activeScenario.cleanText);
    setCopied(true);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#C15F3D", "#D97757", "#E88C6F", "#FBBF24"],
    });
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    setDisplayedText(activeScenario.cleanText);
    setStep("done");
  }, [activeScenario.cleanText]);

  return (
    <section
      id="demo"
      className="py-24 bg-[#F5EFE6]/60 dark:bg-[#16140F]/80 border-y border-[#E2DBD0] dark:border-[#2B2823] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Voice Playground</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Experience the flow.{" "}
            <span className="italic text-[#C15F3D]">Test it live.</span>
          </h2>
          <p className="mt-4 text-[#787368] dark:text-[#A19B8E] text-base sm:text-lg">
            See how Cadence automatically removes fillers, adapts tone to your
            active app, and pastes clean formatting in real-time.
          </p>
        </div>

        {/* Playground Container */}
        <div className="max-w-5xl mx-auto bg-[#FAF7F2] dark:bg-[#1A1916] rounded-3xl border border-[#E2DBD0] dark:border-[#2B2823] shadow-xl overflow-hidden">
          {/* Top Scenario Selector Tabs */}
          <div className="flex border-b border-[#E2DBD0] dark:border-[#2B2823] bg-white/40 dark:bg-black/20 overflow-x-auto no-scrollbar">
            {scenarios.map((sc) => {
              const isActive = sc.id === activeScenario.id;
              return (
                <button
                  type="button"
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-3 sm:py-3.5 text-xs font-mono border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-[#C15F3D] text-[#C15F3D] bg-white dark:bg-[#1A1916] font-semibold"
                      : "border-transparent text-[#787368] dark:text-[#A19B8E] hover:text-[#1A1815] dark:hover:text-[#EDE9DF]"
                  }`}
                >
                  {sc.icon === "slack" && <MessageSquare className="w-4 h-4" />}
                  {sc.icon === "vscode" && <Code2 className="w-4 h-4" />}
                  {sc.icon === "email" && <Mail className="w-4 h-4" />}
                  {sc.icon === "magic" && (
                    <Sparkles className="w-4 h-4 text-[#C15F3D]" />
                  )}
                  <span>{sc.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Simulation Area */}
          <div className="p-4 sm:p-7 md:p-10">
            {/* Target App Bar */}
            <div className="flex flex-wrap items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-[#E2DBD0] dark:border-[#2B2823] text-xs font-mono text-[#787368] dark:text-[#A19B8E] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="shrink-0">Target:</span>
                <span className="font-semibold text-[#1A1815] dark:text-[#EDE9DF] truncate max-w-[160px] xs:max-w-[240px] sm:max-w-none">
                  {activeScenario.targetApp}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="hidden sm:inline">Hotkey:</span>
                <kbd className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#1A1815] dark:text-[#EDE9DF] border border-[#E2DBD0] dark:border-[#2B2823] text-[11px] sm:text-xs">
                  {activeScenario.shortcut}
                </kbd>
              </div>
            </div>

            {/* Split Card: Raw Spoken vs Cadence Transformed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Raw Speech & Filler Analysis */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-black/20 border border-[#E2DBD0] dark:border-[#2B2823] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-[#787368] dark:text-[#A19B8E]">
                    <span>1. What you spoke</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Raw Voice Stream
                    </span>
                  </div>
                  <div className="font-sans text-sm leading-relaxed text-[#787368] dark:text-[#A19B8E]">
                    {step === "listening" ? (
                      <div className="flex items-center gap-2 text-[#C15F3D] font-mono text-xs animate-pulse">
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        <span>Streaming spoken audio in real-time...</span>
                      </div>
                    ) : (
                      <p className="italic">"{activeScenario.rawVoice}"</p>
                    )}
                  </div>
                </div>

                {activeScenario.fillerWords.length > 0 && (
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#E2DBD0]/60 dark:border-[#2B2823]/60">
                    <span className="text-[11px] font-mono text-[#787368] dark:text-[#A19B8E] block mb-2">
                      Detected Fillers (Stripped automatically):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeScenario.fillerWords.map((word, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[11px] font-mono rounded bg-red-500/10 text-red-600 dark:text-red-400 line-through"
                        >
                          "{word}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Clean Transformed Text Output */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1F1D19] border border-[#C15F3D]/30 shadow-md relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider">
                    <span className="text-[#C15F3D] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>2. Cadence Pasted Result</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] font-mono">
                      {activeScenario.tone}
                    </span>
                  </div>

                  <div className="font-mono text-sm leading-relaxed text-[#1A1815] dark:text-[#EDE9DF] min-h-[90px] whitespace-pre-wrap">
                    {step === "processing" ? (
                      <div className="flex items-center gap-2 text-xs text-[#787368] animate-pulse">
                        <Zap className="w-4 h-4 text-[#C15F3D]" />
                        <span>Applying context & punctuation...</span>
                      </div>
                    ) : (
                      <>
                        {displayedText}
                        {isRecording && (
                          <span className="inline-block w-2 h-4 bg-[#C15F3D] ml-1 animate-pulse" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#E2DBD0] dark:border-[#2B2823] flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Formatted in 42ms</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E2DBD0] dark:border-[#2B2823] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#787368] dark:text-[#A19B8E]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar: Soundwave Simulator Trigger */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#E2DBD0] dark:border-[#2B2823] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => startSimulation(activeScenario)}
                  disabled={isRecording}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-mono text-xs sm:text-sm transition-all shadow-md ${
                    isRecording
                      ? "bg-[#C15F3D] text-white animate-pulse"
                      : "bg-[#1A1815] dark:bg-white text-white dark:text-[#1A1815] hover:opacity-90"
                  }`}
                >
                  <Mic
                    className={`w-4 h-4 ${isRecording ? "animate-bounce" : ""}`}
                  />
                  <span>
                    {isRecording
                      ? "Transcribing Audio..."
                      : "Replay Voice Dictation"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => startSimulation(activeScenario)}
                  className="p-2.5 sm:p-3 rounded-2xl border border-[#E2DBD0] dark:border-[#2B2823] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#787368] dark:text-[#A19B8E] shrink-0"
                  title="Reset demo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Pulsing Audio Bar Simulation */}
              <div className="hidden xs:flex items-center gap-1 sm:gap-1.5 h-8 px-3 sm:px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E2DBD0] dark:border-[#2B2823]">
                <span className="text-[11px] font-mono text-[#787368] mr-1.5 sm:mr-2 hidden md:inline">
                  Audio Engine:
                </span>
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isRecording
                        ? "bg-[#C15F3D] animate-wave-bar"
                        : "bg-[#787368]/30 h-1.5"
                    }`}
                    style={{
                      height: isRecording
                        ? `${Math.sin(i * 0.6) * 14 + 18}px`
                        : "6px",
                      animationDelay: `${(i % 5) * 80}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
