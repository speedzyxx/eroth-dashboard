/**
 * Batallas del grupo de moropotopoo (Eroth + alianza NULLE).
 *
 * Fuentes Gameinfo (Américas):
 * - GET /guilds/{erothId}/battles?range=week
 * - GET /battles/{id}
 * - GET /players/{id}/kills|deaths  (filtrar por BattleId)
 * - GET /events/{id}                (detalle + inventario loot)
 */

import {
  getConfiguredGuildId,
  getServer,
  SERVER_BASE,
} from "@/lib/config";
import {
  HOME_ALLIANCE_ID,
  HOME_ALLIANCE_NAME,
  HOME_GUILD_NAME,
  LEADER_NAME,
  isHomeSide,
} from "@/lib/roster";
import {
  prettyItemName,
  sanitizeItemType,
  tierLabelFromType,
} from "@/lib/format";
import type {
  AlbionApiBattle,
  AlbionApiBattlePlayer,
  AlbionApiEvent,
  AlbionApiItem,
  AlbionApiPlayer,
  AlbionServer,
  BattleAllianceRow,
  BattleDetail,
  BattleGuildRow,
  BattleListItem,
  BattlePlayerRow,
  EquipmentItem,
  EquipmentSlot,
  KillEvent,
  LootClaim,
  PlayerRef,
} from "@/types/albion";

const DEFAULT_TIMEOUT_MS = 18_000;

function baseUrl(server?: AlbionServer): string {
  return SERVER_BASE[server ?? getServer()];
}

async function fetchJson<T>(path: string, server?: AlbionServer): Promise<T> {
  const url = `${baseUrl(server)}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 45 },
    });
    if (!res.ok) throw new Error(`Albion API ${res.status}: ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function values<T>(record: Record<string, T> | undefined | null): T[] {
  if (!record) return [];
  return Object.values(record);
}

export function isHomePlayer(p: {
  allianceId?: string | null;
  allianceName?: string | null;
  guildId?: string | null;
  guildName?: string | null;
  id?: string;
}): boolean {
  if (isHomeSide(p)) return true;
  // Env override del guild id
  if (p.guildId && p.guildId === getConfiguredGuildId()) return true;
  return false;
}

function playerCount(battle: AlbionApiBattle): number {
  return values(battle.players).length;
}

function mapListItem(battle: AlbionApiBattle): BattleListItem {
  const players = values(battle.players);
  const home = players.filter(isHomePlayer);
  const enemyAlliances = new Set<string>();
  const enemyGuilds = new Set<string>();

  for (const p of players) {
    if (isHomePlayer(p)) continue;
    if (p.allianceName) enemyAlliances.add(p.allianceName);
    else if (p.guildName) enemyGuilds.add(p.guildName);
  }

  const enemies = [...enemyAlliances, ...enemyGuilds].slice(0, 8);

  return {
    id: String(battle.id),
    startTime: battle.startTime,
    endTime: battle.endTime,
    totalPlayers: playerCount(battle),
    totalKills: battle.totalKills ?? 0,
    totalFame: battle.totalFame ?? 0,
    enemies: enemies.length ? enemies : ["—"],
    homePlayers: home.length,
    homeKills: home.reduce((s, p) => s + (p.kills || 0), 0),
    homeFame: home.reduce((s, p) => s + (p.killFame || 0), 0),
    clusterName: battle.clusterName ?? null,
  };
}

/** Lista de batallas recientes del guild Eroth (grupo del líder). */
export async function listHomeBattles(options?: {
  range?: "day" | "week" | "month";
  limit?: number;
  offset?: number;
  minPlayers?: number;
  minHomePlayers?: number;
  server?: AlbionServer;
}): Promise<BattleListItem[]> {
  const guildId = getConfiguredGuildId();
  const range = options?.range ?? "week";
  const limit = options?.limit ?? 25;
  const offset = options?.offset ?? 0;
  const raw = await fetchJson<AlbionApiBattle[]>(
    `/guilds/${guildId}/battles?range=${range}&offset=${offset}&limit=${limit}`,
    options?.server,
  );

  return raw
    .map(mapListItem)
    .filter((b) => b.totalPlayers >= (options?.minPlayers ?? 1))
    .filter((b) => b.homePlayers >= (options?.minHomePlayers ?? 1))
    .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
}

export async function getBattleRaw(
  battleId: string | number,
  server?: AlbionServer,
): Promise<AlbionApiBattle> {
  return fetchJson<AlbionApiBattle>(`/battles/${battleId}`, server);
}

function mapApiItem(item: AlbionApiItem | null | undefined): EquipmentItem | null {
  if (!item?.Type) return null;
  const type = sanitizeItemType(item.Type);
  return {
    type,
    count: item.Count ?? 1,
    quality: item.Quality ?? 1,
    tierLabel: tierLabelFromType(type),
    name: prettyItemName(type),
  };
}

function mapEquipment(
  equipment?: AlbionApiPlayer["Equipment"],
): KillEvent["victimEquipment"] {
  if (!equipment) return {};
  const slots: EquipmentSlot[] = ["Head", "Armor", "Shoes", "MainHand", "OffHand", "Cape", "Bag"];
  const out: KillEvent["victimEquipment"] = {};
  for (const slot of slots) {
    out[slot] = mapApiItem(equipment[slot] ?? null);
  }
  return out;
}

function splitLoot(victim: AlbionApiPlayer): {
  lootable: EquipmentItem[];
  trash: EquipmentItem[];
} {
  const inventory = (victim.Inventory ?? [])
    .map(mapApiItem)
    .filter((i): i is EquipmentItem => Boolean(i));

  const equipped = Object.values(victim.Equipment ?? {})
    .map(mapApiItem)
    .filter((i): i is EquipmentItem => Boolean(i));

  const lootTypes = new Set(inventory.map((i) => i.type));
  const trash = equipped.filter((i) => !lootTypes.has(i.type));
  return { lootable: inventory, trash };
}

function mapPlayerRef(p: AlbionApiPlayer): PlayerRef {
  return {
    id: p.Id,
    name: p.Name,
    guildId: p.GuildId,
    guildName: p.GuildName,
    allianceName: p.AllianceName ?? null,
  };
}

export function mapApiEventToKill(event: AlbionApiEvent): KillEvent {
  const { lootable, trash } = splitLoot(event.Victim);
  const killerGuild = event.Killer.GuildName ?? null;
  const killerAlliance = event.Killer.AllianceName ?? null;
  return {
    id: String(event.EventId),
    battleId: event.BattleId != null ? String(event.BattleId) : undefined,
    timestamp: event.TimeStamp,
    killer: mapPlayerRef(event.Killer),
    victim: mapPlayerRef(event.Victim),
    fame: event.TotalVictimKillFame ?? 0,
    totalDamage: event.Killer.DamageDone ?? 0,
    location: event.Location || "Battle",
    victimEquipment: mapEquipment(event.Victim.Equipment),
    lootable,
    trash,
    // Un registro por cada pieza lootable (quién mató = quién tiene prioridad de loot)
    lootedBy: lootable.map((item) => ({
      playerName: event.Killer.Name,
      guildName: killerGuild,
      allianceName: killerAlliance,
      item,
    })),
    participants: event.Participants?.length ?? event.numberOfParticipants,
  };
}

async function getPlayerEvents(
  playerId: string,
  kind: "kills" | "deaths",
  server?: AlbionServer,
): Promise<AlbionApiEvent[]> {
  try {
    return await fetchJson<AlbionApiEvent[]>(
      `/players/${playerId}/${kind}?offset=0&limit=50`,
      server,
    );
  } catch {
    return [];
  }
}

async function enrichEvent(
  event: AlbionApiEvent,
  server?: AlbionServer,
): Promise<AlbionApiEvent> {
  const hasInv = (event.Victim.Inventory?.length ?? 0) > 0;
  const hasEquip = Boolean(event.Victim.Equipment?.MainHand || event.Victim.Equipment?.Armor);
  if (hasInv && hasEquip) return event;
  try {
    return await fetchJson<AlbionApiEvent>(`/events/${event.EventId}`, server);
  } catch {
    return event;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await worker(items[current]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => run()),
  );
  return results;
}

/**
 * Carga kills/deaths de la batalla:
 * todos los jugadores con actividad, en lotes (evita 504 del Gameinfo).
 */
export async function fetchBattleKillEvents(
  battle: AlbionApiBattle,
  server?: AlbionServer,
): Promise<KillEvent[]> {
  const battleId = String(battle.id);
  const players = values(battle.players);

  const candidates = players
    .filter((p) => (p.kills || 0) > 0 || (p.deaths || 0) > 0)
    .sort((a, b) => {
      const aHome = isHomePlayer(a) ? 1 : 0;
      const bHome = isHomePlayer(b) ? 1 : 0;
      if (aHome !== bHome) return bHome - aHome;
      return b.kills + b.deaths - (a.kills + a.deaths);
    });

  const byId = new Map<number, AlbionApiEvent>();

  await mapPool(candidates, 6, async (p) => {
    const tasks: Promise<AlbionApiEvent[]>[] = [];
    if (p.kills > 0) tasks.push(getPlayerEvents(p.id, "kills", server));
    if (p.deaths > 0) tasks.push(getPlayerEvents(p.id, "deaths", server));
    const batches = await Promise.all(tasks);
    for (const list of batches) {
      for (const ev of list) {
        if (String(ev.BattleId) === battleId) {
          byId.set(ev.EventId, ev);
        }
      }
    }
  });

  try {
    const seed = await fetchJson<AlbionApiEvent>(`/events/${battleId}`, server);
    if (String(seed.BattleId) === battleId || seed.EventId === Number(battleId)) {
      byId.set(seed.EventId, seed);
    }
  } catch {
    // ignore
  }

  const eventList = [...byId.values()];
  await mapPool(eventList, 8, async (ev) => {
    const rich = await enrichEvent(ev, server);
    byId.set(rich.EventId, rich);
    return rich;
  });

  return [...byId.values()]
    .map(mapApiEventToKill)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

function estimateSilver(item: EquipmentItem): number {
  const tier = Number(item.tierLabel.match(/T(\d+)/)?.[1] || 4);
  const enchant = Number(item.tierLabel.split(".")[1] || 0);
  return Math.round(80_000 * tier * (1 + enchant) * (item.quality || 1) * (item.count || 1));
}

/** Ledger completo de la pelea: cada lootable + trash de cada kill */
function buildClaims(kills: KillEvent[]): LootClaim[] {
  const claims: LootClaim[] = [];
  for (const k of kills) {
    for (const [idx, item] of k.lootable.entries()) {
      claims.push({
        id: `${k.id}-loot-${idx}`,
        playerName: k.killer.name,
        guildName: k.killer.guildName,
        allianceName: k.killer.allianceName ?? null,
        item,
        estimatedSilver: estimateSilver(item),
        killEventId: k.id,
        timestamp: k.timestamp,
        victimName: k.victim.name,
        kind: "lootable",
      });
    }
    for (const [idx, item] of k.trash.entries()) {
      claims.push({
        id: `${k.id}-trash-${idx}`,
        playerName: k.killer.name,
        guildName: k.killer.guildName,
        allianceName: k.killer.allianceName ?? null,
        item,
        estimatedSilver: 0,
        killEventId: k.id,
        timestamp: k.timestamp,
        victimName: k.victim.name,
        kind: "trash",
      });
    }
  }
  return claims.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "lootable" ? -1 : 1;
    return b.estimatedSilver - a.estimatedSilver || +new Date(b.timestamp) - +new Date(a.timestamp);
  });
}

function avgIpForGuild(
  players: AlbionApiBattlePlayer[],
  guildId: string,
): number | null {
  // IP no viene en battle summary; se rellena luego desde events si hay
  void players;
  void guildId;
  return null;
}

function toPlayerRow(
  p: AlbionApiBattlePlayer,
  extras?: { damage?: number; heal?: number; ip?: number; weaponType?: string },
): BattlePlayerRow {
  return {
    id: p.id,
    name: p.name,
    guildName: p.guildName,
    allianceName: p.allianceName,
    kills: p.kills || 0,
    deaths: p.deaths || 0,
    fame: p.killFame || 0,
    damage: extras?.damage ?? 0,
    heal: extras?.heal ?? 0,
    ip: extras?.ip ?? null,
    weaponType: extras?.weaponType ?? null,
    isHome: isHomePlayer(p),
  };
}

function mergeEventStats(
  players: BattlePlayerRow[],
  kills: KillEvent[],
  rawEvents: AlbionApiEvent[],
): BattlePlayerRow[] {
  const dmg = new Map<string, number>();
  const heal = new Map<string, number>();
  const ip = new Map<string, number>();
  const weapon = new Map<string, string>();

  for (const ev of rawEvents) {
    for (const part of ev.Participants ?? [ev.Killer]) {
      if (!part?.Id) continue;
      dmg.set(part.Id, (dmg.get(part.Id) || 0) + (part.DamageDone || 0));
      heal.set(part.Id, (heal.get(part.Id) || 0) + (part.SupportHealingDone || 0));
      if (part.AverageItemPower) ip.set(part.Id, part.AverageItemPower);
      const w = part.Equipment?.MainHand?.Type;
      if (w) weapon.set(part.Id, w);
    }
  }

  // Fallback damage from mapped kills
  for (const k of kills) {
    if (k.totalDamage) {
      dmg.set(k.killer.id, Math.max(dmg.get(k.killer.id) || 0, k.totalDamage));
    }
  }

  return players.map((p) => ({
    ...p,
    damage: dmg.get(p.id) || p.damage,
    heal: heal.get(p.id) || p.heal,
    ip: ip.get(p.id) ?? p.ip,
    weaponType: weapon.get(p.id) ?? p.weaponType,
  }));
}

export async function fetchBattleDetail(
  battleId: string | number,
  server?: AlbionServer,
): Promise<BattleDetail> {
  const battle = await getBattleRaw(battleId, server);
  const rawPlayers = values(battle.players);
  const rawGuilds = values(battle.guilds);
  const rawAlliances = values(battle.alliances);

  let killEvents: KillEvent[] = [];
  let rawKillEvents: AlbionApiEvent[] = [];
  try {
    killEvents = await fetchBattleKillEvents(battle, server);
    // Re-fetch raw for participant stats (best-effort)
    rawKillEvents = await Promise.all(
      killEvents.slice(0, 20).map(async (k) => {
        try {
          return await fetchJson<AlbionApiEvent>(`/events/${k.id}`, server);
        } catch {
          return null as unknown as AlbionApiEvent;
        }
      }),
    ).then((list) => list.filter(Boolean));
  } catch (err) {
    console.warn("[battleService] kills fetch failed", err);
  }

  let players = rawPlayers
    .map((p) => toPlayerRow(p))
    .sort((a, b) => b.fame - a.fame || b.kills - a.kills);

  players = mergeEventStats(players, killEvents, rawKillEvents);

  const guilds: BattleGuildRow[] = rawGuilds
    .map((g) => {
      const gPlayers = rawPlayers.filter((p) => p.guildId === g.id);
      return {
        id: g.id,
        name: g.name,
        alliance: g.alliance || "—",
        players: gPlayers.length,
        kills: g.kills || 0,
        deaths: g.deaths || 0,
        fame: g.killFame || 0,
        avgIp: avgIpForGuild(rawPlayers, g.id),
        isHome: isHomePlayer({
          allianceId: g.allianceId,
          allianceName: g.alliance,
          guildId: g.id,
          guildName: g.name,
        }),
      };
    })
    .sort((a, b) => b.fame - a.fame);

  const alliances: BattleAllianceRow[] = rawAlliances
    .map((a) => {
      const aPlayers = rawPlayers.filter((p) => p.allianceId === a.id);
      const ips = aPlayers
        .map((p) => players.find((x) => x.id === p.id)?.ip)
        .filter((n): n is number => typeof n === "number" && n > 0);
      const avgIp = ips.length ? Math.round(ips.reduce((s, n) => s + n, 0) / ips.length) : null;
      return {
        id: a.id,
        name: a.name,
        players: aPlayers.length,
        kills: a.kills || 0,
        deaths: a.deaths || 0,
        fame: a.killFame || 0,
        avgIp,
        isHome: a.id === HOME_ALLIANCE_ID || a.name?.toUpperCase() === HOME_ALLIANCE_NAME,
      };
    })
    .sort((a, b) => b.fame - a.fame);

  // Jugadores sin alianza también cuentan en tablas vía guilds

  const byKills = [...players].sort((a, b) => b.kills - a.kills || b.fame - a.fame);
  const byFameDeath = [...players].filter((p) => p.deaths > 0).sort((a, b) => b.fame - a.fame);
  const byDmg = [...players].sort((a, b) => b.damage - a.damage);
  const byHeal = [...players].sort((a, b) => b.heal - a.heal);

  // Fix sort bug in killEvents - I used a.startTime incorrectly
  killEvents = killEvents.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return {
    id: String(battle.id),
    startTime: battle.startTime,
    endTime: battle.endTime,
    totalPlayers: rawPlayers.length,
    totalKills: battle.totalKills ?? 0,
    totalFame: battle.totalFame ?? 0,
    clusterName: battle.clusterName ?? null,
    alliances,
    guilds,
    players,
    mvp: {
      topKills: byKills[0] ?? null,
      topFame: byFameDeath[0] ?? byKills[0] ?? null,
      topDamage: byDmg.find((p) => p.damage > 0) ?? null,
      topHeal: byHeal.find((p) => p.heal > 0) ?? null,
    },
    kills: killEvents,
    lootClaims: buildClaims(killEvents),
    homeAlliance: HOME_ALLIANCE_NAME,
    homeGuild: HOME_GUILD_NAME,
    leaderName: LEADER_NAME,
    source: "live",
    lastUpdated: new Date().toISOString(),
  };
}
