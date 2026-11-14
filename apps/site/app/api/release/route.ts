import { NextResponse } from "next/server";
import { getLatestRelease, resolveDownloadUrl } from "@/lib/releases";

export const revalidate = 60;

export async function GET() {
  try {
    const release = await getLatestRelease();
    const downloads = {
      windows: resolveDownloadUrl(release, "windows"),
      macDmg: resolveDownloadUrl(release, "mac", "dmg"),
      macZip: resolveDownloadUrl(release, "mac", "zip", "arm64"),
      linuxAppImage: resolveDownloadUrl(release, "linux", "appimage"),
      linuxDeb: resolveDownloadUrl(release, "linux", "deb"),
      androidApk: resolveDownloadUrl(release, "android"),
    };

    return NextResponse.json(
      {
        tag: release.tag,
        version: release.version,
        name: release.name,
        htmlUrl: release.htmlUrl,
        publishedAt: release.publishedAt,
        downloads,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Release API error:", error);
    return NextResponse.json(
      {
        tag: "v0.7.1",
        version: "0.7.1",
        name: "Cadence v0.7.1 Desktop Release",
        htmlUrl: "https://github.com/rishabh777dev/cadence/releases/tag/v0.7.1",
        publishedAt: "2025-05-18T10:15:00Z",
      },
      { status: 200 },
    );
  }
}
