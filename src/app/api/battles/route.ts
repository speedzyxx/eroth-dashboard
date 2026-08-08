import { NextRequest, NextResponse } from "next/server";
import { getMockBattleList } from "@/data/mockBattles";
import { listHomeBattles } from "@/services/battleService";

/**
 * GET /api/battles?live=1&minPlayers=10&minHome=1
 * Lista batallas del grupo (guild Eroth / aliados de moropotopoo).
 */
export async function GET(req: NextRequest) {
  const live = req.nextUrl.searchParams.get("live") !== "0";
  const minPlayers = Number(req.nextUrl.searchParams.get("minPlayers") || 1);
  const minHome = Number(req.nextUrl.searchParams.get("minHome") || 1);
  const limit = Number(req.nextUrl.searchParams.get("limit") || 25);

  try {
    if (!live) {
      const mock = getMockBattleList().filter(
        (b) => b.totalPlayers >= minPlayers && b.homePlayers >= minHome,
      );
      return NextResponse.json({ battles: mock, source: "mock" });
    }

    const battles = await listHomeBattles({
      range: "week",
      limit,
      minPlayers,
      minHomePlayers: minHome,
    });
    return NextResponse.json(
      { battles, source: "live" },
      { headers: { "Cache-Control": "s-maxage=45, stale-while-revalidate=90" } },
    );
  } catch (error) {
    const mock = getMockBattleList();
    return NextResponse.json({
      battles: mock,
      source: "mock",
      warning: error instanceof Error ? error.message : "Live battles failed",
    });
  }
}
