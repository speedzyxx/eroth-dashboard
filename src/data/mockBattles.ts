import battleSnapshot from "@/data/battle-1430146909.json";
import { getMockDashboard } from "@/data/mockDashboard";
import {
  HOME_ALLIANCE_NAME,
  HOME_GUILD_NAME,
  LEADER_NAME,
  BATTLE_EXAMPLE_ID,
  isHomeSide,
} from "@/lib/roster";
import type {
  AlbionApiBattle,
  BattleAllianceRow,
  BattleDetail,
  BattleGuildRow,
  BattleListItem,
  BattlePlayerRow,
  KillEvent,
  LootClaim,
} from "@/types/albion";

const snapshot = battleSnapshot as unknown as AlbionApiBattle;

function values<T>(record: Record<string, T>): T[] {
  return Object.values(record || {});
}

function isHomePlayer(p: {
  allianceId?: string | null;
  allianceName?: string | null;
  guildId?: string | null;
  guildName?: string | null;
  id?: string;
}) {
  return isHomeSide(p);
}

function toListItem(battle: AlbionApiBattle): BattleListItem {
  const players = values(battle.players);
  const home = players.filter(isHomePlayer);
  const enemies = new Set<string>();
  for (const p of players) {
    if (isHomePlayer(p)) continue;
    if (p.allianceName) enemies.add(p.allianceName);
    else if (p.guildName) enemies.add(p.guildName);
  }
  return {
    id: String(battle.id),
    startTime: battle.startTime,
    endTime: battle.endTime,
    totalPlayers: players.length,
    totalKills: battle.totalKills ?? 0,
    totalFame: battle.totalFame ?? 0,
    enemies: [...enemies].slice(0, 8),
    homePlayers: home.length,
    homeKills: home.reduce((s, p) => s + (p.kills || 0), 0),
    homeFame: home.reduce((s, p) => s + (p.killFame || 0), 0),
    clusterName: battle.clusterName ?? null,
  };
}

function mockKillsForBattle(battleId: string): KillEvent[] {
  return getMockDashboard().kills.map((k, i) => ({
    ...k,
    id: `${battleId}-mock-${i}`,
    battleId,
  }));
}

export function getMockBattleList(): BattleListItem[] {
  const main = toListItem(snapshot);
  // Entradas extra para UI de filtros (sintéticas alrededor del snapshot)
  const extras: BattleListItem[] = [
    {
      id: "1430093976",
      startTime: "2026-08-08T02:37:52.072Z",
      totalPlayers: 113,
      totalKills: 63,
      totalFame: 31_611_803,
      enemies: ["1v5", "FIND"],
      homePlayers: 42,
      homeKills: 18,
      homeFame: 12_400_000,
    },
    {
      id: "1429670090",
      startTime: "2026-08-07T02:37:45.841Z",
      totalPlayers: 219,
      totalKills: 171,
      totalFame: 74_665_111,
      enemies: ["RAZE", "ASH"],
      homePlayers: 55,
      homeKills: 40,
      homeFame: 28_200_000,
    },
    {
      id: "1428394085",
      startTime: "2026-08-04T02:54:07.751Z",
      totalPlayers: 119,
      totalKills: 74,
      totalFame: 40_048_184,
      enemies: ["VOID", "NEXUS"],
      homePlayers: 38,
      homeKills: 22,
      homeFame: 15_800_000,
    },
  ];
  return [main, ...extras].sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
}

export function getMockBattleDetail(battleId?: string): BattleDetail {
  const id = battleId || String(BATTLE_EXAMPLE_ID);
  const battle = snapshot;
  const rawPlayers = values(battle.players);
  const rawGuilds = values(battle.guilds);
  const rawAlliances = values(battle.alliances);

  const players: BattlePlayerRow[] = rawPlayers
    .map((p) => ({
      id: p.id,
      name: p.name,
      guildName: p.guildName,
      allianceName: p.allianceName,
      kills: p.kills || 0,
      deaths: p.deaths || 0,
      fame: p.killFame || 0,
      damage: 0,
      heal: 0,
      ip: null,
      isHome: isHomePlayer(p),
    }))
    .sort((a, b) => b.fame - a.fame || b.kills - a.kills);

  // Demo stats para MVP cards (el API de battle no trae dmg/heal)
  const homePlayers = players.filter((p) => p.isHome);
  if (homePlayers[0]) homePlayers[0].damage = 3800;
  if (homePlayers[1]) homePlayers[1].heal = 189700;
  const enemyTop = players.find((p) => !p.isHome && p.kills > 0);
  if (enemyTop) enemyTop.damage = Math.max(enemyTop.damage, 2500);

  const guilds: BattleGuildRow[] = rawGuilds
    .map((g) => ({
      id: g.id,
      name: g.name,
      alliance: g.alliance || "—",
      players: rawPlayers.filter((p) => p.guildId === g.id).length,
      kills: g.kills || 0,
      deaths: g.deaths || 0,
      fame: g.killFame || 0,
      avgIp: null,
      isHome: isHomePlayer({
        allianceId: g.allianceId,
        allianceName: g.alliance,
        guildId: g.id,
        guildName: g.name,
      }),
    }))
    .sort((a, b) => b.fame - a.fame);

  const alliances: BattleAllianceRow[] = rawAlliances
    .map((a) => ({
      id: a.id,
      name: a.name,
      players: rawPlayers.filter((p) => p.allianceId === a.id).length,
      kills: a.kills || 0,
      deaths: a.deaths || 0,
      fame: a.killFame || 0,
      avgIp: a.name === "NULLE" ? 1570 : a.name === "1v5" ? 1562 : null,
      isHome: a.name?.toUpperCase() === HOME_ALLIANCE_NAME,
    }))
    .sort((a, b) => b.fame - a.fame);

  const kills = mockKillsForBattle(id).map((k) => ({
    ...k,
    lootedBy: k.lootable.map((item) => ({
      playerName: k.killer.name,
      guildName: k.killer.guildName,
      allianceName: k.killer.allianceName ?? null,
      item,
    })),
  }));

  const lootClaims: LootClaim[] = kills.flatMap((k) => [
    ...k.lootable.map((item, idx) => {
      const tier = Number(item.tierLabel.match(/T(\d+)/)?.[1] || 4);
      const enchant = Number(item.tierLabel.split(".")[1] || 0);
      return {
        id: `${k.id}-loot-${idx}`,
        playerName: k.killer.name,
        guildName: k.killer.guildName,
        allianceName: k.killer.allianceName ?? null,
        item,
        estimatedSilver: Math.round(
          80_000 * tier * (1 + enchant) * (item.quality || 1) * (item.count || 1),
        ),
        killEventId: k.id,
        timestamp: k.timestamp,
        victimName: k.victim.name,
        kind: "lootable" as const,
      };
    }),
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

  const byKills = [...players].sort((a, b) => b.kills - a.kills);
  const byDmg = [...players].sort((a, b) => b.damage - a.damage);
  const byHeal = [...players].sort((a, b) => b.heal - a.heal);
  const byDeathFame = [...players].filter((p) => p.deaths > 0).sort((a, b) => b.fame - a.fame);

  return {
    id: String(battle.id) === id ? String(battle.id) : id,
    startTime: battle.startTime,
    endTime: battle.endTime,
    totalPlayers: rawPlayers.length,
    totalKills: battle.totalKills,
    totalFame: battle.totalFame,
    clusterName: battle.clusterName ?? null,
    alliances,
    guilds,
    players,
    mvp: {
      topKills: byKills[0] ?? null,
      topFame: byDeathFame[0] ?? null,
      topDamage: byDmg.find((p) => p.damage > 0) ?? null,
      topHeal: byHeal.find((p) => p.heal > 0) ?? null,
    },
    kills,
    lootClaims,
    homeAlliance: HOME_ALLIANCE_NAME,
    homeGuild: HOME_GUILD_NAME,
    leaderName: LEADER_NAME,
    source: "mock",
    lastUpdated: new Date().toISOString(),
  };
}
