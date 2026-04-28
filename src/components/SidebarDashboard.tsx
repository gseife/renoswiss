import { Activity, TrendingDown, Wallet, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeTotals } from "@/lib/derived";
import { formatCHF } from "@/lib/format";

export const SidebarDashboard = () => {
  const { selectedModules, selectedContractors } = useStore();
  const t = computeTotals(selectedModules, selectedContractors);

  const fillPct = t.modulesTotal > 0 ? (t.modulesSelected / t.modulesTotal) * 100 : 0;

  return (
    <div className="rounded-xl border border-line bg-gradient-to-br from-canvas to-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Your plan, live
        </div>
        <Activity size={12} className="text-teal" />
      </div>

      <div className="space-y-2.5">
        <Row icon={Sparkles} label="GEAK" value={t.geakImprovement} tone="teal" highlight />
        <Row icon={Wallet} label="Net to finance" value={formatCHF(t.netFinancing)} />
        <Row
          icon={TrendingDown}
          label="Est. CHF/month"
          value={formatCHF(Math.max(0, t.netMonthlyCostEstimate))}
          tone="emerald"
        />
      </div>

      <div className="mt-3 border-t border-line pt-2.5">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted">
          <span>{t.modulesSelected} of {t.modulesTotal} modules</span>
          <span>{t.contractorsChosen} contractors</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-teal transition-[width] duration-500 ease-smooth"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Row = ({
  icon: Icon,
  label,
  value,
  tone = "ink",
  highlight,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone?: "ink" | "teal" | "emerald";
  highlight?: boolean;
}) => {
  const toneClass = {
    ink: "text-navy",
    teal: "text-teal",
    emerald: "text-emerald",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Icon size={12} />
        {label}
      </span>
      <span className={`font-serif font-bold ${toneClass} ${highlight ? "text-base" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
};
