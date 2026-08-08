/**
 * Cliente para la Gameinfo API de Albion Online (killboard no oficial).
 *
 * Endpoints útiles (casi tiempo real, ~1–2 min de delay típico):
 * - GET /events?limit=&offset=          → kills recientes globales
 * - GET /events/{id}                    → detalle de kill + equipo + inventario
 * - GET /search?q=                      → jugadores / gremios
 * - GET /guilds/{id}                    → info gremio
 * - GET /guilds/{id}/members            → roster
 * - GET /guilds/{id}/top?range=week     → top kills del gremio
 * - GET /players/{id}/kills|deaths      → historial por jugador
 * - GET /battles?range=day&sort=recent  → batallas ZvZ
 *
 * Servidores:
 * - americas → gameinfo.albiononline.com
 * - europe   → gameinfo-ams.albiononline.com
 * - asia     → gameinfo-sgp.albiononline.com
 *
 * Alternativas / complementos:
 * - render.albiononline.com → íconos de ítems (oficial)
 * - albion-online-data.com  → precios de mercado (no killboard)
 * - MurderLedger / AO West  → frontends; misma Gameinfo por detrás
 */

import {
  getConfiguredGuildId,
  getServer,
  GUILD_NAME,
  PARTY_SIZE,
  SERVER_BASE,
} from "@/lib/config";
import { makeItem, prettyItemName, sanitizeItemType, tierLabelFromType, isNonDropLootItem } from "@/lib/format";
import { getMockDashboard } from "@/data/mockDashboard";
import type {
  AlbionApiEvent,
  AlbionApiItem,
  AlbionApiPlayer,
  AlbionServer,
  DashboardData,
  EquipmentItem,
  EquipmentSlot,
  KillEvent,
  PartyMemberStats,
  PlayerRef,
  SessionSummary,
} from "@/types/albion";

const DEFAULT_TIMEOUT_MS = 12_000;

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
      // Killboard se actualiza con frecuencia; no cachear agresivo en server
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Albion API ${res.status}: ${url}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Búsqueda de jugadores/gremios */
export async function searchAlbion(query: string, server?: AlbionServer) {
  return fetchJson<{
    guilds: { Id: string; Name: string; AllianceId?: string; AllianceName?: string }[];
    players: { Id: string; Name: string; GuildId?: string; GuildName?: string }[];
  }>(`/search?q=${encodeURIComponent(query)}`, server);
}

/** Resuelve el ID del gremio Eroth si no está en env */
export async function resolveGuildId(
  name = GUILD_NAME,
  server?: AlbionServer,
): Promise<string | null> {
  const configured = getConfiguredGuildId();
  if (configured) return configured;

  const result = await searchAlbion(name, server);
  const exact = result.guilds.find((g) => g.Name.toLowerCase() === name.toLowerCase());
  return exact?.Id ?? result.guilds[0]?.Id ?? null;
}

/** Kills recientes globales */
export async function getRecentEvents(limit = 50, offset = 0, server?: AlbionServer) {
  return fetchJson<AlbionApiEvent[]>(`/events?limit=${limit}&offset=${offset}`, server);
}

/** Detalle de un event (incluye Inventory completo) */
export async function getEventById(eventId: string | number, server?: AlbionServer) {
  return fetchJson<AlbionApiEvent>(`/events/${eventId}`, server);
}

/** Top kills del gremio */
export async function getGuildTopKills(
  guildId: string,
  range: "week" | "lastWeek" | "month" | "lastMonth" = "week",
  limit = 20,
  server?: AlbionServer,
) {
  return fetchJson<AlbionApiEvent[]>(
    `/guilds/${guildId}/top?range=${range}&limit=${limit}&offset=0`,
    server,
  );
}

/** Miembros del gremio */
export async function getGuildMembers(guildId: string, server?: AlbionServer) {
  return fetchJson<AlbionApiPlayer[]>(`/guilds/${guildId}/members`, server);
}

function mapPlayer(p: AlbionApiPlayer): PlayerRef {
  return {
    id: p.Id,
    name: p.Name,
    guildId: p.GuildId,
    guildName: p.GuildName,
    allianceName: p.AllianceName ?? null,
  };
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
  const slots: EquipmentSlot[] = [
    "Head",
    "Armor",
    "Shoes",
    "MainHand",
    "OffHand",
    "Cape",
    "Bag",
    "Mount",
    "Potion",
    "Food",
  ];
  const out: KillEvent["victimEquipment"] = {};
  for (const slot of slots) {
    out[slot] = mapApiItem(equipment[slot] ?? null);
  }
  return out;
}

/**
 * Inventory = lootable; soulbound (NONTRADABLE) = bound; resto equipo = trash.
 */
function splitLoot(victim: AlbionApiPlayer): {
  lootable: EquipmentItem[];
  trash: EquipmentItem[];
  bound: EquipmentItem[];
} {
  const inventoryAll = (victim.Inventory ?? [])
    .map(mapApiItem)
    .filter((i): i is EquipmentItem => Boolean(i));

  const lootable: EquipmentItem[] = [];
  const bound: EquipmentItem[] = [];
  for (const item of inventoryAll) {
    if (isNonDropLootItem(item.type)) bound.push(item);
    else lootable.push(item);
  }

  const remaining = new Map<string, number>();
  for (const item of lootable) {
    remaining.set(item.type, (remaining.get(item.type) || 0) + (item.count || 1));
  }

  const slots: EquipmentSlot[] = [
    "Head",
    "Armor",
    "Shoes",
    "MainHand",
    "OffHand",
    "Cape",
    "Bag",
    "Mount",
    "Potion",
    "Food",
  ];
  const trash: EquipmentItem[] = [];
  for (const slot of slots) {
    const eq = mapApiItem(victim.Equipment?.[slot] ?? null);
    if (!eq) continue;
    const left = remaining.get(eq.type) || 0;
    if (left > 0) remaining.set(eq.type, left - 1);
    else trash.push(eq);
  }

  return { lootable, trash, bound };
}

export function mapApiEventToKill(event: AlbionApiEvent): KillEvent {
  const { lootable, trash, bound } = splitLoot(event.Victim);
  return {
    id: String(event.EventId),
    timestamp: event.TimeStamp,
    killer: mapPlayer(event.Killer),
    victim: mapPlayer(event.Victim),
    fame: event.TotalVictimKillFame ?? 0,
    totalDamage: event.Killer.DamageDone ?? 0,
    location: event.Location || "Unknown",
    victimEquipment: mapEquipment(event.Victim.Equipment),
    lootable,
    trash,
    bound,
    participants: event.Participants?.length ?? event.groupMemberCount,
  };
}

/** Filtra events donde el killer pertenece al gremio */
export function filterGuildKills(events: AlbionApiEvent[], guildId: string, guildName?: string) {
  const nameLower = guildName?.toLowerCase();
  return events.filter((e) => {
    if (e.Killer.GuildId && e.Killer.GuildId === guildId) return true;
    if (nameLower && e.Killer.GuildName?.toLowerCase() === nameLower) return true;
    return false;
  });
}

function buildPartyFromKills(kills: KillEvent[], members?: AlbionApiPlayer[]): PartyMemberStats[] {
  const map = new Map<string, PartyMemberStats>();

  for (const k of kills) {
    const existing = map.get(k.killer.id) ?? {
      id: k.killer.id,
      name: k.killer.name,
      kills: 0,
      deaths: 0,
      assistFame: 0,
      lootValue: 0,
      damage: 0,
      isOnline: true,
    };
    existing.kills += 1;
    existing.assistFame += k.fame;
    existing.damage += k.totalDamage;
    // Estimación burda de valor de loot (API no da silver)
    existing.lootValue += k.lootable.length * 750_000;
    map.set(k.killer.id, existing);
  }

  if (members?.length) {
    for (const m of members.slice(0, PARTY_SIZE)) {
      if (!map.has(m.Id)) {
        map.set(m.Id, {
          id: m.Id,
          name: m.Name,
          kills: 0,
          deaths: 0,
          assistFame: 0,
          lootValue: 0,
          damage: 0,
          isOnline: false,
        });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.kills - a.kills || b.assistFame - a.assistFame)
    .slice(0, PARTY_SIZE);
}

/**
 * Carga el dashboard en vivo filtrando kills del gremio.
 * Si falla la red/API, el caller debería caer a mock.
 */
export async function fetchLiveDashboard(options?: {
  server?: AlbionServer;
  guildName?: string;
  limit?: number;
}): Promise<DashboardData> {
  const server = options?.server ?? getServer();
  const guildName = options?.guildName ?? GUILD_NAME;
  const limit = options?.limit ?? 80;

  const guildId = await resolveGuildId(guildName, server);
  if (!guildId) {
    throw new Error(`No se encontró el gremio "${guildName}" en ${server}`);
  }

  // Preferir top del gremio (más relevante) + recientes como respaldo
  let raw: AlbionApiEvent[] = [];
  try {
    raw = await getGuildTopKills(guildId, "week", Math.min(limit, 50), server);
  } catch {
    const recent = await getRecentEvents(limit, 0, server);
    raw = filterGuildKills(recent, guildId, guildName);
  }

  // Enriquecer con detalle si el listado no trae Inventory
  const detailed = await Promise.all(
    raw.slice(0, 12).map(async (ev) => {
      try {
        return await getEventById(ev.EventId, server);
      } catch {
        return ev;
      }
    }),
  );

  const kills = detailed.map(mapApiEventToKill);
  let members: AlbionApiPlayer[] | undefined;
  try {
    members = await getGuildMembers(guildId, server);
  } catch {
    members = undefined;
  }

  const party = buildPartyFromKills(kills, members);
  const summary: SessionSummary = {
    sessionId: `live-${guildId}`,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    kills: party.reduce((s, p) => s + p.kills, 0),
    deaths: party.reduce((s, p) => s + p.deaths, 0),
    fame: kills.reduce((s, k) => s + k.fame, 0),
    lootValueSilver: party.reduce((s, p) => s + p.lootValue, 0),
    activeSlots: Math.min(party.filter((p) => p.kills > 0).length || party.length, PARTY_SIZE),
    maxSlots: PARTY_SIZE,
    guildName,
    guildTag: "EROTH",
  };

  return {
    summary,
    kills,
    lootClaims: kills.flatMap((k) => [
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
    ]),
    party,
    source: "live",
    lastUpdated: new Date().toISOString(),
  };
}

/** API unificada: live con fallback a mock */
export async function loadDashboard(preferLive: boolean): Promise<DashboardData> {
  if (!preferLive) return getMockDashboard();

  try {
    return await fetchLiveDashboard();
  } catch (err) {
    console.warn("[albionApi] Live fetch failed, using mock:", err);
    const mock = getMockDashboard();
    return { ...mock, source: "mock" };
  }
}

/** Helper exportado para UI de ítems sueltos */
export { makeItem };
