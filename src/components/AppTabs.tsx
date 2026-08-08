"use client";

import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

export type AppTab = "battles" | "overview" | "kills" | "loot" | "party";

const TABS: {
  id: AppTab;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "battles", label: "Batallas", hint: "Elegir pelea", icon: Trophy },
  { id: "overview", label: "Resumen", hint: "Alianzas / MVP", icon: LayoutDashboard },
  { id: "kills", label: "Killboard", hint: "Bajas", icon: Swords },
  { id: "loot", label: "Loot", hint: "Todo el botín", icon: Package },
  { id: "party", label: "Party", hint: "Rendimiento", icon: Users },
];

interface AppTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  battleLabel?: string | null;
}

export function AppTabs({ active, onChange, battleLabel }: AppTabsProps) {
  return (
    <nav className="relative z-10 sticky top-0 -mx-4 mb-5 border-b border-[#2a3344] bg-[#0b0c10]/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`group inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                isActive
                  ? "border-[#d97706]/50 bg-[#d97706]/15 text-[#fde68a]"
                  : "border-transparent bg-transparent text-[#8b95a8] hover:border-[#2a3344] hover:bg-[#16181d] hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#f59e0b]" : ""}`} />
              <span>
                <span className="block text-sm font-semibold leading-none">{tab.label}</span>
                <span className="mt-0.5 block text-[10px] opacity-70">{tab.hint}</span>
              </span>
            </button>
          );
        })}
        {battleLabel && (
          <span className="ml-auto hidden shrink-0 rounded-md border border-[#2a3344] bg-[#16181d] px-2 py-1 text-[11px] text-[#8b95a8] sm:inline">
            Batalla <span className="text-[#f59e0b]">{battleLabel}</span>
          </span>
        )}
      </div>
    </nav>
  );
}
