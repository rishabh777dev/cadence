import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Check,
  Clock,
  Copy,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CadenceMark } from "@/components/cadence-mark";
import { HeaderActions } from "@/components/header-actions";
import { MicButton } from "@/components/mic-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TranscriptView } from "@/components/transcript-view";
import { TutorialPillDemo } from "@/components/tutorial-pill-demo";
import { Waveform } from "@/components/waveform";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useDictation } from "@/lib/audio/use-dictation";
import { type HistoryEntry, useHistory } from "@/lib/history";

function dateGroup(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayMs = 86_400_000;
  const diff = Math.round((startOf(now) - startOf(d)) / dayMs);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatClock(ts: number): string {
  return new Date(ts)
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
    .toLowerCase();
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signedIn } = useAuth();
  const { history, removeHistory } = useHistory();

  const [liveText, setLiveText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { micState, partial, level, onPressIn, onPressOut } = useDictation({
    signedIn,
    onRecordingStart: () => setLiveText(""),
    onFinal: (t) => {
      setLiveText(t);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase().trim();
    return history.filter((entry) => entry.text.toLowerCase().includes(q));
  }, [history, searchQuery]);

  const totalWords = useMemo(
    () => history.reduce((acc, curr) => acc + wordCount(curr.text), 0),
    [history],
  );

  const copyEntry = useCallback(async (entry: HistoryEntry) => {
    await Clipboard.setStringAsync(entry.text);
    setCopiedId(entry.id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const shareEntry = useCallback((entry: HistoryEntry) => {
    void Share.share({ message: entry.text });
  }, []);

  const deleteEntry = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete transcription?",
        "This removes this transcription from your device.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => removeHistory(id),
          },
        ],
      );
    },
    [removeHistory],
  );

  const status =
    micState === "recording"
      ? "Listening"
      : micState === "finalizing"
        ? "Polishing"
        : !signedIn
          ? "Guest Mode — Tap to Sign In"
          : liveText
            ? "Tap mic to dictate again"
            : "Hold or tap to speak";

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Central Interactive Pill Demo Hero */}
      <TutorialPillDemo
        activeRecording={micState === "recording"}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        latestTranscript={liveText || partial}
      />

      {/* Guest Mode Notice */}
      {!signedIn ? (
        <Pressable
          onPress={() => router.push("/sign-in")}
          style={({ pressed }) => [
            styles.guestBanner,
            {
              borderColor: theme.border,
              backgroundColor: pressed ? theme.secondary : theme.accent,
            },
          ]}
        >
          <ThemedText
            style={[styles.guestBannerText, { color: theme.accentForeground }]}
          >
            Guest Mode · Sign in for Cadence Cloud dictation
          </ThemedText>
          <ThemedText
            style={[styles.guestBannerAction, { color: theme.primary }]}
          >
            Sign in →
          </ThemedText>
        </Pressable>
      ) : null}

      {/* Live In-Progress Transcript Preview */}
      {(micState !== "idle" || liveText) && (
        <View style={styles.liveCardWrap}>
          <TranscriptView
            text={liveText}
            partial={partial}
            placeholder="Listening to your voice…"
          />
        </View>
      )}

      {/* Section Header: Recent Transcriptions */}
      <View style={styles.sectionRow}>
        <View>
          <ThemedText style={styles.sectionTitle}>
            Recent Transcriptions
          </ThemedText>
          <ThemedText
            themeColor="mutedForeground"
            style={styles.sectionSubtitle}
          >
            {history.length === 0
              ? "Your voice dictations will appear here"
              : `${history.length} ${history.length === 1 ? "dictation" : "dictations"} · ${totalWords} words`}
          </ThemedText>
        </View>

        {history.length > 0 && (
          <Pressable
            onPress={() => setSearchOpen((prev) => !prev)}
            hitSlop={8}
            style={[styles.searchBtn, { borderColor: theme.border }]}
          >
            <Search size={15} color={theme.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Search Input */}
      {searchOpen && (
        <View
          style={[
            styles.searchBar,
            { borderColor: theme.border, backgroundColor: theme.secondary },
          ]}
        >
          <Search size={14} color={theme.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transcriptions…"
            placeholderTextColor={theme.mutedForeground}
            style={[styles.searchInput, { color: theme.foreground }]}
            autoFocus
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <X size={14} color={theme.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Top Header matching desktop branding */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <CadenceMark size={26} color={theme.foreground} />
            <ThemedText style={styles.brandTitle}>Cadence</ThemedText>
            {__DEV__ && (
              <View style={styles.devBadge}>
                <ThemedText style={styles.devBadgeText}>DEV</ThemedText>
              </View>
            )}
          </View>
          <HeaderActions />
        </View>

        {/* Transcriptions Feed */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            filteredHistory.length === 0 && history.length > 0 ? (
              <View style={styles.emptyWrap}>
                <ThemedText
                  themeColor="mutedForeground"
                  style={styles.emptyText}
                >
                  No transcriptions matching "{searchQuery}".
                </ThemedText>
              </View>
            ) : history.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    borderColor: theme.cardRing,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                <Clock size={20} color={theme.mutedForeground} />
                <ThemedText style={styles.emptyTitle}>
                  No Transcriptions Yet
                </ThemedText>
                <ThemedText
                  themeColor="mutedForeground"
                  style={styles.emptyHint}
                >
                  Tap or hold the microphone below to start speaking. Your
                  dictated text will appear here automatically.
                </ThemedText>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isCopied = copiedId === item.id;
            return (
              <View
                style={[
                  styles.entryCard,
                  {
                    borderColor: theme.cardRing,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                <View style={styles.entryHeader}>
                  <ThemedText
                    themeColor="mutedForeground"
                    style={styles.entryMeta}
                  >
                    {dateGroup(item.createdAt)} · {formatClock(item.createdAt)}{" "}
                    · {formatSeconds(item.durationMs)}
                  </ThemedText>
                  <View style={styles.entryActions}>
                    <Pressable
                      onPress={() => copyEntry(item)}
                      hitSlop={8}
                      style={[
                        styles.entryActionBtn,
                        { borderColor: theme.border },
                      ]}
                    >
                      {isCopied ? (
                        <Check size={13} color={theme.primary} />
                      ) : (
                        <Copy size={13} color={theme.mutedForeground} />
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => shareEntry(item)}
                      hitSlop={8}
                      style={[
                        styles.entryActionBtn,
                        { borderColor: theme.border },
                      ]}
                    >
                      <Share2 size={13} color={theme.mutedForeground} />
                    </Pressable>
                    <Pressable
                      onPress={() => deleteEntry(item.id)}
                      hitSlop={8}
                      style={[
                        styles.entryActionBtn,
                        { borderColor: theme.border },
                      ]}
                    >
                      <Trash2 size={13} color={theme.destructive} />
                    </Pressable>
                  </View>
                </View>

                <ThemedText style={styles.entryText}>{item.text}</ThemedText>
              </View>
            );
          }}
        />

        {/* Floating Docked Mic Action at Bottom */}
        <View style={styles.floatingFooter} pointerEvents="box-none">
          {micState === "recording" && (
            <Waveform level={level} active={micState === "recording"} />
          )}
          {micState !== "idle" && (
            <ThemedText themeColor="mutedForeground" style={styles.status}>
              {status}
            </ThemedText>
          )}
          <MicButton
            state={micState}
            level={level}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  brandTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  devBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  devBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: "700",
    color: "#EAB308",
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 160,
    gap: Spacing.two,
  },
  listHeader: {
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  guestBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  guestBannerText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    flex: 1,
  },
  guestBannerAction: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    marginLeft: Spacing.two,
  },
  liveCardWrap: {
    marginVertical: Spacing.one,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 40,
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  entryCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.three + 2,
    gap: Spacing.one + 2,
    marginVertical: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryMeta: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  entryActions: {
    flexDirection: "row",
    gap: Spacing.one,
  },
  entryActionBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  entryText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
  },
  emptyHint: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyWrap: {
    paddingVertical: Spacing.four,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
  floatingFooter: {
    position: "absolute",
    bottom: 85,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: Spacing.two,
  },
  status: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
