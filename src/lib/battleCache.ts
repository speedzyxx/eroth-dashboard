import type { BattleDetail } from "@/types/albion";

type CacheEntry = {
  detail: BattleDetail;
  savedAt: number;
};

const g = globalThis as typeof globalThis & {
  __erothBattleCache?: Map<string, CacheEntry>;
};

function store(): Map<string, CacheEntry> {
  if (!g.__erothBattleCache) g.__erothBattleCache = new Map();
  return g.__erothBattleCache;
}

/** Batallas terminadas no cambian: cache en memoria del server (Render free reinicia a veces). */
export function getCachedBattle(id: string): BattleDetail | null {
  const hit = store().get(String(id));
  if (!hit) return null;
  // Full (con kills) vive 6h; lite no se cachea aquí
  if (hit.detail.partial) return null;
  if (Date.now() - hit.savedAt > 6 * 60 * 60_000) {
    store().delete(String(id));
    return null;
  }
  return hit.detail;
}

export function setCachedBattle(detail: BattleDetail): void {
  if (detail.partial) return;
  store().set(String(detail.id), { detail, savedAt: Date.now() });
}
