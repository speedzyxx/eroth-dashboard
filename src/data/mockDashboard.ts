import { GUILD_NAME, GUILD_TAG, PARTY_SIZE } from "@/lib/config";
import { makeItem } from "@/lib/format";
import type {
  DashboardData,
  KillEvent,
  LootClaim,
  PartyMemberStats,
  SessionSummary,
} from "@/types/albion";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

const party: PartyMemberStats[] = [
  { id: "p1", name: "Vaelith", kills: 7, deaths: 1, assistFame: 182400, lootValue: 4_850_000, damage: 41200, isOnline: true, role: "Caller" },
  { id: "p2", name: "Nyxara", kills: 5, deaths: 0, assistFame: 156200, lootValue: 6_120_000, damage: 35800, isOnline: true, role: "DPS" },
  { id: "p3", name: "Korrin", kills: 4, deaths: 2, assistFame: 98400, lootValue: 2_340_000, damage: 28900, isOnline: true, role: "Support" },
  { id: "p4", name: "Ashveil", kills: 6, deaths: 1, assistFame: 141000, lootValue: 3_980_000, damage: 37600, isOnline: true, role: "DPS" },
  { id: "p5", name: "Thorne", kills: 3, deaths: 0, assistFame: 87200, lootValue: 1_560_000, damage: 22100, isOnline: true, role: "Tank" },
  { id: "p6", name: "Selune", kills: 2, deaths: 1, assistFame: 64100, lootValue: 890_000, damage: 18400, isOnline: true, role: "Healer" },
  { id: "p7", name: "Draven", kills: 4, deaths: 0, assistFame: 110500, lootValue: 2_750_000, damage: 30100, isOnline: true, role: "DPS" },
  { id: "p8", name: "Mirage", kills: 3, deaths: 2, assistFame: 72800, lootValue: 1_210_000, damage: 19800, isOnline: true, role: "Scout" },
  { id: "p9", name: "Riven", kills: 5, deaths: 1, assistFame: 129300, lootValue: 3_440_000, damage: 33400, isOnline: true, role: "DPS" },
  { id: "p10", name: "Orin", kills: 1, deaths: 0, assistFame: 41200, lootValue: 620_000, damage: 11200, isOnline: true, role: "Support" },
  { id: "p11", name: "Kael", kills: 2, deaths: 1, assistFame: 55800, lootValue: 980_000, damage: 15600, isOnline: true, role: "Tank" },
  { id: "p12", name: "Lyra", kills: 3, deaths: 0, assistFame: 79300, lootValue: 1_870_000, damage: 24700, isOnline: true, role: "Healer" },
  { id: "p13", name: "Vex", kills: 4, deaths: 1, assistFame: 101200, lootValue: 2_110_000, damage: 26800, isOnline: true, role: "DPS" },
  { id: "p14", name: "Sable", kills: 2, deaths: 0, assistFame: 48600, lootValue: 740_000, damage: 13900, isOnline: true, role: "Support" },
  { id: "p15", name: "Joran", kills: 1, deaths: 2, assistFame: 33400, lootValue: 410_000, damage: 9800, isOnline: true, role: "Scout" },
  { id: "p16", name: "Eira", kills: 3, deaths: 0, assistFame: 86700, lootValue: 1_990_000, damage: 25600, isOnline: true, role: "DPS" },
  { id: "p17", name: "Hex", kills: 2, deaths: 1, assistFame: 52100, lootValue: 1_050_000, damage: 14700, isOnline: true, role: "Support" },
  { id: "p18", name: "Nova", kills: 4, deaths: 0, assistFame: 118900, lootValue: 2_880_000, damage: 31200, isOnline: true, role: "DPS" },
  { id: "p19", name: "Grimm", kills: 1, deaths: 1, assistFame: 38900, lootValue: 530_000, damage: 10400, isOnline: true, role: "Tank" },
  { id: "p20", name: "Aria", kills: 2, deaths: 0, assistFame: 61200, lootValue: 1_340_000, damage: 17300, isOnline: true, role: "Healer" },
];

/** IDs verificados contra render.albiononline.com */
const kills: KillEvent[] = [
  {
    id: "k1",
    timestamp: ago(2),
    killer: { id: "p2", name: "Nyxara", guildId: "eroth", guildName: GUILD_NAME },
    victim: { id: "e1", name: "Bloodhawk", guildId: "x", guildName: "Iron Covenant", allianceName: "VOID" },
    fame: 48210,
    totalDamage: 1892,
    location: "Black Zone — Steppe Crossing",
    victimEquipment: {
      Head: makeItem("T8_HEAD_PLATE_SET3@3", { name: "Judicator Helmet", quality: 4 }),
      Armor: makeItem("T8_ARMOR_PLATE_SET3@4", { name: "Judicator Armor", quality: 5 }),
      Shoes: makeItem("T8_SHOES_PLATE_SET3@3", { name: "Judicator Boots", quality: 3 }),
      MainHand: makeItem("T8_MAIN_SWORD@3", { name: "Broadsword", quality: 4 }),
      OffHand: makeItem("T8_OFF_SHIELD@3", { name: "Shield", quality: 3 }),
    },
    lootable: [
      makeItem("T8_ARMOR_PLATE_SET3@4", { name: "Judicator Armor", quality: 5 }),
      makeItem("T8_MAIN_SWORD@3", { name: "Broadsword", quality: 4 }),
      makeItem("T8_MOUNT_ARMORED_HORSE", { name: "Armored Horse", quality: 1 }),
      makeItem("T8_POTION_COOLDOWN@3", { name: "Gigantify Potion", quality: 3, count: 3 }),
      makeItem("T8_MEAL_STEW@3", { name: "Beef Stew", quality: 1, count: 5 }),
      makeItem("T8_BAG@3", { name: "Bag", quality: 2 }),
      makeItem("T8_CAPEITEM_FW_BRIDGEWATCH@3", { name: "Bridgewatch Cape", quality: 3 }),
    ],
    trash: [
      makeItem("T8_HEAD_PLATE_SET3@3", { name: "Judicator Helmet", quality: 4 }),
      makeItem("T8_SHOES_PLATE_SET3@3", { name: "Judicator Boots", quality: 3 }),
      makeItem("T8_OFF_SHIELD@3", { name: "Shield", quality: 3 }),
    ],
    lootedBy: [
      {
        playerName: "Nyxara",
        item: makeItem("T8_ARMOR_PLATE_SET3@4", { name: "Judicator Armor", quality: 5 }),
      },
    ],
    participants: 8,
  },
  {
    id: "k2",
    timestamp: ago(7),
    killer: { id: "p1", name: "Vaelith", guildId: "eroth", guildName: GUILD_NAME },
    victim: { id: "e2", name: "SilkFang", guildId: "y", guildName: "Night Reapers", allianceName: "ASH" },
    fame: 39150,
    totalDamage: 2104,
    location: "Roads of Avalon",
    victimEquipment: {
      Head: makeItem("T8_HEAD_LEATHER_SET2@3", { name: "Hunter Hood", quality: 3 }),
      Armor: makeItem("T8_ARMOR_LEATHER_SET1@3", { name: "Mercenary Jacket", quality: 4 }),
      Shoes: makeItem("T8_SHOES_LEATHER_SET2@2", { name: "Hunter Shoes", quality: 2 }),
      MainHand: makeItem("T8_2H_DUALSWORD@3", { name: "Bloodletter", quality: 4 }),
      OffHand: null,
    },
    lootable: [
      makeItem("T8_2H_DUALSWORD@3", { name: "Bloodletter", quality: 4 }),
      makeItem("T8_ARMOR_LEATHER_SET1@3", { name: "Mercenary Jacket", quality: 4 }),
      makeItem("T8_MOUNT_HORSE", { name: "Riding Horse", quality: 1 }),
      makeItem("T6_POTION_ENERGY@1", { name: "Energy Potion", quality: 2, count: 4 }),
      makeItem("T8_MEAL_SANDWICH@3", { name: "Sandwich", quality: 1, count: 8 }),
    ],
    trash: [
      makeItem("T8_HEAD_LEATHER_SET2@3", { name: "Hunter Hood", quality: 3 }),
      makeItem("T8_SHOES_LEATHER_SET2@2", { name: "Hunter Shoes", quality: 2 }),
    ],
    lootedBy: [
      {
        playerName: "Ashveil",
        item: makeItem("T8_2H_DUALSWORD@3", { name: "Bloodletter", quality: 4 }),
      },
    ],
    participants: 12,
  },
  {
    id: "k3",
    timestamp: ago(14),
    killer: { id: "p4", name: "Ashveil", guildId: "eroth", guildName: GUILD_NAME },
    victim: { id: "e3", name: "Frostbite", guildId: "z", guildName: "Crystal Wardens", allianceName: "NEXUS" },
    fame: 52880,
    totalDamage: 2450,
    location: "Outlands — Drytop",
    victimEquipment: {
      Head: makeItem("T8_HEAD_CLOTH_SET3@4", { name: "Cultist Cowl", quality: 5 }),
      Armor: makeItem("T8_ARMOR_CLOTH_SET3@3", { name: "Cultist Robe", quality: 4 }),
      Shoes: makeItem("T8_SHOES_CLOTH_SET3@3", { name: "Cultist Sandals", quality: 3 }),
      MainHand: makeItem("T8_2H_ARCANESTAFF@4", { name: "Enigmatic Staff", quality: 5 }),
      OffHand: null,
    },
    lootable: [
      makeItem("T8_2H_ARCANESTAFF@4", { name: "Enigmatic Staff", quality: 5 }),
      makeItem("T8_HEAD_CLOTH_SET3@4", { name: "Cultist Cowl", quality: 5 }),
      makeItem("T8_ARMOR_CLOTH_SET3@3", { name: "Cultist Robe", quality: 4 }),
      makeItem("T8_POTION_CLEANSE@2", { name: "Cleansing Potion", quality: 2, count: 2 }),
      makeItem("T8_FURNITUREITEM_TROPHY_GENERAL", { name: "Trophy", quality: 1 }),
    ],
    trash: [makeItem("T8_SHOES_CLOTH_SET3@3", { name: "Cultist Sandals", quality: 3 })],
    lootedBy: [
      {
        playerName: "Vaelith",
        item: makeItem("T8_2H_ARCANESTAFF@4", { name: "Enigmatic Staff", quality: 5 }),
      },
      {
        playerName: "Riven",
        item: makeItem("T8_HEAD_CLOTH_SET3@4", { name: "Cultist Cowl", quality: 5 }),
      },
    ],
    participants: 15,
  },
  {
    id: "k4",
    timestamp: ago(22),
    killer: { id: "p9", name: "Riven", guildId: "eroth", guildName: GUILD_NAME },
    victim: { id: "e4", name: "Ironhowl", guildId: "w", guildName: "Black Banner", allianceName: "RAZE" },
    fame: 31420,
    totalDamage: 1670,
    location: "Black Zone — Mountain Reach",
    victimEquipment: {
      Head: makeItem("T8_HEAD_PLATE_SET1@2", { name: "Soldier Helmet", quality: 2 }),
      Armor: makeItem("T8_ARMOR_PLATE_SET1@3", { name: "Soldier Armor", quality: 3 }),
      Shoes: makeItem("T8_SHOES_PLATE_SET1@2", { name: "Soldier Boots", quality: 2 }),
      MainHand: makeItem("T8_2H_HAMMER@3", { name: "Great Hammer", quality: 3 }),
      OffHand: null,
    },
    lootable: [
      makeItem("T8_ARMOR_PLATE_SET1@3", { name: "Soldier Armor", quality: 3 }),
      makeItem("T8_OFF_TORCH@2", { name: "Torch", quality: 2 }),
    ],
    trash: [
      makeItem("T8_HEAD_PLATE_SET1@2", { name: "Soldier Helmet", quality: 2 }),
      makeItem("T8_SHOES_PLATE_SET1@2", { name: "Soldier Boots", quality: 2 }),
      makeItem("T8_2H_HAMMER@3", { name: "Great Hammer", quality: 3 }),
    ],
    lootedBy: [
      {
        playerName: "Thorne",
        item: makeItem("T8_ARMOR_PLATE_SET1@3", { name: "Soldier Armor", quality: 3 }),
      },
    ],
    participants: 6,
  },
  {
    id: "k5",
    timestamp: ago(31),
    killer: { id: "p18", name: "Nova", guildId: "eroth", guildName: GUILD_NAME },
    victim: { id: "e5", name: "Shadewalker", guildId: "v", guildName: "Silent Path", allianceName: "GLOOM" },
    fame: 44760,
    totalDamage: 1988,
    location: "Hellgate — Duo",
    victimEquipment: {
      Head: makeItem("T8_HEAD_LEATHER_MORGANA@3", { name: "Stalker Hood", quality: 4 }),
      Armor: makeItem("T8_ARMOR_LEATHER_MORGANA@3", { name: "Stalker Jacket", quality: 4 }),
      Shoes: makeItem("T8_SHOES_LEATHER_MORGANA@3", { name: "Stalker Shoes", quality: 3 }),
      MainHand: makeItem("T8_2H_BOW_HELL@3", { name: "Wailing Bow", quality: 4 }),
      OffHand: null,
    },
    lootable: [
      makeItem("T8_2H_BOW_HELL@3", { name: "Wailing Bow", quality: 4 }),
      makeItem("T8_ARMOR_LEATHER_MORGANA@3", { name: "Stalker Jacket", quality: 4 }),
      makeItem("T8_2H_DAGGERPAIR@1", { name: "Dagger Pair", quality: 3 }),
      makeItem("T8_POTION_COOLDOWN@3", { name: "Gigantify Potion", quality: 2, count: 2 }),
    ],
    trash: [
      makeItem("T8_HEAD_LEATHER_MORGANA@3", { name: "Stalker Hood", quality: 4 }),
      makeItem("T8_SHOES_LEATHER_MORGANA@3", { name: "Stalker Shoes", quality: 3 }),
      makeItem("T8_ARMOR_LEATHER_SET3@3", { name: "Assassin Jacket", quality: 2 }),
    ],
    lootedBy: [
      { playerName: "Nova", item: makeItem("T8_2H_BOW_HELL@3", { name: "Wailing Bow", quality: 4 }) },
      {
        playerName: "Nyxara",
        item: makeItem("T8_ARMOR_LEATHER_MORGANA@3", { name: "Stalker Jacket", quality: 4 }),
      },
    ],
    participants: 4,
  },
  {
    id: "k6",
    timestamp: ago(45),
    killer: { id: "p7", name: "Draven", guildId: "eroth", guildName: GUILD_NAME },
    victim: { id: "e6", name: "Embercoil", guildId: "u", guildName: "Ash Legion", allianceName: "BLAZE" },
    fame: 27640,
    totalDamage: 1420,
    location: "Yellow Zone — Dewleaf Fen",
    victimEquipment: {
      Head: makeItem("T7_HEAD_CLOTH_SET1@2", { name: "Scholar Cowl", quality: 2 }),
      Armor: makeItem("T7_ARMOR_CLOTH_SET1@2", { name: "Scholar Robe", quality: 2 }),
      Shoes: makeItem("T7_SHOES_CLOTH_SET1@2", { name: "Scholar Sandals", quality: 2 }),
      MainHand: makeItem("T7_MAIN_FIRESTAFF@2", { name: "Fire Staff", quality: 3 }),
      OffHand: makeItem("T8_OFF_TORCH@2", { name: "Torch", quality: 2 }),
    },
    lootable: [
      makeItem("T7_MAIN_FIRESTAFF@2", { name: "Fire Staff", quality: 3 }),
      makeItem("T6_POTION_ENERGY@1", { name: "Energy Potion", quality: 1, count: 6 }),
    ],
    trash: [
      makeItem("T7_HEAD_CLOTH_SET1@2", { name: "Scholar Cowl", quality: 2 }),
      makeItem("T7_ARMOR_CLOTH_SET1@2", { name: "Scholar Robe", quality: 2 }),
      makeItem("T7_SHOES_CLOTH_SET1@2", { name: "Scholar Sandals", quality: 2 }),
      makeItem("T8_OFF_TORCH@2", { name: "Torch", quality: 2 }),
    ],
    lootedBy: [
      { playerName: "Draven", item: makeItem("T7_MAIN_FIRESTAFF@2", { name: "Fire Staff", quality: 3 }) },
    ],
    participants: 9,
  },
];

function estimateSilver(item: { tierLabel: string; quality: number; count: number }): number {
  const tier = Number(item.tierLabel.match(/T(\d+)/)?.[1] || 4);
  const enchant = Number(item.tierLabel.split(".")[1] || 0);
  return Math.round(80_000 * tier * (1 + enchant) * (item.quality || 1) * (item.count || 1));
}

/** Expande cada kill: todos los lootables como lootedBy + ledger completo */
const enrichedKills: KillEvent[] = kills.map((k) => ({
  ...k,
  lootedBy: k.lootable.map((item) => ({
    playerName: k.killer.name,
    guildName: k.killer.guildName,
    allianceName: k.killer.allianceName ?? null,
    item,
  })),
}));

const lootClaims: LootClaim[] = enrichedKills.flatMap((k) => [
  ...k.lootable.map((item, idx) => ({
    id: `${k.id}-loot-${idx}`,
    playerName: k.killer.name,
    guildName: k.killer.guildName,
    allianceName: k.killer.allianceName ?? null,
    item,
    estimatedSilver: estimateSilver(item),
    killEventId: k.id,
    timestamp: k.timestamp,
    victimName: k.victim.name,
    kind: "lootable" as const,
  })),
  ...k.trash.map((item, idx) => ({
    id: `${k.id}-trash-${idx}`,
    playerName: k.killer.name,
    guildName: k.killer.guildName,
    allianceName: k.killer.allianceName ?? null,
    item,
    estimatedSilver: 0,
    killEventId: k.id,
    timestamp: k.timestamp,
    victimName: k.victim.name,
    kind: "trash" as const,
  })),
]);

const summary: SessionSummary = {
  sessionId: "session-mock-001",
  startedAt: ago(90),
  kills: party.reduce((s, p) => s + p.kills, 0),
  deaths: party.reduce((s, p) => s + p.deaths, 0),
  fame: party.reduce((s, p) => s + p.assistFame, 0),
  lootValueSilver: lootClaims
    .filter((c) => c.kind === "lootable")
    .reduce((s, c) => s + c.estimatedSilver, 0),
  activeSlots: party.filter((p) => p.isOnline).length,
  maxSlots: party.length,
  alliesCount: party.length,
  enemiesCount: 0,
  totalPlayers: party.length,
  guildName: GUILD_NAME,
  guildTag: GUILD_TAG,
};

export function getMockDashboard(): DashboardData {
  return {
    summary,
    kills: enrichedKills,
    lootClaims,
    party,
    source: "mock",
    lastUpdated: new Date().toISOString(),
  };
}
