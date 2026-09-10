import * as Haptics from "expo-haptics";
import {
  Check,
  Cpu,
  ExternalLink,
  Key,
  Mic,
  RefreshCw,
  Server,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
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
import {
  ALL_PROVIDERS,
  type CleanupProviderId,
  type ProviderId,
  type TranscriptionProvider,
  useModelConfig,
} from "@/lib/models";

const VOICE_PROVIDERS: {
  id: TranscriptionProvider;
  name: string;
  desc: string;
  icon: string;
  defaultModel: string;
  keyUrl: string;
}[] = [
  {
    id: "groq",
    name: "Groq Whisper",
    desc: "Ultra-fast direct speech recognition (~200ms)",
    icon: "⚡",
    defaultModel: "whisper-large-v3-turbo",
    keyUrl: "https://console.groq.com/keys",
  },
  {
    id: "openai",
    name: "OpenAI Whisper",
    desc: "Industry-standard accuracy across 99+ languages",
    icon: "🤖",
    defaultModel: "whisper-1",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "deepgram",
    name: "Deepgram Nova-3",
    desc: "Fast streaming speech-to-text model",
    icon: "🎙️",
    defaultModel: "nova-3",
    keyUrl: "https://console.deepgram.com",
  },
];

const CLEANUP_PROVIDER_LIST: {
  id: CleanupProviderId;
  name: string;
  icon: string;
}[] = [
  { id: "groq", name: "Groq", icon: "⚡" },
  { id: "openai", name: "OpenAI", icon: "🤖" },
  { id: "anthropic", name: "Anthropic", icon: "🧠" },
  { id: "google", name: "Gemini", icon: "🌐" },
  { id: "mistral", name: "Mistral", icon: "🌪️" },
  { id: "openrouter", name: "OpenRouter", icon: "🔀" },
  { id: "custom", name: "Custom LLM", icon: "🦙" },
  { id: "off", name: "Off (Raw)", icon: "🚫" },
];

export default function ModelsSettingsScreen() {
  const theme = useTheme();
  const {
    provider,
    cleanupProvider,
    cleanupModel,
    magicEditLlmProvider,
    customServerUrl,
    configuredKeys,
    discoveredModels,
    discovering,
    setProvider,
    setCleanupProvider,
    setCleanupModel,
    setMagicEditLlmProvider,
    setMagicEditLlmModel,
    setCustomServerUrl,
    saveApiKey,
    deleteApiKey,
    discoverModels,
  } = useModelConfig();

  // Active top-level mode: "transcription" or "cleanup"
  const [activeMode, setActiveMode] = useState<"transcription" | "cleanup">(
    "transcription",
  );

  // Key input states
  const [keyInput, setKeyInput] = useState("");
  const [customUrlInput, setCustomUrlInput] = useState(customServerUrl);
  const [customModelInput, setCustomModelInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  // Switch active mode (Transcription vs Clean-up)
  const handleSelectMode = (mode: "transcription" | "cleanup") => {
    setActiveMode(mode);
    setKeyInput("");
    setCustomModelInput("");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Provider meta for active selection
  const activeVoiceProviderMeta = useMemo(
    () => VOICE_PROVIDERS.find((p) => p.id === provider) || VOICE_PROVIDERS[0],
    [provider],
  );

  const activeCleanupProviderMeta = useMemo(() => {
    if (cleanupProvider === "off") return null;
    return (
      ALL_PROVIDERS.find((p) => p.id === cleanupProvider) || ALL_PROVIDERS[0]
    );
  }, [cleanupProvider]);

  // Current provider depending on which mode is active
  const currentTargetProvider: ProviderId =
    activeMode === "transcription"
      ? provider
      : cleanupProvider === "off"
        ? "groq"
        : (cleanupProvider as ProviderId);

  const isCurrentKeyConfigured = configuredKeys[currentTargetProvider];

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setSavingKey(true);
    try {
      await saveApiKey(currentTargetProvider, key);
      setKeyInput("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Saved",
        `${currentTargetProvider.toUpperCase()} API key saved securely. Live models discovered.`,
      );
    } catch {
      Alert.alert("Error", `Could not save ${currentTargetProvider} key.`);
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = () => {
    Alert.alert(
      `Remove ${currentTargetProvider.toUpperCase()} Key?`,
      `This removes your stored ${currentTargetProvider} credentials.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteApiKey(currentTargetProvider);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
    );
  };

  const handleSaveCustomUrl = async () => {
    if (!customUrlInput.trim()) return;
    await setCustomServerUrl(customUrlInput.trim());
    await discoverModels("custom");
    Alert.alert("Saved", "Custom endpoint saved and models queried.");
  };

  const handleDiscover = async () => {
    try {
      const models = await discoverModels(currentTargetProvider);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Discovery Complete",
        `Discovered ${models.length} active models for ${currentTargetProvider.toUpperCase()}.`,
      );
    } catch {
      Alert.alert(
        "Discovery Notice",
        `Could not query live models from ${currentTargetProvider}. Please check your key or endpoint.`,
      );
    }
  };

  // Models list for current view
  const currentAvailableModels = useMemo(() => {
    if (activeMode === "transcription") {
      const list = discoveredModels[provider] || [];
      const voiceOnly = list.filter((m) => m.type === "voice");
      if (voiceOnly.length > 0) return voiceOnly;
      // Fallback
      return [
        {
          id: activeVoiceProviderMeta.defaultModel,
          name: activeVoiceProviderMeta.name,
          providerId: provider,
          providerName: activeVoiceProviderMeta.name,
          type: "voice" as const,
          curated: true,
        },
      ];
    }

    if (cleanupProvider === "off") return [];
    const list = discoveredModels[cleanupProvider as ProviderId] || [];
    return list.filter((m) => m.type === "llm");
  }, [
    activeMode,
    provider,
    cleanupProvider,
    discoveredModels,
    activeVoiceProviderMeta,
  ]);

  return (
    <SettingsScreenScaffold
      title="Models & Providers"
      subtitle="Select a box below to configure Transcription or Clean-up. Everything edits directly in a single flow."
    >
      {/* 1. The Two Hero Boxes: Transcription vs Clean-up */}
      <View style={styles.boxesRow}>
        {/* Box 1: Transcription */}
        <Pressable
          onPress={() => handleSelectMode("transcription")}
          style={[
            styles.heroBox,
            {
              backgroundColor:
                activeMode === "transcription" ? theme.card : theme.secondary,
              borderColor:
                activeMode === "transcription" ? theme.primary : theme.border,
              borderWidth: activeMode === "transcription" ? 2 : 1,
            },
          ]}
        >
          <View style={styles.boxHeaderRow}>
            <View style={styles.boxTagRow}>
              <Mic
                size={12}
                color={
                  activeMode === "transcription"
                    ? theme.primary
                    : theme.mutedForeground
                }
              />
              <ThemedText
                style={[
                  styles.boxKicker,
                  {
                    color:
                      activeMode === "transcription"
                        ? theme.primary
                        : theme.mutedForeground,
                  },
                ]}
              >
                TRANSCRIPTION
              </ThemedText>
            </View>
            {activeMode === "transcription" ? (
              <View
                style={[styles.activePill, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.activePillText}>EDITING</ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText
            type="title"
            style={styles.boxModelName}
            numberOfLines={1}
          >
            {provider === "groq"
              ? "Whisper Turbo"
              : provider === "openai"
                ? "Whisper-1"
                : "Nova-3"}
          </ThemedText>

          <ThemedText
            themeColor="mutedForeground"
            style={styles.boxProvider}
            numberOfLines={1}
          >
            {activeVoiceProviderMeta.icon} {activeVoiceProviderMeta.name}
          </ThemedText>
        </Pressable>

        {/* Box 2: Clean-up */}
        <Pressable
          onPress={() => handleSelectMode("cleanup")}
          style={[
            styles.heroBox,
            {
              backgroundColor:
                activeMode === "cleanup" ? theme.card : theme.secondary,
              borderColor:
                activeMode === "cleanup" ? theme.primary : theme.border,
              borderWidth: activeMode === "cleanup" ? 2 : 1,
            },
          ]}
        >
          <View style={styles.boxHeaderRow}>
            <View style={styles.boxTagRow}>
              <Sparkles
                size={12}
                color={
                  activeMode === "cleanup"
                    ? theme.primary
                    : theme.mutedForeground
                }
              />
              <ThemedText
                style={[
                  styles.boxKicker,
                  {
                    color:
                      activeMode === "cleanup"
                        ? theme.primary
                        : theme.mutedForeground,
                  },
                ]}
              >
                CLEAN-UP
              </ThemedText>
            </View>
            {activeMode === "cleanup" ? (
              <View
                style={[styles.activePill, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.activePillText}>EDITING</ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText
            type="title"
            style={styles.boxModelName}
            numberOfLines={1}
          >
            {cleanupProvider === "off"
              ? "Disabled (Raw)"
              : cleanupModel || "Default"}
          </ThemedText>

          <ThemedText
            themeColor="mutedForeground"
            style={styles.boxProvider}
            numberOfLines={1}
          >
            {cleanupProvider === "off"
              ? "🚫 No AI Rewrite"
              : `${activeCleanupProviderMeta?.icon || "✨"} ${activeCleanupProviderMeta?.name || cleanupProvider.toUpperCase()}`}
          </ThemedText>
        </Pressable>
      </View>

      {/* 2. The Integrated Configuration Panel (Directly Under the Active Box) */}
      <Card style={styles.editorCard}>
        {activeMode === "transcription" ? (
          /* ================= TRANSCRIPTION CONFIGURATION ================= */
          <View>
            <SectionTitle
              icon={Cpu}
              title="Transcription Engine (Speech-to-Text)"
            />
            <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
              Select the engine that converts your microphone audio into text.
            </ThemedText>

            {/* Provider Options */}
            <View style={styles.providerRow}>
              {VOICE_PROVIDERS.map((vp) => {
                const isSelected = provider === vp.id;
                const isConfigured = configuredKeys[vp.id];
                return (
                  <Pressable
                    key={vp.id}
                    onPress={() => {
                      setProvider(vp.id);
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                    }}
                    style={[
                      styles.providerSelectCard,
                      {
                        backgroundColor: isSelected
                          ? theme.accent
                          : theme.secondary,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.providerTopLine}>
                      <ThemedText style={styles.providerIconText}>
                        {vp.icon}
                      </ThemedText>
                      {isConfigured ? (
                        <View style={styles.dotConfigured} />
                      ) : (
                        <View style={styles.dotNotConfigured} />
                      )}
                    </View>
                    <ThemedText style={styles.providerSelectName}>
                      {vp.name}
                    </ThemedText>
                    <ThemedText
                      themeColor="mutedForeground"
                      style={styles.providerSelectDesc}
                      numberOfLines={2}
                    >
                      {vp.desc}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* Selected Voice Provider Key Management */}
            <View
              style={[
                styles.keyContainer,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.keyHeader}>
                <View style={styles.keyTitleRow}>
                  <Key size={14} color={theme.primary} />
                  <ThemedText style={styles.keyHeading}>
                    {activeVoiceProviderMeta.name} API Key
                  </ThemedText>
                  {isCurrentKeyConfigured ? (
                    <View style={styles.statusBadgeGreen}>
                      <Check size={11} color="#10B981" />
                      <ThemedText style={styles.statusTextGreen}>
                        Active
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.statusTextMuted}>
                      Key Required
                    </ThemedText>
                  )}
                </View>
                {activeVoiceProviderMeta.keyUrl ? (
                  <Pressable
                    onPress={() =>
                      Linking.openURL(activeVoiceProviderMeta.keyUrl)
                    }
                    hitSlop={8}
                    style={styles.linkRow}
                  >
                    <ThemedText
                      style={[styles.linkText, { color: theme.primary }]}
                    >
                      Get key
                    </ThemedText>
                    <ExternalLink size={11} color={theme.primary} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  value={keyInput}
                  onChangeText={setKeyInput}
                  placeholder={
                    isCurrentKeyConfigured
                      ? "Paste new key to update…"
                      : "Paste API key…"
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
                  onPress={handleSaveKey}
                  disabled={!keyInput.trim() || savingKey}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: keyInput.trim()
                        ? theme.primary
                        : theme.muted,
                    },
                  ]}
                >
                  {savingKey ? (
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
                {isCurrentKeyConfigured ? (
                  <Pressable
                    onPress={handleDeleteKey}
                    style={[styles.deleteBtn, { borderColor: theme.border }]}
                  >
                    <Trash2 size={16} color={theme.destructive} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Model Discovery for Voice */}
            <View style={styles.modelListHeader}>
              <ThemedText style={styles.subHeading}>
                Models for {activeVoiceProviderMeta.name}
              </ThemedText>
              <Pressable
                onPress={handleDiscover}
                disabled={discovering[provider]}
                style={[styles.discoverBtn, { borderColor: theme.border }]}
              >
                {discovering[provider] ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <RefreshCw size={11} color={theme.primary} />
                    <ThemedText
                      style={[styles.discoverBtnText, { color: theme.primary }]}
                    >
                      Discover Models
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            {/* Models list */}
            <View style={styles.list}>
              {currentAvailableModels.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    // Current voice provider uses selected default
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.modelOptionCard,
                    {
                      borderColor: theme.primary,
                      backgroundColor: theme.accent,
                    },
                  ]}
                >
                  <View style={styles.modelOptionContent}>
                    <ThemedText style={styles.modelOptionTitle}>
                      {m.name || m.id}
                    </ThemedText>
                    <ThemedText
                      themeColor="mutedForeground"
                      style={styles.modelOptionDesc}
                    >
                      {m.description ||
                        `Active speech recognition model (${m.id})`}
                    </ThemedText>
                  </View>
                  <View style={styles.modelActiveCheck}>
                    <Check size={14} color={theme.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          /* ================= CLEAN-UP CONFIGURATION ================= */
          <View>
            <SectionTitle
              icon={Sparkles}
              title="Clean-up Intelligence (Post-Processing)"
            />
            <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
              Select the LLM that removes filler words, fixes grammar, and
              polishes your transcript.
            </ThemedText>

            {/* Provider Selector Pills */}
            <ThemedText style={styles.subHeading}>Clean-up Provider</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hScroll}
            >
              <View style={styles.pillRow}>
                {CLEANUP_PROVIDER_LIST.map((cp) => {
                  const isSelected = cleanupProvider === cp.id;
                  const isConfigured =
                    cp.id === "off" || configuredKeys[cp.id as ProviderId];
                  return (
                    <Pressable
                      key={cp.id}
                      onPress={() => {
                        setCleanupProvider(cp.id);
                        if (cp.id !== "off") {
                          const def =
                            ALL_PROVIDERS.find((p) => p.id === cp.id)
                              ?.defaultLlmModel || "";
                          if (def) setCleanupModel(def);
                        }
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                      }}
                      style={[
                        styles.choicePill,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.secondary,
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      <ThemedText style={styles.pillIcon}>{cp.icon}</ThemedText>
                      <ThemedText
                        style={[
                          styles.choicePillText,
                          {
                            color: isSelected
                              ? theme.primaryForeground
                              : theme.foreground,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {cp.name}
                      </ThemedText>
                      {cp.id !== "off" && isConfigured ? (
                        <View
                          style={[
                            styles.dotInsidePill,
                            {
                              backgroundColor: isSelected
                                ? theme.primaryForeground
                                : "#10B981",
                            },
                          ]}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {cleanupProvider === "off" ? (
              <View
                style={[
                  styles.offNoticeBox,
                  {
                    backgroundColor: theme.secondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText style={styles.offNoticeTitle}>
                  🚫 Raw Audio Dictation Mode
                </ThemedText>
                <ThemedText
                  themeColor="mutedForeground"
                  style={styles.offNoticeDesc}
                >
                  Clean-up is disabled. Spoken words will be returned exactly as
                  recognized by the voice engine without any AI editing or
                  filler removal.
                </ThemedText>
              </View>
            ) : (
              <View>
                {/* Custom Endpoint URL if custom */}
                {cleanupProvider === "custom" ? (
                  <View style={styles.customUrlBlock}>
                    <ThemedText style={styles.inputLabel}>
                      Endpoint Base URL (Ollama / Local LLM)
                    </ThemedText>
                    <View style={styles.inputRow}>
                      <TextInput
                        value={customUrlInput}
                        onChangeText={setCustomUrlInput}
                        placeholder="http://192.168.1.50:11434"
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
                        onPress={handleSaveCustomUrl}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.actionBtnText,
                            { color: theme.primaryForeground },
                          ]}
                        >
                          Save URL
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {/* API Key Management for Selected Clean-up Provider */}
                <View
                  style={[
                    styles.keyContainer,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.keyHeader}>
                    <View style={styles.keyTitleRow}>
                      <Key size={14} color={theme.primary} />
                      <ThemedText style={styles.keyHeading}>
                        {activeCleanupProviderMeta?.name} API Key
                      </ThemedText>
                      {isCurrentKeyConfigured ? (
                        <View style={styles.statusBadgeGreen}>
                          <Check size={11} color="#10B981" />
                          <ThemedText style={styles.statusTextGreen}>
                            Active
                          </ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.statusTextMuted}>
                          Key Required
                        </ThemedText>
                      )}
                    </View>
                    {activeCleanupProviderMeta?.keyUrl ? (
                      <Pressable
                        onPress={() =>
                          Linking.openURL(activeCleanupProviderMeta.keyUrl!)
                        }
                        hitSlop={8}
                        style={styles.linkRow}
                      >
                        <ThemedText
                          style={[styles.linkText, { color: theme.primary }]}
                        >
                          Get key
                        </ThemedText>
                        <ExternalLink size={11} color={theme.primary} />
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.inputRow}>
                    <TextInput
                      value={keyInput}
                      onChangeText={setKeyInput}
                      placeholder={
                        isCurrentKeyConfigured
                          ? "Paste new key to update…"
                          : "Paste API key…"
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
                      onPress={handleSaveKey}
                      disabled={!keyInput.trim() || savingKey}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: keyInput.trim()
                            ? theme.primary
                            : theme.muted,
                        },
                      ]}
                    >
                      {savingKey ? (
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
                    {isCurrentKeyConfigured ? (
                      <Pressable
                        onPress={handleDeleteKey}
                        style={[
                          styles.deleteBtn,
                          { borderColor: theme.border },
                        ]}
                      >
                        <Trash2 size={16} color={theme.destructive} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {/* Model Selection for Clean-up */}
                <View style={styles.modelListHeader}>
                  <ThemedText style={styles.subHeading}>
                    Select Model for {activeCleanupProviderMeta?.name}
                  </ThemedText>
                  <Pressable
                    onPress={handleDiscover}
                    disabled={discovering[currentTargetProvider]}
                    style={[styles.discoverBtn, { borderColor: theme.border }]}
                  >
                    {discovering[currentTargetProvider] ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <>
                        <RefreshCw size={11} color={theme.primary} />
                        <ThemedText
                          style={[
                            styles.discoverBtnText,
                            { color: theme.primary },
                          ]}
                        >
                          Discover Models
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* Models List */}
                <View style={styles.list}>
                  {currentAvailableModels.map((m) => {
                    const isSelected = cleanupModel === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => {
                          setCleanupModel(m.id);
                          void Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        }}
                        style={[
                          styles.modelOptionCard,
                          {
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                            backgroundColor: isSelected
                              ? theme.accent
                              : "transparent",
                          },
                        ]}
                      >
                        <View style={styles.modelOptionContent}>
                          <ThemedText
                            style={[
                              styles.modelOptionTitle,
                              {
                                color: isSelected
                                  ? theme.primary
                                  : theme.foreground,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {m.name || m.id}
                          </ThemedText>
                          <ThemedText
                            themeColor="mutedForeground"
                            style={styles.modelOptionDesc}
                          >
                            {m.description || `ID: ${m.id}`}
                          </ThemedText>
                        </View>
                        {isSelected ? (
                          <View style={styles.modelActiveCheck}>
                            <Check size={14} color={theme.primary} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Model ID Fallback */}
                <View style={styles.customModelBox}>
                  <ThemedText style={styles.inputLabel}>
                    Or specify custom model ID:
                  </ThemedText>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={customModelInput}
                      onChangeText={setCustomModelInput}
                      placeholder="e.g. llama-3.1-8b-instant…"
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
                      onPress={() => {
                        if (customModelInput.trim()) {
                          setCleanupModel(customModelInput.trim());
                          setCustomModelInput("");
                          Alert.alert(
                            "Model Set",
                            `Clean-up model set to ${customModelInput.trim()}`,
                          );
                        }
                      }}
                      disabled={!customModelInput.trim()}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: customModelInput.trim()
                            ? theme.primary
                            : theme.muted,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.actionBtnText,
                          { color: theme.primaryForeground },
                        ]}
                      >
                        Set
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* 3. Magic Edit Model Settings */}
      <Card>
        <SectionTitle icon={Wand2} title="Magic Edit Model" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          Configure which LLM powers voice rewriting in the Magic Edit tab.
        </ThemedText>

        <ThemedText style={styles.subHeading}>Magic Edit Provider</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
        >
          <View style={styles.pillRow}>
            {(
              [
                "auto",
                "groq",
                "openai",
                "anthropic",
                "google",
                "mistral",
                "openrouter",
                "custom",
              ] as const
            ).map((p) => {
              const isSelected = magicEditLlmProvider === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setMagicEditLlmProvider(p);
                    const def =
                      p === "auto"
                        ? ""
                        : ALL_PROVIDERS.find((meta) => meta.id === p)
                            ?.defaultLlmModel || "";
                    setMagicEditLlmModel(def);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.choicePill,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.secondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.choicePillText,
                      {
                        color: isSelected
                          ? theme.primaryForeground
                          : theme.foreground,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {p === "auto" ? "AUTO (MATCH CLEAN-UP)" : p.toUpperCase()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Card>

      {/* 4. Serverless Architecture */}
      <Card>
        <SectionTitle icon={Server} title="Serverless Architecture" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          100% direct client-side speech recognition & LLM completions. Zero
          cold-start delays. Data synced to Supabase.
        </ThemedText>
      </Card>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  boxesRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  heroBox: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  boxHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  boxTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  boxKicker: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activePillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: Fonts.mono,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  boxModelName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  boxProvider: {
    fontSize: 11,
    marginTop: 2,
  },
  editorCard: {
    marginBottom: Spacing.four,
  },
  sectionLead: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  providerRow: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  providerSelectCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  providerTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  providerIconText: {
    fontSize: 16,
  },
  dotConfigured: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  dotNotConfigured: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#9CA3AF",
  },
  providerSelectName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  providerSelectDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  keyContainer: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  keyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  keyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  keyHeading: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
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
    fontSize: 11,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  actionBtn: {
    height: 40,
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
    height: 40,
    width: 40,
    borderWidth: 1,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modelListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  discoverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  discoverBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  list: {
    gap: Spacing.two,
  },
  modelOptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  modelOptionDesc: {
    fontSize: 11,
  },
  modelActiveCheck: {
    marginLeft: Spacing.two,
  },
  hScroll: {
    marginBottom: Spacing.three,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  choicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 12,
  },
  choicePillText: {
    fontSize: 12,
  },
  dotInsidePill: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  offNoticeBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  offNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  offNoticeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  customUrlBlock: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  customModelBox: {
    marginTop: Spacing.three,
  },
});
