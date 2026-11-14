export const REPO_OWNER = "rishabh777dev";
export const REPO_NAME = "cadence";
export const FALLBACK_TAG = "v0.7.1";
export const FALLBACK_VERSION = "0.7.1";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type?: string;
}

export interface ReleaseInfo {
  tag: string;
  version: string;
  name: string;
  htmlUrl: string;
  publishedAt: string;
  assets: ReleaseAsset[];
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function getFilenameForTarget(
  version: string,
  platform: "windows" | "mac" | "linux" | "android",
  format?: string,
  arch?: string,
): string {
  const v = version.replace(/^v/, "");
  if (platform === "windows") {
    return `Cadence-${v}-setup.exe`;
  }
  if (platform === "mac") {
    if (format === "zip" || arch === "arm64") {
      return `Cadence-${v}-arm64.zip`;
    }
    return `Cadence-${v}.dmg`;
  }
  if (platform === "linux") {
    if (format === "deb") {
      return `Cadence-${v}.deb`;
    }
    return `Cadence-${v}.AppImage`;
  }
  if (platform === "android") {
    return `Cadence-${v}.apk`;
  }
  return `Cadence-${v}-setup.exe`;
}

export function resolveDownloadUrl(
  release: ReleaseInfo,
  platform: "windows" | "mac" | "linux" | "android",
  format?: string,
  arch?: string,
): { url: string; filename: string; size?: string } {
  const filename = getFilenameForTarget(
    release.version,
    platform,
    format,
    arch,
  );

  // If GitHub has uploaded assets attached to the release, find matching asset
  if (release.assets && release.assets.length > 0) {
    const asset = release.assets.find((a) => {
      const lower = a.name.toLowerCase();
      if (platform === "windows") {
        return lower.endsWith(".exe");
      }
      if (platform === "mac") {
        if (format === "zip" || arch === "arm64") {
          return lower.endsWith("-arm64.zip") || lower.endsWith(".zip");
        }
        return lower.endsWith(".dmg");
      }
      if (platform === "linux") {
        if (format === "deb") {
          return lower.endsWith(".deb");
        }
        return lower.endsWith(".appimage");
      }
      if (platform === "android") {
        return lower.endsWith(".apk");
      }
      return false;
    });

    if (asset) {
      return {
        url: asset.browser_download_url,
        filename: asset.name,
        size: formatFileSize(asset.size),
      };
    }
  }

  // Deterministic GitHub direct download URL
  const directUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${release.tag}/${filename}`;
  return {
    url: directUrl,
    filename,
  };
}

export async function getLatestRelease(): Promise<ReleaseInfo> {
  // Method 1: GitHub REST API with 60-second caching
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Cadence-Website",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        headers,
        next: { revalidate: 60 },
      },
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.tag_name) {
        const tag = data.tag_name;
        const version = tag.replace(/^v/, "");
        return {
          tag,
          version,
          name: data.name || `Cadence ${tag}`,
          htmlUrl:
            data.html_url ||
            `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag}`,
          publishedAt: data.published_at || new Date().toISOString(),
          assets: Array.isArray(data.assets)
            ? data.assets.map(
                (a: {
                  name: string;
                  browser_download_url: string;
                  size?: number;
                  content_type?: string;
                }) => ({
                  name: a.name,
                  browser_download_url: a.browser_download_url,
                  size: a.size || 0,
                  content_type: a.content_type,
                }),
              )
            : [],
        };
      }
    }
  } catch (error) {
    console.warn("Failed to fetch release from GitHub API:", error);
  }

  // Method 2: Public GitHub HTML releases redirect (Zero API rate limits)
  try {
    const headRes = await fetch(
      `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        method: "HEAD",
        redirect: "manual",
        next: { revalidate: 60 },
      },
    );

    const location = headRes.headers.get("location");
    if (location) {
      const match = location.match(/\/tag\/(v?[0-9][a-zA-Z0-9.-]*)/);
      if (match?.[1]) {
        const rawTag = match[1];
        const tag = rawTag.startsWith("v") ? rawTag : `v${rawTag}`;
        const version = tag.replace(/^v/, "");
        return {
          tag,
          version,
          name: `Cadence ${tag}`,
          htmlUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag}`,
          publishedAt: new Date().toISOString(),
          assets: [],
        };
      }
    }
  } catch (error) {
    console.warn("Failed to probe GitHub release redirect:", error);
  }

  // Method 3: Fallback baseline release
  return {
    tag: FALLBACK_TAG,
    version: FALLBACK_VERSION,
    name: `Cadence ${FALLBACK_TAG} Desktop Release`,
    htmlUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${FALLBACK_TAG}`,
    publishedAt: "2025-05-18T10:15:00Z",
    assets: [],
  };
}
