"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatUtcNow(d = new Date()): string {
  return d.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function UtcClock({ className = "" }: { className?: string }) {
  const [utc, setUtc] = useState(() => formatUtcNow());

  useEffect(() => {
    const tick = () => setUtc(formatUtcNow());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[#2a3344] bg-[#12171f] px-2.5 py-1.5 text-xs font-medium tabular-nums text-[#e8edf5] ${className}`}
      title="Hora UTC en tiempo real"
    >
      <Clock className="h-3 w-3 shrink-0 text-[#f59e0b]" />
      <span className="text-[#8b95a8]">UTC</span>
      <span>{utc}</span>
    </span>
  );
}
