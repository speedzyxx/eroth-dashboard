import { NextRequest, NextResponse } from "next/server";
import { loadDashboard } from "@/services/albionApi";

/**
 * GET /api/dashboard?live=1
 * Proxy server-side para evitar CORS del browser hacia Gameinfo.
 */
export async function GET(req: NextRequest) {
  const live = req.nextUrl.searchParams.get("live") === "1";

  try {
    const data = await loadDashboard(live);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": live ? "s-maxage=30, stale-while-revalidate=60" : "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
