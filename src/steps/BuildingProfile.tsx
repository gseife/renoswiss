import { AlertTriangle, MapPin, Calendar, Flame, Layers, AppWindow, Home, Box } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { GeakBar } from "@/components/ui/GeakBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { BUILDING } from "@/data/building";
import { formatCHF, formatNumber } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export const BuildingProfile = () => {
  useDocumentTitle("Step 1 — Building Profile");
  const { address } = useStore();
  const b = BUILDING;

  const facts: Array<{
    icon: typeof MapPin;
    label: string;
    value: string;
    tone?: "danger" | "warning";
  }> = [
    { icon: MapPin, label: "Address", value: address },
    { icon: Calendar, label: "Year / Type", value: `${b.year} · ${b.type} · ${b.area} m²` },
    { icon: Flame, label: "Heating", value: b.heating, tone: "danger" },
    { icon: Layers, label: "Insulation", value: b.insulation, tone: "warning" },
    { icon: AppWindow, label: "Windows", value: b.windows, tone: "warning" },
    { icon: Home, label: "Roof", value: b.roof, tone: "warning" },
    { icon: Box, label: "Basement", value: b.basement, tone: "warning" },
  ];

  const toneClass = {
    danger: "text-danger",
    warning: "text-warning",
  } as const;

  return (
    <>
      <SectionHeading
        eyebrow="Step 1"
        title="Your building profile"
        description="Pulled from the Swiss Federal Building Register (GWR), GEAK database, and cantonal records."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {facts.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.label} className="flex items-start gap-3 p-4">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink/70">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted">{f.label}</div>
                <div
                  className={`mt-0.5 text-sm font-semibold ${
                    f.tone ? toneClass[f.tone] : "text-navy"
                  }`}
                >
                  {f.value}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-navy">GEAK energy rating</h3>
          <span className="text-[11px] uppercase tracking-wider text-muted">After renovation target</span>
        </div>
        <GeakBar current={b.geakClass} target="B" />
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5">
          <Stat value={`${formatNumber(b.annualEnergy)} kWh`} label="Annual consumption" tone="ink" />
          <Stat value={formatCHF(b.annualCost)} label="Annual cost" tone="danger" />
          <Stat value={`${b.co2} t`} label="CO₂ per year" tone="warning" />
        </div>
      </Card>

      <Card className="mt-4 border-l-4 border-l-gold bg-[#FFFDF5] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="shrink-0 text-gold" size={18} />
          <div>
            <div className="text-sm font-semibold text-navy">Renovation urgency: High</div>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">
              Oil boiler is {b.heatingAge} years old (typical lifespan 20–25 years), GEAK class F.
              MuKEn 2025 tightening means acting within 12 months maximizes available subsidies.
              From 2026, fossil-boiler replacement will require insulation first.
            </p>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        <strong className="text-ink/80">Demo data.</strong> The address above
        is yours; the building characteristics, GEAK class and energy figures
        are illustrative for this prototype. In a real deployment they'd be
        pulled from <em>swisstopo</em> + <em>GWR</em> + an audit partner — see{" "}
        <code className="rounded bg-canvas px-1 py-0.5 text-[10px]">docs/data-sourcing.md</code>
        {" "}for the wiring plan.
      </p>

      <StepNav />
    </>
  );
};
