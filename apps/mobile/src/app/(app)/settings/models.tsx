import {
  Check,
  Cpu,
  ExternalLink,
  Key,
  RefreshCw,
  Server,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react-native";
import { useState } from "react";
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
  type ProviderId,
  type TranscriptionProvider,
  useModelConfig,
} from "@/lib/models";

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
    cleanupProvider,
    cleanupModel,
    magicEditLlmProvider,
    magicEditLlmModel,
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

  const [activeProviderTab, setActiveProviderTab] =
    useState<ProviderId>("groq");
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [customUrlInput, setCustomUrlInput] = useState(customServerUrl);
  const [customCleanupInput, setCustomCleanupInput] = useState("");
  const [_customMagicLlmInput, _setCustomMagicLlmInput] = useState("");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  const handleSaveKey = async (target: ProviderId) => {
    const key = keyInputs[target]?.trim();
    if (!key) return;
    setSavingMap((prev) => ({ ...prev, [target]: true }));
    try {
      await saveApiKey(target, key);
      setKeyInputs((prev) => ({ ...prev, [target]: "" }));
      Alert.alert(
        "Saved",
        `${target.toUpperCase()} API key saved securely. Live models discovered.`,
      );
    } catch {
      Alert.alert("Error", `Could not save ${target} key.`);
    } finally {
      setSavingMap((prev) => ({ ...prev, [target]: false }));
    }
  };

  const handleDeleteKey = (target: ProviderId) => {
    Alert.alert(
      `Remove ${target.toUpperCase()} key?`,
      `This removes your stored ${target} credentials.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteApiKey(target),
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

  const handleDiscover = async (target: ProviderId) => {
    try {
      const models = await discoverModels(target);
      Alert.alert(
        "Discovery Complete",
        `Discovered ${models.length} active models for ${target.toUpperCase()}.`,
      );
    } catch {
      Alert.alert(
        "Discovery Notice",
        `Could not query live models from ${target}. Please verify your API key or network connection.`,
      );
    }
  };

  const activeMeta =
    ALL_PROVIDERS.find((p) => p.id === activeProviderTab) || ALL_PROVIDERS[0];
  const activeDiscovered = discoveredModels[activeProviderTab] || [];

  // Models available for current cleanup provider
  const availableCleanupModels =
    cleanupProvider !== "off" && cleanupProvider
      ? discoveredModels[cleanupProvider as ProviderId] || []
      : [];

  // Models available for current magic edit LLM provider
  const availableMagicLlmModels =
    magicEditLlmProvider !== "auto" && magicEditLlmProvider
      ? discoveredModels[magicEditLlmProvider as ProviderId] || []
      : [];

  return (
    <SettingsScreenScaffold
      title="Models & Providers"
      subtitle="Full desktop parity. Bring your own keys (BYOK), discover live models from your accounts, and configure clean-up & magic edits."
    >
      {/* 1. Active Model Pair Card */}
      <Card style={styles.activePairCard}>
        <View style={styles.activePairRow}>
          <View style={styles.pairHalf}>
            <ThemedText style={styles.pairKicker}>TRANSCRIPTION</ThemedText>
            <ThemedText type="title" style={styles.pairModelName}>
              {provider === "groq"
                ? "Whisper Turbo"
                : provider === "openai"
                  ? "Whisper-1"
                  : "Nova-3"}
            </ThemedText>
            <ThemedText
              themeColor="mutedForeground"
              style={styles.pairProvider}
            >
              {provider.toUpperCase()} (BYOK)
            </ThemedText>
          </View>

          <View
            style={[styles.pairDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.pairHalf}>
            <ThemedText style={styles.pairKicker}>CLEANUP (LLM)</ThemedText>
            <ThemedText
              type="title"
              style={styles.pairModelName}
              numberOfLines={1}
            >
              {cleanupProvider === "off"
                ? "Disabled"
                : cleanupModel || "Default"}
            </ThemedText>
            <ThemedText
              themeColor="mutedForeground"
              style={styles.pairProvider}
            >
              {cleanupProvider === "off"
                ? "Raw audio transcript"
                : `${cleanupProvider.toUpperCase()} Polish`}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* 2. Provider Manager & Model Discovery */}
      <Card>
        <SectionTitle icon={Key} title="Provider Manager & Keys (BYOK)" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          Configure any provider available in the desktop app. Tap "Discover
          Models" to query models directly from your accounts.
        </ThemedText>

        {/* Provider Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.providerTabScroll}
        >
          {ALL_PROVIDERS.map((p) => {
            const isSelected = p.id === activeProviderTab;
            const isConfigured = configuredKeys[p.id];
            return (
              <Pressable
                key={p.id}
                onPress={() => setActiveProviderTab(p.id)}
                style={[
                  styles.providerTab,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.secondary,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText style={styles.providerTabIcon}>{p.icon}</ThemedText>
                <ThemedText
                  style={[
                    styles.providerTabText,
                    {
                      color: isSelected
                        ? theme.primaryForeground
                        : theme.foreground,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {p.name}
                </ThemedText>
                {isConfigured ? (
                  <View
                    style={[
                      styles.configDot,
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
        </ScrollView>

        {/* Active Provider Detail Box */}
        <View
          style={[
            styles.providerDetailBox,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.providerHeader}>
            <View style={styles.providerTitleRow}>
              <ThemedText style={styles.providerTitle}>
                {activeMeta.icon} {activeMeta.name}
              </ThemedText>
              {configuredKeys[activeMeta.id] ? (
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

            {activeMeta.keyUrl ? (
              <Pressable
                onPress={() => Linking.openURL(activeMeta.keyUrl!)}
                hitSlop={8}
                style={styles.linkRow}
              >
                <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                  Get key
                </ThemedText>
                <ExternalLink size={12} color={theme.primary} />
              </Pressable>
            ) : null}
          </View>

          <ThemedText themeColor="mutedForeground" style={styles.providerDesc}>
            {activeMeta.desc}
          </ThemedText>

          {/* Custom URL input if custom provider */}
          {activeMeta.id === "custom" ? (
            <View style={styles.customUrlBlock}>
              <ThemedText style={styles.inputLabel}>
                Endpoint Base URL
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
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
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

          {/* Key Input Row */}
          <View style={styles.inputBlock}>
            <ThemedText style={styles.inputLabel}>
              {activeMeta.id === "custom" ? "API Key (Optional)" : "API Key"}
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                value={keyInputs[activeMeta.id] || ""}
                onChangeText={(val) =>
                  setKeyInputs((prev) => ({ ...prev, [activeMeta.id]: val }))
                }
                placeholder={
                  configuredKeys[activeMeta.id]
                    ? "Enter new key to replace…"
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
                onPress={() => handleSaveKey(activeMeta.id)}
                disabled={
                  !keyInputs[activeMeta.id]?.trim() || savingMap[activeMeta.id]
                }
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: keyInputs[activeMeta.id]?.trim()
                      ? theme.primary
                      : theme.muted,
                  },
                ]}
              >
                {savingMap[activeMeta.id] ? (
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
              {configuredKeys[activeMeta.id] ? (
                <Pressable
                  onPress={() => handleDeleteKey(activeMeta.id)}
                  style={[styles.deleteBtn, { borderColor: theme.border }]}
                >
                  <Trash2 size={16} color={theme.destructive} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Discover Models Button */}
          <View style={styles.discoveryHeader}>
            <View style={styles.discoveryTitleRow}>
              <ThemedText style={styles.discoveryTitle}>
                Discovered Models
              </ThemedText>
              <ThemedText style={styles.discoveryCount}>
                ({activeDiscovered.length} available)
              </ThemedText>
            </View>
            <Pressable
              onPress={() => handleDiscover(activeMeta.id)}
              disabled={discovering[activeMeta.id]}
              style={[styles.discoverBtn, { borderColor: theme.border }]}
            >
              {discovering[activeMeta.id] ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <RefreshCw size={12} color={theme.primary} />
                  <ThemedText
                    style={[styles.discoverBtnText, { color: theme.primary }]}
                  >
                    Discover
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>

          {/* Discovered Model Badges */}
          <View style={styles.badgeWrap}>
            {activeDiscovered.map((m) => {
              const isCleanupActive =
                cleanupProvider === activeMeta.id && cleanupModel === m.id;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.modelBadge,
                    {
                      backgroundColor: isCleanupActive
                        ? theme.accent
                        : theme.secondary,
                      borderColor: isCleanupActive
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <ThemedText style={styles.modelBadgeName} numberOfLines={1}>
                    {m.name || m.id}
                  </ThemedText>
                  {m.type === "voice" ? (
                    <ThemedText style={styles.modelBadgeType}>STT</ThemedText>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      {/* 3. Speech Recognition Provider */}
      <Card>
        <SectionTitle icon={Cpu} title="Speech Recognition Provider" />
        <View style={styles.list}>
          {[
            {
              id: "groq" as TranscriptionProvider,
              title: "Groq Whisper",
              model: "whisper-large-v3-turbo",
              description:
                "Ultra-fast direct dictation (~200ms). Free API key.",
              badge: "RECOMMENDED",
            },
            {
              id: "openai" as TranscriptionProvider,
              title: "OpenAI Whisper",
              model: "whisper-1",
              description: "Industry-standard accuracy across 99+ languages.",
            },
            {
              id: "deepgram" as TranscriptionProvider,
              title: "Deepgram Nova-3",
              model: "nova-3",
              description: "Next-generation high-speed voice engine.",
            },
          ].map((p) => {
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

      {/* 4. Clean-up Post-Processing */}
      <Card>
        <SectionTitle icon={Sparkles} title="Post-Processing & Clean-up" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          Select which provider and model polishes your spoken words.
        </ThemedText>

        {/* Clean-up Provider Selector */}
        <ThemedText style={styles.subHeading}>Clean-up Provider</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
        >
          <View style={styles.pillRow}>
            {(
              [
                "off",
                "groq",
                "openai",
                "anthropic",
                "google",
                "mistral",
                "openrouter",
                "custom",
              ] as const
            ).map((p) => {
              const isSelected = cleanupProvider === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setCleanupProvider(p);
                    // Default model for provider
                    const def =
                      ALL_PROVIDERS.find((meta) => meta.id === p)
                        ?.defaultLlmModel || "";
                    if (def) setCleanupModel(def);
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
                    {p === "off" ? "Off (Raw)" : p.toUpperCase()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Discovered Models for Selected Clean-up Provider */}
        {cleanupProvider !== "off" ? (
          <View style={styles.modelSection}>
            <ThemedText style={styles.subHeading}>
              Select Clean-up Model ({cleanupProvider.toUpperCase()})
            </ThemedText>
            <View style={styles.list}>
              {availableCleanupModels
                .filter((m) => m.type === "llm")
                .map((m) => {
                  const active = cleanupModel === m.id;
                  return (
                    <SelectableModelCard
                      key={m.id}
                      title={m.name || m.id}
                      description={m.description || `Model ID: ${m.id}`}
                      active={active}
                      onPress={() => setCleanupModel(m.id)}
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
                          {m.id}
                        </ThemedText>
                        {m.curated ? (
                          <ThemedText
                            style={[
                              styles.badgeTag,
                              {
                                backgroundColor: `${theme.primary}22`,
                                color: theme.primary,
                              },
                            ]}
                          >
                            RECOMMENDED
                          </ThemedText>
                        ) : null}
                      </View>
                    </SelectableModelCard>
                  );
                })}
            </View>

            {/* Custom Model ID Entry */}
            <View style={styles.customModelRow}>
              <TextInput
                value={customCleanupInput}
                onChangeText={setCustomCleanupInput}
                placeholder="Or enter custom model ID…"
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
                  if (customCleanupInput.trim()) {
                    setCleanupModel(customCleanupInput.trim());
                    setCustomCleanupInput("");
                    Alert.alert(
                      "Applied",
                      `Set clean-up model to ${customCleanupInput.trim()}`,
                    );
                  }
                }}
                disabled={!customCleanupInput.trim()}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: customCleanupInput.trim()
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
                  Apply
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Card>

      {/* 5. Magic Edit Settings */}
      <Card>
        <SectionTitle icon={Wand2} title="Magic Edit AI Engine" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          Configure which LLM executes your voice transformations and
          ghostwriting.
        </ThemedText>

        <ThemedText style={styles.subHeading}>
          Magic Edit LLM Provider
        </ThemedText>
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
                    {p === "auto" ? "AUTO (DEFAULT)" : p.toUpperCase()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {magicEditLlmProvider !== "auto" &&
        availableMagicLlmModels.length > 0 ? (
          <View style={styles.modelSection}>
            <ThemedText style={styles.subHeading}>
              Selected Magic Edit Model: {magicEditLlmModel || "Default"}
            </ThemedText>
            <View style={styles.badgeWrap}>
              {availableMagicLlmModels
                .filter((m) => m.type === "llm")
                .map((m) => {
                  const isSelected = magicEditLlmModel === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMagicEditLlmModel(m.id)}
                      style={[
                        styles.modelSelectPill,
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
                      <ThemedText
                        style={[
                          styles.modelSelectPillText,
                          {
                            color: isSelected
                              ? theme.primaryForeground
                              : theme.foreground,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {m.name || m.id}
                      </ThemedText>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        ) : null}
      </Card>

      {/* 6. Cloud Sync & Architecture */}
      <Card>
        <SectionTitle icon={Server} title="Cloud Architecture" />
        <ThemedText themeColor="mutedForeground" style={styles.sectionLead}>
          100% Serverless. Direct client-side speech recognition and
          multi-provider AI completions (zero cold starts).
        </ThemedText>
        <View style={styles.serverInfoCard}>
          <ThemedText style={styles.serverCurrentLabel}>
            Database & Auth:
          </ThemedText>
          <ThemedText
            style={[styles.serverCurrentUrl, { color: theme.primary }]}
          >
            Supabase (Connected & Synced)
          </ThemedText>
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
    fontSize: 16,
    fontWeight: "600",
  },
  pairProvider: {
    fontSize: 12,
    marginTop: 2,
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
    marginTop: Spacing.one,
  },
  hScroll: {
    marginBottom: Spacing.three,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  choicePillText: {
    fontSize: 12,
  },
  providerTabScroll: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: Spacing.two,
  },
  providerTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  providerTabIcon: {
    fontSize: 14,
  },
  providerTabText: {
    fontSize: 13,
  },
  configDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  providerDetailBox: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  providerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  providerDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.three,
  },
  customUrlBlock: {
    marginBottom: Spacing.three,
  },
  inputBlock: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
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
  discoveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  discoveryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discoveryTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  discoveryCount: {
    fontSize: 11,
    opacity: 0.6,
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
  badgeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  modelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  modelBadgeName: {
    fontSize: 11,
    fontWeight: "500",
  },
  modelBadgeType: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    opacity: 0.7,
  },
  modelSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modelSelectPillText: {
    fontSize: 12,
  },
  modelSection: {
    marginTop: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  customModelRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: Spacing.two,
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
