import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Mic,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeaderActions } from "@/components/header-actions";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

const SAMPLE_TEXTS = {
  email:
    "hey bob just following up on our chat from yesterday. we need to push the deployment to friday because the tests are failing on staging. let me know if that works for you or if you want to hop on a call to debug.",
  notes:
    "meeting notes 10am: alex says design system is 80% done. still need mobile pill widget and magic edit tab. sarah working on cloud auth sync. target release next tuesday.",
};

const PROMPT_CHIPS = [
  { id: "concise", label: "Make it concise", icon: Zap },
  { id: "polish", label: "Polish grammar & tone", icon: Sparkles },
  { id: "bullets", label: "Turn into bullet points", icon: FileText },
  { id: "professional", label: "Professional email", icon: ArrowRight },
];

export default function MagicEditScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signedIn } = useAuth();

  const [sourceText, setSourceText] = useState(SAMPLE_TEXTS.email);
  const [instruction, setInstruction] = useState("");
  const [resultText, setResultText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Settings
  const [selectedModel, _setSelectedModel] = useState("Auto (Cadence Cloud)");

  const handleRunMagicEdit = useCallback(async () => {
    if (!sourceText.trim()) {
      Alert.alert("Empty text", "Please enter or paste text to edit.");
      return;
    }

    const effectiveInstruction =
      instruction.trim() || "Polish tone and fix grammar";
    setLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate / execute transformation
    setTimeout(() => {
      let transformed = "";
      const lower = effectiveInstruction.toLowerCase();

      if (lower.includes("concise") || lower.includes("short")) {
        transformed =
          "Bob — Following up on yesterday: deployment is moved to Friday due to failing staging tests. Let me know if that works or if you'd like a quick debug call.";
      } else if (lower.includes("bullet") || lower.includes("list")) {
        transformed =
          "• Deployment delayed to Friday due to failing staging tests.\n• Follow-up needed: confirm schedule or join quick call to debug.";
      } else if (lower.includes("professional") || lower.includes("formal")) {
        transformed =
          "Hi Bob,\n\nFollowing up on our discussion yesterday, we will need to reschedule the deployment to Friday to resolve staging test failures. Please let me know if this aligns with your schedule, or if you would like to connect on a brief call to debug.\n\nBest regards,";
      } else {
        transformed =
          "Hi Bob, following up on our chat from yesterday. We need to postpone deployment to Friday due to failing tests on staging. Let me know if that schedule works for you, or if we should hop on a call to debug.";
      }

      setResultText(transformed);
      setLoading(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 900);
  }, [sourceText, instruction]);

  const copyResult = useCallback(async () => {
    if (!resultText) return;
    await Clipboard.setStringAsync(resultText);
    setCopied(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 1800);
  }, [resultText]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Sparkles color={theme.primary} size={24} />
            <ThemedText type="title" style={styles.title}>
              Magic Edit
            </ThemedText>
          </View>
          <HeaderActions />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Display Hero Title */}
            <View style={styles.heroSection}>
              <ThemedText type="eyebrow" themeColor="mutedForeground">
                AI VOICE REWRITE
              </ThemedText>
              <ThemedText type="display" style={styles.heroHeadline}>
                speak &
                <ThemedText type="displayItalic" themeColor="primary">
                  {" "}
                  transform
                </ThemedText>
                .
              </ThemedText>
              <ThemedText
                themeColor="mutedForeground"
                style={styles.heroSubtitle}
              >
                Select or paste any text, speak what to change, and Cadence AI
                executes in-place rewrites.
              </ThemedText>
            </View>

            {/* Source Text Input Card */}
            <View
              style={[
                styles.card,
                {
                  borderColor: theme.cardRing,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>
                  Text to Rewrite
                </ThemedText>
                <View style={styles.sampleChipsRow}>
                  <Pressable
                    onPress={() => setSourceText(SAMPLE_TEXTS.email)}
                    style={[styles.miniChip, { borderColor: theme.border }]}
                  >
                    <ThemedText style={styles.miniChipText}>
                      Sample Email
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setSourceText(SAMPLE_TEXTS.notes)}
                    style={[styles.miniChip, { borderColor: theme.border }]}
                  >
                    <ThemedText style={styles.miniChipText}>
                      Sample Notes
                    </ThemedText>
                  </Pressable>
                  {sourceText ? (
                    <Pressable
                      onPress={() => setSourceText("")}
                      style={[styles.miniChip, { borderColor: theme.border }]}
                    >
                      <RotateCcw size={11} color={theme.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <TextInput
                value={sourceText}
                onChangeText={setSourceText}
                placeholder="Paste or type text here to transform…"
                placeholderTextColor={theme.mutedForeground}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    color: theme.foreground,
                    borderColor: theme.border,
                    backgroundColor: theme.secondary,
                  },
                ]}
              />
            </View>

            {/* Edit Instruction Card */}
            <View
              style={[
                styles.card,
                {
                  borderColor: theme.cardRing,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <ThemedText style={styles.cardTitle}>
                What should change?
              </ThemedText>
              <ThemedText themeColor="mutedForeground" style={styles.cardHint}>
                Speak your command or pick a preset prompt:
              </ThemedText>

              {/* Quick Chips */}
              <View style={styles.chipsWrap}>
                {PROMPT_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  const isSelected = instruction === chip.label;
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => setInstruction(chip.label)}
                      style={[
                        styles.chip,
                        {
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                          backgroundColor: isSelected
                            ? theme.accent
                            : theme.secondary,
                        },
                      ]}
                    >
                      <Icon
                        size={13}
                        color={
                          isSelected ? theme.primary : theme.mutedForeground
                        }
                      />
                      <ThemedText
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? theme.primary
                              : theme.foreground,
                          },
                        ]}
                      >
                        {chip.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Spoken / Typed Instruction Bar */}
              <View
                style={[
                  styles.instructionBar,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.secondary,
                  },
                ]}
              >
                <TextInput
                  value={instruction}
                  onChangeText={setInstruction}
                  placeholder="e.g. 'Make it punchy and polite'…"
                  placeholderTextColor={theme.mutedForeground}
                  style={[styles.instructionInput, { color: theme.foreground }]}
                />
                <Pressable
                  onPress={() => {
                    if (!signedIn) {
                      Alert.alert(
                        "Sign in for Voice",
                        "Spoken instructions use Cadence Cloud transcription. Sign in to dictate.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Sign In",
                            onPress: () => router.push("/sign-in"),
                          },
                        ],
                      );
                      return;
                    }
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setInstruction("Make this sound professional and concise");
                  }}
                  style={[styles.micBtn, { backgroundColor: theme.primary }]}
                >
                  <Mic size={15} color={theme.primaryForeground} />
                </Pressable>
              </View>

              {/* Run Action */}
              <Pressable
                onPress={handleRunMagicEdit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.runButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed || loading ? 0.85 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <>
                    <Sparkles size={16} color={theme.primaryForeground} />
                    <ThemedText
                      style={[
                        styles.runButtonText,
                        { color: theme.primaryForeground },
                      ]}
                    >
                      Transform with Magic Edit
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            {/* Output Result Card */}
            {resultText ? (
              <View
                style={[
                  styles.card,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.resultBadge}>
                    <Sparkles size={13} color={theme.primary} />
                    <ThemedText
                      style={[styles.resultBadgeText, { color: theme.primary }]}
                    >
                      Transformed Result
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setShowDiff((prev) => !prev)}
                    style={[styles.miniChip, { borderColor: theme.border }]}
                  >
                    <ThemedText style={styles.miniChipText}>
                      {showDiff ? "Hide Diff" : "Show Diff"}
                    </ThemedText>
                  </Pressable>
                </View>

                {showDiff ? (
                  <View style={styles.diffBox}>
                    <ThemedText
                      style={[styles.diffRaw, { color: theme.mutedForeground }]}
                    >
                      Before: {sourceText}
                    </ThemedText>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.border },
                      ]}
                    />
                    <ThemedText
                      style={[styles.diffCleaned, { color: theme.foreground }]}
                    >
                      After: {resultText}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText
                    style={[styles.resultBody, { color: theme.foreground }]}
                  >
                    {resultText}
                  </ThemedText>
                )}

                <View style={styles.resultActions}>
                  <Pressable
                    onPress={copyResult}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    {copied ? (
                      <Check size={14} color={theme.primaryForeground} />
                    ) : (
                      <Copy size={14} color={theme.primaryForeground} />
                    )}
                    <ThemedText
                      style={[
                        styles.actionBtnText,
                        { color: theme.primaryForeground },
                      ]}
                    >
                      {copied ? "Copied" : "Copy to Clipboard"}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Model & Tone Setting Summary */}
            <View
              style={[
                styles.settingsCard,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.secondary,
                },
              ]}
            >
              <View style={styles.settingsRow}>
                <Sliders size={16} color={theme.mutedForeground} />
                <ThemedText
                  themeColor="mutedForeground"
                  style={styles.settingsLabel}
                >
                  Engine: {selectedModel} · App-Aware Tone
                </ThemedText>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  title: { fontSize: 24, lineHeight: 28 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 130,
    gap: Spacing.three,
  },
  heroSection: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    gap: Spacing.one,
  },
  heroHeadline: {
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 340,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two + 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  sampleChipsRow: {
    flexDirection: "row",
    gap: Spacing.one,
  },
  miniChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  miniChipText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
  },
  textArea: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 90,
    textAlignVertical: "top",
    fontFamily: Fonts.sans,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 1,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  instructionBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    height: 46,
  },
  instructionInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  runButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    height: 48,
    borderRadius: Radius.full,
    marginTop: Spacing.one,
  },
  runButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one + 2,
  },
  resultBadgeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  resultBody: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: Fonts.sans,
    marginVertical: Spacing.one,
  },
  diffBox: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  diffRaw: {
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  diffCleaned: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sansMedium,
  },
  resultActions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.four,
    height: 40,
    borderRadius: Radius.full,
  },
  actionBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  settingsCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  settingsLabel: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },
});
