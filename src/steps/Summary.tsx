import { Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { MODULES } from "@/data/modules";
import { SUBSIDIES } from "@/data/subsidies";
import { moduleIcons } from "@/lib/icons";
import { formatCHF } from "@/lib/format";
import { useStore } from "@/lib/store";

export const Summary = () => {
  const { selectedModules, selectedContractors } = useStore();

  const totalCost = selectedModules.reduce((s, id) => {
    const ct = selectedContractors[id];
    const mod = MODULES.find((m) => m.id === id);
    return s + (ct ? ct.price : (mod?.estCost ?? 0));
  }, 0);
  const totalSubsidies = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  const annualSaving = selectedModules.reduce(
    (s, id) => s + (MODULES.find((m) => m.id === id)?.energySaving ?? 0),
    0,
  );
  const co2Saving = selectedModules.reduce(
    (s, id) => s + (MODULES.find((m) => m.id === id)?.co2Saving ?? 0),
    0,
  );

  return (
    <>
      <SectionHeading
        eyebrow="Step 7"
        title="Your renovation summary"
        description="Review your complete plan before booking the GEAK Plus audit."
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy via-navy to-teal p-6 text-white">
        <div className="grid grid-cols-3 gap-3">
          <Stat value="F → B" label="GEAK improvement" tone="white" size="lg" />
          <Stat value={formatCHF(annualSaving)} label="Annual savings" tone="mint" size="lg" />
          <Stat value={`−${co2Saving.toFixed(1)} t`} label="CO₂ per year" tone="gold" size="lg" />
        </div>
      </Card>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-navy">Selected modules & contractors</h3>
      <div className="space-y-2">
        {selectedModules.map((id) => {
          const mod = MODULES.find((m) => m.id === id);
          if (!mod) return null;
          const ct = selectedContractors[id];
          const Icon = moduleIcons[mod.iconKey] ?? moduleIcons.facade;
          return (
            <Card key={id} className="flex items-center gap-3 p-3.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink/70">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy">{mod.name}</div>
                <div className="text-xs text-muted">
                  {ct ? ct.name : <span className="text-warning">No contractor selected</span>}
                </div>
              </div>
              <div className="text-sm font-bold text-navy">
                {formatCHF(ct ? ct.price : mod.estCost)}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-3 p-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted">Total cost: </span>
            <strong className="text-navy">{formatCHF(totalCost)}</strong>
          </div>
          <div>
            <span className="text-muted">Subsidies: </span>
            <strong className="text-emerald">{formatCHF(totalSubsidies)}</strong>
          </div>
          <div>
            <span className="text-muted">Net financing: </span>
            <strong className="text-teal">{formatCHF(totalCost - totalSubsidies)}</strong>
          </div>
          <div>
            <span className="text-muted">Timeline: </span>
            <strong className="text-navy">~5 months</strong>
          </div>
        </div>
      </Card>

      <Card className="mt-3 p-6 text-center">
        <Button
          size="lg"
          onClick={() => alert("In a real product, this would open scheduling for the GEAK Plus audit.")}
        >
          <Calendar size={16} />
          Book your free GEAK Plus audit
          <ArrowRight size={16} />
        </Button>
        <p className="mt-3 text-[11px] text-muted">
          Certified auditor visits within 5 business days · No obligations
        </p>
      </Card>

      <StepNav currentIndex={6} />
    </>
  );
};
