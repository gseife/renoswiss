import { type ReactNode } from "react";

type KPITone = "teal" | "emerald" | "gold" | "navy";

const toneClass: Record<KPITone, string> = {
  teal: "bg-teal/10 text-teal",
  emerald: "bg-emerald/10 text-emerald",
  gold: "bg-gold/10 text-gold",
  navy: "bg-canvas text-navy",
};

interface KPIProps {
  value: ReactNode;
  label: ReactNode;
  tone?: KPITone;
}

/**
 * Compact metric pill used inside cards to highlight a single value.
 * Use Stat for centered stats inside accent panels; use KPI for inline pills.
 */
export const KPI = ({ value, label, tone = "navy" }: KPIProps) => (
  <div className={`rounded-lg px-2 py-3 text-center ${toneClass[tone]}`}>
    <div className="font-serif text-base font-bold leading-tight">{value}</div>
    <div className="mt-0.5 text-[10px] opacity-80">{label}</div>
  </div>
);
