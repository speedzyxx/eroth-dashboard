/** Identidad del grupo liderado por moropotopoo (Américas / West). */
export const LEADER_NAME = "moropotopoo";
export const LEADER_PLAYER_ID = "SnGWWjKCTR60zRmmsRWuxQ";

/** Guild home del líder — la marca de la app sigue siendo Eroth */
export const HOME_GUILD_NAME = "Eroth";
export const HOME_GUILD_ID = "_ETEQ8jSQsyE-nFMXdqLGA";

/** Alianza con la que pelea el grupo (no solo Eroth) */
export const HOME_ALLIANCE_NAME = "NULLE";
export const HOME_ALLIANCE_ID = "AnLmqVpoS3Ccvjl-qxGqhw";

export const BATTLE_EXAMPLE_ID = 1430146909;

/** ¿Juega con moropotopoo? (alianza NULLE, Eroth, o el líder) */
export function isHomeSide(p: {
  allianceId?: string | null;
  allianceName?: string | null;
  guildId?: string | null;
  guildName?: string | null;
  id?: string | null;
}): boolean {
  if (p.id && p.id === LEADER_PLAYER_ID) return true;
  if (p.allianceId && p.allianceId === HOME_ALLIANCE_ID) return true;
  if (p.allianceName?.toUpperCase() === HOME_ALLIANCE_NAME) return true;
  if (p.guildId && p.guildId === HOME_GUILD_ID) return true;
  if (p.guildName?.toLowerCase() === HOME_GUILD_NAME.toLowerCase()) return true;
  return false;
}
