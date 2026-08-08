"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Box, Camera, Package, Search, Trash2, Upload } from "lucide-react";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { formatSilver, formatTimeAgo } from "@/lib/format";
import { isHomeSide } from "@/lib/roster";
import type { EquipmentItem, KillEvent, LootClaim } from "@/types/albion";

interface LootTrackerProps {
  kills: KillEvent[];
  claims: LootClaim[];
}

interface ChestStack {
  key: string;
  item: EquipmentItem;
  totalCount: number;
  looters: { name: string; guild: string }[];
  estimatedSilver: number;
}

function buildAllyChest(claims: LootClaim[]): ChestStack[] {
  const allyLoot = claims.filter((c) => {
    if (c.kind === "trash") return false;
    return isHomeSide({
      guildName: c.guildName,
      allianceName: c.allianceName,
    });
  });

  const map = new Map<string, ChestStack>();
  for (const c of allyLoot) {
    const key = `${c.item.type}|${c.item.quality}`;
    const existing = map.get(key);
    const looter = {
      name: c.playerName,
      guild: c.guildName || "Sin gremio",
    };
    if (!existing) {
      map.set(key, {
        key,
        item: { ...c.item, count: c.item.count || 1 },
        totalCount: c.item.count || 1,
        looters: [looter],
        estimatedSilver: c.estimatedSilver,
      });
    } else {
      existing.totalCount += c.item.count || 1;
      existing.estimatedSilver += c.estimatedSilver;
      if (!existing.looters.some((l) => l.name === looter.name)) {
        existing.looters.push(looter);
      }
    }
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      item: { ...s.item, count: s.totalCount },
    }))
    .sort((a, b) => b.estimatedSilver - a.estimatedSilver || b.totalCount - a.totalCount);
}

export function LootTracker({ kills, claims }: LootTrackerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "lootable" | "trash">("all");

  const chest = useMemo(() => buildAllyChest(claims), [claims]);
  const chestValue = useMemo(
    () => chest.reduce((s, c) => s + c.estimatedSilver, 0),
    [chest],
  );

  const lootableClaims = useMemo(
    () => claims.filter((c) => c.kind !== "trash"),
    [claims],
  );
  const trashClaims = useMemo(
    () => claims.filter((c) => c.kind === "trash"),
    [claims],
  );

  const filteredClaims = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return claims.filter((c) => {
      if (filter === "lootable" && c.kind === "trash") return false;
      if (filter === "trash" && c.kind !== "trash") return false;
      if (!needle) return true;
      const blob = [
        c.playerName,
        c.guildName,
        c.allianceName,
        c.victimName,
        c.item.name,
        c.item.tierLabel,
        c.item.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [claims, filter, query]);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...next, ...prev].slice(0, 12));
  }

  return (
    <section className="relative z-10 space-y-4">
      <div className="rounded-2xl border border-[#d97706]/35 bg-gradient-to-b from-[#1a1510] to-[#16181d] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d97706]/40 bg-[#d97706]/15">
              <Box className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Cofre de loot aliado
              </h2>
              <p className="text-xs text-[#8b95a8]">
                Inventario agregado del botín lootable del lado home (NULLE / Eroth)
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-[#8b95a8]">
              {chest.length} stacks · {chest.reduce((s, c) => s + c.totalCount, 0)} ítems
            </p>
            <p className="font-semibold text-[#86efac]">~{formatSilver(chestValue)} silver</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#3a2e1a] bg-[#0c0e12]/p-3 shadow-inner">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {chest.map((stack, i) => (
              <div key={stack.key} className="flex flex-col items-center gap-1">
                <ItemIcon item={stack.item} size={52} priority={i < 24} />
                <p
                  className="w-full truncate text-center text-[9px] text-[#9ca3af]"
                  title={stack.looters.map((l) => `${l.name} (${l.guild})`).join(", ")}
                >
                  {stack.looters[0]?.guild || "—"}
                </p>
              </div>
            ))}
            {!chest.length && (
              <p className="col-span-full py-8 text-center text-sm text-[#8b95a8]">
                Aún no hay lootable de aliados (o la API no devolvió inventarios).
              </p>
            )}
          </div>
        </div>

        {chest.length > 0 && (
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-[11px] text-[#8b95a8]">
            {chest.slice(0, 50).map((s) => (
              <li key={`sum-${s.key}`}>
                <span className="text-[#e8edf5]">
                  {s.totalCount}× {s.item.tierLabel} {s.item.name}
                </span>
                {" — "}
                {s.looters.map((l) => `${l.name} [${l.guild}]`).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-[#2a3344] bg-[#16181d] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Ledger completo</h2>
            <p className="text-xs text-[#8b95a8]">
              {kills.length} bajas · {lootableClaims.length} lootable · {trashClaims.length} trash
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7280]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jugador, gremio, ítem…"
                className="w-48 rounded-md border border-[#2a3344] bg-[#0f1218] py-1.5 pl-7 pr-2 text-xs text-white outline-none focus:border-[#d97706]/40"
              />
            </div>
            {(["all", "lootable", "trash"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold capitalize ${
                  filter === f
                    ? "border-[#d97706]/40 bg-[#d97706]/15 text-[#f59e0b]"
                    : "border-[#2a3344] text-[#8b95a8]"
                }`}
              >
                {f === "all" ? "Todo" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-[#2a3344]">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="sticky top-0 z-[1] bg-[#12151b]">
              <tr className="text-[10px] uppercase tracking-wide text-[#6b7280]">
                <th className="px-2 py-2">Ítem</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">Looter</th>
                <th className="px-2 py-2">Gremio</th>
                <th className="px-2 py-2">Víctima</th>
                <th className="px-2 py-2">Valor</th>
                <th className="px-2 py-2">Cuando</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="border-t border-[#2a3344]/60 hover:bg-white/[0.02]">
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <ItemIcon item={claim.item} size={36} />
                      <span className="text-[#e8edf5]">
                        {claim.item.count > 1 ? `${claim.item.count}× ` : ""}
                        {claim.item.tierLabel} {claim.item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        claim.kind === "trash"
                          ? "bg-[#7f1d1d]/40 text-[#f87171]"
                          : "bg-teal-500/15 text-[#5eead4]"
                      }`}
                    >
                      {claim.kind === "trash" ? "Trash" : "Lootable"}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-semibold text-[#f59e0b]">{claim.playerName}</td>
                  <td className="px-2 py-2 text-[#9ca3af]">
                    {claim.guildName || "Sin gremio"}
                    {claim.allianceName ? (
                      <span className="text-[#6b7280]"> · {claim.allianceName}</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 text-[#f87171]">{claim.victimName || "—"}</td>
                  <td className="px-2 py-2 tabular-nums text-[#86efac]">
                    {claim.kind === "trash" ? "—" : `~${formatSilver(claim.estimatedSilver)}`}
                  </td>
                  <td className="px-2 py-2 text-[#6b7280]">{formatTimeAgo(claim.timestamp)}</td>
                </tr>
              ))}
              {!filteredClaims.length && (
                <tr>
                  <td colSpan={7} className="px-2 py-10 text-center text-sm text-[#8b95a8]">
                    Sin registros de loot para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Por baja · {kills.length} eventos</h3>
        {kills.map((kill, index) => (
          <motion.article
            key={kill.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 20) * 0.02 }}
            className="rounded-xl border border-[#2a3344] bg-[#0f1218] p-3.5"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-white">
                <span className="text-[#f59e0b]">{kill.killer.name}</span>
                <span className="mx-1 text-[#5b6578]">[{kill.killer.guildName || "—"}]</span>
                <span className="font-normal text-[#6b7280]">vs</span>{" "}
                <span className="text-[#f87171]">{kill.victim.name}</span>
                <span className="ml-1 text-[#5b6578]">[{kill.victim.guildName || "—"}]</span>
              </p>
              <p className="text-[11px] text-[#6b7280]">
                {kill.lootable.length} lootable · {kill.trash.length} trash ·{" "}
                {formatTimeAgo(kill.timestamp)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5eead4]">
                  <Package className="h-3.5 w-3.5" /> Lootable ({kill.lootable.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {kill.lootable.length ? (
                    kill.lootable.map((item, i) => (
                      <ItemIcon
                        key={`${kill.id}-l-${item.type}-${i}`}
                        item={item}
                        size={48}
                        priority={index < 2 && i < 8}
                      />
                    ))
                  ) : (
                    <span className="text-xs text-[#5b6578]">Sin drops</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f87171]">
                  <Trash2 className="h-3.5 w-3.5" /> Trash ({kill.trash.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {kill.trash.length ? (
                    kill.trash.map((item, i) => (
                      <ItemIcon key={`${kill.id}-t-${item.type}-${i}`} item={item} size={48} />
                    ))
                  ) : (
                    <span className="text-xs text-[#5b6578]">Sin trash</span>
                  )}
                </div>
              </div>
            </div>

            {kill.lootedBy && kill.lootedBy.length > 0 && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t border-[#2a3344] pt-2.5">
                {kill.lootedBy.map((row, i) => (
                  <li
                    key={`${kill.id}-by-${i}`}
                    className="flex items-center gap-2 text-xs text-[#8b95a8]"
                  >
                    <ItemIcon item={row.item} size={24} showTier={false} />
                    <span>
                      <span className="font-semibold text-[#f59e0b]">{row.playerName}</span>
                      <span className="text-[#6b7280]">
                        {" "}
                        ({row.guildName || "Sin gremio"}
                        {row.allianceName ? ` · ${row.allianceName}` : ""})
                      </span>{" "}
                      loteó{" "}
                      <span className="text-[#e8edf5]">
                        {row.item.count > 1 ? `${row.item.count}× ` : "1× "}
                        {row.item.tierLabel} {row.item.name}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.article>
        ))}
        {!kills.length && (
          <p className="rounded-xl border border-[#2a3344] bg-[#0f1218] py-10 text-center text-sm text-[#8b95a8]">
            No hay kills con inventario para esta batalla todavía.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-[#2a3344] bg-[#16181d] p-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Camera className="mt-0.5 h-4 w-4 text-[#f59e0b]" />
            <div>
              <p className="text-sm font-medium text-white">Capturas de bolsas</p>
              <p className="text-xs text-[#8b95a8]">OCR / parseo (próximamente).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d97706]/40 bg-[#d97706]/15 px-3 py-2 text-xs font-semibold text-[#f59e0b] hover:bg-[#d97706]/25"
          >
            <Upload className="h-3.5 w-3.5" />
            Subir imágenes
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.url}
                src={p.url}
                alt={p.name}
                className="h-16 w-16 rounded-md border border-[#2a3344] object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
