"use client";

import { motion } from "framer-motion";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { formatFame, formatTimeAgo, SLOT_LABELS, SLOT_ORDER } from "@/lib/format";
import type { KillEvent } from "@/types/albion";

interface KillboardProps {
  kills: KillEvent[];
  loading?: boolean;
}

export function Killboard({ kills, loading }: KillboardProps) {
  return (
    <section className="relative z-10 rounded-2xl border border-[#2a3344] bg-[#181e29]/p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Killboard</h2>
          <p className="text-xs text-[#8b95a8]">Monitor de bajas · pelea seleccionada</p>
        </div>
        <span className="rounded-md border border-[#2a3344] bg-[#12171f] px-2 py-1 text-[11px] text-[#8b95a8]">
          {loading && !kills.length ? "…" : `${kills.length} eventos`}
        </span>
      </div>

      <div className="space-y-3">
        {loading && kills.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-[#8b95a8]">
            <Loader2 className="h-6 w-6 animate-spin text-[#f59e0b]" />
            <p>Cargando kills de esta batalla…</p>
            <p className="text-[11px] text-[#5b6578]">
              Primero kills aliados (loot), luego el resto.
            </p>
          </div>
        )}

        {kills.map((kill, index) => (
          <motion.article
            key={kill.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index, 15) * 0.03 }}
            className="rounded-xl border border-[#2a3344] bg-[#12171f]/p-3.5 transition hover:border-[#d97706]/35"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  <span className="text-[#f59e0b]">{kill.killer.name}</span>
                  <span className="mx-1.5 text-[#5b6578]">→</span>
                  <span className="text-[#f87171]">{kill.victim.name}</span>
                </p>
                <p className="mt-0.5 text-xs text-[#8b95a8]">
                  {kill.victim.guildName || "Sin gremio"}
                  {kill.victim.allianceName ? ` · [${kill.victim.allianceName}]` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#d97706]/15 px-2 py-1 text-xs font-semibold text-[#f59e0b]">
                  <Sparkles className="h-3 w-3" />
                  {formatFame(kill.fame)} fama
                </span>
                <span className="text-[11px] text-[#5b6578]">{formatTimeAgo(kill.timestamp)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6b7280]">
              <MapPin className="h-3 w-3" />
              {kill.location}
              {kill.participants ? ` · ${kill.participants} en pelea` : null}
              {kill.lootable.length ? ` · ${kill.lootable.length} lootable` : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {SLOT_ORDER.map((slot) => (
                <div key={slot} className="flex flex-col items-center gap-1">
                  <ItemIcon item={kill.victimEquipment[slot]} size={52} />
                  <span className="text-[9px] uppercase tracking-wide text-[#5b6578]">
                    {SLOT_LABELS[slot]}
                  </span>
                </div>
              ))}
            </div>
          </motion.article>
        ))}

        {!loading && kills.length === 0 && (
          <p className="py-8 text-center text-sm text-[#8b95a8]">
            No se encontraron kills de esta batalla en Gameinfo (o la pelea es muy antigua).
          </p>
        )}
      </div>
    </section>
  );
}
