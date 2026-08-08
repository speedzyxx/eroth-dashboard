"use client";

import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { itemIconCandidates } from "@/lib/format";
import type { EquipmentItem } from "@/types/albion";

interface ItemIconProps {
  item: EquipmentItem | null | undefined;
  size?: number;
  showTier?: boolean;
  className?: string;
  /** Carga prioritaria (primeros ítems del cofre / viewport) */
  priority?: boolean;
}

export function ItemIcon({
  item,
  size = 48,
  showTier = true,
  className = "",
  priority = false,
}: ItemIconProps) {
  // Pedir tamaño cercano al display (más liviano que size*2 grandes)
  const requestSize = Math.min(128, Math.max(64, size <= 40 ? 64 : 96));
  const candidates = useMemo(
    () => (item ? itemIconCandidates(item.type, item.quality, requestSize) : []),
    [item, requestSize],
  );

  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrcIndex(0);
    setFailed(false);
    setLoaded(false);
  }, [item?.type, item?.quality, requestSize]);

  if (!item) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-md border border-[#2a3344] bg-[#0f131a] ${className}`}
        style={{ width: size, height: size }}
        title="Vacío"
      >
        <span className="text-[10px] text-[#4b5568]">—</span>
      </div>
    );
  }

  const src = !failed ? candidates[srcIndex] : undefined;

  return (
    <div
      className={`group relative flex items-center justify-center overflow-hidden rounded-md border border-[#2a3344] bg-[#0f131a] shadow-inner ${className}`}
      style={{ width: size, height: size }}
      title={`${item.name} (${item.tierLabel})`}
    >
      {!loaded && src && (
        <div className="absolute inset-0 animate-pulse bg-[#1a2030]" />
      )}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={item.name}
          width={size}
          height={size}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-contain p-0.5 transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (srcIndex + 1 < candidates.length) {
              setSrcIndex((i) => i + 1);
              setLoaded(false);
            } else {
              setFailed(true);
            }
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[#5b6578]">
          <Package className="h-3.5 w-3.5 opacity-60" />
          <span className="max-w-[90%] truncate px-0.5 text-center text-[8px] leading-tight">
            {item.name.split(" ").slice(0, 2).join(" ")}
          </span>
        </div>
      )}

      {item.count > 1 && (
        <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
          ×{item.count}
        </span>
      )}

      {showTier && (
        <span className="absolute bottom-0 right-0 rounded-tl bg-black/75 px-1 text-[9px] font-bold tracking-wide text-[#f59e0b]">
          {item.tierLabel}
        </span>
      )}
    </div>
  );
}
