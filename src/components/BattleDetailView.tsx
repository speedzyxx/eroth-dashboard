"use client";

import { useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Crosshair, Heart, Shield, Skull, Sparkles } from "lucide-react";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { makeItem, formatFame, formatTimeAgo } from "@/lib/format";
import type { BattleDetail, BattlePlayerRow } from "@/types/albion";

interface BattleDetailViewProps {
  battle: BattleDetail;
}

function MvpCard({
  title,
  player,
  value,
  accent,
  icon: Icon,
}: {
  title: string;
  player: BattlePlayerRow | null;
  value: string;
  accent: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
}) {
  return (
    <div
      className="rounded-xl border bg-[#0f1218] p-3"
      style={{ borderColor: `${accent}55` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
        {title}
      </p>
      {player ? (
        <>
          <p className="mt-1 truncate text-sm font-semibold text-white">{player.name}</p>
          <p className="truncate text-[11px] text-[#8b95a8]">
            {player.allianceName ? `[${player.allianceName}] ` : ""}
            {player.guildName || "—"}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums" style={{ color: accent }}>
            {value}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-[#5b6578]">—</p>
      )}
      <Icon className="mt-1 h-3.5 w-3.5 opacity-40" style={{ color: accent }} />
    </div>
  );
}

function StatTable<T extends { id: string; isHome?: boolean }>({
  title,
  rows,
  columns,
  searchKeys,
}: {
  title: string;
  rows: T[];
  columns: { key: string; label: string; render: (row: T) => ReactNode; className?: string }[];
  searchKeys: (row: T) => string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => searchKeys(r).toLowerCase().includes(needle));
  }, [q, rows, searchKeys]);

  return (
    <div className="rounded-xl border border-[#2a3344] bg-[#0f1218] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
          {title}{" "}
          <span className="text-[#6b7280]">({filtered.length})</span>
        </h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="w-28 rounded-md border border-[#2a3344] bg-[#16181d] px-2 py-1 text-xs text-white outline-none focus:border-[#d97706]/40"
        />
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#0f1218]">
            <tr className="text-[10px] uppercase tracking-wide text-[#6b7280]">
              {columns.map((c) => (
                <th key={c.key} className={`px-1.5 py-1.5 font-medium ${c.className || ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className={`border-t border-[#2a3344]/50 ${row.isHome ? "bg-[#d97706]/5" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-1.5 py-1.5 ${c.className || ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BattleDetailView({ battle }: BattleDetailViewProps) {
  const homePlayers = battle.players.filter((p) => p.isHome);

  return (
    <section className="relative z-10 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#2a3344] bg-[#16181d] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f59e0b]">
              Battle {battle.id}
            </p>
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
              {new Date(battle.startTime).toLocaleString()}
            </h2>
            <p className="mt-1 text-xs text-[#8b95a8]">
              Lado home: <span className="text-white">{battle.homeAlliance}</span> · Guild{" "}
              <span className="text-white">{battle.homeGuild}</span> · Leader{" "}
              <span className="text-[#f59e0b]">{battle.leaderName}</span>
              {" · "}
              {battle.totalPlayers} players · {battle.totalKills} kills ·{" "}
              {formatFame(battle.totalFame)} fame
            </p>
          </div>
          <span className="rounded-md border border-[#2a3344] bg-[#0f1218] px-2 py-1 text-[11px] text-[#8b95a8]">
            {battle.source === "live" ? "Live Gameinfo" : "Mock"} ·{" "}
            {formatTimeAgo(battle.lastUpdated)}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MvpCard
            title="Top Kills"
            player={battle.mvp.topKills}
            value={String(battle.mvp.topKills?.kills ?? 0)}
            accent="#ef4444"
            icon={Crosshair}
          />
          <MvpCard
            title="Top Damage"
            player={battle.mvp.topDamage}
            value={formatFame(battle.mvp.topDamage?.damage ?? 0)}
            accent="#a855f7"
            icon={Sparkles}
          />
          <MvpCard
            title="Top Heal"
            player={battle.mvp.topHeal}
            value={formatFame(battle.mvp.topHeal?.heal ?? 0)}
            accent="#2dd4bf"
            icon={Heart}
          />
          <MvpCard
            title="Top Death Fame"
            player={battle.mvp.topFame}
            value={formatFame(battle.mvp.topFame?.fame ?? 0)}
            accent="#9ca3af"
            icon={Skull}
          />
        </div>

        <div className="mt-4">
          <StatTable
            title={`Players · Home side ${homePlayers.length}`}
            rows={battle.players}
            searchKeys={(r) => `${r.name} ${r.guildName || ""} ${r.allianceName || ""}`}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (r) => (
                  <span className="inline-flex items-center gap-1.5">
                    {r.weaponType ? (
                      <ItemIcon item={makeItem(r.weaponType)} size={22} showTier={false} />
                    ) : (
                      <Shield className="h-3.5 w-3.5 text-[#5b6578]" />
                    )}
                    <span className={r.isHome ? "font-semibold text-[#fde68a]" : "text-white"}>
                      {r.name}
                    </span>
                  </span>
                ),
              },
              {
                key: "guild",
                label: "Guild",
                render: (r) => (
                  <span className="text-[#9ca3af]">
                    {r.guildName || "—"}
                    {r.allianceName ? ` · ${r.allianceName}` : ""}
                  </span>
                ),
              },
              { key: "ip", label: "IP", render: (r) => r.ip ?? "—" },
              {
                key: "dmg",
                label: "Dmg",
                className: "text-[#a855f7]",
                render: (r) => (r.damage ? formatFame(r.damage) : "0"),
              },
              {
                key: "heal",
                label: "Heal",
                className: "text-[#2dd4bf]",
                render: (r) => (r.heal ? formatFame(r.heal) : "0"),
              },
              {
                key: "kills",
                label: "Kills",
                className: "text-[#f87171]",
                render: (r) => r.kills,
              },
              {
                key: "deaths",
                label: "Deaths",
                className: "text-[#f472b6]",
                render: (r) => r.deaths,
              },
              {
                key: "fame",
                label: "Fame",
                className: "text-[#f59e0b]",
                render: (r) => formatFame(r.fame),
              },
            ]}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <StatTable
            title="Guilds"
            rows={battle.guilds}
            searchKeys={(r) => `${r.name} ${r.alliance}`}
            columns={[
              {
                key: "name",
                label: "Guild",
                render: (r) => (
                  <span className={r.isHome ? "font-semibold text-[#f59e0b]" : "text-white"}>
                    {r.name}
                  </span>
                ),
              },
              { key: "alliance", label: "Alliance", render: (r) => r.alliance },
              {
                key: "players",
                label: "Players",
                className: "text-[#60a5fa]",
                render: (r) => r.players,
              },
              {
                key: "kills",
                label: "Kills",
                className: "text-[#f87171]",
                render: (r) => r.kills,
              },
              {
                key: "deaths",
                label: "Deaths",
                className: "text-[#f472b6]",
                render: (r) => r.deaths,
              },
              {
                key: "fame",
                label: "Fame",
                className: "text-[#f59e0b]",
                render: (r) => formatFame(r.fame),
              },
            ]}
          />
          <StatTable
            title="Alliances"
            rows={battle.alliances}
            searchKeys={(r) => r.name}
            columns={[
              {
                key: "name",
                label: "Alliance",
                render: (r) => (
                  <span className={r.isHome ? "font-semibold text-[#f59e0b]" : "text-white"}>
                    {r.name}
                  </span>
                ),
              },
              {
                key: "players",
                label: "Players",
                className: "text-[#60a5fa]",
                render: (r) => r.players,
              },
              {
                key: "kills",
                label: "Kills",
                className: "text-[#f87171]",
                render: (r) => r.kills,
              },
              {
                key: "deaths",
                label: "Deaths",
                className: "text-[#f472b6]",
                render: (r) => r.deaths,
              },
              {
                key: "ip",
                label: "Avg IP",
                render: (r) => r.avgIp ?? "—",
              },
              {
                key: "fame",
                label: "Fame",
                className: "text-[#f59e0b]",
                render: (r) => formatFame(r.fame),
              },
            ]}
          />
        </div>
      </motion.div>
    </section>
  );
}
