interface StatBarProps {
  value: number;
  max?: number;
  label: string;
  suffix?: string;
  tone?: "teal" | "emerald" | "info" | "gold";
}

const toneClass = {
  teal: "bg-teal",
  emerald: "bg-emerald",
  info: "bg-info",
  gold: "bg-gold",
} as const;

const textTone = {
  teal: "text-teal",
  emerald: "text-emerald",
  info: "text-info",
  gold: "text-gold",
} as const;

export const StatBar = ({
  value,
  max = 100,
  label,
  suffix = "%",
  tone = "teal",
}: StatBarProps) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[11px]">
      <span className="text-ink">{label}</span>
      <span className={`font-semibold ${textTone[tone]}`}>
        {value}
        {suffix}
      </span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-smooth ${toneClass[tone]}`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  </div>
);
