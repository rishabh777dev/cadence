/**
 * Dictation history for Cadence Mobile.
 * Keeps a local store in AsyncStorage, and automatically synchronizes
 * with Supabase `cadence_history` whenever the user is signed in.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getJsonPref, setJsonPref } from "./storage";
import { supabase } from "./supabase";

export const HISTORY_MAX = 500;

export interface HistoryEntry {
  id: string;
  /** Final transcript, after AI cleanup and local dictionary replacement. */
  text: string;
  /** Unix epoch (ms) when the dictation completed. */
  createdAt: number;
  /** Recording length in milliseconds. */
  durationMs: number;
}

const HISTORY_KEY = "history";

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface HistoryContextValue {
  history: HistoryEntry[];
  ready: boolean;
  addHistory: (text: string, durationMs: number) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  // Load from local storage and optionally sync with Supabase
  useEffect(() => {
    (async () => {
      const stored = await getJsonPref<HistoryEntry[]>(HISTORY_KEY, []);
      setHistory(stored);
      setReady(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("cadence_history")
            .select("id, text, duration_ms, created_at")
            .order("created_at", { ascending: false })
            .limit(100);

          if (!error && data && data.length > 0) {
            const cloudEntries: HistoryEntry[] = data.map((row) => ({
              id: row.id,
              text: row.text,
              createdAt: new Date(row.created_at).getTime(),
              durationMs: row.duration_ms || 0,
            }));

            // Merge local and cloud, avoiding duplicates by matching text + approx timestamp
            const map = new Map<string, HistoryEntry>();
            for (const item of [...cloudEntries, ...stored]) {
              map.set(
                `${item.text}_${Math.floor(item.createdAt / 5000)}`,
                item,
              );
            }
            const merged = Array.from(map.values())
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, HISTORY_MAX);

            setHistory(merged);
            void setJsonPref(HISTORY_KEY, merged);
          }
        }
      } catch {
        // Offline
      }
    })();
  }, []);

  const persist = useCallback((next: HistoryEntry[]) => {
    setHistory(next);
    void setJsonPref(HISTORY_KEY, next);
  }, []);

  const value = useMemo<HistoryContextValue>(
    () => ({
      history,
      ready,
      addHistory: (text, durationMs) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const entry: HistoryEntry = {
          id: newId(),
          text: trimmed,
          createdAt: Date.now(),
          durationMs,
        };
        const next = [entry, ...history].slice(0, HISTORY_MAX);
        persist(next);

        // Sync to Supabase in background
        void (async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("cadence_history").insert({
                user_id: user.id,
                text: trimmed,
                duration_ms: durationMs,
              });
            }
          } catch {
            // Non-blocking
          }
        })();
      },
      removeHistory: (id) => {
        persist(history.filter((e) => e.id !== id));
        void (async () => {
          try {
            await supabase.from("cadence_history").delete().eq("id", id);
          } catch {
            // Non-blocking
          }
        })();
      },
      clearHistory: () => {
        persist([]);
        void (async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from("cadence_history")
                .delete()
                .eq("user_id", user.id);
            }
          } catch {
            // Non-blocking
          }
        })();
      },
    }),
    [history, ready, persist],
  );

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return ctx;
}
