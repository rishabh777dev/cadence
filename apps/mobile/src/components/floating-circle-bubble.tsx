import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Pressable,
  Animated as RNAnimated,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Circle as SvgCircle,
} from "react-native-svg";

import { CadenceMark } from "@/components/cadence-mark";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useDictation } from "@/lib/audio/use-dictation";
import { useHistory } from "@/lib/history";
import { useSettings } from "@/lib/settings";

const SIZE_IDLE = 56;
const SIZE_RECORDING = 84;

/**
 * Cadence Gaussian Wave synthesis tailored for a circular boundary:
 * Creates the authentic 5-lobe organic wave spanning horizontally through
 * the center of the circle, flaring symmetrically and pinched at circle edges.
 */
function generateCircleWavePath(
  w: number,
  h: number,
  t: number,
  amp: number,
): string {
  const N = 64;
  const top: string[] = [];
  const bot: string[] = [];
  const yMid = h / 2;

  // Dynamic peak heights modulated by time for organic fluidity
  const pCenter = 0.95 + 0.12 * Math.sin(t * 4.2);
  const pMidL = 0.72 + 0.15 * Math.sin(t * 3.6 + 1.2);
  const pMidR = 0.72 + 0.15 * Math.cos(t * 3.9 + 0.7);
  const pOutL = 0.42 + 0.1 * Math.sin(t * 5.1 + 2.1);
  const pOutR = 0.42 + 0.1 * Math.cos(t * 4.7 + 1.8);

  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const x = (tt * w).toFixed(1);

    // Gaussian lobe synthesis for 5 distinct rounded peaks
    const gCenter = Math.exp(-(((tt - 0.5) / 0.095) ** 2)) * pCenter;
    const gMidL = Math.exp(-(((tt - 0.33) / 0.075) ** 2)) * pMidL;
    const gMidR = Math.exp(-(((tt - 0.67) / 0.075) ** 2)) * pMidR;
    const gOutL = Math.exp(-(((tt - 0.18) / 0.055) ** 2)) * pOutL;
    const gOutR = Math.exp(-(((tt - 0.82) / 0.055) ** 2)) * pOutR;

    // Base continuous wave floor
    const baseFloor = 0.08 * Math.sin(Math.PI * tt);
    const combined = Math.max(
      baseFloor,
      gCenter + gMidL + gMidR + gOutL + gOutR,
    );

    // Tapered envelope pinching to a sharp point at the circle edges
    const taper = Math.sin(Math.PI * tt) ** 1.2;
    // wave max half-height (up to 18px above/below midline)
    const waveH = Math.max(0.5, h * 0.28 * amp * combined * taper);

    top.push(`${x},${(yMid - waveH).toFixed(2)}`);
    bot.unshift(`${x},${(yMid + waveH).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
}

function generateCircleRestingPath(w: number, h: number): string {
  const N = 48;
  const top: string[] = [];
  const bot: string[] = [];
  const yMid = h / 2;

  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const x = (tt * w).toFixed(1);
    const env = Math.sin(Math.PI * tt);
    const halfH = (h * 0.02 * env).toFixed(2);
    top.push(`${x},${(yMid - parseFloat(halfH)).toFixed(2)}`);
    bot.unshift(`${x},${(yMid + parseFloat(halfH)).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
}

/**
 * FloatingCircleBubble:
 * An edge-docking, draggable circular floating bubble widget that renders
 * the authentic Cadence continuous Gaussian wave inside a circle.
 *
 * When tapped, it records and polishes voice speech, copies the result
 * to the clipboard, and saves to History.
 */
export function FloatingCircleBubble() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signedIn } = useAuth();
  const { settings } = useSettings();
  const { addHistory } = useHistory();

  const [toastText, setToastText] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const screen = Dimensions.get("window");
  const edgeMargin = 14;

  // Draggable position coordinates
  const pan = useRef(
    new RNAnimated.ValueXY({
      x: screen.width - SIZE_IDLE - edgeMargin,
      y: screen.height / 2 - SIZE_IDLE / 2,
    }),
  ).current;

  // Size and pulsing animation states
  const sizeVal = useSharedValue(SIZE_IDLE);
  const pulse = useSharedValue(1);
  const breathe = useSharedValue(0);

  // Gaussian wave path state & 60fps RAF loop
  const [wavePathD, setWavePathD] = useState(() =>
    generateCircleRestingPath(SIZE_RECORDING, SIZE_RECORDING),
  );
  const smoothedAmpRef = useRef(0.2);
  const animFrameRef = useRef<number | null>(null);

  // Dictation integration
  const dictation = useDictation({
    signedIn,
    onFinal: async (finalText) => {
      if (!finalText.trim()) return;

      // Copy directly to system clipboard
      await Clipboard.setStringAsync(finalText);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save to Cadence History
      addHistory(finalText, 2500);

      // Show brief success toast
      setToastText(finalText);
      setToastVisible(true);

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToastVisible(false);
      }, 2800);
    },
  });

  const { micState, level, toggle } = dictation;
  const isRecording = micState === "recording";
  const isFinalizing = micState === "finalizing";

  // Expand / shrink circle based on recording state
  useEffect(() => {
    if (isRecording) {
      sizeVal.value = withSpring(SIZE_RECORDING, {
        damping: 16,
        stiffness: 220,
      });
      breathe.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
      pulse.value = withRepeat(
        withTiming(1.35, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      sizeVal.value = withSpring(SIZE_IDLE, { damping: 18, stiffness: 220 });
      breathe.value = withTiming(0, { duration: 250 });
      pulse.value = 1;
    }
  }, [isRecording, sizeVal, breathe, pulse]);

  // 60fps RAF loop to synthesize the circular Cadence wave
  useEffect(() => {
    if (!isRecording) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setWavePathD(generateCircleRestingPath(SIZE_RECORDING, SIZE_RECORDING));
      return;
    }

    const start = Date.now();
    let isMounted = true;

    const tick = () => {
      if (!isMounted) return;
      const t = (Date.now() - start) / 1000;
      const rawLevel = level?.value ?? 0;

      // Voice level expands lobes; quiet speech maintains gentle organic breathing
      const targetAmp =
        rawLevel > 0.02
          ? Math.min(1.0, 0.28 + rawLevel * 1.8)
          : 0.22 + 0.08 * Math.sin(t * 2.2);

      smoothedAmpRef.current += (targetAmp - smoothedAmpRef.current) * 0.32;

      setWavePathD(
        generateCircleWavePath(
          SIZE_RECORDING,
          SIZE_RECORDING,
          t,
          smoothedAmpRef.current,
        ),
      );
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRecording, level]);

  // PanResponder to handle drag & drop with edge-snapping physics
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        pan.setOffset({
          // @ts-expect-error internal value access
          x: pan.x._value,
          // @ts-expect-error internal value access
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        const currentSize = isRecording ? SIZE_RECORDING : SIZE_IDLE;
        const totalDist = Math.hypot(gestureState.dx, gestureState.dy);

        // Quick tap detection
        if (totalDist < 8 && Math.abs(gestureState.vx) < 0.2) {
          toggle();
          return;
        }

        // Snap to nearest screen edge (left or right)
        // @ts-expect-error internal value access
        const currentX = pan.x._value;
        // @ts-expect-error internal value access
        const currentY = pan.y._value;

        const snapLeft = edgeMargin;
        const snapRight = screen.width - currentSize - edgeMargin;
        const targetX = currentX < screen.width / 2 ? snapLeft : snapRight;

        // Clamp Y within safe viewport boundaries
        const minY = insets.top + 20;
        const maxY = screen.height - insets.bottom - currentSize - 90;
        const targetY = Math.max(minY, Math.min(maxY, currentY));

        RNAnimated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          friction: 6.5,
          tension: 50,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  // Outer sonar ring animation
  const ringOuterStyle = useAnimatedStyle(() => {
    const drive =
      (breathe.value + (level?.value ?? 0) * 1.2) * (isRecording ? 1 : 0);
    const scale = 1 + interpolate(drive, [0, 1.2], [0.05, 0.45]);
    return {
      transform: [{ scale }],
      opacity: isRecording ? interpolate(scale, [1, 1.45], [0.5, 0]) : 0,
    };
  });

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!settings.floatingBubbleEnabled) {
    return null;
  }

  const currentSize = isRecording ? SIZE_RECORDING : SIZE_IDLE;

  return (
    <RNAnimated.View
      style={[
        styles.wrap,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Outer pulsing ring while recording */}
      {isRecording && (
        <Animated.View
          style={[
            styles.sonarRing,
            {
              width: SIZE_RECORDING,
              height: SIZE_RECORDING,
              borderRadius: SIZE_RECORDING / 2,
              backgroundColor: `${theme.primary}25`,
            },
            ringOuterStyle,
          ]}
        />
      )}

      {/* Main Circle Bubble */}
      <View
        {...panResponder.panHandlers}
        style={[
          styles.circleBubble,
          {
            width: currentSize,
            height: currentSize,
            borderRadius: currentSize / 2,
            backgroundColor: isRecording ? theme.card : theme.card,
            borderColor: isRecording ? theme.primary : theme.cardRing,
            shadowColor: theme.primary,
          },
        ]}
      >
        {isRecording ? (
          // Active state: Cadence continuous Gaussian wave flowing across the circle
          <View style={styles.recordingContent}>
            {/* Top pulsing red/terracotta dot */}
            <Animated.View
              style={[
                styles.activeDot,
                { backgroundColor: theme.primary },
                dotAnimatedStyle,
              ]}
            />

            {/* Circular clipped Gaussian audio wave */}
            <Svg
              width={SIZE_RECORDING}
              height={SIZE_RECORDING}
              viewBox={`0 0 ${SIZE_RECORDING} ${SIZE_RECORDING}`}
            >
              <Defs>
                <ClipPath id="bubbleCircleClip">
                  <SvgCircle
                    cx={SIZE_RECORDING / 2}
                    cy={SIZE_RECORDING / 2}
                    r={SIZE_RECORDING / 2 - 2}
                  />
                </ClipPath>
              </Defs>
              <G clipPath="url(#bubbleCircleClip)">
                <Path d={wavePathD} fill={theme.primary} fillOpacity={0.92} />
              </G>
            </Svg>
          </View>
        ) : isFinalizing ? (
          // Transcribing state: centered spinner
          <View style={styles.centerContent}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          // Idle state: Cadence mark / mic icon
          <View style={styles.centerContent}>
            <CadenceMark size={22} color={theme.foreground} />
          </View>
        )}
      </View>

      {/* Completion Toast Notification */}
      {toastVisible && toastText && (
        <Pressable
          onPress={() => setToastVisible(false)}
          style={[
            styles.toastPill,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardRing,
            },
          ]}
        >
          <ThemedText style={[styles.toastLabel, { color: theme.primary }]}>
            ✓ Copied to clipboard
          </ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[styles.toastSnippet, { color: theme.foreground }]}
          >
            "{toastText}"
          </ThemedText>
        </Pressable>
      )}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  sonarRing: {
    position: "absolute",
    pointerEvents: "none",
  },
  circleBubble: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centerContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingContent: {
    width: SIZE_RECORDING,
    height: SIZE_RECORDING,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    top: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 10,
  },
  toastPill: {
    position: "absolute",
    top: -46,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    maxWidth: 240,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  toastLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  toastSnippet: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    marginTop: 1,
    opacity: 0.85,
  },
});
