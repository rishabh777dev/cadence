/**
 * Shared recording orchestration for Cadence Mobile.
 *
 * Runs 100% direct client-side speech recognition using Groq Whisper or
 * OpenAI Whisper with optional LLM cleanup, with zero middleman servers.
 */

import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import type { MicState } from "@/components/mic-button";
import { applyDictionaryReplacements, useEntries } from "@/lib/entries";
import { useHistory } from "@/lib/history";
import { getSecureApiKey, useModelConfig } from "@/lib/models";
import { languageHint, useSettings } from "@/lib/settings";
import { directCleanup, directTranscribe } from "./direct-transcribe";
import {
  checkMicPermission,
  requestMicPermission,
  useRecorder,
} from "./recorder";

/** Debounce so an accidental tap/hold doesn't start a pointless session. */
const MIN_RECORDING_MS = 350;
/**
 * Hold threshold: pressing longer than this and releasing = hold-to-talk (stop
 * on release). A quick tap = toggle (stop on the next tap).
 */
const HOLD_THRESHOLD_MS = 300;

const GUEST_SAMPLE_TRANSCRIPTS = [
  "Pushing the product sync to tomorrow morning at ten.",
  "Cadence voice dictation test. Real-time speech recognition that works everywhere.",
  "Let's deploy the staging release on Friday once all tests pass.",
  "Reviewing the mobile interface design and Supabase data sync.",
];

interface UseDictationOptions {
  signedIn: boolean;
  /** Called with the trimmed final transcript (non-empty). */
  onFinal: (text: string) => void;
  /** Reset any prior result when a new recording begins. */
  onRecordingStart?: () => void;
  /** Auto-start recording once on mount (keyboard-handoff flow). */
  autoStart?: boolean;
}

export interface Dictation {
  micState: MicState;
  partial: string;
  level: ReturnType<typeof useSharedValue<number>>;
  /** Press-and-hold / tap-to-toggle handlers for the mic button. */
  onPressIn: () => void;
  onPressOut: () => void;
  /** Plain tap-to-toggle (used by the keyboard-handoff screen). */
  toggle: () => void;
}

export function useDictation({
  onFinal,
  onRecordingStart,
  autoStart = false,
}: UseDictationOptions): Dictation {
  const { settings } = useSettings();
  const { dictionary } = useEntries();
  const { addHistory } = useHistory();
  const { provider: modelProvider, cleanupModel } = useModelConfig();

  const [micState, setMicState] = useState<MicState>("idle");
  const [partial, setPartial] = useState("");
  const level = useSharedValue(0);

  const startedAt = useRef(0);
  const recordingRef = useRef(false);
  const startingRef = useRef(false);
  const pressInAt = useRef(0);
  const isPressingRef = useRef(false);

  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });
  const onStartRef = useRef(onRecordingStart);
  useEffect(() => {
    onStartRef.current = onRecordingStart;
  });
  const addHistoryRef = useRef(addHistory);
  useEffect(() => {
    addHistoryRef.current = addHistory;
  });

  const finishRecordingRef = useRef<() => void>(() => {});

  const recorder = useRecorder({
    onFrame: () => {},
    onLevel: (l) => {
      level.value = l;
    },
  });

  const startRecording = useCallback(async () => {
    if (recordingRef.current || startingRef.current) return;
    startingRef.current = true;

    let permission = await checkMicPermission();
    if (permission !== "granted") {
      permission = await requestMicPermission();
      if (permission !== "granted") {
        startingRef.current = false;
        Alert.alert(
          "Microphone access needed",
          "Please enable microphone permission in your device settings to use voice typing.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
        return;
      }
    }

    recordingRef.current = true;
    startingRef.current = false;
    startedAt.current = Date.now();
    setPartial("Listening to your voice…");
    onStartRef.current?.();
    setMicState("recording");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await recorder.start();
      if (
        !isPressingRef.current &&
        Date.now() - pressInAt.current >= HOLD_THRESHOLD_MS
      ) {
        finishRecordingRef.current();
      }
    } catch {
      recordingRef.current = false;
      setMicState("idle");
      setPartial("");
      Alert.alert("Recording failed", "Could not start the microphone.");
    }
  }, [recorder]);

  const finishRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    level.value = 0;
    setMicState("finalizing");

    const elapsed = Date.now() - startedAt.current;
    let fileUri: string | null = null;
    try {
      fileUri = await recorder.stop();
    } catch {
      // Ignored
    }

    if (elapsed < MIN_RECORDING_MS) {
      setMicState("idle");
      setPartial("");
      return;
    }

    // Retrieve active keys
    const groqKey = await getSecureApiKey("groq");
    const openAiKey = await getSecureApiKey("openai");

    const activeProvider = modelProvider === "openai" ? "openai" : "groq";
    const activeKey = activeProvider === "openai" ? openAiKey : groqKey;

    const hasKey = Boolean(activeKey?.trim());

    if (!hasKey) {
      // Guest Demo Mode: Instant sample text with full tactile haptic feel
      setPartial("Polishing speech…");
      setTimeout(() => {
        setPartial("");
        setMicState("idle");
        const idx = Math.floor(Math.random() * GUEST_SAMPLE_TRANSCRIPTS.length);
        const text = applyDictionaryReplacements(
          GUEST_SAMPLE_TRANSCRIPTS[idx],
          dictionary,
        ).trim();
        addHistoryRef.current(text, elapsed);
        onFinalRef.current(text);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }, 400);
      return;
    }

    if (!fileUri) {
      setMicState("idle");
      setPartial("");
      Alert.alert("Error", "No audio recorded.");
      return;
    }

    // Direct Speech Recognition
    try {
      setPartial(
        activeProvider === "groq"
          ? "Transcribing with Groq Whisper…"
          : "Transcribing with OpenAI…",
      );

      const result = await directTranscribe({
        fileUri,
        provider: activeProvider,
        apiKey: activeKey as string,
        language: languageHint(settings.language),
      });

      let rawText = result.text.trim();
      if (!rawText) {
        setMicState("idle");
        setPartial("");
        return;
      }

      // Direct LLM Cleanup
      if (settings.cleanup && cleanupModel !== "off") {
        setPartial("Polishing with AI…");
        rawText = await directCleanup({
          text: rawText,
          cleanupModel,
          groqKey: groqKey || undefined,
          openAiKey: openAiKey || undefined,
          intensity: settings.intensity,
          customPrompt: settings.customPrompt || undefined,
        });
      }

      // Custom dictionary replacement
      const finalText = applyDictionaryReplacements(rawText, dictionary).trim();

      setPartial("");
      setMicState("idle");

      if (finalText) {
        addHistoryRef.current(finalText, elapsed);
        onFinalRef.current(finalText);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (err: unknown) {
      setMicState("idle");
      setPartial("");
      const msg = err instanceof Error ? err.message : "Transcription failed";
      Alert.alert("Dictation Error", msg);
    }
  }, [recorder, level, modelProvider, cleanupModel, settings, dictionary]);
  finishRecordingRef.current = finishRecording;

  const onPressIn = useCallback(() => {
    isPressingRef.current = true;
    if (recordingRef.current) {
      finishRecording();
      return;
    }
    pressInAt.current = Date.now();
    void startRecording();
  }, [startRecording, finishRecording]);

  const onPressOut = useCallback(() => {
    isPressingRef.current = false;
    if (!recordingRef.current) return;
    const elapsed = Date.now() - pressInAt.current;
    if (elapsed >= HOLD_THRESHOLD_MS) {
      finishRecording();
    }
  }, [finishRecording]);

  const toggle = useCallback(() => {
    if (recordingRef.current) {
      finishRecording();
    } else {
      void startRecording();
    }
  }, [startRecording, finishRecording]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStarted.current) {
      autoStarted.current = true;
      void startRecording();
    }
  }, [autoStart, startRecording]);

  return {
    micState,
    partial,
    level,
    onPressIn,
    onPressOut,
    toggle,
  };
}
