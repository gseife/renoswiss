import { useState } from "react";
import { Calendar, ArrowRight, Printer, Trees, AlertOctagon, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { MODULES } from "@/data/modules";
import { BUILDING } from "@/data/building";
import { moduleIcons } from "@/lib/icons";
import { formatCHF, formatNumber } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { computeTotals, treesEquivalent, ESTIMATE_RATE, ESTIMATE_TERM } from "@/lib/derived";
import { calcFinance } from "@/lib/finance";
import { clsx } from "@/lib/clsx";
import type { ModuleId } from "@/data/types";

const PROJECTION_YEARS = 15;

export const Summary = () => {
  useDocumentTitle("Step 7 — Summary");
  const { selectedModules, selectedContractors } = useStore();
  const [excluded, setExcluded] = useState<ModuleId | null>(null);

  const totals = computeTotals(selectedModules, selectedContractors);

  // Scenario compare: same totals but with one module excluded
  const compareModules = excluded
    ? selectedModules.filter((id) => id !== excluded)
    : selectedModules;
  const compareTotals = computeTotals(compareModules, selectedContractors);

  const trees = treesEquivalent(totals.annualCO2Saving);

  // "Do nothing" baseline: 15 years of energy bills + boiler replacement +
  // a conservative property-value erosion as energy standards tighten.
  const energyOver15 = BUILDING.annualCost * PROJECTION_YEARS;
  const boilerReplacement = 18_000; // typical oil/gas replacement cost
  const valueErosion = Math.round(BUILDING.estimatedValue * 0.06); // ~6% drag on property value
  const doNothingCost = energyOver15 + boilerReplacement + valueErosion;

  const renovateOver15 =
    totals.netFinancing +
    calcFinance({
      netFinancing: totals.netFinancing,
      rate: ESTIMATE_RATE,
      termYears: ESTIMATE_TERM,
      marginalTaxRate: 25,
      totalCost: totals.totalCost,
      annualEnergySaving: totals.annualEnergySaving,
    }).totalInterest -
    totals.annualEnergySaving * PROJECTION_YEARS;

  const lifetimeAdvantage = doNothingCost - renovateOver15;

  return (
    <>
      <SectionHeading
        eyebrow="Step 7"
        title="Your renovation summary"
        description="Review your complete plan before booking the GEAK Plus audit."
        trailing={
          <Button variant="secondary" size="sm" onClick={() => window.print()} className="no-print">
            <Printer size={14} />
            Print report
          </Button>
        }
      />

      <Card className="print:keep-bg overflow-hidden border-0 bg-gradient-to-br from-navy via-navy to-teal p-6 text-white">
        <div className="grid grid-cols-3 gap-3">
          <Stat value={totals.geakImprovement} label="GEAK improvement" tone="white" size="lg" />
          <Stat value={formatCHF(totals.annualEnergySaving)} label="Annual savings" tone="mint" size="lg" />
          <Stat value={`−${totals.annualCO2Saving.toFixed(1)} t`} label="CO₂ per year" tone="gold" size="lg" />
        </div>
      </Card>

      {/* CO₂ trees-equivalent widget */}
      {totals.annualCO2Saving > 0 && (
        <Card className="mt-4 flex items-center gap-4 border-l-4 border-l-emerald bg-emerald/5 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald">
            <Trees size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-navy">
              That's like planting <strong className="text-emerald">{formatNumber(trees)} trees</strong> every year
            </div>
            <p className="text-xs text-muted">
              Each mature tree absorbs ~21 kg of CO₂ per year. Your renovation has the same
              annual climate impact as a small forest.
            </p>
          </div>
        </Card>
      )}

      <h3 className="mt-6 mb-3 font-serif text-base font-bold text-navy">Selected modules & contractors</h3>
      <p className="mb-3 text-xs text-muted no-print">
        Tap a module to preview your plan without it.
      </p>
      <div className="space-y-2">
        {selectedModules.map((id) => {
          const mod = MODULES.find((m) => m.id === id);
          if (!mod) return null;
          const ct = selectedContractors[id];
          const Icon = moduleIcons[mod.iconKey] ?? moduleIcons.facade;
          const isExcluded = excluded === id;
          return (
            <Card
              key={id}
              className={clsx(
                "flex items-center gap-3 p-4 transition-all",
                isExcluded && "border-warning/40 bg-warning/5 opacity-70",
              )}
              hoverable={!isExcluded}
              onClick={() => setExcluded(isExcluded ? null : id)}
              role="button"
              aria-pressed={isExcluded}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExcluded(isExcluded ? null : id);
                }
              }}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink/70">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy">{mod.name}</div>
                <div className="text-xs text-muted">
                  {ct ? ct.name : <span className="text-warning">No contractor selected</span>}
                </div>
              </div>
              <div className={clsx("text-sm font-bold", isExcluded ? "text-muted line-through" : "text-navy")}>
                {formatCHF(ct ? ct.price : mod.estCost)}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Scenario compare result */}
      {excluded && (
        <Card className="mt-3 border-warning/40 bg-warning/5 p-4 no-print">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warning/15 text-warning">
              <AlertOctagon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-navy">
                Without {MODULES.find((m) => m.id === excluded)?.name}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <Delta label="Cost" before={totals.totalCost} after={compareTotals.totalCost} format={formatCHF} />
                <Delta
                  label="Annual savings"
                  before={totals.annualEnergySaving}
                  after={compareTotals.annualEnergySaving}
                  format={formatCHF}
                  inverted
                />
                <Delta
                  label="GEAK"
                  beforeText={totals.geakImprovement}
                  afterText={compareTotals.geakImprovement}
                />
              </div>
            </div>
            <button
              onClick={() => setExcluded(null)}
              className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-canvas hover:text-ink"
              aria-label="Clear comparison"
            >
              <X size={14} />
            </button>
          </div>
        </Card>
      )}

      <Card className="mt-3 p-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted">Total cost: </span>
            <strong className="text-navy">{formatCHF(totals.totalCost)}</strong>
          </div>
          <div>
            <span className="text-muted">Subsidies: </span>
            <strong className="text-emerald">{formatCHF(totals.totalSubsidies)}</strong>
          </div>
          <div>
            <span className="text-muted">Net financing: </span>
            <strong className="text-teal">{formatCHF(totals.netFinancing)}</strong>
          </div>
          <div>
            <span className="text-muted">Timeline: </span>
            <strong className="text-navy">~5 months</strong>
          </div>
        </div>
      </Card>

      {/* "Do nothing" baseline */}
      <h3 className="mt-6 mb-3 font-serif text-base font-bold text-navy">
        Or… what if you do nothing?
      </h3>
      <Card className="border-l-4 border-l-danger bg-danger/[0.04] p-5">
        <p className="mb-4 text-sm text-ink/80">
          Over the next {PROJECTION_YEARS} years, doing nothing isn't free.
        </p>
        <ul className="space-y-2 text-sm">
          <BaselineRow
            label={`Energy bills (${formatCHF(BUILDING.annualCost)}/yr × ${PROJECTION_YEARS} yrs)`}
            value={formatCHF(energyOver15)}
          />
          <BaselineRow label="Forced boiler replacement (lifespan exceeded)" value={formatCHF(boilerReplacement)} />
          <BaselineRow
            label="Property value erosion as energy standards tighten"
            value={formatCHF(valueErosion)}
          />
        </ul>
        <div className="mt-4 border-t border-danger/20 pt-3 flex items-baseline justify-between">
          <span className="text-sm font-bold text-navy">15-year cost of inaction</span>
          <span className="font-serif text-xl font-bold text-danger">{formatCHF(doNothingCost)}</span>
        </div>
        {totals.totalCost > 0 && lifetimeAdvantage > 0 && (
          <div className="mt-4 rounded-lg bg-emerald/10 p-3 text-center text-xs text-emerald">
            <strong>Renovating saves you ~{formatCHF(lifetimeAdvantage)} over 15 years</strong> compared to doing nothing
            (after subsidies, energy savings and interest).
          </div>
        )}
      </Card>

      <Card className="mt-3 p-6 text-center no-print">
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

      <div className="no-print">
        <StepNav currentIndex={6} />
      </div>
    </>
  );
};

interface DeltaProps {
  label: string;
  before?: number;
  after?: number;
  format?: (n: number) => string;
  inverted?: boolean;
  beforeText?: string;
  afterText?: string;
}

const Delta = ({ label, before, after, format, inverted, beforeText, afterText }: DeltaProps) => {
  if (beforeText !== undefined && afterText !== undefined) {
    return (
      <div className="text-xs">
        <div className="text-muted">{label}</div>
        <div className="mt-1">
          <span className="text-ink/80">{beforeText}</span>
          <span className="mx-1 text-muted">→</span>
          <span className="font-semibold text-navy">{afterText}</span>
        </div>
      </div>
    );
  }
  if (before === undefined || after === undefined || !format) return null;
  const diff = after - before;
  const isImprovement = inverted ? diff < 0 : diff > 0;
  const tone = isImprovement ? "text-warning" : diff === 0 ? "text-muted" : "text-emerald";
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  return (
    <div className="text-xs">
      <div className="text-muted">{label}</div>
      <div className={`mt-1 font-semibold ${tone}`}>
        {sign}
        {format(Math.abs(diff))}
      </div>
    </div>
  );
};

const BaselineRow = ({ label, value }: { label: string; value: string }) => (
  <li className="flex items-baseline justify-between gap-3">
    <span className="text-ink/80">{label}</span>
    <span className="font-semibold text-navy">{value}</span>
  </li>
);
