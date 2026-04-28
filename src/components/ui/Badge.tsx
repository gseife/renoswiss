import { type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type Tone = "teal" | "emerald" | "gold" | "danger" | "warning" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  teal: "bg-teal/10 text-teal",
  emerald: "bg-emerald/10 text-emerald",
  gold: "bg-gold/10 text-gold",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/15 text-[#a36106]",
  info: "bg-info/10 text-info",
  muted: "bg-line text-muted",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ tone = "teal", children, className }: BadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      toneClass[tone],
      className,
    )}
  >
    {children}
  </span>
);
