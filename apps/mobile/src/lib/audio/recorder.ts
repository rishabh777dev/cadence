/**
 * Microphone capture for direct file transcription & waveform visualization.
 * Uses `expo-audio`'s `useAudioRecorder` with hardware metering enabled
 * to capture high-quality audio files (.m4a) and feed the live Gaussian waveform.
 */

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useCallback, useEffect, useRef } from "react";

export type MicPermission = "granted" | "denied" | "undetermined";

export async function checkMicPermission(): Promise<MicPermission> {
  const { status } = await AudioModule.getRecordingPermissionsAsync();
  return status === "granted"
    ? "granted"
    : status === "denied"
      ? "denied"
      : "undetermined";
}

export async function requestMicPermission(): Promise<MicPermission> {
  const { status } = await AudioModule.requestRecordingPermissionsAsync();
  return status === "granted"
    ? "granted"
    : status === "denied"
      ? "denied"
      : "undetermined";
}

/** Configure the audio session for recording. Call before starting recording. */
async function enableRecordingMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
}

export interface RecorderCallbacks {
  /** Optional frame callback (for streaming fallback). */
  onFrame?: (frame: ArrayBuffer) => void;
  /** Normalized input level in [0, 1] for the waveform. */
  onLevel?: (level: number) => void;
}

export interface Recorder {
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
}

/**
 * Hook returning a recorder that prepares audio capture with native metering,
 * updates waveform visualizer levels, and returns the recorded file URI on stop.
 */
export function useRecorder(callbacks: RecorderCallbacks): Recorder {
  const cb = useRef(callbacks);
  useEffect(() => {
    cb.current = callbacks;
  });

  const fileRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (meterIntervalRef.current) {
        clearInterval(meterIntervalRef.current);
        meterIntervalRef.current = null;
      }
    };
  }, []);

  const start = useCallback(async () => {
    await enableRecordingMode();

    // 1. Prepare native recording file and hardware input
    await fileRecorder.prepareToRecordAsync();

    // 2. Start hardware recording
    fileRecorder.record();

    // 3. Clear any existing metering timer
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }

    // 4. Sample native metering at ~20Hz (every 50ms) to drive fluid Gaussian waveform
    meterIntervalRef.current = setInterval(() => {
      try {
        const status = fileRecorder.getStatus();
        if (status.isRecording && typeof status.metering === "number") {
          // Metering is in dB: -160 (silence) to 0 dB (clipping).
          // Normal human speech sits between -60 dB and -6 dB.
          const db = status.metering;
          const normalized = Math.max(0, Math.min(1, (db + 60) / 60));
          cb.current.onLevel?.(normalized);
        }
      } catch {
        // Safe to ignore status polling hiccups
      }
    }, 50);
  }, [fileRecorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    // 1. Stop polling metering
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
    cb.current.onLevel?.(0);

    // 2. Stop hardware recorder and retrieve the file URI
    try {
      await fileRecorder.stop();
      const finalUri = fileRecorder.uri ?? fileRecorder.getStatus().url ?? null;
      return finalUri;
    } catch {
      return fileRecorder.uri ?? null;
    }
  }, [fileRecorder]);

  return { start, stop };
}
