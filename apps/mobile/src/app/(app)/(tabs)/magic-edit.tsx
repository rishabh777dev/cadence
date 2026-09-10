import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Mic,
  RotateCcw,
  Sliders,
  Sparkles,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useTheme } from "@/hooks/use-theme";
import { directTranscribe } from "@/lib/audio/direct-transcribe";
import { useRecorder } from "@/lib/audio/recorder";
import { executeDirectLLM } from "@/lib/direct-llm";
import {
  ALL_PROVIDERS,
  getSecureApiKey,
  type ProviderId,
  useModelConfig,
} from "@/lib/models";

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

  const {
    provider: defaultVoiceProvider,
    magicEditLlmProvider,
    magicEditLlmModel,
    cleanupProvider,
    cleanupModel,
    discoveredModels,
    customServerUrl,
    setMagicEditLlmProvider,
    setMagicEditLlmModel,
  } = useModelConfig();

  const [sourceText, setSourceText] = useState(SAMPLE_TEXTS.email);
  const [instruction, setInstruction] = useState("");
  const [resultText, setResultText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [lastMeta, setLastMeta] = useState<{
    provider: string;
    model: string;
  } | null>(null);

  // Resolved active provider & model
  const resolvedProvider: ProviderId = useMemo(() => {
    if (magicEditLlmProvider && magicEditLlmProvider !== "auto") {
      return magicEditLlmProvider as ProviderId;
    }
    if (cleanupProvider && cleanupProvider !== "off") {
      return cleanupProvider as ProviderId;
    }
    return "groq";
  }, [magicEditLlmProvider, cleanupProvider]);

  const resolvedModel: string = useMemo(() => {
    if (magicEditLlmModel) return magicEditLlmModel;
    if (cleanupModel && cleanupModel !== "off") return cleanupModel;
    return "llama-3.1-8b-instant";
  }, [magicEditLlmModel, cleanupModel]);

  const providerMeta = useMemo(
    () =>
      ALL_PROVIDERS.find((p) => p.id === resolvedProvider) || ALL_PROVIDERS[0],
    [resolvedProvider],
  );

  const recorder = useRecorder({});

  // Spoken voice instruction recording
  const handleToggleVoiceInstruction = async () => {
    if (recordingVoice) {
      // Stop recording and transcribe
      setRecordingVoice(false);
      try {
        const fileUri = await recorder.stop();
        if (!fileUri) {
          Alert.alert("Notice", "No audio detected.");
          return;
        }

        const voiceProv = defaultVoiceProvider === "openai" ? "openai" : "groq";
        const key = await getSecureApiKey(voiceProv);

        if (!key) {
          Alert.alert(
            "API Key Required",
            `Please configure your ${voiceProv.toUpperCase()} key in Settings > Models to transcribe voice instructions.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => router.push("/settings/models"),
              },
            ],
          );
          return;
        }

        const res = await directTranscribe({
          fileUri,
          provider: voiceProv,
          apiKey: key,
        });

        if (res.text?.trim()) {
          setInstruction(res.text.trim());
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      } catch (err) {
        Alert.alert(
          "Voice Error",
          `Could not transcribe voice instruction: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else {
      // Start recording
      try {
        await recorder.start();
        setRecordingVoice(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        Alert.alert(
          "Permission",
          "Microphone access is required for voice instructions.",
        );
      }
    }
  };

  const handleRunMagicEdit = useCallback(async () => {
    const effectiveInstruction =
      instruction.trim() ||
      "Polish grammar and make the text clear and professional";

    setLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const apiKey = await getSecureApiKey(resolvedProvider);
      if (!apiKey && resolvedProvider !== "custom") {
        Alert.alert(
          "Missing Key",
          `Please configure your ${resolvedProvider.toUpperCase()} API key in Settings > Models to use Magic Edit.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Configure Key",
              onPress: () => router.push("/settings/models"),
            },
          ],
        );
        setLoading(false);
        return;
      }

      let systemPrompt = "";
      let userPrompt = "";

      if (sourceText.trim()) {
        systemPrompt = `You are an elite, highly capable AI editor and writing assistant.
Your goal is to rewrite, refine, or transform the user's selected text according to their instruction: "${effectiveInstruction}".
CRITICAL RULES:
1. Output ONLY the final transformed text ready to paste directly.
2. Do NOT include conversational commentary (e.g. "Here is the revised text:").
3. Preserve key facts, names, and intent unless explicitly told to alter them.`;

        userPrompt = `<text_to_transform>\n${sourceText.trim()}\n</text_to_transform>\n\nInstruction: ${effectiveInstruction}`;
      } else {
        systemPrompt = `You are an elite AI ghostwriter and assistant.
Generate the text requested by the user: "${effectiveInstruction}".
CRITICAL RULES:
1. Write directly from the user's first-person perspective if writing an email, letter, or message.
2. Output ONLY the completed text without conversational preambles.`;

        userPrompt = effectiveInstruction;
      }

      const transformed = await executeDirectLLM({
        provider: resolvedProvider,
        model: resolvedModel,
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        apiKey,
        customUrl: customServerUrl,
        temperature: 0.2,
      });

      setResultText(transformed);
      setLastMeta({
        provider: resolvedProvider.toUpperCase(),
        model: resolvedModel,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("[Magic Edit Error]", err);
      Alert.alert(
        "Magic Edit Failed",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setLoading(false);
    }
  }, [
    sourceText,
    instruction,
    resolvedProvider,
    resolvedModel,
    customServerUrl,
    router,
  ]);

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

        {/* Model Selector Pill */}
        <View style={styles.modelPillContainer}>
          <Pressable
            onPress={() => setShowModelPicker(true)}
            style={[
              styles.modelPill,
              {
                backgroundColor: theme.secondary,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={styles.modelPillIcon}>
              {providerMeta.icon}
            </ThemedText>
            <ThemedText style={styles.modelPillText} numberOfLines={1}>
              {providerMeta.name}: {resolvedModel}
            </ThemedText>
            <ChevronDown size={14} color={theme.mutedForeground} />
          </Pressable>
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
                placeholder="Paste or type text here to transform (or leave empty to ghostwrite)…"
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
                    borderColor: recordingVoice
                      ? theme.destructive
                      : theme.border,
                    backgroundColor: theme.secondary,
                  },
                ]}
              >
                <TextInput
                  value={instruction}
                  onChangeText={setInstruction}
                  placeholder={
                    recordingVoice
                      ? "Listening to voice instruction…"
                      : "e.g. 'Make it punchy and polite'…"
                  }
                  placeholderTextColor={theme.mutedForeground}
                  style={[styles.instructionInput, { color: theme.foreground }]}
                />
                <Pressable
                  onPress={handleToggleVoiceInstruction}
                  style={[
                    styles.micBtn,
                    {
                      backgroundColor: recordingVoice
                        ? theme.destructive
                        : theme.primary,
                    },
                  ]}
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

                {lastMeta ? (
                  <ThemedText style={styles.resultMeta}>
                    Powered by {lastMeta.provider} · {lastMeta.model}
                  </ThemedText>
                ) : null}

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

            {/* Model & Settings Footer */}
            <Pressable
              onPress={() => router.push("/settings/models")}
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
                  Configure Providers & Discover Models in Settings
                </ThemedText>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Model Selection Modal */}
        <Modal
          visible={showModelPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowModelPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Select Magic Edit Model
                </ThemedText>
                <Pressable
                  onPress={() => setShowModelPicker(false)}
                  hitSlop={8}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={theme.foreground} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll}>
                {ALL_PROVIDERS.filter((p) => p.hasLlm).map((p) => {
                  const models = (discoveredModels[p.id] || []).filter(
                    (m) => m.type === "llm",
                  );
                  return (
                    <View key={p.id} style={styles.modalProviderGroup}>
                      <ThemedText style={styles.modalProviderTitle}>
                        {p.icon} {p.name}
                      </ThemedText>
                      <View style={styles.modalModelList}>
                        {models.map((m) => {
                          const isCurrent =
                            resolvedProvider === p.id && resolvedModel === m.id;
                          return (
                            <Pressable
                              key={m.id}
                              onPress={() => {
                                setMagicEditLlmProvider(p.id);
                                setMagicEditLlmModel(m.id);
                                setShowModelPicker(false);
                                void Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light,
                                );
                              }}
                              style={[
                                styles.modalModelItem,
                                {
                                  backgroundColor: isCurrent
                                    ? theme.accent
                                    : theme.secondary,
                                  borderColor: isCurrent
                                    ? theme.primary
                                    : theme.border,
                                },
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.modalModelName,
                                  {
                                    color: isCurrent
                                      ? theme.primary
                                      : theme.foreground,
                                    fontWeight: isCurrent ? "700" : "500",
                                  },
                                ]}
                              >
                                {m.name || m.id}
                              </ThemedText>
                              {isCurrent ? (
                                <Check size={14} color={theme.primary} />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  modelPillContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  modelPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  modelPillIcon: {
    fontSize: 12,
  },
  modelPillText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    maxWidth: 220,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroSection: {
    marginBottom: Spacing.one,
  },
  heroHeadline: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardHint: {
    fontSize: 12,
    marginBottom: Spacing.two,
  },
  sampleChipsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  miniChip: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniChipText: {
    fontSize: 11,
    opacity: 0.8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 90,
    fontSize: 13,
    textAlignVertical: "top",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.three,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
  },
  instructionBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.three,
  },
  instructionInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
  },
  micBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  runButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  runButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  diffBox: {
    gap: 8,
    marginVertical: Spacing.two,
  },
  diffRaw: {
    fontSize: 12,
    lineHeight: 16,
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  diffCleaned: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultBody: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: Spacing.two,
  },
  resultMeta: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    opacity: 0.5,
    marginBottom: Spacing.two,
  },
  resultActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  settingsCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsLabel: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "75%",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    marginBottom: Spacing.four,
  },
  modalProviderGroup: {
    marginBottom: Spacing.three,
  },
  modalProviderTitle: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    fontWeight: "700",
    marginBottom: 6,
    opacity: 0.8,
  },
  modalModelList: {
    gap: 6,
  },
  modalModelItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modalModelName: {
    fontSize: 13,
  },
});
