import { formatAcceleratorKeys } from "@renderer/hooks/use-hotkey-recorder";
import { settingsQueryOptions } from "@renderer/lib/query";
import { cn } from "@renderer/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDefaultHotkey } from "../../../shared/hotkey-defaults";
import { SETTINGS_KEYS } from "../../../shared/settings-keys";
import { Textarea } from "./ui/textarea";

// ---------------------------------------------------------------------------
// Tutorial — animated 3-phase loop:
//   idle (1.8s) → pressed (3.6s, animated wave) → result (2.4s, transcript)
// On real hotkey-down/up, the auto-loop is suspended and the demo follows
// the user's actual press.
//
// Shared between the Today page and onboarding's "how to use" step. Pass
// `hotkey` (an Electron accelerator like "Alt+Space") to drive the keycaps
// from caller state — e.g. while the user is rebinding it live in
// onboarding. When omitted, the demo loads the configured hotkey itself.
// ---------------------------------------------------------------------------

type DemoPhase = "idle" | "pressed" | "result";

const PHASE_STEPS: ReadonlyArray<readonly [DemoPhase, number]> = [
  ["idle", 1800],
  ["pressed", 3600],
  ["result", 2400],
];

const SAMPLE_TRANSCRIPT = "Pushing the meeting to tomorrow at ten.";

// Platform-aware default, mirrored from the main process via the preload.
const DEFAULT_HOTKEY = window.api?.defaultHotkey ?? getDefaultHotkey();

export function TutorialDemo({
  hotkey,
  interactive = false,
  onDictation,
}: {
  hotkey?: string;
  // When true, the result line becomes a real editable textarea the user can
  // dictate into (the transcription pastes in like any other app), and the
  // scripted idle→pressed→result loop is disabled so the box stays calm until
  // a real hotkey press.
  interactive?: boolean;
  // Fired on each real hotkey press while interactive (used by onboarding to
  // log that the user actually tried dictation).
  onDictation?: () => void;
}): React.JSX.Element {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [hotkeyTokens, setHotkeyTokens] = useState<string[]>(() =>
    formatAcceleratorKeys(hotkey ?? DEFAULT_HOTKEY),
  );
  const stepRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  // suspendedRef pauses the auto-loop while the real hotkey is held
  const suspendedRef = useRef(false);
  // Latest mic amplitude (0..1) broadcast by the pill via main. Refs avoid
  // re-rendering this component at 60Hz; Wave reads it inside its RAF loop.
  const audioLevelRef = useRef(0);
  // True while the real hotkey is held — switches Wave from scripted
  // amplitude to live amplitude.
  const livePressRef = useRef(false);
  // Keep the latest onDictation callback without re-subscribing the hotkey
  // listeners every render (the parent passes a fresh closure each time).
  const onDictationRef = useRef(onDictation);
  onDictationRef.current = onDictation;

  const clearLoop = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Auto-loop tick. Re-entered after each timeout fires (or when manually
  // restarted after a real hotkey release).
  const tick = useCallback(() => {
    if (suspendedRef.current) return;
    const [name, dur] = PHASE_STEPS[stepRef.current % PHASE_STEPS.length];
    setPhase(name);
    stepRef.current += 1;
    timeoutRef.current = window.setTimeout(tick, dur);
  }, []);

  useEffect(() => {
    // In interactive mode the demo only reacts to real hotkey presses, so the
    // scripted loop never starts.
    if (interactive) return;
    tick();
    return clearLoop;
  }, [tick, clearLoop, interactive]);

  // Read the configured hotkey from the shared settings cache (deduped with
  // every other settings consumer); skipped when the caller drives it.
  const { data: settingsData } = useQuery({
    ...settingsQueryOptions(),
    enabled: hotkey === undefined,
  });

  // Resolve the hotkey: prefer the caller-provided accelerator, otherwise fall
  // back to the configured one (default while it loads).
  useEffect(() => {
    const val =
      hotkey ?? settingsData?.[SETTINGS_KEYS.hotkey] ?? DEFAULT_HOTKEY;
    const tokens = formatAcceleratorKeys(val);
    if (tokens.length > 0) setHotkeyTokens(tokens);
  }, [hotkey, settingsData]);

  // Real hotkey events override the loop while held.
  useEffect(() => {
    const removeDown = window.api?.onHotkeyDown(() => {
      suspendedRef.current = true;
      livePressRef.current = true;
      // Reset amplitude so the wave starts flat until the pill warms up
      // the mic (usually within 100ms).
      audioLevelRef.current = 0;
      clearLoop();
      setPhase("pressed");
      if (interactive) onDictationRef.current?.();
    });
    const removeUp = window.api?.onHotkeyUp(() => {
      livePressRef.current = false;
      setPhase("result");
      clearLoop();
      timeoutRef.current = window.setTimeout(() => {
        if (interactive) {
          // Settle back to idle — no scripted loop to resume.
          setPhase("idle");
          return;
        }
        // Resume auto-loop on the next phase after a result hold.
        suspendedRef.current = false;
        stepRef.current = 0;
        tick();
      }, PHASE_STEPS[2][1]);
    });
    return () => {
      removeDown?.();
      removeUp?.();
    };
  }, [tick, clearLoop, interactive]);

  // Subscribe to live audio levels broadcast by the pill. Writing to a ref
  // (rather than state) avoids 60Hz re-renders.
  useEffect(() => {
    const remove = window.api?.onAudioLevel((level: number) => {
      audioLevelRef.current = level;
    });
    return () => remove?.();
  }, []);

  // Stable accessor — Wave's RAF effect depends on it; recreating it each
  // render would tear down and rebuild the RAF loop.
  const getLiveLevel = useCallback(
    () => (livePressRef.current ? audioLevelRef.current : null),
    [],
  );

  const pressed = phase === "pressed";
  const showResult = phase === "result";

  return (
    <div className="glass-panel relative flex flex-col items-center gap-5 rounded-[28px] px-8 py-7 transition-all">
      {/* Instructional sentence */}
      <div className="select-none text-center">
        <div className="serif text-foreground text-[34px] leading-[1.1] font-normal tracking-tight">
          <StepWord active={phase === "idle"}>Press</StepWord>{" "}
          <span className="inline-block align-middle">
            {hotkeyTokens.map((tok, i) => (
              <span key={`${tok}-${i}`} className="inline-block align-middle">
                {i > 0 && (
                  <span className="text-muted-foreground mx-1 text-[16px]">
                    +
                  </span>
                )}
                <FnKey pressed={pressed} label={tok} />
              </span>
            ))}
          </span>{" "}
          <StepWord active={pressed}>, speak,</StepWord>{" "}
          <StepWord active={showResult}>release.</StepWord>
        </div>
      </div>

      {/* Wave + status pill card */}
      <div
        className={cn(
          "relative w-full max-w-[560px] overflow-hidden border px-8 py-4 transition-all duration-300 backdrop-blur-md",
          interactive ? "rounded-[24px]" : "rounded-full",
          pressed
            ? "border-primary/60 bg-accent/80 shadow-inner"
            : "border-border/50 bg-secondary/50 shadow-xs",
        )}
      >
        <div className="mb-1.5 flex items-center justify-center gap-2">
          <span
            className={cn(
              "h-[7px] w-[7px] rounded-full transition-all duration-200",
              pressed
                ? "bg-primary opacity-100"
                : showResult
                  ? "bg-primary opacity-100"
                  : "bg-muted-foreground opacity-40",
            )}
            style={
              pressed ? { animation: "tdot 1.6s infinite ease-in-out" } : {}
            }
          />
          <span
            className={cn(
              "mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors",
              pressed
                ? "text-accent-foreground"
                : showResult
                  ? "text-accent-foreground"
                  : "text-muted-foreground",
            )}
          >
            {phase === "idle"
              ? "Ready"
              : pressed
                ? "Listening…"
                : interactive
                  ? "Pasted below"
                  : "Pasted to your app"}
          </span>
        </div>

        <div className="w-full py-0.5">
          <Wave pressed={pressed} getLiveLevel={getLiveLevel} />
        </div>

        {interactive ? (
          // Real practice area — focus it, hold the hotkey, and the
          // transcription pastes in just like in any other app.
          <Textarea
            autoFocus
            rows={3}
            aria-label="Practice dictation area"
            placeholder="Click here, hold your hotkey, and speak — your words land right here."
            className="placeholder:text-muted-foreground/70 text-foreground mt-2 block min-h-0 w-full resize-none border-none bg-transparent px-0 py-0 text-[17px] leading-[1.5] shadow-none outline-none focus-visible:border-none focus-visible:ring-0 dark:bg-transparent"
          />
        ) : (
          // Result transcript
          <div
            className="mt-1 min-h-[22px] text-center transition-all duration-300"
            style={{
              opacity: showResult ? 1 : 0,
              transform: showResult ? "translateY(0)" : "translateY(4px)",
            }}
          >
            <span className="serif text-foreground text-[16px] leading-[1.4]">
              "{SAMPLE_TRANSCRIPT}"
            </span>
          </div>
        )}
      </div>

      {/* CSS for the pulsing status dot */}
      <style>{`@keyframes tdot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.5 } }`}</style>
    </div>
  );
}

function StepWord({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        "serif-italic transition-colors duration-200",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FnKey — keycap that depresses on `pressed`.
// ---------------------------------------------------------------------------
function FnKey({
  pressed,
  label,
}: {
  pressed: boolean;
  label: string;
}): React.JSX.Element {
  const size = 38;
  return (
    <span
      className={cn(
        "mono inline-flex items-center justify-center align-middle font-semibold transition-all duration-150",
        pressed ? "text-accent-foreground" : "text-foreground",
      )}
      style={{
        height: size * 0.95,
        minWidth: size * 1.05,
        padding: "0 8px",
        borderRadius: size * 0.18,
        background: pressed ? "var(--accent)" : "var(--card)",
        border: `1.5px solid ${pressed ? "var(--primary)" : "var(--border)"}`,
        borderBottomWidth: pressed ? 1.5 : Math.max(2, size * 0.075),
        fontSize: size * 0.4,
        letterSpacing: "0.04em",
        transform: pressed ? `translateY(${size * 0.04}px)` : "translateY(0)",
        boxShadow: pressed
          ? `inset 0 -1px 0 rgba(20,12,4,0.06), 0 0 0 6px var(--accent)`
          : `0 1px 0 var(--border), 0 2px 2px -1px rgba(20,12,4,0.06)`,
        transitionTimingFunction: "cubic-bezier(0.3, 0.7, 0.4, 1)",
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Wave — filled symmetric audio waveform blob.
// Matches the classic voice-memo / Siri multi-peak symmetric waveform.
// Extends smoothly and symmetrically above and below the center line.
// ---------------------------------------------------------------------------
function Wave({
  pressed,
  getLiveLevel,
}: {
  pressed: boolean;
  getLiveLevel: () => number | null;
}): React.JSX.Element {
  const W = 520;
  const H = 76;
  const pathRef = useRef<SVGPathElement>(null);
  const smoothedAmpRef = useRef(0);

  useEffect(() => {
    const node = pathRef.current;
    if (!node) return;

    if (!pressed) {
      // Resting state: a refined, sleek tapered resting capsule
      smoothedAmpRef.current = 0;
      const N = 100;
      const top: string[] = [];
      const bot: string[] = [];
      for (let i = 0; i <= N; i++) {
        const tt = i / N;
        const x = (tt * W).toFixed(1);
        const env = Math.sin(Math.PI * tt);
        const h = (H * 0.035 * env).toFixed(2);
        top.push(`${x},${(H / 2 - parseFloat(h)).toFixed(2)}`);
        bot.unshift(`${x},${(H / 2 + parseFloat(h)).toFixed(2)}`);
      }
      node.setAttribute("d", `M ${top.join(" L ")} L ${bot.join(" L ")} Z`);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const N = 120;

      // Amplitude: live mic level or scripted breathing envelope
      const liveLevel = getLiveLevel();
      let amp: number;
      if (liveLevel !== null) {
        const target = Math.min(1, liveLevel * 1.8);
        smoothedAmpRef.current += (target - smoothedAmpRef.current) * 0.35;
        amp = Math.max(0.15, smoothedAmpRef.current);
      } else {
        amp =
          (0.68 + 0.32 * Math.sin(t * 1.5)) *
          (0.75 + 0.25 * Math.sin(t * 2.8 + 0.8));
      }

      // Dynamic peak heights modulated by time for organic fluidity
      const pCenter = 0.95 + 0.12 * Math.sin(t * 4.2);
      const pMidL = 0.72 + 0.15 * Math.sin(t * 3.6 + 1.2);
      const pMidR = 0.72 + 0.15 * Math.cos(t * 3.9 + 0.7);
      const pOutL = 0.42 + 0.10 * Math.sin(t * 5.1 + 2.1);
      const pOutR = 0.42 + 0.10 * Math.cos(t * 4.7 + 1.8);

      const top: string[] = [];
      const bot: string[] = [];

      for (let i = 0; i <= N; i++) {
        const tt = i / N;
        const x = (tt * W).toFixed(1);

        // Gaussian lobe synthesis for 5 distinct rounded peaks
        const gCenter = Math.exp(-Math.pow((tt - 0.5) / 0.095, 2)) * pCenter;
        const gMidL = Math.exp(-Math.pow((tt - 0.33) / 0.075, 2)) * pMidL;
        const gMidR = Math.exp(-Math.pow((tt - 0.67) / 0.075, 2)) * pMidR;
        const gOutL = Math.exp(-Math.pow((tt - 0.18) / 0.055, 2)) * pOutL;
        const gOutR = Math.exp(-Math.pow((tt - 0.82) / 0.055, 2)) * pOutR;

        // Base continuous wave floor so troughs curve smoothly
        const baseFloor = 0.08 * Math.sin(Math.PI * tt);
        const combined = Math.max(baseFloor, gCenter + gMidL + gMidR + gOutL + gOutR);

        // Outer flare envelope to pinch to a sharp point at the tips
        const taper = Math.pow(Math.sin(Math.PI * tt), 1.2);
        const h = Math.max(0.6, H * 0.45 * amp * combined * taper);

        top.push(`${x},${(H / 2 - h).toFixed(2)}`);
        bot.unshift(`${x},${(H / 2 + h).toFixed(2)}`);
      }

      node.setAttribute("d", `M ${top.join(" L ")} L ${bot.join(" L ")} Z`);
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [pressed, getLiveLevel]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      className="block"
      role="img"
      aria-label="Voice waveform"
    >
      <path
        ref={pathRef}
        fill={pressed ? "var(--accent-foreground)" : "var(--muted-foreground)"}
        fillOpacity={pressed ? 0.95 : 0.22}
        stroke="none"
        style={{
          transition: "fill 0.25s ease, fill-opacity 0.25s ease",
        }}
      />
    </svg>
  );
}
