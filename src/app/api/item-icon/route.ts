import { NextRequest, NextResponse } from "next/server";
import { ITEM_RENDER_BASE } from "@/lib/config";
import { sanitizeItemType, stripEnchant } from "@/lib/format";

export const runtime = "nodejs";

/**
 * Proxy de íconos: evita fallos de hotlink / encoding en el browser.
 * GET /api/item-icon?id=T8_ARMOR_PLATE_SET3@4&quality=4&size=128
 */
export async function GET(req: NextRequest) {
  const idRaw = req.nextUrl.searchParams.get("id");
  if (!idRaw) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const id = sanitizeItemType(idRaw);
  const quality = Math.min(Math.max(Number(req.nextUrl.searchParams.get("quality") || 1), 1), 5);
  const size = Math.min(Math.max(Number(req.nextUrl.searchParams.get("size") || 96), 32), 128);

  const candidates = [
    `${ITEM_RENDER_BASE}/${id}.png?count=1&quality=${quality}&size=${size}`,
    `${ITEM_RENDER_BASE}/${id}.png`,
    `${ITEM_RENDER_BASE}/${stripEnchant(id)}.png?count=1&quality=${quality}&size=${size}`,
  ];

  for (const url of candidates) {
    try {
      const upstream = await fetch(url, {
        headers: { Accept: "image/png,*/*" },
        next: { revalidate: 86400 },
      });
      if (!upstream.ok) continue;
      const buf = await upstream.arrayBuffer();
      if (buf.byteLength < 500) continue; // placeholder vacío / error

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      // try next
    }
  }

  return NextResponse.json({ error: "Icon not found", id }, { status: 404 });
}
