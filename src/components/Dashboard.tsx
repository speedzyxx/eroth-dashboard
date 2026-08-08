"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeaderHero } from "@/components/HeaderHero";
import { AppTabs, type AppTab } from "@/components/AppTabs";
import { LastBattles } from "@/components/LastBattles";
import { BattleDetailView } from "@/components/BattleDetailView";
import { Killboard } from "@/components/Killboard";
import { LootTracker } from "@/components/LootTracker";
import { PartyStats } from "@/components/PartyStats";
import { GathererMascot } from "@/components/GathererMascot";
import { useLiveApiDefault } from "@/lib/config";
import { BATTLE_EXAMPLE_ID, LEADER_NAME, isHomeSide } from "@/lib/roster";
import { classifyWeaponRole } from "@/lib/weaponRoles";
import { getMockBattleList } from "@/data/mockBattles";
import type {
  BattleDetail,
  BattleListItem,
  DashboardData,
  PartyMemberStats,
  SessionSummary,
} from "@/types/albion";

function battleToDashboard(battle: BattleDetail): DashboardData {
  const home = battle.players.filter((p) => p.isHome);
  const enemies = battle.players.filter((p) => !p.isHome);
  const allyLootClaims = battle.lootClaims.filter((c) => {
    if (c.kind === "trash" || c.kind === "bound") return false;
    if (
      isHomeSide({
        id: c.playerId,
        guildId: c.guildId,
        guildName: c.guildName,
        allianceId: c.allianceId,
        allianceName: c.allianceName,
      })
    ) {
      return true;
    }
    const killer = battle.players.find(
      (p) => p.id === c.playerId || p.name.toLowerCase() === c.playerName.toLowerCase(),
    );
    return Boolean(killer?.isHome);
  });
  const lootableValue = allyLootClaims.reduce((s, c) => s + c.estimatedSilver, 0);

  const party: PartyMemberStats[] = battle.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      kills: p.kills,
      deaths: p.deaths,
      assistFame: p.fame,
      lootValue: battle.lootClaims
        .filter((c) => c.playerName === p.name && c.kind !== "trash" && c.kind !== "bound")
        .reduce((s, c) => s + c.estimatedSilver, 0),
      damage: p.damage,
      heal: p.heal,
      ip: p.ip ?? undefined,
      weaponType: p.weaponType ?? null,
      weaponRole: classifyWeaponRole(p.weaponType),
      isOnline: true,
      role: p.guildName || undefined,
      guildName: p.guildName,
      allianceName: p.allianceName,
      isHomeSide: p.isHome,
    }))
    .sort((a, b) => {
      if (a.isHomeSide !== b.isHomeSide) return a.isHomeSide ? -1 : 1;
      return b.kills - a.kills || b.assistFame - a.assistFame;
    });

  const summary: SessionSummary = {
    sessionId: `battle-${battle.id}`,
    startedAt: battle.startTime,
    kills: home.reduce((s, p) => s + p.kills, 0),
    deaths: home.reduce((s, p) => s + p.deaths, 0),
    fame: home.reduce((s, p) => s + p.fame, 0),
    lootValueSilver: lootableValue,
    activeSlots: home.length,
    maxSlots: battle.totalPlayers,
    alliesCount: home.length,
    enemiesCount: enemies.length,
    totalPlayers: battle.totalPlayers || battle.players.length,
    guildName: battle.homeGuild,
    guildTag: "EROTH",
  };

  return {
    summary,
    kills: battle.kills,
    lootClaims: battle.lootClaims,
    party,
    source: battle.source,
    lastUpdated: battle.lastUpdated,
  };
}

export function Dashboard() {
  const [liveEnabled, setLiveEnabled] = useState(useLiveApiDefault);
  const [tab, setTab] = useState<AppTab>("battles");
  const [battles, setBattles] = useState<BattleListItem[]>(() => getMockBattleList());
  const [selectedId, setSelectedId] = useState<string | null>(String(BATTLE_EXAMPLE_ID));
  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minPlayers, setMinPlayers] = useState(10);
  const [minHome, setMinHome] = useState(1);
  const [manualId, setManualId] = useState("");
  const requestSeq = useRef(0);

  const activeBattle =
    battle && selectedId && String(battle.id) === String(selectedId) ? battle : null;

  const data = useMemo(
    () => (activeBattle ? battleToDashboard(activeBattle) : null),
    [activeBattle],
  );

  const loadBattles = useCallback(async (live: boolean, minP: number, minH: number) => {
    setListLoading(true);
    try {
      const res = await fetch(
        `/api/battles?live=${live ? "1" : "0"}&minPlayers=${minP}&minHome=${minH}&limit=30`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        battles: BattleListItem[];
        source: string;
        warning?: string;
      };
      setBattles(json.battles);
      if (json.warning) setError(json.warning);
    } catch (e) {
      setBattles(getMockBattleList());
      setError(e instanceof Error ? e.message : "Error cargando batallas");
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadBattle = useCallback(async (id: string, live: boolean) => {
    const seq = ++requestSeq.current;
    setSelectedId(id);
    setBattle(null);
    setDetailLoading(true);
    setEnriching(false);
    setError(null);

    try {
      // 1) Roster rápido → UI al instante
      const liteRes = await fetch(`/api/battles/${id}?live=${live ? "1" : "0"}&lite=1`, {
        cache: "no-store",
      });
      if (!liteRes.ok) {
        const body = (await liteRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `HTTP ${liteRes.status}`);
      }
      const lite = (await liteRes.json()) as BattleDetail & { warning?: string };
      if (seq !== requestSeq.current) return;
      if (String(lite.id) !== String(id)) {
        throw new Error(`Batalla incorrecta: API devolvió ${lite.id}, pedimos ${id}`);
      }
      setBattle(lite);
      setDetailLoading(false);
      if (lite.warning) setError(lite.warning);

      if (!live) return;

      // 2) Kills / loot / armas en segundo plano
      setEnriching(true);
      const fullRes = await fetch(`/api/battles/${id}?live=1`, { cache: "no-store" });
      if (seq !== requestSeq.current) return;
      if (!fullRes.ok) {
        const body = (await fullRes.json().catch(() => null)) as { error?: string } | null;
        setError(
          `${body?.error || `HTTP ${fullRes.status}`} — roster OK; reintenta kills abajo.`,
        );
        return;
      }
      const full = (await fullRes.json()) as BattleDetail & { warning?: string };
      if (seq !== requestSeq.current) return;
      if (String(full.id) !== String(id)) return;
      setBattle(full);
      if (full.warning || full.truncated) {
        setError(full.warning || "Carga parcial: priorizamos loot aliado.");
      }
    } catch (e) {
      if (seq !== requestSeq.current) return;
      // Si ya hay lite, no borrar roster
      setError(
        e instanceof Error
          ? `${e.message}`
          : "Error cargando batalla",
      );
    } finally {
      if (seq === requestSeq.current) {
        setDetailLoading(false);
        setEnriching(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBattles(liveEnabled, minPlayers, minHome);
  }, [liveEnabled, minPlayers, minHome, loadBattles]);

  useEffect(() => {
    if (selectedId) void loadBattle(selectedId, liveEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEnabled]);

  function onSelectBattle(id: string) {
    void loadBattle(id, liveEnabled);
    setTab("overview");
  }

  function onManualLoad() {
    const id = manualId.trim();
    if (!/^\d+$/.test(id)) {
      setError("Battle ID inválido");
      return;
    }
    onSelectBattle(id);
  }

  function goTab(next: AppTab) {
    if (next !== "battles" && !activeBattle && !detailLoading) {
      setError("Primero elige una batalla en la pestaña Batallas.");
      setTab("battles");
      return;
    }
    setTab(next);
  }

  const detailReady = Boolean(activeBattle) && !detailLoading;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b0c10]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(217,119,6,0.10),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(153,27,27,0.08),_transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13 12h2v1h-1v1h-1v-1h-1v-1h1zm0-12h2v1h-1v1h-1V1h-1V0h1zM0 12h2v1H1v1H0v-1h0v-1zm0-12h2v1H1v1H0V1h0V0h0z' fill='%2394a3b8' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <GathererMascot />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {data && (
          <HeaderHero
            summary={data.summary}
            source={data.source}
            lastUpdated={data.lastUpdated}
            liveEnabled={liveEnabled}
            loading={listLoading || detailLoading || enriching}
            onToggleLive={() => setLiveEnabled((v) => !v)}
          />
        )}

        <p className="relative z-10 mt-3 text-xs text-[#8b95a8]">
          Grupo de <span className="font-semibold text-[#f59e0b]">{LEADER_NAME}</span>
          {" — "}Eroth + alianza <span className="text-white">NULLE</span>. Usa las pestañas para
          navegar.
          {selectedId ? (
            <span className="ml-2 text-[#6b7280]">
              Batalla activa: <span className="text-[#f59e0b]">{selectedId}</span>
            </span>
          ) : null}
        </p>

        <AppTabs active={tab} onChange={goTab} battleLabel={selectedId} />

        {enriching && activeBattle && (
          <div className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
            <span>
              Cargando kills, loot y armas… Resumen y roster ya listos. Priorizamos kills
              aliadas.
            </span>
          </div>
        )}

        {error && (
          <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <p>{error}</p>
            {selectedId && (
              <button
                type="button"
                onClick={() => void loadBattle(selectedId, liveEnabled)}
                className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-100 hover:bg-amber-500/25"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        <div className="relative z-10">
          {tab === "battles" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#2a3344] bg-[#16181d] p-3">
                <label className="text-[11px] text-[#8b95a8]">
                  Battle ID directo
                  <input
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="1430146909"
                    className="mt-1 block w-44 rounded-md border border-[#2a3344] bg-[#0f1218] px-2 py-1.5 text-sm text-white outline-none focus:border-[#d97706]/50"
                  />
                </label>
                <button
                  type="button"
                  onClick={onManualLoad}
                  className="rounded-md border border-[#d97706]/40 bg-[#d97706]/15 px-3 py-1.5 text-xs font-semibold text-[#f59e0b] hover:bg-[#d97706]/25"
                >
                  Cargar y abrir resumen
                </button>
              </div>
              <LastBattles
                battles={battles}
                selectedId={selectedId}
                loading={listLoading}
                onSelect={onSelectBattle}
                onFilterChange={(p, h) => {
                  setMinPlayers(p);
                  setMinHome(h);
                }}
              />
            </div>
          )}

          {tab !== "battles" && detailLoading && (
            <div className="rounded-2xl border border-[#2a3344] bg-[#16181d] px-4 py-16 text-center">
              <p className="font-display text-lg text-white">Cargando batalla {selectedId}…</p>
              <p className="mt-2 text-xs text-[#8b95a8]">Roster primero (~1–3s), luego kills/loot.</p>
            </div>
          )}

          {tab !== "battles" && !detailLoading && !detailReady && (
            <div className="rounded-2xl border border-[#2a3344] bg-[#16181d] px-4 py-16 text-center text-sm text-[#8b95a8]">
              Elige una batalla en la pestaña Batallas.
            </div>
          )}

          {detailReady && tab === "overview" && activeBattle && (
            <BattleDetailView battle={activeBattle} />
          )}

          {detailReady && tab === "kills" && data && (
            <Killboard kills={data.kills} loading={enriching} />
          )}

          {detailReady && tab === "loot" && data && activeBattle && (
            <LootTracker
              kills={data.kills}
              claims={data.lootClaims}
              homePlayers={activeBattle.players.filter((p) => p.isHome)}
              loading={enriching}
            />
          )}

          {detailReady && tab === "party" && data && (
            <PartyStats party={data.party} summary={data.summary} battleId={activeBattle!.id} />
          )}
        </div>

        <footer className="relative z-10 mt-10 border-t border-[#2a3344] pt-4 text-center text-[11px] text-[#5b6578]">
          Eroth · {LEADER_NAME} / NULLE · pestañas Batallas → Resumen → Kills → Loot → Party
        </footer>
      </main>
    </div>
  );
}
