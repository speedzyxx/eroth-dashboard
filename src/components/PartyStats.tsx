"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Coins, Search, Shield, Swords, TrendingUp, Trophy } from "lucide-react";
import { formatFame, formatSilver } from "@/lib/format";
import type { PartyMemberStats, SessionSummary } from "@/types/albion";

interface PartyStatsProps {
  party: PartyMemberStats[];
  summary: SessionSummary;
}

function RosterGrid({
  title,
  accent,
  players,
}: {
  title: string;
  accent: string;
  players: PartyMemberStats[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return players;
    return players.filter((p) =>
      `${p.name} ${p.guildName || ""} ${p.allianceName || ""}`.toLowerCase().includes(needle),
    );
  }, [players, q]);

  return (
    <div className="rounded-2xl border border-[#2a3344] bg-[#181e29] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: accent }} />
          <h3 className="font-display text-base font-semibold text-white">
            {title}{" "}
            <span className="text-[#8b95a8]">({players.length})</span>
          </h3>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-36 rounded-md border border-[#2a3344] bg-[#0f1218] py-1 pl-6 pr-2 text-[11px] text-white outline-none focus:border-[#d97706]/40"
          />
        </div>
      </div>
      <div className="grid max-h-[520px] grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-[#2a3344]/60 bg-[#12171f] px-2.5 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${p.isOnline ? "bg-emerald-400" : "bg-[#4b5563]"}`}
                />
                <p className="truncate text-sm font-medium text-[#e8edf5]">{p.name}</p>
              </div>
              <p className="truncate text-[10px] text-[#5b6578]">
                {p.guildName || p.role || "—"}
                {p.allianceName ? ` · ${p.allianceName}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right text-[11px] tabular-nums">
              <p className="text-[#f87171]">
                {p.kills}K / {p.deaths}D
              </p>
              <p className="text-[#6b7280]">{formatFame(p.assistFame)}</p>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <p className="col-span-full py-6 text-center text-xs text-[#8b95a8]">Sin jugadores</p>
        )}
      </div>
    </div>
  );
}

export function PartyStats({ party, summary }: PartyStatsProps) {
  const allies = useMemo(() => party.filter((p) => p.isHomeSide), [party]);
  const enemies = useMemo(() => party.filter((p) => !p.isHomeSide), [party]);

  const mvp = [...allies].sort(
    (a, b) => b.kills - a.kills || b.assistFame - a.assistFame,
  )[0];
  const topLooters = [...allies].sort((a, b) => b.lootValue - a.lootValue).slice(0, 8);
  const totalDeaths = summary.deaths || 0;
  const kd = totalDeaths === 0 ? summary.kills : summary.kills / totalDeaths;
  const killPct = Math.min(100, (summary.kills / (summary.kills + summary.deaths || 1)) * 100);

  const alliesCount = summary.alliesCount ?? allies.length;
  const enemiesCount = summary.enemiesCount ?? enemies.length;
  const total = summary.totalPlayers ?? alliesCount + enemiesCount;

  return (
    <section className="relative z-10 space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-[#2a3344] bg-[#16181d] p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-[#8b95a8]">Total pelea</p>
          <p className="font-display text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-emerald-300/80">Aliados</p>
          <p className="font-display text-2xl font-bold text-emerald-400">{alliesCount}</p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-rose-300/80">Enemigos</p>
          <p className="font-display text-2xl font-bold text-rose-400">{enemiesCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2a3344] bg-[#181e29] p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#f59e0b]" />
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Rendimiento aliados</h2>
            <p className="text-xs text-[#8b95a8]">
              MVP · Top looters · K/D · {alliesCount} aliados en pelea
            </p>
          </div>
        </div>

        {mvp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 overflow-hidden rounded-xl border border-[#d97706]/35 bg-gradient-to-br from-[#2a1f0f] via-[#181e29] to-[#181e29] p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f59e0b]">
              MVP aliado
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-bold text-white">{mvp.name}</p>
                <p className="text-xs text-[#8b95a8]">
                  {mvp.guildName || mvp.role || "—"}
                  {mvp.allianceName ? ` · ${mvp.allianceName}` : ""}
                </p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-[10px] uppercase text-[#5b6578]">Kills</p>
                  <p className="text-lg font-semibold text-[#f87171]">{mvp.kills}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#5b6578]">Fama</p>
                  <p className="text-lg font-semibold text-[#f59e0b]">
                    {formatFame(mvp.assistFame)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[#8b95a8]">
              <TrendingUp className="h-3.5 w-3.5" /> Ratio K/D aliados
            </span>
            <span className="font-semibold tabular-nums text-white">{kd.toFixed(2)}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-[#0e1217] ring-1 ring-[#2a3344]">
            <div
              className="bg-gradient-to-r from-[#991b1b] to-[#dc2626] transition-all"
              style={{ width: `${killPct}%` }}
            />
            <div className="bg-[#374151]" style={{ width: `${100 - killPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-[#6b7280]">
            <span className="inline-flex items-center gap-1 text-[#f87171]">
              <Swords className="h-3 w-3" />
              {summary.kills} kills
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {summary.deaths} deaths
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#f59e0b]">
            <Coins className="h-3 w-3" /> Top Looters aliados
          </p>
          <ul className="space-y-2">
            {topLooters.filter((p) => p.lootValue > 0).map((p, i) => {
              const max = topLooters[0]?.lootValue || 1;
              const pct = (p.lootValue / max) * 100;
              return (
                <li key={p.id} className="rounded-lg bg-[#12171f] px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-[#e8edf5]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#d97706]/20 text-[10px] font-bold text-[#f59e0b]">
                        {i + 1}
                      </span>
                      <span className="truncate">
                        {p.name}
                        <span className="ml-1 text-[10px] text-[#6b7280]">
                          {p.guildName || ""}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-[#16a34a]">
                      {formatSilver(p.lootValue)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#0e1217]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#166534] to-[#22c55e]"
                    />
                  </div>
                </li>
              );
            })}
            {!topLooters.some((p) => p.lootValue > 0) && (
              <p className="text-xs text-[#8b95a8]">Sin loot asignado aún en esta pelea.</p>
            )}
          </ul>
        </div>
      </div>

      <RosterGrid title="Roster aliados" accent="#34d399" players={allies} />
      <RosterGrid title="Roster enemigos" accent="#f87171" players={enemies} />
    </section>
  );
}
