/**
 * Clasificación de armas Albion → Tank / Healer / Support / DPS
 * Basado en unique names (MAIN_*, 2H_*) y roles típicos ZvZ / small-scale.
 */

import { prettyItemName, sanitizeItemType, weaponFamilyKey } from "@/lib/format";

export type WeaponRole = "tank" | "healer" | "support" | "dps" | "unknown";

export const WEAPON_ROLE_ORDER: WeaponRole[] = [
  "tank",
  "healer",
  "support",
  "dps",
  "unknown",
];

export const WEAPON_ROLE_LABEL: Record<WeaponRole, string> = {
  tank: "Tanks",
  healer: "Healers",
  support: "Supports",
  dps: "DPS",
  unknown: "Sin arma / sin K-D",
};

export const WEAPON_ROLE_COLOR: Record<WeaponRole, string> = {
  tank: "#60a5fa",
  healer: "#34d399",
  support: "#c084fc",
  dps: "#f87171",
  unknown: "#6b7280",
};

/** Familia sin T# / @enchant, uppercased */
export function weaponFamily(type: string): string {
  return weaponFamilyKey(type).toUpperCase();
}

/**
 * Rol por unique name.
 * Orden: healer → support (específicos) → tank → dps (default).
 */
export function classifyWeaponRole(type: string | null | undefined): WeaponRole {
  if (!type) return "unknown";
  const f = weaponFamily(type);
  if (!f) return "unknown";

  // —— Healers (Holy + Nature) ——
  if (
    f.includes("HOLYSTAFF") ||
    f.includes("DIVINESTAFF") ||
    f.includes("NATURESTAFF") ||
    f.includes("WILDSTAFF")
  ) {
    return "healer";
  }

  // —— Supports (Arcane utility + Occult / Lifecurse) ——
  if (
    f.includes("ARCANESTAFF") ||
    f.includes("ENIGMATICORB") ||
    f.includes("ARCANEORB") ||
    f.includes("ARCANE_ORB")
  ) {
    return "support";
  }
  // Occult Staff
  if (f.includes("CURSEDSTAFF_MORGANA")) return "support";
  // Lifecurse Staff (Avalon 1H cursed)
  if (f === "MAIN_CURSEDSTAFF_AVALON") return "support";
  // Staff of Balance — peel / utility
  if (f.includes("QUARTERSTAFF_AVALON")) return "support";

  // —— Tanks (Maces, Hammers, Grovekeeper, Earthrune, Daybreaker, peel scythe) ——
  if (f.includes("MACE") || f.includes("HAMMER") || f.includes("POLEHAMMER")) {
    return "tank";
  }
  // Grovekeeper
  if (f.includes("RAM_KEEPER")) return "tank";
  // Earthrune Staff
  if (f.includes("ROCKSTAFF_KEEPER")) return "tank";
  // Daybreaker
  if (f.includes("SPEAR_LANCE_AVALON") || f.includes("LANCE_AVALON")) return "tank";
  // Soulscythe — peel / frontline disrupt
  if (f.includes("SCYTHE_HELL") || f.includes("SOULSCYTHE")) return "tank";
  // Icicle / crystal frost tank tools
  if (f.includes("ICEGAUNTLETS_CRYSTAL") || f.includes("FROST_CRYSTAL")) return "tank";
  // Spiked Gauntlets / similar crystal tanks
  if (f.includes("GAUNTLETS_CRYSTAL") && f.includes("ICE")) return "tank";

  // —— Todo lo demás = DPS ——
  return "dps";
}

export function weaponDisplayName(type: string): string {
  const f = weaponFamily(type);
  const NAMES: Record<string, string> = {
    MAIN_SWORD: "Broadsword",
    "2H_CLAYMORE": "Claymore",
    "2H_DUALSWORD": "Bloodletter",
    "2H_CLEAVER_HELL": "Carving Sword",
    "2H_SWORD_CRYSTAL": "Infinity Blade",
    MAIN_AXE: "Battleaxe",
    "2H_AXE": "Greataxe",
    "2H_HALBERD": "Halberd",
    "2H_HALBERD_MORGANA": "Carrioncaller",
    "2H_SCYTHE_HELL": "Soulscythe",
    "2H_DUALAXE_KEEPER": "Bear Paws",
    "2H_AXE_AVALON": "Realmbreaker",
    MAIN_MACE: "Mace",
    "2H_MACE": "Heavy Mace",
    MAIN_MACE_HELL: "Incubus Mace",
    "2H_MACE_MORGANA": "Camlann Mace",
    "2H_DUALMACE_AVALON": "Oathkeepers",
    MAIN_ROCKMACE_KEEPER: "Bedrock Mace",
    "2H_ROCKMACE_KEEPER": "Bedrock Mace",
    MAIN_HAMMER: "Hammer",
    "2H_HAMMER": "Great Hammer",
    "2H_POLEHAMMER": "Polehammer",
    "2H_HAMMER_UNDEAD": "Tombhammer",
    "2H_HAMMER_AVALON": "Hand of Justice",
    "2H_RAM_KEEPER": "Grovekeeper",
    "2H_ROCKSTAFF_KEEPER": "Earthrune Staff",
    MAIN_SPEAR: "Spear",
    "2H_SPEAR": "Pike",
    "2H_GLAIVE": "Glaive",
    MAIN_SPEAR_LANCE: "Lance",
    "2H_SPEAR_LANCE_AVALON": "Daybreaker",
    MAIN_DAGGER: "Dagger",
    "2H_DAGGERPAIR": "Dagger Pair",
    "2H_CLAWPAIR": "Claws",
    "2H_IRONCLAWS_HELL": "Demonfang",
    "2H_DUALSICKLE_UNDEAD": "Deathgivers",
    "2H_DAGGER_KATAR_AVALON": "Bridled Fury",
    "2H_CROSSBOW": "Crossbow",
    "2H_CROSSBOWLARGE": "Heavy Crossbow",
    "2H_REPEATINGCROSSBOW_UNDEAD": "Weeping Repeater",
    "2H_DUALCROSSBOW_HELL": "Siegebow",
    "2H_CROSSBOW_CANNON_AVALON": "Energy Shaper",
    "2H_BOW": "Bow",
    "2H_WARBOW": "Warbow",
    "2H_LONGBOW": "Longbow",
    "2H_BOW_HELL": "Wailing Bow",
    "2H_BOW_KEEPER": "Badon Bow",
    "2H_BOW_AVALON": "Skystrider",
    MAIN_FIRESTAFF: "Fire Staff",
    "2H_FIRESTAFF": "Great Fire Staff",
    "2H_INFERNOSTAFF": "Infernal Staff",
    "2H_FIRESTAFF_HELL": "Brimstone Staff",
    MAIN_FIRESTAFF_KEEPER: "Wildfire Staff",
    "2H_FIRE_RINGPAIR_AVALON": "Dawnsong",
    MAIN_FROSTSTAFF: "Frost Staff",
    "2H_FROSTSTAFF": "Great Frost Staff",
    "2H_GLACIALSTAFF": "Glacial Staff",
    MAIN_FROSTSTAFF_AVALON: "Chillhowl",
    "2H_ICEGAUNTLETS_CRYSTAL": "Icicle Staff",
    MAIN_ARCANESTAFF: "Arcane Staff",
    "2H_ARCANESTAFF": "Enigmatic Staff",
    "2H_ARCANESTAFF_HELL": "Witchwork Staff",
    "2H_ENIGMATICORB": "Malevolent Locus",
    MAIN_CURSEDSTAFF: "Cursed Staff",
    "2H_CURSEDSTAFF": "Great Cursed Staff",
    "2H_DEMONICSTAFF": "Demonic Staff",
    "2H_CURSEDSTAFF_MORGANA": "Occult Staff",
    MAIN_CURSEDSTAFF_AVALON: "Lifecurse Staff",
    "2H_CURSEDSTAFF_AVALON": "Shadowcaller",
    MAIN_HOLYSTAFF: "Holy Staff",
    "2H_HOLYSTAFF": "Great Holy Staff",
    "2H_DIVINESTAFF": "Divine Staff",
    "2H_HOLYSTAFF_HELL": "Fallen Staff",
    "2H_HOLYSTAFF_UNDEAD": "Redemption Staff",
    "2H_HOLYSTAFF_CRYSTAL": "Exalted Staff",
    MAIN_HOLYSTAFF_MORGANA: "Lifetouch Staff",
    MAIN_HOLYSTAFF_AVALON: "Hallowfall",
    MAIN_NATURESTAFF: "Nature Staff",
    "2H_NATURESTAFF": "Great Nature Staff",
    "2H_WILDSTAFF": "Wild Staff",
    "2H_NATURESTAFF_KEEPER": "Druid Staff",
    "2H_NATURESTAFF_HELL": "Blight Staff",
    "2H_NATURESTAFF_AVALON": "Ironroot Staff",
    "2H_QUARTERSTAFF": "Quarterstaff",
    "2H_IRONCLADEDSTAFF": "Iron-clad Staff",
    "2H_DOUBLEBLADEDSTAFF": "Double Bladed Staff",
    "2H_COMBATSTAFF_MORGANA": "Black Monk Staff",
    "2H_QUARTERSTAFF_AVALON": "Staff of Balance",
    "2H_KNUCKLES_SET1": "Brawler Gloves",
    "2H_KNUCKLES_SET2": "Battle Bracers",
    "2H_KNUCKLES_SET3": "Spiked Gauntlets",
    "2H_KNUCKLES_KEEPER": "Ursine Gauntlets",
    "2H_KNUCKLES_HELL": "Hellfire Hands",
    "2H_KNUCKLES_MORGANA": "Ravenstrike Cestus",
    "2H_KNUCKLES_AVALON": "Fists of Avalon",
  };

  if (NAMES[f]) return NAMES[f];
  return prettyItemName(type);
}

export function normalizeWeaponType(type: string): string {
  return sanitizeItemType(type);
}
