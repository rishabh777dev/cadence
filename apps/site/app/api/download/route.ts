import { type NextRequest, NextResponse } from "next/server";
import { getLatestRelease, resolveDownloadUrl } from "@/lib/releases";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let platform = (searchParams.get("platform") || "").toLowerCase();
  const format = (searchParams.get("format") || "").toLowerCase();
  const arch = (searchParams.get("arch") || "").toLowerCase();

  // If no platform specified in query params, detect platform from User-Agent
  if (!platform || !["windows", "mac", "linux", "android"].includes(platform)) {
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
    if (userAgent.includes("mac") || userAgent.includes("darwin")) {
      platform = "mac";
    } else if (userAgent.includes("android")) {
      platform = "android";
    } else if (userAgent.includes("linux")) {
      platform = "linux";
    } else {
      platform = "windows";
    }
  }

  try {
    const release = await getLatestRelease();
    const resolved = resolveDownloadUrl(
      release,
      platform as "windows" | "mac" | "linux" | "android",
      format,
      arch,
    );

    return NextResponse.redirect(resolved.url, {
      status: 307,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "X-Cadence-Release-Tag": release.tag,
        "X-Cadence-Resolved-File": resolved.filename,
      },
    });
  } catch (error) {
    console.error("Download redirect error:", error);
    // Safe fallback to GitHub's latest release page
    return NextResponse.redirect(
      "https://github.com/rishabh777dev/cadence/releases/latest",
      { status: 307 },
    );
  }
}
