"use client";

/**
 * Mascota recolectora T8 (inspirada en Miner / Lumberjack High-End).
 * Camina por los bordes, recolecta recursos y reacciona al clic.
 * pointer-events solo en el personaje; el resto no bloquea la UI.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ResourceKind = "wood" | "ore" | "fiber" | "hide" | "stone";

interface ResourceNode {
  id: string;
  kind: ResourceKind;
  x: number;
  y: number;
}

interface Floater {
  id: string;
  x: number;
  y: number;
  label: string;
}

const RESOURCE_META: Record<
  ResourceKind,
  { label: string; color: string; emoji: string }
> = {
  wood: { label: "+1 Wood", color: "#a16207", emoji: "🪵" },
  ore: { label: "+1 Ore", color: "#94a3b8", emoji: "⛏️" },
  fiber: { label: "+1 Fiber", color: "#4d7c0f", emoji: "🌿" },
  hide: { label: "+1 Hide", color: "#b45309", emoji: "🦌" },
  stone: { label: "+1 Stone", color: "#78716c", emoji: "🪨" },
};

const KINDS = Object.keys(RESOURCE_META) as ResourceKind[];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Genera un punto aleatorio cerca de los bordes del viewport */
function randomEdgePoint(w: number, h: number, margin = 28): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0:
      return { x: clamp(Math.random() * w, margin, w - margin), y: margin };
    case 1:
      return { x: w - margin, y: clamp(Math.random() * h, margin, h - margin) };
    case 2:
      return { x: clamp(Math.random() * w, margin, w - margin), y: h - margin };
    default:
      return { x: margin, y: clamp(Math.random() * h, margin, h - margin) };
  }
}

function makeResource(w: number, h: number): ResourceNode {
  const pos = randomEdgePoint(w, h);
  return {
    id: `r-${Math.random().toString(36).slice(2, 9)}`,
    kind: KINDS[Math.floor(Math.random() * KINDS.length)],
    x: pos.x,
    y: pos.y,
  };
}

function GathererSprite({
  facing,
  gathering,
  happy,
}: {
  facing: 1 | -1;
  gathering: boolean;
  happy: boolean;
}) {
  return (
    <motion.div
      animate={happy ? { y: [0, -14, 0], rotate: [0, -8, 8, 0] } : gathering ? { y: [0, 2, 0] } : { y: [0, -2, 0] }}
      transition={
        happy
          ? { duration: 0.45 }
          : gathering
            ? { duration: 0.35, repeat: 2 }
            : { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
      }
      style={{ scaleX: facing }}
      className="relative h-14 w-10"
    >
      {/* Capucha blanca + gema dorada (Miner T8) */}
      <div className="absolute left-1/2 top-0 h-5 w-7 -translate-x-1/2 rounded-t-full bg-[#f8fafc] shadow">
        <div className="absolute left-1/2 top-1 h-2 w-2 -translate-x-1/2 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
      </div>
      {/* Cara */}
      <div className="absolute left-1/2 top-3.5 h-3.5 w-5 -translate-x-1/2 rounded-md bg-[#e7c6a0]">
        <div className="absolute left-1 top-1.5 h-1 w-1 rounded-full bg-[#1e293b]" />
        <div className="absolute right-1 top-1.5 h-1 w-1 rounded-full bg-[#1e293b]" />
        {happy && (
          <div className="absolute bottom-0.5 left-1/2 h-1 w-2 -translate-x-1/2 rounded-b-full border-b border-[#991b1b]" />
        )}
      </div>
      {/* Tabardo blanco / borde carmesí */}
      <div className="absolute left-1/2 top-7 h-7 w-8 -translate-x-1/2 rounded-md border-2 border-[#991b1b] bg-[#f1f5f9]">
        <div className="absolute inset-x-1 top-1 h-0.5 bg-[#d97706]/80" />
        <div className="absolute bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border border-[#d97706]/70" />
      </div>
      {/* Guantes / botas oscuras */}
      <div className="absolute -left-0.5 top-9 h-2.5 w-2 rounded-sm bg-[#1f2937]" />
      <div className="absolute -right-0.5 top-9 h-2.5 w-2 rounded-sm bg-[#1f2937]" />
      <div className="absolute bottom-0 left-1.5 h-2 w-2.5 rounded-sm bg-[#111827]" />
      <div className="absolute bottom-0 right-1.5 h-2 w-2.5 rounded-sm bg-[#111827]" />
      {/* Pico / hacha al recolectar */}
      {gathering && (
        <motion.div
          className="absolute -right-2 top-6 h-5 w-1 origin-bottom rounded-full bg-[#94a3b8]"
          animate={{ rotate: [-25, 35, -25] }}
          transition={{ duration: 0.35, repeat: 2 }}
        >
          <div className="absolute -top-1 -left-1.5 h-2 w-3 rounded-sm bg-[#f59e0b]" />
        </motion.div>
      )}
    </motion.div>
  );
}

export function GathererMascot() {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [pos, setPos] = useState({ x: 48, y: 120 });
  const [facing, setFacing] = useState<1 | -1>(1);
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [gathering, setGathering] = useState(false);
  const [happy, setHappy] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const busyRef = useRef(false);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Sembrar recursos iniciales en bordes
  useEffect(() => {
    if (size.w < 100) return;
    setResources([
      makeResource(size.w, size.h),
      makeResource(size.w, size.h),
      makeResource(size.w, size.h),
    ]);
  }, [size.w, size.h]);

  const target = useMemo(
    () => resources.find((r) => r.id === targetId) ?? null,
    [resources, targetId],
  );

  // Elegir próximo recurso
  useEffect(() => {
    if (busyRef.current || gathering || resources.length === 0) return;
    if (!targetId || !resources.some((r) => r.id === targetId)) {
      const next = resources[Math.floor(Math.random() * resources.length)];
      setTargetId(next.id);
    }
  }, [resources, targetId, gathering]);

  // Movimiento hacia el objetivo
  useEffect(() => {
    if (!target || gathering) return;

    let raf = 0;
    const speed = 1.15;

    const tick = () => {
      setPos((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
          // Llegó: recolectar
          if (!busyRef.current) {
            busyRef.current = true;
            setGathering(true);
            const meta = RESOURCE_META[target.kind];
            const floaterId = `f-${target.id}`;
            setFloaters((f) => [
              ...f,
              { id: floaterId, x: target.x, y: target.y - 20, label: meta.label },
            ]);

            window.setTimeout(() => {
              setResources((list) => {
                const rest = list.filter((r) => r.id !== target.id);
                return [...rest, makeResource(size.w, size.h)];
              });
              setGathering(false);
              setTargetId(null);
              busyRef.current = false;
              setFloaters((f) => f.filter((x) => x.id !== floaterId));
            }, 700);
          }
          return prev;
        }

        setFacing(dx >= 0 ? 1 : -1);
        return {
          x: prev.x + (dx / dist) * speed,
          y: prev.y + (dy / dist) * speed,
        };
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, gathering, size.w, size.h]);

  const onClickCharacter = useCallback(() => {
    setHappy(true);
    window.setTimeout(() => setHappy(false), 500);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {/* Recursos en bordes */}
      {resources.map((r) => {
        const meta = RESOURCE_META[r.kind];
        return (
          <div
            key={r.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 opacity-70"
            style={{ left: r.x, top: r.y }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-sm shadow-lg"
              style={{ background: `${meta.color}33` }}
              title={meta.label}
            >
              <span className="grayscale-[20%]">{meta.emoji}</span>
            </div>
          </div>
        );
      })}

      {/* Floaters +1 */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -28 }}
            exit={{ opacity: 0 }}
            className="absolute -translate-x-1/2 text-[11px] font-bold text-[#f59e0b] drop-shadow"
            style={{ left: f.x, top: f.y }}
          >
            {f.label}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Personaje — único elemento clickeable */}
      <button
        type="button"
        onClick={onClickCharacter}
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 outline-none"
        style={{ left: pos.x, top: pos.y }}
        title="Recolector Eroth"
        aria-label="Mascota recolectora de Eroth"
      >
        <GathererSprite facing={facing} gathering={gathering} happy={happy} />
      </button>
    </div>
  );
}
