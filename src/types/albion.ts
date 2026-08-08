/** Tipos de dominio — batallas + loot (grupo moropotopoo / NULLE). */

export type AlbionServer = "americas" | "europe" | "asia";

export type EquipmentSlot =
  | "Head"
  | "Armor"
  | "Shoes"
  | "MainHand"
  | "OffHand"
  | "Cape"
  | "Bag"
  | "Mount"
  | "Potion"
  | "Food";

export interface EquipmentItem {
  type: string;
  count: number;
  quality: number;
  tierLabel: string;
  name: string;
  active?: boolean;
}

export interface PlayerRef {
  id: string;
  name: string;
  guildId: string | null;
  guildName: string | null;
  allianceName?: string | null;
  avatar?: string;
}

export interface KillEvent {
  id: string;
  battleId?: string;
  timestamp: string;
  killer: PlayerRef;
  victim: PlayerRef;
  fame: number;
  totalDamage: number;
  location: string;
  victimEquipment: Partial<Record<EquipmentSlot, EquipmentItem | null>>;
  lootable: EquipmentItem[];
  trash: EquipmentItem[];
  /** Inventario soulbound / no dropea (p.ej. Tomes NONTRADABLE) */
  bound?: EquipmentItem[];
  lootedBy?: {
    playerName: string;
    guildName?: string | null;
    allianceName?: string | null;
    item: EquipmentItem;
  }[];
  participants?: number;
}

export interface LootClaim {
  id: string;
  playerName: string;
  guildName?: string | null;
  allianceName?: string | null;
  item: EquipmentItem;
  estimatedSilver: number;
  killEventId: string;
  timestamp: string;
  /** víctima de la baja que generó el drop */
  victimName?: string;
  kind?: "lootable" | "trash" | "bound";
}

export interface PartyMemberStats {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  assistFame: number;
  lootValue: number;
  damage: number;
  heal?: number;
  ip?: number;
  /** MainHand visto en kills/deaths de la pelea */
  weaponType?: string | null;
  /** tank | healer | support | dps | unknown */
  weaponRole?: string | null;
  isOnline: boolean;
  role?: string;
  guildName?: string | null;
  allianceName?: string | null;
  isHomeSide?: boolean;
}

export interface SessionSummary {
  sessionId: string;
  startedAt: string;
  kills: number;
  deaths: number;
  fame: number;
  lootValueSilver: number;
  activeSlots: number;
  maxSlots: number;
  /** Aliados (lado home) en la pelea */
  alliesCount?: number;
  /** Enemigos en la pelea */
  enemiesCount?: number;
  /** Total participantes */
  totalPlayers?: number;
  guildName: string;
  guildTag: string;
}

export interface DashboardData {
  summary: SessionSummary;
  kills: KillEvent[];
  lootClaims: LootClaim[];
  party: PartyMemberStats[];
  source: "mock" | "live";
  lastUpdated: string;
}

export interface BattleListItem {
  id: string;
  startTime: string;
  endTime?: string;
  totalPlayers: number;
  totalKills: number;
  totalFame: number;
  /** Tags de alianzas/gremios enemigos */
  enemies: string[];
  /** Jugadores del lado home (NULLE / Eroth / aliados en pelea) */
  homePlayers: number;
  homeKills: number;
  homeFame: number;
  clusterName?: string | null;
}

export interface BattleAllianceRow {
  id: string;
  name: string;
  players: number;
  kills: number;
  deaths: number;
  fame: number;
  avgIp: number | null;
  isHome: boolean;
}

export interface BattleGuildRow {
  id: string;
  name: string;
  alliance: string;
  players: number;
  kills: number;
  deaths: number;
  fame: number;
  avgIp: number | null;
  isHome: boolean;
}

export interface BattlePlayerRow {
  id: string;
  name: string;
  guildName: string | null;
  allianceName: string | null;
  kills: number;
  deaths: number;
  fame: number;
  damage: number;
  heal: number;
  ip: number | null;
  weaponType?: string | null;
  isHome: boolean;
}

export interface BattleMvp {
  topKills: BattlePlayerRow | null;
  topFame: BattlePlayerRow | null;
  topDamage: BattlePlayerRow | null;
  topHeal: BattlePlayerRow | null;
}

export interface BattleDetail {
  id: string;
  startTime: string;
  endTime: string;
  totalPlayers: number;
  totalKills: number;
  totalFame: number;
  clusterName?: string | null;
  alliances: BattleAllianceRow[];
  guilds: BattleGuildRow[];
  players: BattlePlayerRow[];
  mvp: BattleMvp;
  kills: KillEvent[];
  lootClaims: LootClaim[];
  homeAlliance: string;
  homeGuild: string;
  leaderName: string;
  source: "mock" | "live";
  lastUpdated: string;
}

/** Forma cruda aproximada de un event de Gameinfo API */
export interface AlbionApiEvent {
  EventId: number;
  TimeStamp: string;
  TotalVictimKillFame: number;
  Location?: string;
  BattleId?: number | string;
  Killer: AlbionApiPlayer;
  Victim: AlbionApiPlayer;
  Participants?: AlbionApiPlayer[];
  groupMemberCount?: number;
  numberOfParticipants?: number;
}

export interface AlbionApiPlayer {
  Id: string;
  Name: string;
  GuildId: string | null;
  GuildName: string | null;
  AllianceId?: string | null;
  AllianceName?: string | null;
  KillFame?: number;
  DamageDone?: number;
  SupportHealingDone?: number;
  AverageItemPower?: number;
  Equipment?: {
    MainHand?: AlbionApiItem | null;
    OffHand?: AlbionApiItem | null;
    Head?: AlbionApiItem | null;
    Armor?: AlbionApiItem | null;
    Shoes?: AlbionApiItem | null;
    Cape?: AlbionApiItem | null;
    Bag?: AlbionApiItem | null;
    Mount?: AlbionApiItem | null;
    Potion?: AlbionApiItem | null;
    Food?: AlbionApiItem | null;
  };
  Inventory?: (AlbionApiItem | null)[];
}

export interface AlbionApiItem {
  Type: string;
  Count: number;
  Quality: number;
  ActiveSpells?: string[];
  PassiveSpells?: string[];
}

export interface AlbionApiBattlePlayer {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  killFame: number;
  guildName: string | null;
  guildId: string | null;
  allianceName: string | null;
  allianceId: string | null;
}

export interface AlbionApiBattleGuild {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  killFame: number;
  alliance: string | null;
  allianceId: string | null;
}

export interface AlbionApiBattleAlliance {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  killFame: number;
}

export interface AlbionApiBattle {
  id: number;
  startTime: string;
  endTime: string;
  totalFame: number;
  totalKills: number;
  clusterName?: string | null;
  players: Record<string, AlbionApiBattlePlayer>;
  guilds: Record<string, AlbionApiBattleGuild>;
  alliances: Record<string, AlbionApiBattleAlliance>;
}
