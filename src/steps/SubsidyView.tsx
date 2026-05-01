import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { SUBSIDIES } from "@/data/subsidies";
import { formatCHF } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const statusTone = {
  "Pre-qualified": "emerald",
  Eligible: "gold",
  "To verify": "warning",
} as const;

export const SubsidyView = () => {
  useDocumentTitle("Step 4 — Subsidies");
  const total = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  const filed = SUBSIDIES.filter((s) => s.auto).length;

  return (
    <>
      <SectionHeading
        eyebrow="Step 4"
        title="Subsidy optimization"
        description="Auto-identified across federal, cantonal and municipal programs for your property in Kanton Zürich."
      />

      <div className="space-y-2">
        {SUBSIDIES.map((sub) => (
          <Card
            key={sub.source}
            className={`p-4 ${sub.auto ? "border-l-4 border-l-emerald" : "border-l-4 border-l-gold"}`}
            hoverable
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-navy">{sub.source}</div>
                <div className="mt-0.5 text-xs text-muted">{sub.desc}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-serif text-lg font-bold text-emerald">
                  {formatCHF(sub.amount)}
                </div>
                <div className="mt-1 flex items-center justify-end gap-1.5">
                  <Badge tone={statusTone[sub.status]}>{sub.status}</Badge>
                  {sub.auto && <span className="text-[10px] text-teal">Auto-filed</span>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-5 overflow-hidden border-0 p-0">
        <div className="bg-gradient-to-br from-navy to-teal px-6 py-5 text-white">
          <div className="grid grid-cols-3 gap-2">
            <Stat value={formatCHF(total)} label="Total identified" tone="white" />
            <Stat value={`${filed} of ${SUBSIDIES.length}`} label="Auto-filed" tone="mint" />
            <Stat value="~40%" label="More than avg." tone="gold" />
          </div>
        </div>
      </Card>

      <Card className="mt-3 border-l-4 border-l-info bg-info/5 p-4">
        <div className="flex gap-3">
          <Info className="shrink-0 text-info" size={16} />
          <p className="text-xs leading-relaxed text-ink/80">
            <strong className="text-navy">Important:</strong> Most cantonal programs require
            applications before construction begins. Missing this deadline means forfeiting the
            subsidy. RenoSwiss files {filed} of {SUBSIDIES.length} applications automatically —
            ensuring no money is left on the table.
          </p>
        </div>
      </Card>

      <StepNav />
    </>
  );
};
