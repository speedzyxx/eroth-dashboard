"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Crown,
  Radio,
  Skull,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { APP_TITLE, GUILD_NAME } from "@/lib/config";
import { formatFame, formatSilver } from "@/lib/format";
import type { SessionSummary } from "@/types/albion";

interface HeaderHeroProps {
  summary: SessionSummary;
  source: "mock" | "live";
  lastUpdated: string;
  liveEnabled: boolean;
  onToggleLive: () => void;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-[#2a3344] bg-[#181e29]/p-4"
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b95a8]">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-[#e8edf5] tabular-nums">
            {value}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a3344]"
          style={{ color: accent, background: `${accent}18` }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

export function HeaderHero({
  summary,
  source,
  lastUpdated,
  liveEnabled,
  onToggleLive,
  loading,
}: HeaderHeroProps) {
  const allies = summary.alliesCount ?? summary.activeSlots;
  const enemies = summary.enemiesCount ?? Math.max(0, (summary.totalPlayers ?? 0) - allies);
  const total = summary.totalPlayers ?? allies + enemies;

  return (
    <header className="relative z-10 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d97706]/35 bg-[#d97706]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f59e0b]">
            <Crown className="h-3.5 w-3.5" />
            High-End · moropotopoo / NULLE
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            <span className="bg-gradient-to-r from-white via-[#f5e6c8] to-[#f59e0b] bg-clip-text text-transparent">
              {GUILD_NAME}
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#8b95a8]">{APP_TITLE}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              source === "live"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-[#2a3344] bg-[#12171f] text-[#8b95a8]"
            }`}
          >
            <Radio className={`h-3 w-3 ${source === "live" ? "animate-pulse" : ""}`} />
            {source === "live" ? "Live Gameinfo" : "Mock Data"}
          </span>
          <button
            type="button"
            onClick={onToggleLive}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d97706]/40 bg-[#d97706]/15 px-3 py-1.5 text-xs font-semibold text-[#f59e0b] transition hover:bg-[#d97706]/25 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {liveEnabled ? "Usar Mock" : "Conectar API"}
          </button>
          <span className="text-[11px] text-[#5b6578]">
            {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Kills aliados"
          value={String(summary.kills)}
          icon={Swords}
          accent="#dc2626"
        />
        <StatCard
          label="Fama aliados"
          value={formatFame(summary.fame)}
          icon={Skull}
          accent="#f59e0b"
        />
        <StatCard
          label="Botín estimado"
          value={`${formatSilver(summary.lootValueSilver)} ₳`}
          icon={Coins}
          accent="#16a34a"
        />
        <StatCard
          label="Participantes"
          value={`${allies} / ${enemies}`}
          icon={Users}
          accent="#60a5fa"
        />
      </div>
      <p className="-mt-3 text-[11px] text-[#5b6578]">
        Aliados {allies} · Enemigos {enemies} · Total pelea {total}
      </p>
    </header>
  );
}
