import { type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

interface StatProps {
  value: ReactNode;
  label: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "teal" | "emerald" | "white" | "gold" | "mint" | "danger" | "warning";
  className?: string;
}

const toneClass = {
  ink: "text-navy",
  teal: "text-teal",
  emerald: "text-emerald",
  white: "text-white",
  gold: "text-gold-soft",
  mint: "text-mint",
  danger: "text-danger",
  warning: "text-warning",
} as const;

const sizeClass = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
} as const;

export const Stat = ({ value, label, size = "md", tone = "ink", className }: StatProps) => (
  <div className={clsx("text-center", className)}>
    <div
      className={clsx(
        "font-serif font-bold leading-tight",
        sizeClass[size],
        toneClass[tone],
      )}
    >
      {value}
    </div>
    <div className="mt-0.5 text-[11px] text-muted">{label}</div>
  </div>
);
