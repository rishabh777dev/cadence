import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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

const PROVIDER_ORDER: SocialProvider[] = Platform.select({
  ios: ["apple", "google", "github"],
  default: ["google", "apple", "github"],
});

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signInWith, signInWithEmail, signUpWithEmail, continueAsGuest } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingSocial, setPendingSocial] = useState<SocialProvider | null>(
    null,
  );
  const [error, setError] = useState("");

  const handleEmailAuth = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    if (mode === "signup") {
      const { error: err } = await signUpWithEmail(email, password, fullName);
      setSubmitting(false);
      if (err) {
        setError(err);
        return;
      }
      router.replace("/(app)/(tabs)");
    } else {
      const { error: err } = await signInWithEmail(email, password);
      setSubmitting(false);
      if (err) {
        setError(err);
        return;
      }
      router.replace("/(app)/(tabs)");
    }
  }, [
    email,
    password,
    fullName,
    mode,
    signInWithEmail,
    signUpWithEmail,
    router,
  ]);

  const handleSocialSignIn = useCallback(
    async (provider: SocialProvider) => {
      setPendingSocial(provider);
      setError("");
      const { error: err } = await signInWith(provider);
      setPendingSocial(null);
      if (err) {
        setError(err);
        return;
      }
      router.replace("/(app)/(tabs)");
    },
    [signInWith, router],
  );

  const handleContinueAsGuest = useCallback(() => {
    continueAsGuest();
    router.replace("/(app)/(tabs)");
  }, [continueAsGuest, router]);

  const busy = submitting || pendingSocial !== null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Hero Brand */}
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
                Voice typing that works everywhere. Powered by Supabase and your
                own API keys.
              </ThemedText>
            </View>

            {/* 2. Auth Form Toggle */}
            <View
              style={[
                styles.toggleContainer,
                { backgroundColor: theme.secondary, borderColor: theme.border },
              ]}
            >
              <Pressable
                onPress={() => {
                  setMode("signin");
                  setError("");
                }}
                style={[
                  styles.toggleTab,
                  mode === "signin"
                    ? { backgroundColor: theme.card, shadowColor: "#000" }
                    : null,
                ]}
              >
                <ThemedText
                  style={[
                    styles.toggleTabText,
                    {
                      color:
                        mode === "signin"
                          ? theme.foreground
                          : theme.mutedForeground,
                      fontFamily:
                        mode === "signin"
                          ? Fonts.sansSemiBold
                          : Fonts.sansMedium,
                    },
                  ]}
                >
                  Sign In
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode("signup");
                  setError("");
                }}
                style={[
                  styles.toggleTab,
                  mode === "signup"
                    ? { backgroundColor: theme.card, shadowColor: "#000" }
                    : null,
                ]}
              >
                <ThemedText
                  style={[
                    styles.toggleTabText,
                    {
                      color:
                        mode === "signup"
                          ? theme.foreground
                          : theme.mutedForeground,
                      fontFamily:
                        mode === "signup"
                          ? Fonts.sansSemiBold
                          : Fonts.sansMedium,
                    },
                  ]}
                >
                  Create Account
                </ThemedText>
              </Pressable>
            </View>

            {/* Error banner */}
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${theme.destructive}15`,
                    borderColor: `${theme.destructive}40`,
                  },
                ]}
              >
                <ThemedText
                  style={[styles.errorText, { color: theme.destructive }]}
                >
                  {error}
                </ThemedText>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.form}>
              {mode === "signup" ? (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>FULL NAME</ThemedText>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Jane Doe"
                    placeholderTextColor={`${theme.mutedForeground}80`}
                    autoCapitalize="words"
                    editable={!busy}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.foreground,
                      },
                    ]}
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>EMAIL</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jane@example.com"
                  placeholderTextColor={`${theme.mutedForeground}80`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.foreground,
                    },
                  ]}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>PASSWORD</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={`${theme.mutedForeground}80`}
                  secureTextEntry
                  editable={!busy}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.foreground,
                    },
                  ]}
                />
              </View>

              <Pressable
                onPress={handleEmailAuth}
                disabled={busy}
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.primary },
                  busy ? styles.buttonDisabled : null,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <ThemedText
                    style={[
                      styles.submitButtonText,
                      { color: theme.primaryForeground },
                    ]}
                  >
                    {mode === "signup" ? "Create Account" : "Sign In"}
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.border }]}
              />
              <ThemedText
                themeColor="mutedForeground"
                style={styles.dividerText}
              >
                or
              </ThemedText>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.border }]}
              />
            </View>

            {/* Social Logins */}
            <View style={styles.socialGroup}>
              {PROVIDER_ORDER.map((provider) => (
                <Pressable
                  key={provider}
                  onPress={() => handleSocialSignIn(provider)}
                  disabled={busy}
                  style={[
                    styles.socialButton,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                    },
                    busy && pendingSocial !== provider
                      ? styles.buttonDisabled
                      : null,
                  ]}
                >
                  {pendingSocial === provider ? (
                    <ActivityIndicator color={theme.foreground} />
                  ) : (
                    <ThemedText style={styles.socialButtonText}>
                      {PROVIDER_LABELS[provider]}
                    </ThemedText>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Guest button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue without signing in"
              onPress={handleContinueAsGuest}
              disabled={busy}
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
              User accounts and data syncing are powered securely by Supabase.
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
  hero: { marginBottom: Spacing.four },
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
    fontSize: 14,
    lineHeight: 21,
    marginTop: Spacing.two,
    maxWidth: 320,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    padding: 3,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTabText: {
    fontSize: 14,
  },
  errorBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  form: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  submitButton: {
    height: 50,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
  },
  submitButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.three,
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
  socialGroup: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  socialButton: {
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  guestButton: {
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  legal: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: Spacing.three,
  },
});
