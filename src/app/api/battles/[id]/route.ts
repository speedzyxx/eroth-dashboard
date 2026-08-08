import { NextRequest, NextResponse } from "next/server";
import { getMockBattleDetail } from "@/data/mockBattles";
import { getCachedBattle, setCachedBattle } from "@/lib/battleCache";
import { BATTLE_EXAMPLE_ID } from "@/lib/roster";
import { fetchBattleDetail, fetchBattleDetailLite } from "@/services/battleService";

export const maxDuration = 60;

/**
 * GET /api/battles/[id]?live=1&lite=1|fast=1
 * lite → roster; fast → kills aliados (cofre); full → kills+armas
 * Cache en memoria tras primera carga completa.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const live = req.nextUrl.searchParams.get("live") !== "0";
  const lite = req.nextUrl.searchParams.get("lite") === "1";
  const fast = req.nextUrl.searchParams.get("fast") === "1";

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

    if (!lite) {
      const cached = getCachedBattle(id);
      if (cached && !fast) {
        return NextResponse.json(
          { ...cached, warning: cached.warning ?? "Desde cache (instantáneo)" },
          { headers: { "Cache-Control": "public, s-maxage=300" } },
        );
      }
    }

    const detail = lite
      ? await fetchBattleDetailLite(id)
      : await fetchBattleDetail(id, undefined, { mode: fast ? "fast" : "full" });

    if (String(detail.id) !== String(id)) {
      return NextResponse.json(
        { error: `ID mismatch: expected ${id}, got ${detail.id}` },
        { status: 500 },
      );
    }

    if (!lite && !detail.partial) {
      setCachedBattle(detail);
    }

    return NextResponse.json(detail, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live battle failed";
    console.error("[api/battles/id]", id, lite ? "lite" : fast ? "fast" : "full", message);
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
