import { Mic, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type DemoPhase = "idle" | "pressed" | "result";

const SAMPLE_TRANSCRIPT = "Pushing the meeting to tomorrow at ten.";

interface TutorialPillDemoProps {
  /** If provided, active live recording overrides the automated loop */
  activeRecording?: boolean;
  /** Callback when the user taps or holds the demo pill to trigger recording */
  onPressIn?: () => void;
  onPressOut?: () => void;
  /** Latest user transcript to display instead of the default sample */
  latestTranscript?: string;
  /** Callback when user dismisses the tutorial hero card */
  onDismiss?: () => void;
}

/** Resting state: a sleek tapered horizontal capsule pinched at tips */
function generateRestingPath(W: number, H: number): string {
  const N = 64;
  const top: string[] = [];
  const bot: string[] = [];

  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const x = (tt * W).toFixed(1);
    const env = Math.sin(Math.PI * tt);
    const h = (H * 0.045 * env).toFixed(2);
    top.push(`${x},${(H / 2 - parseFloat(h)).toFixed(2)}`);
    bot.unshift(`${x},${(H / 2 + parseFloat(h)).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
}

/** Active state: continuous Gaussian-lobe synthesized multi-peak organic wave */
function generateActiveWavePath(W: number, H: number, t: number): string {
  const N = 76;
  const amp =
    (0.72 + 0.28 * Math.sin(t * 1.5)) * (0.78 + 0.22 * Math.sin(t * 2.8 + 0.8));

  // Dynamic peak heights modulated by time for organic fluidity
  const pCenter = 0.95 + 0.12 * Math.sin(t * 4.2);
  const pMidL = 0.72 + 0.15 * Math.sin(t * 3.6 + 1.2);
  const pMidR = 0.72 + 0.15 * Math.cos(t * 3.9 + 0.7);
  const pOutL = 0.42 + 0.1 * Math.sin(t * 5.1 + 2.1);
  const pOutR = 0.42 + 0.1 * Math.cos(t * 4.7 + 1.8);

  const top: string[] = [];
  const bot: string[] = [];

  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const x = (tt * W).toFixed(1);

    // Gaussian lobe synthesis for 5 distinct rounded peaks
    const gCenter = Math.exp(-(((tt - 0.5) / 0.095) ** 2)) * pCenter;
    const gMidL = Math.exp(-(((tt - 0.33) / 0.075) ** 2)) * pMidL;
    const gMidR = Math.exp(-(((tt - 0.67) / 0.075) ** 2)) * pMidR;
    const gOutL = Math.exp(-(((tt - 0.18) / 0.055) ** 2)) * pOutL;
    const gOutR = Math.exp(-(((tt - 0.82) / 0.055) ** 2)) * pOutR;

    // Base continuous wave floor so troughs curve smoothly
    const baseFloor = 0.08 * Math.sin(Math.PI * tt);
    const combined = Math.max(
      baseFloor,
      gCenter + gMidL + gMidR + gOutL + gOutR,
    );

    // Outer flare envelope to pinch to a sharp point at the tips
    const taper = Math.sin(Math.PI * tt) ** 1.2;
    const h = Math.max(0.6, H * 0.44 * amp * combined * taper);

    top.push(`${x},${(H / 2 - h).toFixed(2)}`);
    bot.unshift(`${x},${(H / 2 + h).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
}

// ---------------------------------------------------------------------------
// GaussianWaveform — filled symmetric audio waveform blob.
// Directly mirrors desktop's Wave component in apps/electron:
// Synthesizes 5 distinct Gaussian lobes and flares symmetrically.
// ---------------------------------------------------------------------------
function GaussianWaveform({
  pressed,
  primaryColor,
  mutedColor,
}: {
  pressed: boolean;
  primaryColor: string;
  mutedColor: string;
}) {
  const W = 320;
  const H = 52;

  const [pathD, setPathD] = useState(() => generateRestingPath(W, H));
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pressed) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setPathD(generateRestingPath(W, H));
      return;
    }

    const start = Date.now();
    let isMounted = true;

    const tick = () => {
      if (!isMounted) return;
      const t = (Date.now() - start) / 1000;
      setPathD(generateActiveWavePath(W, H, t));
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [pressed]);

  return (
    <Svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      style={{ width: "100%" }}
    >
      <Path
        d={pathD}
        fill={pressed ? primaryColor : mutedColor}
        fillOpacity={pressed ? 0.95 : 0.28}
      />
    </Svg>
  );
}

export function TutorialPillDemo({
  activeRecording = false,
  onPressIn,
  onPressOut,
  latestTranscript,
  onDismiss,
}: TutorialPillDemoProps) {
  const theme = useTheme();
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [dismissed, setDismissed] = useState(false);

  const pulse = useSharedValue(1);

  // Automated 3-phase tutorial loop: idle -> pressed (animated wave) -> result
  useEffect(() => {
    if (activeRecording) {
      setPhase("pressed");
      return;
    }

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const runLoop = (current: DemoPhase) => {
      if (!isMounted || activeRecording) return;
      if (current === "idle") {
        timer = setTimeout(() => {
          if (isMounted && !activeRecording) {
            setPhase("pressed");
            runLoop("pressed");
          }
        }, 2200);
      } else if (current === "pressed") {
        timer = setTimeout(() => {
          if (isMounted && !activeRecording) {
            setPhase("result");
            runLoop("result");
          }
        }, 3600);
      } else {
        timer = setTimeout(() => {
          if (isMounted && !activeRecording) {
            setPhase("idle");
            runLoop("idle");
          }
        }, 2600);
      }
    };

    runLoop(phase);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [activeRecording, phase]);

  // Dot pulse animation
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: phase === "pressed" ? pulse.value : 1 }],
    opacity: phase === "idle" ? 0.45 : 1,
  }));

  const isPressed = activeRecording || phase === "pressed";
  const isResult = phase === "result";
  const transcriptToShow = latestTranscript || SAMPLE_TRANSCRIPT;

  if (dismissed) return null;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          borderColor: theme.cardRing,
          backgroundColor: theme.card,
        },
      ]}
    >
      {/* Top Dismiss Button matching desktop's close icon */}
      <Pressable
        onPress={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tutorial"
        style={styles.dismissBtn}
      >
        <X size={15} color={theme.mutedForeground} />
      </Pressable>

      {/* Instructional Title matching desktop's TutorialDemo with 3D Keycap */}
      <View style={styles.titleRow}>
        <ThemedText
          style={[
            styles.serifWord,
            { color: phase === "idle" ? theme.primary : theme.mutedForeground },
          ]}
        >
          Hold
        </ThemedText>

        {/* 3D Keycap matching desktop's FnKey */}
        <View
          style={[
            styles.keycap,
            {
              backgroundColor: isPressed ? theme.accent : theme.secondary,
              borderColor: isPressed ? theme.primary : theme.border,
              borderBottomColor: isPressed ? theme.primary : theme.border,
              transform: [{ translateY: isPressed ? 2 : 0 }],
            },
          ]}
        >
          <Mic size={13} color={isPressed ? theme.primary : theme.foreground} />
          <ThemedText
            style={[
              styles.keycapText,
              { color: isPressed ? theme.primary : theme.foreground },
            ]}
          >
            Mic
          </ThemedText>
        </View>

        <ThemedText
          style={[
            styles.serifWord,
            { color: isPressed ? theme.primary : theme.mutedForeground },
          ]}
        >
          , speak,
        </ThemedText>

        <ThemedText
          style={[
            styles.serifWord,
            { color: isResult ? theme.primary : theme.mutedForeground },
          ]}
        >
          {" "}
          release.
        </ThemedText>
      </View>

      {/* Center Interactive Pill Capsule matching desktop's rounded-full shape */}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Interactive voice pill demo"
        style={({ pressed: btnPressed }) => [
          styles.pillCapsule,
          {
            backgroundColor:
              isPressed || btnPressed
                ? "rgba(217, 119, 87, 0.08)"
                : theme.secondary,
            borderColor: isPressed ? theme.primary : "rgba(217, 119, 87, 0.3)",
          },
        ]}
      >
        {/* Status Line: Terracotta Dot + Monospace uppercase text */}
        <View style={styles.statusRow}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: theme.primary },
              dotAnimatedStyle,
            ]}
          />
          <ThemedText
            style={[
              styles.statusText,
              {
                color:
                  isPressed || isResult ? theme.primary : theme.mutedForeground,
              },
            ]}
          >
            {isPressed
              ? "LISTENING…"
              : isResult
                ? "PASTED TO YOUR APP"
                : "READY"}
          </ThemedText>
        </View>

        {/* Continuous Gaussian Lobe Audio Wave (Direct port of desktop's Wave algorithm) */}
        <View style={styles.waveWrap}>
          <GaussianWaveform
            pressed={isPressed}
            primaryColor={theme.primary}
            mutedColor={theme.mutedForeground}
          />
        </View>

        {/* Result Transcript Preview */}
        {isResult ? (
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultText}>
              "{transcriptToShow}"
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    alignItems: "center",
    marginVertical: Spacing.two,
    position: "relative",
  },
  dismissBtn: {
    position: "absolute",
    top: Spacing.three,
    right: Spacing.three,
    zIndex: 10,
    padding: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.four,
    gap: 5,
    flexWrap: "wrap",
  },
  serifWord: {
    fontFamily: Fonts.serifItalic,
    fontSize: 24,
    lineHeight: 28,
  },
  keycap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  keycapText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: "600",
  },
  pillCapsule: {
    width: "100%",
    borderRadius: 9999,
    borderWidth: 1.2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  waveWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  svgBlock: {
    width: "100%",
  },
  resultRow: {
    marginTop: 4,
    paddingHorizontal: Spacing.three,
  },
  resultText: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
    color: "#E5E5E5",
  },
});
