import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LogIn, LogOut } from "lucide-react-native";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { CadenceMark } from "@/components/cadence-mark";
import { Card, SettingsScreenScaffold } from "@/components/settings-ui";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { fetchCloudUsage } from "@/lib/cloud/usage";
import { initialsFor } from "@/lib/initials";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signedIn, signOut, leaveGuestMode } = useAuth();

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["cloud-usage"],
    queryFn: fetchCloudUsage,
    enabled: signedIn,
    retry: 1,
  });

  return (
    <SettingsScreenScaffold title="Profile">
      {/* Account */}
      <Card>
        <View style={styles.accountHeader}>
          {signedIn && user?.image ? (
            <Image
              source={{ uri: user.image }}
              style={styles.avatarImage}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              {signedIn && user ? (
                <ThemedText
                  style={[styles.avatarText, { color: theme.accentForeground }]}
                >
                  {initialsFor(user)}
                </ThemedText>
              ) : (
                <CadenceMark size={20} color={theme.accentForeground} />
              )}
            </View>
          )}
          <View style={styles.accountInfo}>
            <ThemedText style={styles.accountName} numberOfLines={1}>
              {signedIn ? (user?.name ?? "Signed in") : "Guest Account"}
            </ThemedText>
            <ThemedText
              themeColor="mutedForeground"
              style={styles.accountEmail}
              numberOfLines={1}
            >
              {signedIn
                ? (user?.email ?? "")
                : "Browsing Cadence without an account"}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.inlineRow}>
          <ThemedText themeColor="mutedForeground" style={styles.rowLabel}>
            {signedIn ? "Credits" : "Voice Dictation"}
          </ThemedText>
          {signedIn ? (
            usageLoading ? (
              <Skeleton width={72} height={16} />
            ) : (
              <ThemedText style={styles.rowValue}>
                {usage ? `${usage.remaining} / ${usage.limit}` : "—"}
              </ThemedText>
            )
          ) : (
            <ThemedText
              style={[styles.rowValue, { color: theme.mutedForeground }]}
            >
              Sign in to dictate
            </ThemedText>
          )}
        </View>
      </Card>

      {/* Action button */}
      {signedIn ? (
        <Pressable
          onPress={() => {
            void signOut().then(() => router.replace("/sign-in"));
          }}
          style={({ pressed }) => [
            styles.signOutCard,
            {
              backgroundColor: pressed
                ? theme.destructiveTintPressed
                : theme.destructiveTint,
            },
          ]}
        >
          <LogOut color={theme.destructive} size={18} />
          <ThemedText
            style={[styles.signOutText, { color: theme.destructive }]}
          >
            Sign out
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.guestActions}>
          <Pressable
            onPress={() => router.push("/sign-in")}
            style={({ pressed }) => [
              styles.signInCard,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <LogIn color={theme.primaryForeground} size={18} />
            <ThemedText
              style={[styles.signInText, { color: theme.primaryForeground }]}
            >
              Sign in to Cadence
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              leaveGuestMode();
              router.replace("/sign-in");
            }}
            style={({ pressed }) => [
              styles.leaveGuestCard,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.secondary : "transparent",
              },
            ]}
          >
            <ThemedText
              style={[styles.leaveGuestText, { color: theme.mutedForeground }]}
            >
              Return to Welcome Screen
            </ThemedText>
          </Pressable>
        </View>
      )}
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -Spacing.three,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
  },
  avatarText: { fontFamily: Fonts.sansSemiBold, fontSize: 17 },
  accountInfo: { flex: 1 },
  accountName: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 24 },
  accountEmail: { fontSize: 13, marginTop: 3 },
  inlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontFamily: Fonts.sans, fontSize: 15 },
  rowValue: { fontFamily: Fonts.sansMedium, fontSize: 15 },
  signOutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.xl,
    marginTop: Spacing.two,
  },
  signOutText: { fontFamily: Fonts.sansMedium, fontSize: 15 },
  guestActions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  signInCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.xl,
  },
  signInText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  leaveGuestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  leaveGuestText: { fontFamily: Fonts.sansMedium, fontSize: 14 },
});
