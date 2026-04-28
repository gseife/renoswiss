import { clsx } from "@/lib/clsx";

const CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;
type GeakClass = (typeof CLASSES)[number];

const COLORS: Record<GeakClass, string> = {
  A: "bg-emerald",
  B: "bg-[#4CAF50]",
  C: "bg-[#8BC34A]",
  D: "bg-[#FFC107]",
  E: "bg-[#FF9800]",
  F: "bg-[#FF5722]",
  G: "bg-[#D32F2F]",
};

interface GeakBarProps {
  current: GeakClass;
  target: GeakClass;
}

export const GeakBar = ({ current, target }: GeakBarProps) => (
  <div className="grid grid-cols-7 gap-1">
    {CLASSES.map((c) => {
      const isCurrent = c === current;
      const isTarget = c === target;
      const dim = !isCurrent && !isTarget;
      return (
        <div key={c} className="text-center">
          <div className="h-3 text-[9px] font-bold uppercase tracking-wider">
            {isCurrent && <span className="text-danger">Now</span>}
            {isTarget && <span className="text-emerald">Target</span>}
          </div>
          <div
            className={clsx(
              "h-7 rounded transition-opacity",
              COLORS[c],
              dim && "opacity-20",
              isCurrent && "ring-2 ring-danger",
              isTarget && "ring-2 ring-emerald",
            )}
          />
          <div className="mt-1 text-[12px] font-semibold text-navy">{c}</div>
        </div>
      );
    })}
  </div>
);
