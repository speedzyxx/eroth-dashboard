"use client";

import { useMemo, useState } from "react";
import { Filter, Swords } from "lucide-react";
import { formatFame, formatTimeAgo } from "@/lib/format";
import type { BattleListItem } from "@/types/albion";

interface LastBattlesProps {
  battles: BattleListItem[];
  selectedId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onFilterChange?: (minPlayers: number, minHome: number) => void;
}

export function LastBattles({
  battles,
  selectedId,
  loading,
  onSelect,
  onFilterChange,
}: LastBattlesProps) {
  const [minPlayers, setMinPlayers] = useState(10);
  const [minHome, setMinHome] = useState(1);
  const [draftPlayers, setDraftPlayers] = useState("10");
  const [draftHome, setDraftHome] = useState("1");

  const filtered = useMemo(
    () =>
      battles.filter(
        (b) => b.totalPlayers >= minPlayers && b.homePlayers >= minHome,
      ),
    [battles, minPlayers, minHome],
  );

  function applyFilter() {
    const p = Math.max(1, Number(draftPlayers) || 1);
    const h = Math.max(0, Number(draftHome) || 0);
    setMinPlayers(p);
    setMinHome(h);
    onFilterChange?.(p, h);
  }

  return (
    <section className="relative z-10 rounded-2xl border border-[#2a3344] bg-[#16181d] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-wide text-white">
            LAST BATTLES
          </h2>
          <p className="text-xs text-[#8b95a8]">
            Grupo de <span className="text-[#f59e0b]">moropotopoo</span> · Eroth + NULLE
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[11px] text-[#8b95a8]">
            Min. total players
            <input
              value={draftPlayers}
              onChange={(e) => setDraftPlayers(e.target.value)}
              className="mt-1 block w-24 rounded-md border border-[#2a3344] bg-[#0f1218] px-2 py-1.5 text-sm text-white outline-none focus:border-[#d97706]/50"
            />
          </label>
          <label className="text-[11px] text-[#8b95a8]">
            Min. guild players
            <input
              value={draftHome}
              onChange={(e) => setDraftHome(e.target.value)}
              className="mt-1 block w-24 rounded-md border border-[#2a3344] bg-[#0f1218] px-2 py-1.5 text-sm text-white outline-none focus:border-[#d97706]/50"
            />
          </label>
          <button
            type="button"
            onClick={applyFilter}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#2a3344] bg-[#1e2633] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#d97706]/40"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#2a3344] text-[11px] uppercase tracking-wide text-[#6b7280]">
              <th className="px-2 py-2 font-medium"> </th>
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 font-medium">Enemies</th>
              <th className="px-2 py-2 font-medium">Players</th>
              <th className="px-2 py-2 font-medium">Kills</th>
              <th className="px-2 py-2 font-medium">Fame</th>
              <th className="px-2 py-2 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const selected = selectedId === b.id;
              return (
                <tr
                  key={b.id}
                  className={`border-b border-[#2a3344]/70 transition hover:bg-white/[0.03] ${
                    selected ? "bg-[#d97706]/10" : ""
                  }`}
                >
                  <td className="px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onSelect(b.id)}
                      className="accent-[#d97706]"
                      aria-label={`Seleccionar batalla ${b.id}`}
                    />
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-[#9ca3af]">
                    {formatBattleDate(b.startTime)}
                    <span className="ml-2 text-[10px] text-[#5b6578]">
                      {formatTimeAgo(b.startTime)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-medium text-white">
                    {b.enemies.join(", ")}
                  </td>
                  <td className="px-2 py-2.5 font-semibold text-[#60a5fa]">
                    {b.totalPlayers}
                    <span className="ml-1 text-[10px] font-normal text-[#5b6578]">
                      ({b.homePlayers} ours)
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-semibold text-[#f87171]">{b.totalKills}</td>
                  <td className="px-2 py-2.5 font-semibold text-[#f59e0b]">
                    {formatFame(b.totalFame)}
                  </td>
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => onSelect(b.id)}
                      className="text-xs font-medium text-[#93c5fd] underline-offset-2 hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="px-2 py-8 text-center text-sm text-[#8b95a8]">
                  {loading ? "Cargando batallas…" : "Sin batallas con esos filtros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#5b6578]">
        <Swords className="h-3 w-3" />
        Elige una batalla para ver alianzas, MVPs, kills y loot.
      </p>
    </section>
  );
}

function formatBattleDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}
