/**
 * Microphone capture for streaming dictation. Wraps `expo-audio`'s
 * `useAudioStream` to deliver conditioned mono 16 kHz PCM16LE frames plus a
 * running input level for the waveform, and exposes permission helpers.
 */

import {
  AudioModule,
  type AudioStreamBuffer,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioStream,
} from "expo-audio";
import { useCallback, useEffect, useRef } from "react";

import { TARGET_SAMPLE_RATE, toCloudFrame } from "./resample";

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

/** Configure the audio session for recording. Call before starting a stream. */
async function enableRecordingMode(): Promise<void> {
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
}

export interface RecorderCallbacks {
  /** A conditioned mono 16 kHz PCM16LE frame ready to stream. */
  onFrame: (frame: ArrayBuffer) => void;
  /** Normalized input level in [0, 1] for the waveform. */
  onLevel?: (level: number) => void;
}

/** Peak absolute amplitude of an Int16 buffer, normalized to [0, 1]. */
function peakLevel(data: ArrayBuffer): number {
  const samples = new Int16Array(data);
  let peak = 0;
  // Sample sparsely — we only need a coarse level for the visualizer.
  const step = Math.max(1, Math.floor(samples.length / 256));
  for (let i = 0; i < samples.length; i += step) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  return Math.min(1, peak / 32_768);
}

export interface Recorder {
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
}

/**
 * Hook returning a recorder that streams conditioned PCM frames to the given
 * callbacks for waveform visualization, and records audio to a file for direct
 * transcription.
 */
export function useRecorder(callbacks: RecorderCallbacks): Recorder {
  const cb = useRef(callbacks);
  useEffect(() => {
    cb.current = callbacks;
  });

  const fileRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const handleBuffer = useCallback((buffer: AudioStreamBuffer) => {
    const frame = toCloudFrame(buffer.data, buffer.sampleRate, buffer.channels);
    if (frame) cb.current.onFrame(frame);
    cb.current.onLevel?.(peakLevel(buffer.data));
  }, []);

  const { stream } = useAudioStream({
    sampleRate: TARGET_SAMPLE_RATE,
    channels: 1,
    encoding: "int16",
    onBuffer: handleBuffer,
  });

  const start = useCallback(async () => {
    await enableRecordingMode();
    try {
      fileRecorder.record();
    } catch {
      // Stream continues even if file recorder throws
    }
    await stream.start();
  }, [stream, fileRecorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    stream.stop();
    try {
      await fileRecorder.stop();
      return fileRecorder.uri;
    } catch {
      return fileRecorder.uri ?? null;
    }
  }, [stream, fileRecorder]);

  return { start, stop };
}
