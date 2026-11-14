"use client";

import { useEffect, useState } from "react";
import { FALLBACK_TAG, FALLBACK_VERSION } from "./releases";

export interface ReleaseData {
  tag: string;
  version: string;
  name: string;
  htmlUrl: string;
  publishedAt: string;
  downloads?: {
    windows?: { url: string; filename: string; size?: string };
    macDmg?: { url: string; filename: string; size?: string };
    macZip?: { url: string; filename: string; size?: string };
    linuxAppImage?: { url: string; filename: string; size?: string };
    linuxDeb?: { url: string; filename: string; size?: string };
    androidApk?: { url: string; filename: string; size?: string };
  };
}

let cachedRelease: ReleaseData | null = null;

export function useLatestRelease() {
  const [release, setRelease] = useState<ReleaseData>(() => {
    return (
      cachedRelease || {
        tag: FALLBACK_TAG,
        version: FALLBACK_VERSION,
        name: `Cadence ${FALLBACK_TAG} Desktop Release`,
        htmlUrl: `https://github.com/rishabh777dev/cadence/releases/tag/${FALLBACK_TAG}`,
        publishedAt: "2025-05-18T10:15:00Z",
      }
    );
  });

  useEffect(() => {
    let isMounted = true;
    fetch("/api/release")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReleaseData | null) => {
        if (data?.tag && isMounted) {
          cachedRelease = data;
          setRelease(data);
        }
      })
      .catch(() => {
        // Silently keep fallback state
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return release;
}
