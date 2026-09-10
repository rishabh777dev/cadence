import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CadenceMark } from "@/components/cadence-mark";
import { MicButton } from "@/components/mic-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TranscriptView } from "@/components/transcript-view";
import { Waveform } from "@/components/waveform";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useDictation } from "@/lib/audio/use-dictation";
import { setPendingTranscript } from "@/lib/keyboard-bridge";

/**
 * Focused dictation screen launched by the keyboard (`freestyle://dictate`).
 * Records + streams like the main voice screen, but on the final transcript it
 * hands the text to the keyboard via the App Group and prompts the user to
 * return to where they were typing — the keyboard inserts it on reappearance.
 */
export default function DictateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signedIn } = useAuth();

  const [result, setResult] = useState("");

  const { micState, partial, level, toggle } = useDictation({
    signedIn,
    autoStart: true,
    onRecordingStart: () => setResult(""),
    onFinal: (text) => {
      setResult(text);
      // Hand the transcript to the keyboard for insertion.
      setPendingTranscript(text);
    },
  });

  const status =
    micState === "recording"
      ? "Listening — tap when done"
      : micState === "finalizing"
        ? "Polishing"
        : result
          ? "Ready to insert"
          : "Tap to speak";

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: insets.bottom + Spacing.two,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <CadenceMark size={18} color={theme.foreground} />
            <ThemedText type="eyebrow" themeColor="foreground">
              Cadence Voice
            </ThemedText>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="eyebrow" themeColor="primary">
              Done
            </ThemedText>
          </Pressable>
        </View>

        <TranscriptView
          text={result}
          partial={partial}
          placeholder="Speak and your words appear here."
        />

        {!signedIn ? (
          <View
            style={[
              styles.guestPromptCard,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            <ThemedText style={styles.returnTitle}>
              Sign in to Dictate
            </ThemedText>
            <ThemedText themeColor="mutedForeground" style={styles.returnHint}>
              Cadence Cloud powers voice recognition. Sign in to start dictating
              from your keyboard or app.
            </ThemedText>
            <Pressable
              onPress={() => router.push("/sign-in")}
              style={[styles.signInBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText
                style={[
                  styles.signInBtnText,
                  { color: theme.primaryForeground },
                ]}
              >
                Sign in to Cadence
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {result && micState === "idle" ? (
          <View style={[styles.returnCard, { borderColor: theme.border }]}>
            <ThemedText style={styles.returnTitle}>
              Return to your app
            </ThemedText>
            <ThemedText themeColor="mutedForeground" style={styles.returnHint}>
              Switch back to where you were typing — the Cadence keyboard will
              drop this text in for you.
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.footer}>
          {micState === "recording" && (
            <Waveform level={level} active={micState === "recording"} />
          )}
          {micState === "finalizing" && (
            <View
              style={[
                styles.finalizingPill,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardRing,
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText
                style={[
                  styles.finalizingText,
                  { color: theme.mutedForeground },
                ]}
              >
                TRANSCRIBING…
              </ThemedText>
            </View>
          )}
          {micState === "idle" && (
            <ThemedText themeColor="mutedForeground" style={styles.status}>
              {status}
            </ThemedText>
          )}
          <MicButton
            state={micState}
            level={level}
            onPressIn={toggle}
            onPressOut={() => {}}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.two,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one + 2,
  },
  returnCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  returnTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  returnHint: { fontSize: 13, lineHeight: 19 },
  guestPromptCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  signInBtn: {
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
  },
  signInBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  footer: {
    alignItems: "center",
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  finalizingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  finalizingText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  status: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
