import { Stack } from "expo-router";

import { EntriesProvider } from "@/lib/entries";
import { HistoryProvider } from "@/lib/history";
import { SettingsProvider } from "@/lib/settings";

/**
 * Authenticated area. A Stack hosts the bottom-tab group `(tabs)` plus the
 * pushed pages (settings, profile, keyboard setup, dictate). Because these
 * pages are pushed on top of the whole tab group, Back returns to whichever
 * tab was active — not always Home.
 */
export default function AppLayout() {
  return (
    <SettingsProvider>
      <EntriesProvider>
        <HistoryProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="keyboard-setup" />
            <Stack.Screen
              name="dictate"
              options={{
                presentation: "fullScreenModal",
              }}
            />
          </Stack>
        </HistoryProvider>
      </EntriesProvider>
    </SettingsProvider>
  );
}
