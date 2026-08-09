import { ITEM_RENDER_BASE } from "@/lib/config";
import type { EquipmentItem, EquipmentSlot } from "@/types/albion";

/**
 * IDs de Albion usan solo [A-Z0-9_@.].
 * NO encodear `@` → `%40` (rompe render.albiononline.com sin query string).
 */
export function sanitizeItemType(type: string): string {
  return type.trim().replace(/\.png$/i, "");
}

/** Extrae enchant (@N) del type */
export function parseEnchant(type: string): number {
  const m = sanitizeItemType(type).match(/@(\d+)$/);
  return m ? Number(m[1]) : 0;
}

/** Type sin enchant (fallback de ícono) */
export function stripEnchant(type: string): string {
  return sanitizeItemType(type).replace(/@\d+$/, "");
}

/**
 * URL oficial de ícono.
 * size bajo = más rápido (el UI usa 36–52px).
 */
export function itemIconUrl(type: string, quality = 1, size = 108): string {
  const id = sanitizeItemType(type);
  const q = Math.min(Math.max(quality || 1, 1), 5);
  // 64–128 es suficiente para slots UI; 217 es innecesariamente pesado
  const s = Math.min(Math.max(size, 48), 128);
  return `${ITEM_RENDER_BASE}/${id}.png?count=1&quality=${q}&size=${s}`;
}

/** Candidatos: CDN primero (rápido), proxy solo como fallback */
export function itemIconCandidates(
  type: string,
  quality = 1,
  size = 108,
): string[] {
  const id = sanitizeItemType(type);
  const base = stripEnchant(id);
  const q = Math.min(Math.max(quality || 1, 1), 5);
  const s = Math.min(Math.max(size, 48), 128);

  const urls = [
    itemIconUrl(id, q, s),
    `/api/item-icon?id=${encodeURIComponent(id)}&quality=${q}&size=${s}`,
  ];
  if (base !== id) {
    urls.push(itemIconUrl(base, q, s));
    urls.push(`/api/item-icon?id=${encodeURIComponent(base)}&quality=${q}&size=${s}`);
  }
  return urls;
}

export function tierLabelFromType(type: string): string {
  const id = sanitizeItemType(type);
  const tierMatch = id.match(/^T(\d+)/i);
  const enchant = parseEnchant(id);
  const tier = tierMatch ? tierMatch[1] : "?";
  return `T${tier}.${enchant}`;
}

/**
 * Ítems en Inventory de la API que NO se pueden lotear (mano roja / soulbound / event).
 * - *NONTRADABLE*
 * - cofres UNIQUE_LOOTCHEST* (icono con 🚫)
 * - vanity / furniture / trophies
 * - ids sin tier T# (basura de parseo)
 */
export function isNonDropLootItem(type: string): boolean {
  const t = sanitizeItemType(type).toUpperCase();
  if (!t) return true;
  if (/SKILLBOOK_STANDARD/.test(t)) return false;
  if (/SKILLBOOK_NONTRADABLE/.test(t)) return true;
  if (/_NONTRADABLE/.test(t)) return true;
  if (/LOOTCHEST/.test(t)) return true;
  if (/FURNITUREITEM|TROPHY|VANITY|UNIQUE_SHOES_RRF|UNIQUE_ARMOR_RRF/.test(t)) return true;
  // Tipos raros sin T#: suele ser unique event no lootable
  if (!/^T\d+_/.test(t) && /UNIQUE_/.test(t)) return true;
  return false;
}

export function prettyItemName(type: string, fallback?: string): string {
  if (fallback) return fallback;
  const id = sanitizeItemType(type);
  if (/SKILLBOOK_NONTRADABLE/i.test(id)) {
    const tier = id.match(/^T(\d+)/i)?.[1];
    const labels: Record<string, string> = {
      "1": "Novice's Tome of Insight",
      "2": "Journeyman's Tome of Insight",
      "3": "Adept's Tome of Insight",
      "4": "Adept's Tome of Insight",
      "5": "Expert's Tome of Insight",
      "6": "Master's Tome of Insight",
      "7": "Grandmaster's Tome of Insight",
      "8": "Elder's Tome of Insight",
    };
    return labels[tier || ""] || "Tome of Insight";
  }
  if (/^T?\d*_?TRASH$/i.test(id) || /(?:^|_)TRASH$/i.test(id)) {
    return "Trash (silver)";
  }
  return id
    .replace(/^T\d+_/, "")
    .replace(/@\d+$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function makeItem(
  type: string,
  opts: Partial<Pick<EquipmentItem, "count" | "quality" | "name" | "active">> = {},
): EquipmentItem {
  const id = sanitizeItemType(type);
  return {
    type: id,
    count: opts.count ?? 1,
    quality: opts.quality ?? 1,
    tierLabel: tierLabelFromType(id),
    name: opts.name ?? prettyItemName(id),
    active: opts.active,
  };
}

export function formatSilver(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatFame(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const SLOT_ORDER: EquipmentSlot[] = [
  "Head",
  "Armor",
  "Shoes",
  "MainHand",
  "OffHand",
];

export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  Head: "Casco",
  Armor: "Pecho",
  Shoes: "Botas",
  MainHand: "Arma",
  OffHand: "Off-hand",
  Cape: "Capa",
  Bag: "Bolsa",
  Mount: "Montura",
  Potion: "Poción",
  Food: "Comida",
};

/** Clave de familia de arma (sin tier/enchant) para agrupar composición */
export function weaponFamilyKey(type: string): string {
  return sanitizeItemType(type)
    .replace(/^T\d+_/, "")
    .replace(/@\d+$/, "");
}
