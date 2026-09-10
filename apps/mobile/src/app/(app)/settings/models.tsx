import {
  Check,
  Cpu,
  ExternalLink,
  Key,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  Card,
  SectionTitle,
  SettingsScreenScaffold,
} from "@/components/settings-ui";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { cloudUrl } from "@/lib/cloud/config";
import {
  type CleanupModelId,
  type TranscriptionProvider,
  useModelConfig,
} from "@/lib/models";

const PROVIDERS: {
  id: TranscriptionProvider;
  title: string;
  model: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: "groq",
    title: "Groq Whisper",
    model: "whisper-large-v3-turbo",
    description:
      "Ultra-fast cloud dictation (~200ms). Requires free Groq API key.",
    badge: "RECOMMENDED",
  },
  {
    id: "openai",
    title: "OpenAI Whisper",
    model: "whisper-1",
    description: "Industry-standard accuracy. Requires OpenAI API key.",
  },
  {
    id: "cadence",
    title: "Cadence Cloud",
    model: "cadence/stt",
    description:
      "Default cloud backend deployed on Render with real-time streaming.",
  },
];

const CLEANUP_MODELS: {
  id: CleanupModelId;
  title: string;
  provider: string;
  description: string;
}[] = [
  {
    id: "groq/llama-3.3-70b-versatile",
    title: "LLaMA 3.3 70B",
    provider: "Groq",
    description:
      "Removes filler words, cleans grammar, and applies tone formatting.",
  },
  {
    id: "openai/gpt-4o-mini",
    title: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast, intelligent conversational polish and structure.",
  },
  {
    id: "off",
    title: "Off (Raw Transcript)",
    provider: "None",
    description: "Returns words exactly as transcribed without AI rewriting.",
  },
];

function SelectableModelCard({
  title,
  description,
  active,
  onPress,
  children,
}: {
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      style={[
        styles.selectableCard,
        {
          borderColor: active ? theme.primary : theme.border,
          backgroundColor: active ? theme.accent : "transparent",
        },
      ]}
    >
      {active ? (
        <View
          style={[styles.selectableMarker, { backgroundColor: theme.primary }]}
        />
      ) : null}
      <View style={styles.selectableContent}>
        <ThemedText
          style={[
            styles.selectableTitle,
            { color: active ? theme.accentForeground : theme.foreground },
          ]}
        >
          {title}
        </ThemedText>
        <ThemedText
          style={[
            styles.selectableDesc,
            {
              color: active ? theme.accentForeground : theme.mutedForeground,
            },
          ]}
        >
          {description}
        </ThemedText>
        {children}
      </View>
    </Pressable>
  );
}

export default function ModelsSettingsScreen() {
  const theme = useTheme();
  const {
    provider,
    cleanupModel,
    groqConfigured,
    openAiConfigured,
    customServerUrl,
    setProvider,
    setCleanupModel,
    setCustomServerUrl,
    saveApiKey,
    deleteApiKey,
  } = useModelConfig();

  const [groqInput, setGroqInput] = useState("");
  const [openAiInput, setOpenAiInput] = useState("");
  const [savingGroq, setSavingGroq] = useState(false);
  const [savingOpenAi, setSavingOpenAi] = useState(false);
  const [serverInput, setServerInput] = useState(customServerUrl);
  const [savingServer, setSavingServer] = useState(false);

  const handleSaveGroq = async () => {
    if (!groqInput.trim()) return;
    setSavingGroq(true);
    try {
      await saveApiKey("groq", groqInput);
      setGroqInput("");
      Alert.alert("Saved", "Groq API key configured and synced to server.");
    } catch {
      Alert.alert("Error", "Could not save Groq API key.");
    } finally {
      setSavingGroq(false);
    }
  };

  const handleDeleteGroq = () => {
    Alert.alert("Remove Groq key?", "This removes your stored Groq API key.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteApiKey("groq"),
      },
    ]);
  };

  const handleSaveOpenAi = async () => {
    if (!openAiInput.trim()) return;
    setSavingOpenAi(true);
    try {
      await saveApiKey("openai", openAiInput);
      setOpenAiInput("");
      Alert.alert("Saved", "OpenAI API key configured and synced to server.");
    } catch {
      Alert.alert("Error", "Could not save OpenAI API key.");
    } finally {
      setSavingOpenAi(false);
    }
  };

  const handleDeleteOpenAi = () => {
    Alert.alert(
      "Remove OpenAI key?",
      "This removes your stored OpenAI API key.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteApiKey("openai"),
        },
      ],
    );
  };

  const handleSaveServer = async () => {
    setSavingServer(true);
    try {
      await setCustomServerUrl(serverInput.trim());
      Alert.alert("Saved", "Server endpoint updated.");
    } finally {
      setSavingServer(false);
    }
  };

  return (
    <SettingsScreenScaffold
      title="Models & Providers"
      subtitle="Configure your speech recognition and LLM cleanup models. Bring your own keys (BYOK) for lightning-fast dictation."
    >
      {/* 1. Active Pair Card (Desktop Parity) */}
      <Card style={styles.activePairCard}>
        <View style={styles.activePairRow}>
          <View style={styles.pairHalf}>
            <ThemedText style={styles.pairKicker}>TRANSCRIPTION</ThemedText>
            <ThemedText type="title" style={styles.pairModelName}>
              {provider === "groq"
                ? "Whisper Turbo"
                : provider === "openai"
                  ? "Whisper-1"
                  : "Cadence STT"}
            </ThemedText>
            <ThemedText
              themeColor="mutedForeground"
              style={styles.pairProvider}
            >
              {provider === "groq"
                ? "Groq Cloud (BYOK)"
                : provider === "openai"
                  ? "OpenAI (BYOK)"
                  : "Render Cloud"}
            </ThemedText>
          </View>

          <View
            style={[styles.pairDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.pairHalf}>
            <ThemedText style={styles.pairKicker}>CLEANUP (LLM)</ThemedText>
            <ThemedText type="title" style={styles.pairModelName}>
              {cleanupModel === "groq/llama-3.3-70b-versatile"
                ? "LLaMA 3.3 70B"
                : cleanupModel === "openai/gpt-4o-mini"
                  ? "GPT-4o Mini"
                  : "Disabled"}
            </ThemedText>
            <ThemedText
              themeColor="mutedForeground"
              style={styles.pairProvider}
            >
              {cleanupModel.startsWith("groq")
                ? "Groq LLM"
                : cleanupModel.startsWith("openai")
                  ? "OpenAI"
                  : "Raw output"}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* 2. Voice Transcription Providers */}
      <Card>
        <SectionTitle icon={Cpu} title="Speech Recognition Provider" />
        <View style={styles.list}>
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <SelectableModelCard
                key={p.id}
                title={p.title}
                description={p.description}
                active={active}
                onPress={() => setProvider(p.id)}
              >
                <View style={styles.modelMetaRow}>
                  <ThemedText
                    style={[
                      styles.monoBadge,
                      {
                        backgroundColor: theme.secondary,
                        color: theme.mutedForeground,
                      },
                    ]}
                  >
                    {p.model}
                  </ThemedText>
                  {p.badge ? (
                    <ThemedText
                      style={[
                        styles.badgeTag,
                        {
                          backgroundColor: `${theme.primary}22`,
                          color: theme.primary,
                        },
                      ]}
                    >
                      {p.badge}
                    </ThemedText>
                  ) : null}
                </View>
              </SelectableModelCard>
            );
          })}
        </View>
      </Card>

      {/* 3. Cleanup LLM Selection */}
      <Card>
        <SectionTitle icon={Sparkles} title="Post-Processing & Cleanup" />
        <View style={styles.list}>
          {CLEANUP_MODELS.map((m) => {
            const active = cleanupModel === m.id;
            return (
              <SelectableModelCard
                key={m.id}
                title={m.title}
                description={m.description}
                active={active}
                onPress={() => setCleanupModel(m.id)}
              />
            );
          })}
        </View>
      </Card>

      {/* 4. API Keys (BYOK) */}
      <Card>
        <SectionTitle icon={Key} title="API Keys (BYOK)" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          Keys are stored securely in your device keychain and synced to your
          Cadence server for real-time streaming.
        </ThemedText>

        {/* Groq Key */}
        <View style={styles.keyBlock}>
          <View style={styles.keyHeader}>
            <View style={styles.keyTitleRow}>
              <ThemedText style={styles.keyName}>Groq API Key</ThemedText>
              {groqConfigured ? (
                <View style={styles.statusBadge}>
                  <Check size={12} color="#10B981" />
                  <ThemedText style={styles.statusTextGreen}>
                    Configured
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.statusTextMuted}>Not set</ThemedText>
              )}
            </View>
            <Pressable
              onPress={() => Linking.openURL("https://console.groq.com/keys")}
              hitSlop={8}
              style={styles.linkRow}
            >
              <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                Get free key
              </ThemedText>
              <ExternalLink size={12} color={theme.primary} />
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={groqInput}
              onChangeText={setGroqInput}
              placeholder={
                groqConfigured ? "Enter new key to replace…" : "gsk_..."
              }
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.secondary,
                  color: theme.foreground,
                  borderColor: theme.border,
                },
              ]}
            />
            <Pressable
              onPress={handleSaveGroq}
              disabled={!groqInput.trim() || savingGroq}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: groqInput.trim()
                    ? theme.primary
                    : theme.muted,
                },
              ]}
            >
              {savingGroq ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primaryForeground}
                />
              ) : (
                <ThemedText
                  style={[
                    styles.actionBtnText,
                    { color: theme.primaryForeground },
                  ]}
                >
                  Save
                </ThemedText>
              )}
            </Pressable>
            {groqConfigured ? (
              <Pressable
                onPress={handleDeleteGroq}
                style={[styles.deleteBtn, { borderColor: theme.border }]}
              >
                <Trash2 size={16} color={theme.destructive} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* OpenAI Key */}
        <View style={styles.keyBlock}>
          <View style={styles.keyHeader}>
            <View style={styles.keyTitleRow}>
              <ThemedText style={styles.keyName}>OpenAI API Key</ThemedText>
              {openAiConfigured ? (
                <View style={styles.statusBadge}>
                  <Check size={12} color="#10B981" />
                  <ThemedText style={styles.statusTextGreen}>
                    Configured
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.statusTextMuted}>Not set</ThemedText>
              )}
            </View>
            <Pressable
              onPress={() =>
                Linking.openURL("https://platform.openai.com/api-keys")
              }
              hitSlop={8}
              style={styles.linkRow}
            >
              <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                Get key
              </ThemedText>
              <ExternalLink size={12} color={theme.primary} />
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={openAiInput}
              onChangeText={setOpenAiInput}
              placeholder={
                openAiConfigured ? "Enter new key to replace…" : "sk-..."
              }
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.secondary,
                  color: theme.foreground,
                  borderColor: theme.border,
                },
              ]}
            />
            <Pressable
              onPress={handleSaveOpenAi}
              disabled={!openAiInput.trim() || savingOpenAi}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: openAiInput.trim()
                    ? theme.primary
                    : theme.muted,
                },
              ]}
            >
              {savingOpenAi ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primaryForeground}
                />
              ) : (
                <ThemedText
                  style={[
                    styles.actionBtnText,
                    { color: theme.primaryForeground },
                  ]}
                >
                  Save
                </ThemedText>
              )}
            </Pressable>
            {openAiConfigured ? (
              <Pressable
                onPress={handleDeleteOpenAi}
                style={[styles.deleteBtn, { borderColor: theme.border }]}
              >
                <Trash2 size={16} color={theme.destructive} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Card>

      {/* 5. Server Connection Endpoint */}
      <Card>
        <SectionTitle icon={Server} title="Server Endpoint" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          Cadence server URL handling streaming STT, database sync, and user
          data.
        </ThemedText>

        <View style={styles.serverInfoCard}>
          <ThemedText style={styles.serverCurrentLabel}>
            Active Host:
          </ThemedText>
          <ThemedText
            style={[styles.serverCurrentUrl, { color: theme.primary }]}
          >
            {cloudUrl()}
          </ThemedText>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={serverInput}
            onChangeText={setServerInput}
            placeholder="Custom URL (e.g. http://192.168.1.x:4649)"
            placeholderTextColor={theme.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.secondary,
                color: theme.foreground,
                borderColor: theme.border,
              },
            ]}
          />
          <Pressable
            onPress={handleSaveServer}
            disabled={savingServer}
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          >
            {savingServer ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <ThemedText
                style={[
                  styles.actionBtnText,
                  { color: theme.primaryForeground },
                ]}
              >
                Update
              </ThemedText>
            )}
          </Pressable>
        </View>
      </Card>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  activePairCard: {
    padding: Spacing.four,
  },
  activePairRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pairHalf: {
    flex: 1,
  },
  pairDivider: {
    width: 1,
    height: 48,
    marginHorizontal: Spacing.three,
  },
  pairKicker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    opacity: 0.6,
    marginBottom: 2,
  },
  pairModelName: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    fontWeight: "600",
  },
  pairProvider: {
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    gap: Spacing.two,
  },
  modelMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  monoBadge: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeTag: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  sectionLead: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  keyBlock: {
    marginBottom: Spacing.four,
  },
  keyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.one,
  },
  keyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  keyName: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusTextGreen: {
    color: "#10B981",
    fontSize: 11,
    fontFamily: Fonts.mono,
    fontWeight: "600",
  },
  statusTextMuted: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    opacity: 0.5,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  actionBtn: {
    height: 42,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  deleteBtn: {
    height: 42,
    width: 42,
    borderWidth: 1,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  serverInfoCard: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  serverCurrentLabel: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    opacity: 0.6,
  },
  serverCurrentUrl: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    fontWeight: "600",
    marginTop: 2,
  },
  selectableCard: {
    position: "relative",
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    overflow: "hidden",
  },
  selectableMarker: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  selectableContent: {
    flex: 1,
  },
  selectableTitle: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    fontWeight: "600",
  },
  selectableDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
