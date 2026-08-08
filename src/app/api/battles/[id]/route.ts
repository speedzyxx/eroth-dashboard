import { NextRequest, NextResponse } from "next/server";
import { getMockBattleDetail } from "@/data/mockBattles";
import { BATTLE_EXAMPLE_ID } from "@/lib/roster";
import { fetchBattleDetail, fetchBattleDetailLite } from "@/services/battleService";

export const maxDuration = 60;

/**
 * GET /api/battles/[id]?live=1&lite=1
 * lite=1 → solo roster (rápido). Sin lite → kills/loot/armas.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const live = req.nextUrl.searchParams.get("live") !== "0";
  const lite = req.nextUrl.searchParams.get("lite") === "1";

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid battle id" }, { status: 400 });
  }

  try {
    if (!live) {
      if (String(id) !== String(BATTLE_EXAMPLE_ID)) {
        return NextResponse.json(
          {
            error: `Modo mock solo tiene snapshot de ${BATTLE_EXAMPLE_ID}. Activa Live o usa ese ID.`,
            id,
          },
          { status: 404 },
        );
      }
      const mock = getMockBattleDetail(id);
      return NextResponse.json(lite ? { ...mock, partial: true, kills: [], lootClaims: [] } : mock);
    }

    const detail = lite ? await fetchBattleDetailLite(id) : await fetchBattleDetail(id);
    if (String(detail.id) !== String(id)) {
      return NextResponse.json(
        { error: `ID mismatch: expected ${id}, got ${detail.id}` },
        { status: 500 },
      );
    }
    return NextResponse.json(detail, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live battle failed";
    console.error("[api/battles/id]", id, lite ? "lite" : "full", message);
    return NextResponse.json(
      {
        error: message,
        id,
        source: "error",
      },
      { status: 503 },
    );
  }
}
