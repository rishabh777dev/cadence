import { capture } from "@renderer/lib/analytics";
import {
  apiFetch,
  getApiBase,
  getClient,
  getServerToken,
  isRemoteServer,
  refreshApiBase,
} from "@renderer/lib/api";
import {
  applyNeedsAppContextForCleanup,
  refreshNeedsAppContextForCleanup,
} from "@renderer/lib/cleanup-app-context";
import { Recorder } from "@renderer/lib/recorder";
import { Streamer } from "@renderer/lib/streamer";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AudioPlaybackMode,
  normalizeAudioPlaybackMode,
} from "../../../shared/audio-playback";
import { SETTINGS_KEYS } from "../../../shared/settings-keys";

const BARS = 11;
const RISE = 0.7;
const FALL = 0.2;
const SVG_WIDTH = 54;
const SVG_HEIGHT = 16;

type PillState = "idle" | "initializing" | "recording" | "transcribing";

type BarMode = "connecting" | "listening" | "speaking";

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

let _soundEnabled = true;
let _outputMode = "paste";
let _audioPlaybackMode: AudioPlaybackMode = "off";
let _toneCtx: AudioContext | null = null;

/**
 * Whether any loaded plugin implements `beforeOutput` (a suppression-capable
 * output hook). Cached so the delivery hot path doesn't round-trip every time.
 * Drives the fail-closed policy in `deliverFinal`: when a hook exists and the
 * `/deliver` call fails, we must NOT paste the raw text (that would bypass a
 * redaction/PII plugin). Assumed absent until proven present.
 */
let _beforeOutputHookPresent = false;

async function refreshBeforeOutputHookPresence(): Promise<void> {
  try {
    const res = await getClient().api.output.hook.$get(
      {},
      { init: { signal: AbortSignal.timeout(3000) } },
    );
    if (res.ok) _beforeOutputHookPresent = (await res.json()).present;
  } catch {
    // Leave the last-known value; a stale "present" errs safe (fail closed).
  }
}

function getToneCtx(): AudioContext {
  if (!_toneCtx || _toneCtx.state === "closed") _toneCtx = new AudioContext();
  return _toneCtx;
}

type TonePreset = "start" | "stop";
const TONE_PRESETS: Record<TonePreset, { freq: number; ms: number }> = {
  start: { freq: 347, ms: 125 }, // F4
  stop: { freq: 255, ms: 125 }, // C4
};

async function playTone(preset: TonePreset, volume = 0.16): Promise<void> {
  if (!_soundEnabled) return;
  const { freq, ms } = TONE_PRESETS[preset];
  try {
    const ctx = getToneCtx();
    if (ctx.state === "suspended") await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    const dur = ms / 1000;
    const attack = Math.min(0.02, dur * 0.25);
    const g = gain.gain;
    g.setValueAtTime(0.0001, now);
    g.linearRampToValueAtTime(volume, now + attack);
    g.exponentialRampToValueAtTime(0.001, now + dur);
    g.linearRampToValueAtTime(0, now + dur + 0.012);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {}
}

function smoothBars(prev: number[], next: number[]): number[] {
  return prev.map((p, i) => {
    const n = next[i] ?? 0;
    const k = n > p ? RISE : FALL;
    return p + (n - p) * k;
  });
}

function generateWavePath(
  levels: number[],
  width: number,
  height: number,
  time = 0,
): string {
  const yCenter = height / 2;
  const N = 36;
  const MAX_HALF_HEIGHT = 5.2; // Strictly bounded half-height (max total wave height: 10.4px)
  const MIN_HALF_HEIGHT = 0.4; // Crisp subtle needle line when silent

  const topPoints: Array<{ x: number; y: number }> = [];
  const bottomPoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = u * width;
    const d = 2 * (u - 0.5); // -1 to 1

    // Smooth envelope tapering cleanly to 0 at both needle points
    const envelope = Math.max(0, Math.cos((d * Math.PI) / 2));
    const envelopeSq = envelope ** 1.8;

    // Interpolate audio level across frequency bins
    const levelIdx = u * (levels.length - 1);
    const lowIdx = Math.floor(levelIdx);
    const highIdx = Math.min(levels.length - 1, Math.ceil(levelIdx));
    const frac = levelIdx - lowIdx;
    const level =
      (levels[lowIdx] ?? 0) * (1 - frac) + (levels[highIdx] ?? 0) * frac;

    // Organic 5-peak undulating waveform ribbon matching user design
    const waveSin = Math.abs(Math.sin(u * Math.PI * 4 + time * 3.5));
    const waveHarmonic = Math.cos(u * Math.PI * 2 - time * 1.8) * 0.25 + 0.75;
    const lobeModulation = 0.35 + 0.65 * (waveSin * 0.7 + waveHarmonic * 0.3);

    const activeH = level * MAX_HALF_HEIGHT * envelopeSq * lobeModulation;
    const baseH = MIN_HALF_HEIGHT * envelopeSq;
    const h = Math.min(MAX_HALF_HEIGHT, Math.max(baseH, activeH));

    topPoints.push({ x, y: yCenter - h });
    bottomPoints.push({ x, y: yCenter + h });
  }

  // Smooth cubic bezier path across top curve
  let path = `M ${topPoints[0].x.toFixed(2)},${topPoints[0].y.toFixed(2)}`;

  for (let i = 0; i < topPoints.length - 1; i++) {
    const p0 = topPoints[Math.max(0, i - 1)];
    const p1 = topPoints[i];
    const p2 = topPoints[i + 1];
    const p3 = topPoints[Math.min(topPoints.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  // Mirrored bottom curve returning to start
  const reversedBottom = [...bottomPoints].reverse();
  for (let i = 0; i < reversedBottom.length - 1; i++) {
    const p0 = reversedBottom[Math.max(0, i - 1)];
    const p1 = reversedBottom[i];
    const p2 = reversedBottom[i + 1];
    const p3 = reversedBottom[Math.min(reversedBottom.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  path += " Z";
  return path;
}

const PILL_WIDTH = 76;
const PILL_HEIGHT = 28;

const pillInnerStyle: React.CSSProperties = {
  height: PILL_HEIGHT,
  minWidth: PILL_WIDTH,
  padding: "0 12px",
  borderRadius: 9999,
  background:
    "linear-gradient(135deg, rgba(28, 25, 24, 0.88) 0%, rgba(15, 14, 13, 0.92) 100%)",
  backdropFilter: "blur(16px)",
  color: "#FAF8F2",
  border: "1px solid rgba(217, 119, 87, 0.42)",
  boxShadow:
    "0 8px 24px -2px rgba(0, 0, 0, 0.55), 0 0 16px -2px rgba(217, 119, 87, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
  fontFamily: "'DM Sans', sans-serif",
  cursor: "grab",
  WebkitAppRegion: "drag",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.15s ease",
} as React.CSSProperties;

interface TranscribeResult {
  raw: string;
  cleaned: string;
  error?: string;
  cloudAuthRequired?: boolean;
  usageExceeded?: boolean;
  providerCategory?: string;
  /**
   * Terminal pipeline disposition from the server. A plugin that called
   * `api.control.consume()`/`abort()` in a server hook resolves to
   * `"suppressed"`/`"aborted"` here, and the dictation is dropped without
   * delivery. Defaults to `"deliver"` for older server responses.
   */
  disposition?: "deliver" | "suppressed" | "aborted";
}

/**
 * Error text attached to usage-limit results. The interactive prompt (with an
 * "Upgrade to Pro" action) is shown by the main process via
 * `window.api.cloudPromptUpgrade()` — this string only surfaces where a plain
 * error message is needed.
 */
const USAGE_LIMIT_DIALOG_MESSAGE =
  "You've used your free Cadence Cloud dictation for this week. Upgrade to Pro for unlimited dictation, or switch to a local or bring-your-own-key model in Settings > Models.";

/**
 * The app context (process name + window title) can contain characters
 * outside ISO-8859-1 — e.g. a Cyrillic file path in the Notepad++ title
 * bar. HTTP header values only allow Latin-1, so passing the raw JSON
 * makes fetch() throw "Failed to execute 'fetch'". Percent-encode it so
 * the header is always byte-safe; the server decodes it back.
 */
function encodeAppContext(context: string): string {
  return encodeURIComponent(context);
}

interface QueueEntry {
  promise: Promise<TranscribeResult>;
}

export default function AppPage(): React.JSX.Element {
  const [state, setState] = useState<PillState>("idle");
  const stateRef = useRef<PillState>("idle");
  const setPillState = useCallback((next: PillState) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const [pillAlign, setPillAlign] = useState<"start" | "end">("end");
  const [pillSide, setPillSide] = useState<"center" | "right">("center");

  const supportsSessionTransportRef = useRef(false);
  const recordingSessionUsesTransportRef = useRef(false);
  const providerCategoryRef = useRef<string | null>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [isMagicEdit, setIsMagicEdit] = useState(false);
  const isMagicEditRef = useRef(false);
  const selectedTextRef = useRef<string>("");

  const recorderRef = useRef(new Recorder());
  const streamerRef = useRef<Streamer | null>(null);
  const analyserCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const barsRef = useRef<number[]>(new Array(BARS).fill(0));
  const barsSvgRef = useRef<SVGSVGElement>(null);
  const volumeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const wantsMicRef = useRef(false);
  /** True only while state is "recording" — used by the queue drain wait loop. */
  const recordingActiveRef = useRef(false);
  const appContextRef = useRef<string | null>(null);
  const pendingCommitRef = useRef(false);
  const pillActiveRef = useRef(false);
  // Tracks the in-flight prepareSystemAudio() (ducking) call. Ducking runs
  // concurrently with mic acquisition, so every restore must wait for this
  // to settle — otherwise a restore that lands before the duck applies is a
  // no-op and leaves the system volume stuck low.
  const duckingPromiseRef = useRef<Promise<unknown> | undefined>(undefined);
  const barModeRef = useRef<BarMode | null>(null);
  const scanIndexRef = useRef(0);
  const scanTickRef = useRef(0);
  const speakingStartRef = useRef(0);
  const lastIpcTimeRef = useRef(0);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const queueRef = useRef<QueueEntry[]>([]);
  const drainingRef = useRef(false);
  const streamResolverRef = useRef<((r: TranscribeResult) => void) | null>(
    null,
  );
  const drainAgainRef = useRef(false);
  // Set when the user presses the hotkey to start a new dictation while a
  // streaming commit is still finalizing. The single WebSocket/PCM buffer can't
  // host two streaming sessions at once, so instead of dropping the press we
  // replay it once the pending commit resolves.
  const pendingReRecordRef = useRef(false);

  const isTranscriptionIdle = useCallback(
    (): boolean =>
      queueRef.current.length === 0 &&
      !drainingRef.current &&
      streamResolverRef.current === null,
    [],
  );

  // ---- Queue drain ----
  // biome-ignore lint/correctness/useExhaustiveDependencies: drainQueue only reads refs plus hidePill, which is declared later in this component, so adding it to the deps array would reference it before initialization (TDZ). The empty array is intentional.
  const drainQueue = useCallback(async () => {
    if (drainingRef.current) {
      drainAgainRef.current = true;
      return;
    }
    drainingRef.current = true;

    try {
      while (recordingActiveRef.current && pillActiveRef.current) {
        await new Promise((r) => setTimeout(r, 100));
      }

      if (!pillActiveRef.current || queueRef.current.length === 0) {
        return;
      }

      const batch = [...queueRef.current];
      queueRef.current = [];

      const results = await Promise.all(batch.map((e) => e.promise));

      if (!pillActiveRef.current) {
        return;
      }

      // A dictation is deliverable only when it has text AND the server
      // didn't mark it suppressed/aborted (a plugin calling
      // `api.control.consume()`/`abort()` in a server hook). Absent
      // disposition (older responses) is treated as "deliver".
      const isDeliverable = (r: TranscribeResult): boolean =>
        !!r.raw.trim() && (r.disposition ?? "deliver") === "deliver";

      if (
        recordingActiveRef.current ||
        wantsMicRef.current ||
        queueRef.current.length > 0
      ) {
        const resolved = results
          .filter(isDeliverable)
          .map((r) => ({ promise: Promise.resolve(r) }));
        queueRef.current = [...resolved, ...queueRef.current];
        return;
      }

      const nonEmpty = results.filter(isDeliverable);
      if (nonEmpty.length === 0) {
        if (results.some((r) => r.cloudAuthRequired)) {
          hidePill();
          void window.api.cloudPromptSignIn();
          return;
        }
        if (results.some((r) => r.usageExceeded)) {
          hidePill();
          void window.api.cloudPromptUpgrade();
          return;
        }
        const errMsg = results.find((r) => r.error)?.error;
        if (errMsg) {
          hidePill();
          window.api.showErrorDialog("Transcription Failed", errMsg);
        } else if (wantsMicRef.current) {
          // Re-record may have resolved the in-flight stream with an empty
          // result; a new recording is starting — keep the pill visible.
          return;
        } else {
          hidePill();
        }
        return;
      }

      let finalText: string;

      if (nonEmpty.length === 1) {
        finalText = nonEmpty[0].cleaned.trim() || nonEmpty[0].raw.trim();
      } else {
        const combined = nonEmpty.map((r) => r.raw).join(" ");
        try {
          const res = await getClient().api["post-process"].$post({
            json: {
              text: combined,
              appContext: appContextRef.current,
            },
          });
          if (!pillActiveRef.current) {
            return;
          }
          if (res.ok) {
            const data = await res.json();
            // A plugin that consumed/aborted during the multi-segment merge
            // suppresses delivery: keep the text empty so it's dropped below,
            // rather than falling back to the combined raw.
            finalText =
              data.disposition && data.disposition !== "deliver"
                ? ""
                : data.cleaned || combined;
          } else if (res.status === 401) {
            const body = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            if (body?.error === "cloud_auth_required") {
              hidePill();
              void window.api.cloudPromptSignIn();
              return;
            }
            finalText = combined;
          } else {
            finalText = combined;
          }
        } catch {
          finalText = combined;
        }
      }

      if (!pillActiveRef.current) {
        return;
      }

      if (recordingActiveRef.current || queueRef.current.length > 0) {
        queueRef.current = [
          { promise: Promise.resolve({ raw: finalText, cleaned: finalText }) },
          ...queueRef.current,
        ];
        return;
      }

      try {
        const requestedMode =
          _outputMode === "clipboard" ? "clipboard" : "paste";
        let deliverText = finalText;
        let deliverMode: "paste" | "clipboard" = requestedMode;
        let shouldDeliver = true;

        // Run the `beforeOutput` plugin hook server-side only when a hook is
        // actually registered, avoiding an unnecessary HTTP roundtrip on normal dictations.
        if (_beforeOutputHookPresent) {
          try {
            const res = await getClient().api.output.deliver.$post({
              json: {
                text: finalText,
                mode: requestedMode,
                appContext: appContextRef.current,
              },
            });
            if (res.ok) {
              const data = await res.json();
              deliverText = data.output.text;
              deliverMode =
                data.output.mode === "clipboard" ? "clipboard" : "paste";
              shouldDeliver = data.disposition === "deliver";
              void refreshBeforeOutputHookPresence();
            } else {
              shouldDeliver = false;
            }
          } catch {
            shouldDeliver = false;
            console.warn(
              "[pill] beforeOutput unreachable; suppressing delivery (fail-closed)",
            );
          }
        }

        if (shouldDeliver && deliverText.trim()) {
          if (deliverMode === "clipboard") {
            await window.api.copyText(deliverText, appContextRef.current);
          } else {
            await window.api.pasteText(deliverText, appContextRef.current);
          }
        }
      } catch (err) {
        console.error("[pill] paste/copy failed:", err);
      }
      window.api.sendTranscriptionDone();

      // North-star usage metric: fires exactly once per completed dictation,
      // at the single point where single-chunk and multi-chunk paths converge
      // and text is delivered to the user.
      const providerCategory =
        nonEmpty.find((r) => r.providerCategory)?.providerCategory ??
        providerCategoryRef.current ??
        undefined;
      capture("dictation completed", {
        segments: nonEmpty.length,
        multi_segment: nonEmpty.length > 1,
        output_mode: _outputMode,
        char_count: finalText.length,
        provider_category: providerCategory,
      });

      if (
        !recordingActiveRef.current &&
        queueRef.current.length === 0 &&
        pillActiveRef.current
      ) {
        hidePill();
      }
    } finally {
      drainingRef.current = false;
      if (drainAgainRef.current) {
        drainAgainRef.current = false;
        void drainQueue();
      } else if (
        pillActiveRef.current &&
        stateRef.current === "transcribing" &&
        !wantsMicRef.current &&
        !recordingActiveRef.current &&
        isTranscriptionIdle()
      ) {
        hidePill();
      }
    }
  }, []);

  // ---- REST fallback (full recorded WAV kept by the streamer) ----
  const restFallbackTranscribe = useCallback(
    (errorMsg: string): Promise<TranscribeResult> | null => {
      const wavBlob = streamerRef.current?.getWavBlob() ?? null;
      if (!wavBlob) return null;
      const headers: Record<string, string> = {
        "Content-Type": "audio/wav",
        "x-audio-duration-ms": String(Date.now() - startTimeRef.current),
      };
      if (appContextRef.current)
        headers["x-app-context"] = encodeAppContext(appContextRef.current);
      if (queueRef.current.length > 0 || drainingRef.current)
        headers["x-skip-post-process"] = "true";
      return apiFetch("/api/transcribe", {
        method: "POST",
        body: wavBlob,
        headers,
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            if (res.status === 401 && body?.error === "cloud_auth_required") {
              return {
                raw: "",
                cleaned: "",
                error: "Sign in to Cadence Transcribe",
                cloudAuthRequired: true,
              };
            }
            if (res.status === 429 && body?.error === "usage_exceeded") {
              return {
                raw: "",
                cleaned: "",
                error: USAGE_LIMIT_DIALOG_MESSAGE,
                usageExceeded: true,
              };
            }
            return { raw: "", cleaned: "", error: errorMsg };
          }
          const data = (await res.json()) as {
            raw?: string;
            cleaned?: string;
            provider_category?: string;
          };
          return {
            raw: (data.raw || "").trim(),
            cleaned: (data.cleaned || data.raw || "").trim(),
            providerCategory: data.provider_category,
          };
        })
        .catch(() => ({ raw: "", cleaned: "", error: errorMsg }));
    },
    [],
  );

  // ---- Streamer (lazy singleton, only created when streaming is enabled) ----
  // biome-ignore lint/correctness/useExhaustiveDependencies: singleton
  const getStreamer = useCallback((): Streamer => {
    if (!streamerRef.current) {
      streamerRef.current = new Streamer(getApiBase(), getServerToken(), {
        onConfig: (config) => {
          // Only update support for *future* sessions. The per-session decision
          // (recordingSessionUsesTransportRef) is latched once in startRecording
          // and must never be mutated mid-session: a config arriving after the
          // first recording has already committed to the batch path would flip
          // commit to the streaming path, which captured no audio → "No audio
          // captured". This is the first-dictation-after-restart failure.
          supportsSessionTransportRef.current = config.sessionTransport;
          if (config.providerCategory) {
            providerCategoryRef.current = config.providerCategory;
          }
        },
        onReady: () => {},
        onPartial: () => {},
        onFinal: (text) => {
          const resolver = streamResolverRef.current;
          if (!resolver) return;
          streamResolverRef.current = null;
          // A short clip can stream to a live provider that finalizes before it
          // has recognized any words (cold Soniox/Freestyle Cloud session), so
          // the streaming final comes back empty even though audio was captured.
          // Salvage via the batch REST path with the recorded WAV the streamer
          // still has buffered — the same clip transcribes fine one-shot. If no
          // WAV exists (genuine silence) the empty result stands.
          if (!text.trim()) {
            const fallback = restFallbackTranscribe("");
            if (fallback) {
              void fallback.then(resolver);
              return;
            }
          }
          resolver({ raw: text, cleaned: text });
        },
        onCleaned: () => {},
        onError: (msg, code) => {
          const resolver = streamResolverRef.current;
          // Cloud auth expiry and usage limits are terminal — don't fall back
          // to REST (it would just re-hit the same cloud error). Surface them
          // directly, or flag the pending result so the drain loop does.
          if (code === "cloud_auth_required") {
            streamResolverRef.current = null;
            if (resolver) {
              resolver({ raw: "", cleaned: "", cloudAuthRequired: true });
            } else if (pillActiveRef.current) {
              hidePill();
              void window.api.cloudPromptSignIn();
            }
            return;
          }
          if (code === "usage_exceeded") {
            streamResolverRef.current = null;
            if (resolver) {
              resolver({ raw: "", cleaned: "", usageExceeded: true });
            } else if (pillActiveRef.current) {
              hidePill();
              void window.api.cloudPromptUpgrade();
            }
            return;
          }
          if (resolver) {
            streamResolverRef.current = null;
            const fallback = restFallbackTranscribe(msg);
            if (fallback) {
              void fallback.then(resolver);
              return;
            }
            resolver({ raw: "", cleaned: "", error: msg });
            return;
          }
          if (!supportsSessionTransportRef.current) return;
          if (!pillActiveRef.current) return;
          if (wantsMicRef.current) return;
          hidePill();
          window.api.showErrorDialog("Transcription Failed", msg);
        },
      });
    }
    return streamerRef.current;
  }, []);

  // ---- Wave ribbon animation loop ----
  const applyBarsToSvg = useCallback(() => {
    const svg = barsSvgRef.current;
    if (!svg) return;
    const path = svg.querySelector<SVGPathElement>("path.wave-path");
    if (!path) return;
    const time = (performance.now() - speakingStartRef.current) / 1000;
    path.setAttribute(
      "d",
      generateWavePath(barsRef.current, SVG_WIDTH, SVG_HEIGHT, time),
    );
  }, []);

  const runBars = useCallback(() => {
    const mode = barModeRef.current;
    if (!mode) return;

    if (mode === "connecting") {
      // Flat clean baseline when initializing
      barsRef.current = smoothBars(barsRef.current, new Array(BARS).fill(0));
      volumeRef.current = 0;
    } else if (mode === "listening") {
      const analyser = analyserNodeRef.current;
      const dataArray = freqDataRef.current;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const VOICE_MIN = 80;
        const VOICE_MAX = 4200;

        const sampleRate = analyser.context.sampleRate;
        const binWidth = sampleRate / analyser.fftSize;

        const startBin = Math.max(0, Math.floor(VOICE_MIN / binWidth));
        const endBin = Math.min(
          analyser.frequencyBinCount,
          Math.ceil(VOICE_MAX / binWidth),
        );

        // Compute overall voice level
        let sum = 0;
        for (let i = startBin; i < endBin; i++) {
          sum += dataArray[i];
        }

        const voiceLevel = sum / (Math.max(1, endBin - startBin) * 255);

        const raw: number[] = [];
        const center = (BARS - 1) / 2;
        const sigma = BARS / 3.4;
        const binCount = Math.max(1, endBin - startBin);

        // Only wave when actual voice comes into the mic. Otherwise, perfectly flat line!
        if (voiceLevel > 0.016) {
          for (let i = 0; i < BARS; i++) {
            const distance = i - center;
            const weight = Math.exp(
              -(distance * distance) / (2 * sigma * sigma),
            );
            const sampleIndex =
              startBin + Math.floor((i / (BARS - 1)) * (binCount - 1));

            const freqEnergy = dataArray[sampleIndex] / 255;
            const localVariation = 0.75 + freqEnergy * 0.5;

            const activeVal = voiceLevel * weight * localVariation * 3.6;
            raw.push(Math.min(1, Math.max(0, activeVal)));
          }
        } else {
          for (let i = 0; i < BARS; i++) {
            raw.push(0);
          }
        }

        barsRef.current = smoothBars(barsRef.current, raw);

        const volume = Math.min(1, voiceLevel * 2.5);
        volumeRef.current = volume;
        const now = performance.now();
        if (now - lastIpcTimeRef.current >= 100) {
          lastIpcTimeRef.current = now;
          window.api?.sendAudioLevel(volume);
        }
      }
    } else if (mode === "speaking") {
      const time = (performance.now() - speakingStartRef.current) / 1000;
      const raw: number[] = [];
      const center = (BARS - 1) / 2;
      if (isMagicEditRef.current) {
        for (let i = 0; i < BARS; i++) {
          const dist = Math.abs(i - center);
          const env = Math.exp(-(dist * dist) / 22);
          const wave1 = Math.sin(time * 5.5 + i * 0.65) * 0.4 + 0.5;
          const wave2 = Math.cos(time * 3.2 - i * 0.45) * 0.25;
          raw.push(Math.max(0.08, (wave1 + wave2) * env * 0.8));
        }
      } else {
        for (let i = 0; i < BARS; i++) {
          const dist = Math.abs(i - center);
          const env = Math.exp(-(dist * dist) / 16);
          const wave1 = Math.sin(time * 4.5 + i * 0.5) * 0.4 + 0.45;
          raw.push(Math.max(0, wave1 * env * 0.65));
        }
      }
      barsRef.current = smoothBars(barsRef.current, raw);
      volumeRef.current = 0.3;
    }

    applyBarsToSvg();
    rafRef.current = requestAnimationFrame(runBars);
  }, [applyBarsToSvg]);

  // ---- Visualization control ----
  const startBarAnimation = useCallback(
    (mode: BarMode) => {
      cancelAnimationFrame(rafRef.current);
      barModeRef.current = mode;
      if (mode === "connecting") {
        scanIndexRef.current = 0;
        scanTickRef.current = performance.now();
      } else if (mode === "speaking") {
        speakingStartRef.current = performance.now();
      }
      rafRef.current = requestAnimationFrame(runBars);
    },
    [runBars],
  );

  const startListening = useCallback(
    (stream: MediaStream) => {
      if (
        !analyserCtxRef.current ||
        analyserCtxRef.current.state === "closed"
      ) {
        analyserCtxRef.current = new AudioContext();
      }
      const ctx = analyserCtxRef.current;
      try {
        audioSourceRef.current?.disconnect();
      } catch {}
      try {
        analyserNodeRef.current?.disconnect();
      } catch {}

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      audioSourceRef.current = source;
      analyserNodeRef.current = analyser;
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      startBarAnimation("listening");
    },
    [startBarAnimation],
  );

  const stopVisualization = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    barModeRef.current = null;
    try {
      audioSourceRef.current?.disconnect();
    } catch {}
    try {
      analyserNodeRef.current?.disconnect();
    } catch {}
    audioSourceRef.current = null;
    analyserNodeRef.current = null;
    freqDataRef.current = null;
    barsRef.current = new Array(BARS).fill(0);
    volumeRef.current = 0;
  }, []);

  // ---- Hide pill ----
  const hidePill = useCallback(() => {
    setPillState("idle");
    setPendingCount(0);
    wantsMicRef.current = false;
    pillActiveRef.current = false;
    isMagicEditRef.current = false;
    selectedTextRef.current = "";
    setIsMagicEdit(false);
    queueRef.current = [];
    drainingRef.current = false;
    drainAgainRef.current = false;
    recordingActiveRef.current = false;
    streamResolverRef.current = null;
    pendingReRecordRef.current = false;
    stopVisualization();
    window.api.hidePill();
  }, [stopVisualization, setPillState]);

  const resumeTranscribingOrHide = useCallback(() => {
    if (isTranscriptionIdle()) {
      hidePill();
    } else {
      setPillState("transcribing");
      startBarAnimation("speaking");
      void drainQueue();
    }
  }, [
    hidePill,
    setPillState,
    startBarAnimation,
    drainQueue,
    isTranscriptionIdle,
  ]);

  // Restore the system volume, but only after any in-flight duck has settled
  // so the restore can't be a no-op that leaves the volume stuck low.
  const restoreSystemAudioSafely = useCallback(async (): Promise<void> => {
    try {
      await duckingPromiseRef.current;
      await window.api?.restoreSystemAudio();
    } catch {}
  }, []);

  // ---- Start recording ----
  const startRecording = useCallback(
    async (forReRecord = false) => {
      if (wantsMicRef.current) {
        return;
      }
      wantsMicRef.current = true;
      pillActiveRef.current = true;
      pendingCommitRef.current = false;
      startTimeRef.current = Date.now();

      // Warm the pipeline while the user is speaking so submission doesn't pay
      // startup latency: the local ASR server (whisper/mlx) model load and the
      // cloud cleanup LLM connection (e.g. Groq TLS handshake). Fire-and-forget:
      // the server decides what needs warming (no-op where nothing applies), and
      // lazy start at submission remains the fallback if this doesn't land.
      // Skip for Magic Edit — it uses its own STT+LLM pipeline, not the dictation pre-warm.
      if (!isMagicEditRef.current) {
        void getClient()
          .api.transcribe["pre-warm"].$post()
          .catch(() => {});
      }

      appContextRef.current = null;
      // Streaming is always active — prime the streamer's context.
      try {
        getStreamer().setContext(null);
      } catch {}

      void refreshNeedsAppContextForCleanup().then((needsAppContext) => {
        if (!needsAppContext || !wantsMicRef.current) return;
        void window.api
          ?.getFrontmostApp()
          .then((app) => {
            if (!wantsMicRef.current) return;
            appContextRef.current = app;
            try {
              getStreamer().setContext(app);
            } catch {}
          })
          .catch(() => {
            if (!wantsMicRef.current) return;
            appContextRef.current = null;
            try {
              getStreamer().setContext(null);
            } catch {}
          });
      });

      setPillState("initializing");
      startBarAnimation("connecting");

      // Play the start cue immediately, before ducking lowers the system
      // volume — otherwise the tone is attenuated to DUCKED_VOLUME and is
      // effectively inaudible.
      playTone("start");

      // Duck/pause system audio concurrently with mic acquisition. The pause
      // path can spawn a slow media-control subprocess; awaiting it before
      // getUserMedia is what made the "initializing" state drag on. Restores
      // go through restoreSystemAudioSafely(), which waits on this promise so a
      // cancel can't race the duck.
      duckingPromiseRef.current =
        _audioPlaybackMode !== "off"
          ? window.api?.prepareSystemAudio(_audioPlaybackMode).catch(() => {})
          : undefined;

      try {
        recordingSessionUsesTransportRef.current =
          supportsSessionTransportRef.current;

        // Acquire stream directly
        const stream = recordingSessionUsesTransportRef.current
          ? await recorderRef.current.acquireStream()
          : await recorderRef.current.start();

        if (!wantsMicRef.current) {
          recorderRef.current.cancel();
          recorderRef.current.releaseStream();
          void restoreSystemAudioSafely();
          streamerRef.current?.cancel();
          if (forReRecord) {
            resumeTranscribingOrHide();
          }
          return;
        }

        setPillState("recording");
        recordingActiveRef.current = true;

        startListening(stream);
        try {
          await getStreamer().startCapture(stream);
        } catch {}

        if (pendingCommitRef.current) {
          pendingCommitRef.current = false;
          void commitRecording();
          return;
        }
      } catch (err) {
        pendingCommitRef.current = false;
        recorderRef.current.releaseStream();
        void restoreSystemAudioSafely();
        hidePill();
        window.api.showErrorDialog(
          "Recording Failed",
          err instanceof Error ? err.message : "Mic access denied",
        );
      }
    },
    [
      startBarAnimation,
      startListening,
      hidePill,
      getStreamer,
      setPillState,
      resumeTranscribingOrHide,
      restoreSystemAudioSafely,
    ],
  );

  // ---- Commit recording ----
  const commitRecording = useCallback(async () => {
    wantsMicRef.current = false;
    recordingActiveRef.current = false;

    // Restore the system volume first, then play the stop cue so it isn't
    // muted by ducking. Fire-and-forget so the transcription pipeline below
    // isn't blocked on the restore. This runs on every commit path, so the
    // branches below don't restore again. Gate on whether this session ducked
    // (not the current mode setting, which can change mid-recording) so a
    // toggle to "off" while recording can't strand the volume low.
    void (async () => {
      if (duckingPromiseRef.current) {
        await restoreSystemAudioSafely();
      }
      playTone("stop");
    })();

    try {
      audioSourceRef.current?.disconnect();
    } catch {}
    try {
      analyserNodeRef.current?.disconnect();
    } catch {}
    audioSourceRef.current = null;
    analyserNodeRef.current = null;
    freqDataRef.current = null;

    const recordingDuration = Date.now() - startTimeRef.current;
    if (recordingDuration < 250) {
      recorderRef.current.cancel();
      recorderRef.current.releaseStream();
      streamerRef.current?.cancel();
      window.api?.sendRecordingCancelled();
      resumeTranscribingOrHide();
      return;
    }

    window.api?.sendRecordingCommitted();
    setPillState("transcribing");
    startBarAnimation("speaking");

    if (isMagicEditRef.current) {
      try {
        const selected = selectedTextRef.current;

        let wavBlob: Blob | null = null;
        try {
          if (streamerRef.current) {
            wavBlob = streamerRef.current.getWavBlob();
          }
          if (!wavBlob && recorderRef.current.isRecording()) {
            wavBlob = await recorderRef.current.stop();
          }
        } catch (e) {
          console.warn("Failed to stop recorder", e);
        }
        recorderRef.current.releaseStream();
        try {
          streamerRef.current?.cancel();
        } catch {}

        if (!pillActiveRef.current) {
          return;
        }

        if (!wavBlob || wavBlob.size <= 44) {
          // User tapped or released without speaking — exit cleanly and silently like standard dictation
          return;
        }

        setPendingCount(1);
        const formData = new FormData();
        formData.append("audio", wavBlob, "magic-edit.wav");
        formData.append("selectedText", selected);

        const headers: Record<string, string> = {};
        if (appContextRef.current) {
          headers["x-app-context"] = encodeAppContext(appContextRef.current);
        }

        const res = await apiFetch("/api/magic-edit", {
          method: "POST",
          body: formData,
          headers,
        });

        if (res.ok) {
          const data = (await res.json()) as { editedText?: string };
          if (data.editedText) {
            await window.api.pasteText(data.editedText, appContextRef.current);
          }
        } else {
          const errBody = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          const errMsg = errBody?.error ?? "Transformation failed.";
          // Only show popup for critical setup errors (e.g. invalid API key), not for silent cancels or empty speech
          if (
            !errMsg.toLowerCase().includes("no spoken instruction") &&
            !errMsg.toLowerCase().includes("no audio")
          ) {
            window.api.showErrorDialog("Magic Edit", errMsg);
          }
        }
      } catch (err) {
        // Suppress benign abort/cancel errors
        const msg = err instanceof Error ? err.message : String(err);
        if (
          !msg.toLowerCase().includes("abort") &&
          !msg.toLowerCase().includes("cancel")
        ) {
          window.api.showErrorDialog("Magic Edit", msg);
        }
      } finally {
        isMagicEditRef.current = false;
        setIsMagicEdit(false);
        hidePill();
      }
      return;
    }

    // Streaming session transport path: the streamer already has the audio —
    // commit it over the WebSocket and wait for the server's final message.
    if (recordingSessionUsesTransportRef.current && streamerRef.current) {
      recorderRef.current.cancel();
      recorderRef.current.releaseStream();

      setPendingCount((c) => c + 1);
      const transcribePromise = new Promise<TranscribeResult>((resolve) => {
        streamResolverRef.current = resolve;
        // Server-side commit timeouts fire at 12s; if no final arrived by
        // 15s the stream is dead — salvage via REST with the recorded WAV.
        setTimeout(() => {
          if (streamResolverRef.current === resolve) {
            streamResolverRef.current = null;
            const fallback = restFallbackTranscribe("Transcription timed out");
            if (fallback) {
              void fallback.then(resolve);
            } else {
              resolve({
                raw: "",
                cleaned: "",
                error: "Transcription timed out",
              });
            }
          }
        }, 15_000);
      });
      streamerRef.current.commit();
      queueRef.current.push({
        promise: transcribePromise.finally(() => {
          setPendingCount((c) => Math.max(0, c - 1));
          // Replay a re-record press that arrived while this commit was
          // finalizing (see the hotkey-down handler). Only when nothing else
          // has already taken the mic.
          if (pendingReRecordRef.current && !wantsMicRef.current) {
            pendingReRecordRef.current = false;
            void startRecording(true);
          }
        }),
      });
      void drainQueue();
      return;
    }

    const wavBlob = recorderRef.current.isRecording()
      ? await recorderRef.current.stop()
      : null;
    recorderRef.current.releaseStream();

    if (!pillActiveRef.current) {
      return;
    }

    if (!wavBlob) {
      if (isTranscriptionIdle()) {
        hidePill();
        window.api.showErrorDialog(
          "Recording Failed",
          "No audio captured. Try recording again.",
        );
      } else {
        resumeTranscribingOrHide();
      }
      return;
    }

    const isSubsequent = queueRef.current.length > 0 || drainingRef.current;
    const headers: Record<string, string> = {
      "Content-Type": "audio/wav",
      "x-audio-duration-ms": String(recordingDuration),
    };
    if (appContextRef.current)
      headers["x-app-context"] = encodeAppContext(appContextRef.current);
    if (isSubsequent) headers["x-skip-post-process"] = "true";

    const serverOk = await refreshApiBase();
    if (!serverOk) {
      hidePill();
      window.api.showErrorDialog(
        "Server Unreachable",
        isRemoteServer()
          ? `Cannot reach the server at ${getApiBase()}. Check the server URL in Settings → Network, or reset to the local server.`
          : `Cannot reach Cadence server at ${getApiBase()}. Quit and reopen the app.`,
      );
      return;
    }

    setPendingCount((c) => c + 1);
    const transcribePromise: Promise<TranscribeResult> = apiFetch(
      "/api/transcribe",
      { method: "POST", body: wavBlob, headers },
    )
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
            detail?: string;
          } | null;
          if (res.status === 401 && body?.error === "cloud_auth_required") {
            return {
              raw: "",
              cleaned: "",
              error: "Sign in to Cadence Transcribe",
              cloudAuthRequired: true,
            };
          }
          if (res.status === 429 && body?.error === "usage_exceeded") {
            return {
              raw: "",
              cleaned: "",
              error: USAGE_LIMIT_DIALOG_MESSAGE,
              usageExceeded: true,
            };
          }
          const msg =
            body?.detail ||
            body?.error ||
            `Transcription failed (${res.status})`;
          return { raw: "", cleaned: "", error: msg };
        }
        const data = (await res.json()) as {
          raw?: string;
          cleaned?: string;
          provider_category?: string;
          disposition?: "deliver" | "suppressed" | "aborted";
        };
        return {
          raw: (data.raw || "").trim(),
          cleaned: (data.cleaned || data.raw || "").trim(),
          providerCategory: data.provider_category,
          disposition: data.disposition,
        };
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Transcription failed";
        const hint =
          msg.includes("fetch") || msg.includes("Failed")
            ? isRemoteServer()
              ? ` (${getApiBase()} unreachable — check Settings → Network)`
              : ` (${getApiBase()} unreachable — quit and reopen the app)`
            : "";
        return { raw: "", cleaned: "", error: `${msg}${hint}` };
      })
      .finally(() => {
        setPendingCount((c) => Math.max(0, c - 1));
      });

    queueRef.current.push({ promise: transcribePromise });
    drainQueue();
  }, [
    hidePill,
    drainQueue,
    startBarAnimation,
    setPillState,
    resumeTranscribingOrHide,
    isTranscriptionIdle,
    restoreSystemAudioSafely,
    restFallbackTranscribe,
    startRecording,
  ]);

  // ---- Cancel ----
  const cancelRecording = useCallback(() => {
    recorderRef.current.cancel();
    recorderRef.current.releaseStream();
    void restoreSystemAudioSafely();
    streamerRef.current?.cancel();
    window.api?.sendRecordingCancelled();
    hidePill();
  }, [hidePill, restoreSystemAudioSafely]);

  // ---- Preferences ----
  const applyPillPosition = useCallback((pos: string | null | undefined) => {
    const isTop =
      pos === "top-center" || pos === "top-right" || pos === "custom-top";
    setPillAlign(isTop ? "start" : "end");
    setPillSide(pos?.endsWith("right") ? "right" : "center");
  }, []);

  useEffect(() => {
    // Read every persisted preference in a single request instead of one GET
    // per key. Missing keys are simply absent from the map (no 404s), and the
    // legacy audio-playback fallbacks read from the same snapshot.
    getClient()
      .api.settings.$get()
      .then((r) => (r.ok ? r.json() : null))
      .then((settings) => {
        if (!settings) return;

        if (settings[SETTINGS_KEYS.soundEnabled] === "false") {
          _soundEnabled = false;
        }

        const mode = settings.audio_playback_mode;
        if (mode) {
          _audioPlaybackMode = normalizeAudioPlaybackMode(mode);
        } else if (settings.pause_playback_while_recording === "true") {
          _audioPlaybackMode = "pause";
        } else {
          _audioPlaybackMode =
            settings.audio_ducking_enabled === "true" ? "duck" : "off";
        }

        const outputMode = settings[SETTINGS_KEYS.outputMode];
        if (outputMode) _outputMode = outputMode;

        // Warm the cleanup-context cache from the same snapshot instead of
        // firing a second GET /api/settings.
        applyNeedsAppContextForCleanup(settings);
      })
      .catch(() => {});

    // Streaming is always active. Eagerly create the Streamer so the WebSocket
    // connects and the onConfig callback (which sets supportsSessionTransportRef)
    // fires before the first recording. Session-transport support is negotiated
    // per provider — non-streaming providers fall back to the batch path.
    getStreamer();
    window.api
      ?.getPillPosition()
      .then(applyPillPosition)
      .catch(() => {});
    // Prime the `beforeOutput` hook-presence cache so the very first dictation's
    // delivery already applies the correct fail-closed policy.
    void refreshBeforeOutputHookPresence();

    // Listen for live changes from the settings UI
    const removePillPos = window.api?.onPillPositionChanged(applyPillPosition);
    const removeOutputMode = window.api?.onOutputModeChanged((mode) => {
      _outputMode = mode;
    });
    const removeAudioDucking = window.api?.onAudioDuckingChanged((enabled) => {
      _audioPlaybackMode = enabled ? "duck" : "off";
    });
    const removeAudioPlaybackMode = window.api?.onAudioPlaybackModeChanged(
      (mode) => {
        _audioPlaybackMode = normalizeAudioPlaybackMode(mode);
      },
    );
    // The server target (URL/token) changed in Settings. Re-point this window's
    // API client and tear down the streamer so its next connection uses the new
    // server — no app restart needed. A fresh streamer is created immediately so
    // session-transport support is renegotiated before the next recording.
    const removeServerChanged = window.api?.onServerChanged(() => {
      void refreshApiBase().finally(() => {
        streamerRef.current?.destroy();
        streamerRef.current = null;
        supportsSessionTransportRef.current = false;
        getStreamer();
      });
    });
    return () => {
      removePillPos?.();
      removeOutputMode?.();
      removeAudioDucking?.();
      removeAudioPlaybackMode?.();
      removeServerChanged?.();
    };
  }, [applyPillPosition, getStreamer]);

  // ---- Hotkey handlers ----
  useEffect(() => {
    const removeDown = window.api.onHotkeyDown(() => {
      // hidePill() clears pillActiveRef before React re-renders idle state.
      if (!pillActiveRef.current) {
        stateRef.current = "idle";
      }
      const s = stateRef.current;
      if (s === "idle") {
        startRecording(false);
      } else if (s === "transcribing" && !wantsMicRef.current) {
        if (isTranscriptionIdle()) {
          hidePill();
          return;
        }
        // A pending streaming commit owns the single WebSocket + PCM buffer,
        // so a second streaming session can't run alongside it. Defer the
        // re-record until the commit resolves rather than dropping the press.
        if (streamResolverRef.current !== null) {
          pendingReRecordRef.current = true;
          return;
        }
        // A previous batch transcription is still in flight; start a new
        // recording alongside it. Its result is queued and drained normally.
        void startRecording(true);
      }
    });
    const removeUp = window.api.onHotkeyUp(() => {
      if (!pillActiveRef.current) return;
      if (stateRef.current === "recording") {
        commitRecording();
      } else if (stateRef.current === "initializing") {
        pendingCommitRef.current = true;
      } else if (
        stateRef.current === "transcribing" &&
        !wantsMicRef.current &&
        isTranscriptionIdle()
      ) {
        hidePill();
      }
    });
    const removeCancel = window.api.onPillCancel(() => {
      if (stateRef.current !== "idle") cancelRecording();
    });
    const removeMagicDown = window.api.onMagicEditDown((selectedText) => {
      if (!pillActiveRef.current) {
        stateRef.current = "idle";
      }
      isMagicEditRef.current = true;
      selectedTextRef.current = selectedText;
      setIsMagicEdit(true);
      void startRecording(false);
    });
    const removeMagicUp = window.api.onMagicEditUp(() => {
      if (!pillActiveRef.current) return;
      if (stateRef.current === "recording") {
        commitRecording();
      } else if (stateRef.current === "initializing") {
        pendingCommitRef.current = true;
      }
    });
    return () => {
      removeDown();
      removeUp();
      removeMagicDown();
      removeMagicUp();
      removeCancel();
    };
  }, [
    startRecording,
    commitRecording,
    cancelRecording,
    hidePill,
    isTranscriptionIdle,
  ]);

  // ---- Cleanup on unmount ----
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) {
          cancelRecording();
          recorderRef.current.destroy();
          streamerRef.current?.destroy();
          streamerRef.current = null;
        }
      }, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelRecording]);

  // ---- Render ----
  const badge =
    state === "transcribing" && pendingCount > 0 ? `x${pendingCount}` : null;

  // For Magic Edit: show bars ONLY while recording (listening to voice instruction),
  // NOT during processing/transcribing — we show a spinner then instead.
  const isMagicEditProcessing = isMagicEdit && state === "transcribing";

  const showBars =
    !isMagicEditProcessing &&
    (state === "initializing" ||
      state === "recording" ||
      state === "transcribing");

  const renderBars = (ref?: React.RefObject<SVGSVGElement | null>) => (
    <svg
      ref={ref}
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      style={
        {
          display: "block",
          flexShrink: 0,
          WebkitAppRegion: "no-drag",
          overflow: "visible",
        } as React.CSSProperties
      }
      role="img"
      aria-label="Audio waveform"
    >
      <defs>
        <linearGradient id="pillWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FAF8F2" stopOpacity="0.3" />
          <stop offset="25%" stopColor="#FAF8F2" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FAF8F2" stopOpacity="1" />
          <stop offset="75%" stopColor="#FAF8F2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FAF8F2" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        className="wave-path"
        d={generateWavePath(barsRef.current, SVG_WIDTH, SVG_HEIGHT, 0)}
        fill="url(#pillWaveGrad)"
      />
    </svg>
  );

  return (
    <div
      className={`flex h-screen w-screen select-none ${
        pillAlign === "start" ? "items-start" : "items-end"
      } ${pillSide === "right" ? "justify-end pr-3" : "justify-center"}`}
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        style={{
          marginBottom: pillAlign === "end" ? 10 : "auto",
          marginTop: pillAlign === "start" ? 10 : "auto",
          visibility: state === "idle" ? "hidden" : "visible",
          opacity: state === "idle" ? 0 : 1,
          transform: state === "idle" ? "scale(0.94)" : "scale(1)",
          transition:
            "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease",
        }}
      >
        <div
          className="group inline-flex items-center justify-center"
          style={{
            ...pillInnerStyle,
            ...(isMagicEdit
              ? {
                  borderColor: "rgba(217, 119, 87, 0.85)",
                  boxShadow:
                    "0 8px 28px -2px rgba(217, 119, 87, 0.65), 0 0 20px 2px rgba(217, 119, 87, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }
              : {}),
          }}
        >
          {isMagicEditProcessing ? (
            /* Processing spinner — shown after hotkey release while AI is working */
            <svg
              width={SVG_WIDTH + 8}
              height={SVG_HEIGHT + 4}
              viewBox={`0 0 ${SVG_WIDTH + 8} ${SVG_HEIGHT + 4}`}
              style={
                {
                  display: "block",
                  flexShrink: 0,
                  WebkitAppRegion: "no-drag",
                } as React.CSSProperties
              }
            >
              {/* Spinner track */}
              <circle
                cx={(SVG_WIDTH + 8) / 2}
                cy={(SVG_HEIGHT + 4) / 2}
                r={7}
                fill="none"
                stroke="rgba(217, 119, 87, 0.25)"
                strokeWidth={2}
              />
              {/* Spinner arc */}
              <circle
                cx={(SVG_WIDTH + 8) / 2}
                cy={(SVG_HEIGHT + 4) / 2}
                r={7}
                fill="none"
                stroke="#D97757"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="14 30"
                strokeDashoffset="0"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 ${(SVG_WIDTH + 8) / 2} ${(SVG_HEIGHT + 4) / 2}`}
                  to={`360 ${(SVG_WIDTH + 8) / 2} ${(SVG_HEIGHT + 4) / 2}`}
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          ) : (
            <>
              {isMagicEdit && (
                <Sparkles
                  className="size-3.5 text-[#D97757] mr-1.5 animate-pulse shrink-0 drop-shadow-[0_0_8px_rgba(217,119,87,0.7)]"
                  style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
                />
              )}
              {showBars && renderBars(barsSvgRef)}
            </>
          )}

          {badge && (
            <span
              className="mono"
              style={
                {
                  fontSize: 10,
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                  opacity: 0.8,
                  flexShrink: 0,
                  color: "#FAF8F2",
                  marginLeft: 4,
                  WebkitAppRegion: "no-drag",
                } as React.CSSProperties
              }
            >
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
