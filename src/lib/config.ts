import type { AlbionServer } from "@/types/albion";
import {
  HOME_GUILD_ID,
  HOME_GUILD_NAME,
  LEADER_NAME,
} from "@/lib/roster";

/**
 * Configuración central del dashboard.
 * Nota: la ruta correcta del killboard es `/api/gameinfo`, no `/api/albiononline`.
 */
export const GUILD_NAME = HOME_GUILD_NAME;
export const GUILD_TAG = "EROTH";
export const APP_TITLE = "Eroth — ZvZ & Small-Scale Dashboard";
export const PARTY_SIZE = 20;

export const SERVER_BASE: Record<AlbionServer, string> = {
  americas: "https://gameinfo.albiononline.com/api/gameinfo",
  europe: "https://gameinfo-ams.albiononline.com/api/gameinfo",
  asia: "https://gameinfo-sgp.albiononline.com/api/gameinfo",
};

export const ITEM_RENDER_BASE = "https://render.albiononline.com/v1/item";

export function getServer(): AlbionServer {
  const raw = (process.env.NEXT_PUBLIC_ALBION_SERVER || "americas").toLowerCase();
  if (raw === "europe" || raw === "asia" || raw === "americas") return raw;
  return "americas";
}

export function useLiveApiDefault(): boolean {
  return process.env.NEXT_PUBLIC_USE_LIVE_API !== "false";
}

export function getConfiguredGuildId(): string {
  return process.env.NEXT_PUBLIC_EROTH_GUILD_ID || HOME_GUILD_ID;
}

export const LEADER = LEADER_NAME;

export const theme = {
  bg: "#0e1217",
  panel: "#181e29",
  panelSoft: "#1e2633",
  border: "#2a3344",
  gold: "#d97706",
  goldBright: "#f59e0b",
  crimson: "#991b1b",
  crimsonBright: "#dc2626",
  success: "#16a34a",
  text: "#e8edf5",
  muted: "#8b95a8",
} as const;
