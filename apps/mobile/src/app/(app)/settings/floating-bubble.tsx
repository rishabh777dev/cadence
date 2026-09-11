import * as Clipboard from "expo-clipboard";
import {
  Check,
  Clipboard as ClipboardIcon,
  HelpCircle,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";

import {
  Card,
  SectionTitle,
  SettingsScreenScaffold,
} from "@/components/settings-ui";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSettings } from "@/lib/settings";

export default function FloatingBubbleSettingsScreen() {
  const theme = useTheme();
  const { settings, setFloatingBubbleEnabled } = useSettings();
  const [sandboxText, setSandboxText] = useState("");
  const [pasted, setPasted] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setSandboxText(text);
      setPasted(true);
      setTimeout(() => setPasted(false), 2000);
    }
  };

  return (
    <SettingsScreenScaffold title="Floating Voice Bubble">
      {/* Primary Toggle Card */}
      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <ThemedText style={styles.toggleTitle}>
              Floating Voice Bubble
            </ThemedText>
            <ThemedText themeColor="mutedForeground" style={styles.toggleDesc}>
              A circular floating orb that sits docked at the screen edge. Tap
              or hold to record with Cadence's continuous Gaussian wave.
            </ThemedText>
          </View>
          <Switch
            value={settings.floatingBubbleEnabled}
            onValueChange={setFloatingBubbleEnabled}
            trackColor={{
              false: theme.muted,
              true: theme.primary,
            }}
            thumbColor={theme.primaryForeground}
          />
        </View>
      </Card>

      {/* Interactive Testing Sandbox */}
      <Card>
        <SectionTitle icon={Sparkles} title="Interactive Test Sandbox" />
        <ThemedText themeColor="mutedForeground" style={styles.sandboxHint}>
          The circular bubble is active right now on your screen. Tap it, speak
          a few words, and watch the Gaussian wave flare. When done, tap "Paste
          from Clipboard" below to see the result!
        </ThemedText>

        <View
          style={[
            styles.sandboxInputWrap,
            {
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            multiline
            numberOfLines={4}
            value={sandboxText}
            onChangeText={setSandboxText}
            placeholder="Your dictated text will paste here…"
            placeholderTextColor={theme.mutedForeground}
            style={[styles.sandboxInput, { color: theme.foreground }]}
          />
        </View>

        <Pressable
          onPress={handlePaste}
          style={({ pressed }) => [
            styles.pasteBtn,
            {
              backgroundColor: pressed ? theme.secondary : theme.card,
              borderColor: theme.cardRing,
            },
          ]}
        >
          {pasted ? (
            <Check size={16} color={theme.primary} />
          ) : (
            <ClipboardIcon size={16} color={theme.primary} />
          )}
          <ThemedText
            style={[
              styles.pasteBtnText,
              { color: pasted ? theme.primary : theme.foreground },
            ]}
          >
            {pasted ? "Pasted from Clipboard!" : "Paste from Clipboard"}
          </ThemedText>
        </Pressable>
      </Card>

      {/* How It Works Across Apps */}
      <Card>
        <SectionTitle icon={Layers} title="How It Works Across Other Apps" />

        <View style={styles.featureItem}>
          <View
            style={[
              styles.featureBadge,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <Zap size={14} color={theme.primary} />
          </View>
          <View style={styles.featureContent}>
            <ThemedText style={styles.featureTitle}>
              Keeps Gboard Active
            </ThemedText>
            <ThemedText themeColor="mutedForeground" style={styles.featureDesc}>
              Unlike keyboard switching where you leave your keyboard, the
              floating bubble sits above Gboard so you can dictate on-demand
              without changing keyboards.
            </ThemedText>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View
            style={[
              styles.featureBadge,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <Sparkles size={14} color={theme.primary} />
          </View>
          <View style={styles.featureContent}>
            <ThemedText style={styles.featureTitle}>
              Circular Gaussian Wave
            </ThemedText>
            <ThemedText themeColor="mutedForeground" style={styles.featureDesc}>
              The signature Cadence 5-lobe organic wave animates inside the
              circular bubble, reacting in real time to your voice volume.
            </ThemedText>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View
            style={[
              styles.featureBadge,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <HelpCircle size={14} color={theme.primary} />
          </View>
          <View style={styles.featureContent}>
            <ThemedText style={styles.featureTitle}>
              Edge Docking & Snapping
            </ThemedText>
            <ThemedText themeColor="mutedForeground" style={styles.featureDesc}>
              Drag the circle to any height on either edge of your screen. It
              snaps neatly to the margin out of the way of your typing.
            </ThemedText>
          </View>
        </View>
      </Card>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  toggleInfo: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
  },
  toggleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sandboxHint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
  },
  sandboxInputWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    minHeight: 100,
    marginBottom: Spacing.two,
  },
  sandboxInput: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pasteBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  featureItem: {
    flexDirection: "row",
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  featureBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  featureDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
