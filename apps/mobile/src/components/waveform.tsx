import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface WaveformProps {
  /** Live input level [0, 1], shared for smooth UI-thread animation. */
  level: SharedValue<number>;
  active: boolean;
  /** Optional custom status label; defaults to "LISTENING…" */
  label?: string;
}

const W = 260;
const H = 26;

/** Resting state: a sleek tapered horizontal capsule pinched at tips */
function generateRestingPath(w: number, h: number): string {
  const N = 64;
  const top: string[] = [];
  const bot: string[] = [];

  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const x = (tt * w).toFixed(1);
    const env = Math.sin(Math.PI * tt);
    const halfH = h * 0.045 * env;
    top.push(`${x},${(h / 2 - halfH).toFixed(2)}`);
    bot.unshift(`${x},${(h / 2 + halfH).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
}

/** Active state: continuous Gaussian-lobe synthesized multi-peak organic wave */
function generateActiveWavePath(
  w: number,
  h: number,
  t: number,
  amp: number,
): string {
  const N = 76;

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
    const x = (tt * w).toFixed(1);

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
    const waveH = Math.max(0.5, h * 0.44 * amp * combined * taper);

    top.push(`${x},${(h / 2 - waveH).toFixed(2)}`);
    bot.unshift(`${x},${(h / 2 + waveH).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
}

/**
 * Cadence Gaussian Waveform:
 * Renders the authentic continuous 5-lobe Gaussian audio wave inside a sleek
 * floating frosted pill, reactive to live microphone volume levels.
 */
export function Waveform({ level, active, label }: WaveformProps) {
  const theme = useTheme();
  const [pathD, setPathD] = useState(() => generateRestingPath(W, H));
  const smoothedAmpRef = useRef(0.2);
  const animFrameRef = useRef<number | null>(null);

  const pulse = useSharedValue(1);

  // Status dot pulsing animation
  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withTiming(1.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [active, pulse]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // 60fps RAF loop synthesizing the Gaussian wave modulated by live level
  useEffect(() => {
    if (!active) {
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
      const rawLevel = level?.value ?? 0;

      // Smooth live input level: voice level flares amplitude up to 1.0;
      // quiet speech settles to a subtle breathing wave.
      const targetAmp =
        rawLevel > 0.02
          ? Math.min(1.0, 0.28 + rawLevel * 1.8)
          : 0.22 + 0.08 * Math.sin(t * 2.2);

      smoothedAmpRef.current += (targetAmp - smoothedAmpRef.current) * 0.32;

      setPathD(generateActiveWavePath(W, H, t, smoothedAmpRef.current));
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [active, level]);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardRing,
        },
      ]}
    >
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: theme.primary },
            dotAnimatedStyle,
          ]}
        />
        <ThemedText style={[styles.label, { color: theme.mutedForeground }]}>
          {label ?? "LISTENING…"}
        </ThemedText>
      </View>

      <View style={styles.waveWrap}>
        <Svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          style={styles.svg}
        >
          <Path d={pathD} fill={theme.primary} fillOpacity={0.92} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 270,
    height: 54,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    // Elevated floating shadow
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  waveWrap: {
    width: "100%",
    height: H,
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    width: "100%",
  },
});
