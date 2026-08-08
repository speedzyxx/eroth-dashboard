import { NextRequest, NextResponse } from "next/server";
import { getMockBattleDetail } from "@/data/mockBattles";
import { fetchBattleDetail } from "@/services/battleService";

/**
 * GET /api/battles/[id]?live=1
 * Detalle de batalla + kills/loot del grupo.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const live = req.nextUrl.searchParams.get("live") !== "0";

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid battle id" }, { status: 400 });
  }

  try {
    if (!live) {
      return NextResponse.json(getMockBattleDetail(id));
    }

    const detail = await fetchBattleDetail(id);
    return NextResponse.json(detail, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    const mock = getMockBattleDetail(id);
    return NextResponse.json({
      ...mock,
      source: "mock",
      warning: error instanceof Error ? error.message : "Live battle failed",
    });
  }
}
