import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { MODULES } from "@/data/modules";
import { SUBSIDIES } from "@/data/subsidies";
import { formatCHF } from "@/lib/format";
import { calcFinance } from "@/lib/finance";
import { useStore } from "@/lib/store";

export const FinancialCalc = () => {
  const { selectedModules, selectedContractors } = useStore();
  const [rate, setRate] = useState(1.85);
  const [term, setTerm] = useState(15);
  const [taxRate, setTaxRate] = useState(25);

  const totalCost = selectedModules.reduce((s, id) => {
    const ct = selectedContractors[id];
    const mod = MODULES.find((m) => m.id === id);
    return s + (ct ? ct.price : (mod?.estCost ?? 0));
  }, 0);

  const totalSubsidies = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  const netFinancing = Math.max(0, totalCost - totalSubsidies);
  const annualEnergySaving = selectedModules.reduce(
    (s, id) => s + (MODULES.find((m) => m.id === id)?.energySaving ?? 0),
    0,
  );

  const result = useMemo(
    () =>
      calcFinance({
        netFinancing,
        rate,
        termYears: term,
        marginalTaxRate: taxRate,
        totalCost,
        annualEnergySaving,
      }),
    [netFinancing, rate, term, taxRate, totalCost, annualEnergySaving],
  );

  const subsidyPct = totalCost > 0 ? Math.round((totalSubsidies / totalCost) * 100) : 0;

  return (
    <>
      <SectionHeading
        eyebrow="Step 5"
        title="Financial calculator"
        description="Adjust the parameters to see your real net cost. All figures derive from your selected modules and contractors."
      />

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-navy">Cost overview</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <Line label="Total renovation cost" value={formatCHF(totalCost)} bold />
          <Line label="Subsidies (pre-qualified)" value={`− ${formatCHF(totalSubsidies)}`} positive />
        </dl>
        <div className="my-3 border-t border-line" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-navy">Net financing needed</span>
          <span className="font-serif text-xl font-bold text-teal">{formatCHF(netFinancing)}</span>
        </div>
        {totalCost > 0 && (
          <>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line">
              <div className="bg-emerald" style={{ width: `${subsidyPct}%` }} />
              <div className="flex-1 bg-teal" />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-semibold">
              <span className="text-emerald">{subsidyPct}% subsidized</span>
              <span className="text-teal">{100 - subsidyPct}% financed</span>
            </div>
          </>
        )}
      </Card>

      <Card className="mt-3 p-5">
        <h3 className="mb-4 text-sm font-semibold text-navy">Financing parameters</h3>
        <div className="space-y-5">
          <Slider label="Interest rate" value={`${rate}%`} min={1} max={3.5} step={0.05} val={rate} onChange={setRate} />
          <Slider label="Loan term" value={`${term} years`} min={5} max={25} step={1} val={term} onChange={setTerm} />
          <Slider label="Marginal tax rate" value={`${taxRate}%`} min={10} max={40} step={1} val={taxRate} onChange={setTaxRate} />
        </div>
      </Card>

      <Card className="mt-3 overflow-hidden border-0 bg-gradient-to-br from-navy to-teal p-6 text-white">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-soft">
          Monthly net impact
        </h3>
        <DarkLine label="Mortgage payment" value={formatCHF(result.monthlyPayment)} sign="+" />
        <DarkLine label="Energy savings" value={formatCHF(result.monthlyEnergySaving)} sign="−" tone="mint" />
        <DarkLine label="Tax deduction benefit" value={formatCHF(result.monthlyTaxBenefit)} sign="−" tone="mint" />
        <div className="my-3 border-t border-white/15" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold">Your net monthly cost</span>
          <span className="font-serif text-2xl font-bold text-gold-soft">
            {formatCHF(result.netMonthlyCost)}
          </span>
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <h3 className="mb-3 text-sm font-semibold text-navy">Long-term value</h3>
        <div className="grid grid-cols-3 gap-2">
          <KPI label="Property uplift" value={formatCHF(result.propertyIncrease)} tone="emerald" />
          <KPI label="Annual energy savings" value={formatCHF(annualEnergySaving)} tone="teal" />
          <KPI
            label="Estimated payback"
            value={Number.isFinite(result.paybackYears) ? `${Math.round(result.paybackYears)} yrs` : "—"}
            tone="navy"
          />
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">
          Total interest over {term} years: {formatCHF(result.totalInterest)} · Total energy
          savings over {term} years: {formatCHF(annualEnergySaving * term)}
        </p>
      </Card>

      <StepNav currentIndex={4} />
    </>
  );
};

const Line = ({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-ink/80">{label}</span>
    <span className={`${bold ? "font-bold text-navy" : ""} ${positive ? "font-bold text-emerald" : ""}`}>
      {value}
    </span>
  </div>
);

const DarkLine = ({
  label,
  value,
  sign,
  tone,
}: {
  label: string;
  value: string;
  sign: "+" | "−";
  tone?: "mint";
}) => (
  <div className="flex items-center justify-between py-1 text-sm">
    <span className="text-white/70">
      {sign} {label}
    </span>
    <span className={tone === "mint" ? "font-semibold text-mint" : "font-semibold text-white"}>{value}</span>
  </div>
);

const Slider = ({
  label,
  value,
  min,
  max,
  step,
  val,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  val: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between text-xs">
      <label className="text-ink/80">{label}</label>
      <span className="font-bold text-navy">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={val}
      onChange={(e) => onChange(+e.target.value)}
      aria-label={label}
    />
  </div>
);

const kpiTone = {
  emerald: "bg-emerald/10 text-emerald",
  teal: "bg-teal/10 text-teal",
  navy: "bg-canvas text-navy",
} as const;

const KPI = ({ label, value, tone }: { label: string; value: string; tone: keyof typeof kpiTone }) => (
  <div className={`rounded-lg px-2 py-3 text-center ${kpiTone[tone]}`}>
    <div className="font-serif text-base font-bold leading-tight">{value}</div>
    <div className="mt-0.5 text-[10px] opacity-80">{label}</div>
  </div>
);
