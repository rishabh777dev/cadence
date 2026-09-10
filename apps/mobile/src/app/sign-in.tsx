import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CadenceMark } from "@/components/cadence-mark";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { type SocialProvider, useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  apple: "Continue with Apple",
  google: "Continue with Google",
  github: "Continue with GitHub",
};

// Present providers in the order each platform's users expect: Apple first on
// iOS, Google first on Android. GitHub always trails.
const PROVIDER_ORDER: SocialProvider[] = Platform.select({
  ios: ["apple", "google", "github"],
  default: ["google", "apple", "github"],
});

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signInWith, continueAsGuest } = useAuth();

  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  const handleSignIn = useCallback(
    async (provider: SocialProvider) => {
      setPending(provider);
      setError("");
      const { error: err } = await signInWith(provider);
      setPending(null);
      if (err) {
        setError(err);
        return;
      }
      // On native the session resolves reactively; route once it's set.
      router.replace("/(app)/(tabs)");
    },
    [signInWith, router],
  );

  const handleContinueAsGuest = useCallback(() => {
    continueAsGuest();
    router.replace("/(app)/(tabs)");
  }, [continueAsGuest, router]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <CadenceMark size={36} color={theme.foreground} />
            <ThemedText style={styles.brandWord}>Cadence</ThemedText>
          </View>
          <ThemedText type="display" style={styles.title}>
            speak
            <ThemedText type="displayItalic" themeColor="primary">
              {" "}
              freely
            </ThemedText>
            <ThemedText type="display">.</ThemedText>
          </ThemedText>
          <ThemedText themeColor="mutedForeground" style={styles.subtitle}>
            Voice typing that works everywhere. Sign in or create your Cadence
            account to start dictating.
          </ThemedText>
        </View>

        <View style={styles.footer}>
          {error ? (
            <ThemedText themeColor="destructive" style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          {PROVIDER_ORDER.map((provider, index) => (
            <ProviderButton
              key={provider}
              label={PROVIDER_LABELS[provider]}
              onPress={() => handleSignIn(provider)}
              loading={pending === provider}
              disabled={pending !== null}
              variant={index === 0 ? "primary" : "outline"}
            />
          ))}

          <View style={styles.dividerContainer}>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
            <ThemedText themeColor="mutedForeground" style={styles.dividerText}>
              or
            </ThemedText>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue without signing in"
            onPress={handleContinueAsGuest}
            disabled={pending !== null}
            style={({ pressed }) => [
              styles.guestButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.secondary : "transparent",
              },
            ]}
          >
            <ThemedText
              style={[styles.guestButtonText, { color: theme.foreground }]}
            >
              Continue without signing in
            </ThemedText>
          </Pressable>

          <ThemedText themeColor="mutedForeground" style={styles.legal}>
            Continuing with Google, Apple, or GitHub signs you in or
            automatically creates a new account.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function ProviderButton({
  label,
  onPress,
  loading,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  variant: "primary" | "outline";
}) {
  const theme = useTheme();
  const primary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        primary
          ? { backgroundColor: theme.primary }
          : { borderWidth: 1, borderColor: theme.border },
        disabled && !loading ? styles.buttonDisabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={primary ? theme.primaryForeground : theme.foreground}
        />
      ) : (
        <ThemedText
          style={[
            styles.buttonText,
            { color: primary ? theme.primaryForeground : theme.foreground },
          ]}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: "space-between",
  },
  hero: { flex: 1, justifyContent: "center", gap: Spacing.two },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  brandWord: {
    fontFamily: Fonts.serifItalic,
    fontSize: 26,
    lineHeight: 30,
  },
  title: { marginTop: Spacing.one },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: Spacing.two,
    maxWidth: 320,
  },
  footer: { paddingBottom: Spacing.five, gap: Spacing.two },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.one,
  },
  button: {
    height: 54,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.one,
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  guestButton: {
    height: 50,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
  },
  legal: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: Spacing.two,
  },
});
