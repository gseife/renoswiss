import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  Printer,
  Trees,
  AlertOctagon,
  ClipboardList,
  Check,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { moduleIcons } from "@/lib/icons";
import { formatCHF, formatNumber } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useScaledModules } from "@/lib/useScaledModules";
import { useSubsidies } from "@/lib/useSubsidies";
import { priceFor } from "@/lib/gis/contractorPricing";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import {
  computeTotals,
  resolveActiveOffer,
  treesEquivalent,
  ESTIMATE_RATE,
  ESTIMATE_TERM,
} from "@/lib/derived";
import { calcFinance } from "@/lib/finance";
import { clsx } from "@/lib/clsx";
import type { ModuleId } from "@/data/types";

const PROJECTION_YEARS = 15;

export const Summary = () => {
  useDocumentTitle("Step 7 — Summary");
  const {
    selectedModules,
    selectedContractors,
    finance,
    projectStart,
    setProjectStart,
    building,
  } = useStore();
  const modules = useScaledModules();
  const subsidies = useSubsidies();
  const [excluded, setExcluded] = useState<ModuleId | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookedEmail, setBookedEmail] = useState<string | null>(null);

  if (selectedModules.length === 0) {
    return (
      <>
        <SectionHeading
          eyebrow="Step 7"
          title="Your renovation summary"
          description="Pick at least one renovation module first — there's nothing to summarise yet."
        />
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-muted">
            <ClipboardList size={22} />
          </div>
          <p className="text-sm text-muted">
            The summary pulls together your modules, contractors and financing.
            Choose your modules on Step 2 to populate this page.
          </p>
          <Link
            to="/plan"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-canvas"
          >
            <ArrowLeft size={14} /> Back to modules
          </Link>
        </Card>
        <div className="no-print">
          <StepNav />
        </div>
      </>
    );
  }

  const totals = computeTotals(selectedModules, selectedContractors, modules, subsidies);
  const activeOffer = resolveActiveOffer(finance, totals);

  // Scenario compare: same totals but with one module excluded
  const compareModules = excluded
    ? selectedModules.filter((id) => id !== excluded)
    : selectedModules;
  const compareTotals = computeTotals(
    compareModules,
    selectedContractors,
    modules,
    subsidies,
  );

  const trees = treesEquivalent(totals.annualCO2Saving);

  // "Do nothing" baseline: 15 years of energy bills + boiler replacement +
  // a conservative property-value erosion as energy standards tighten.
  const energyOver15 = building.annualCost * PROJECTION_YEARS;
  const boilerReplacement = 18_000; // typical oil/gas replacement cost
  const valueErosion = Math.round(building.estimatedValue * 0.06); // ~6% drag on property value
  const doNothingCost = energyOver15 + boilerReplacement + valueErosion;

  const renoLoan = activeOffer?.renovationLoan ?? totals.netFinancing;
  const renoRate = activeOffer?.rate ?? ESTIMATE_RATE;
  const renoTerm = finance.term ?? ESTIMATE_TERM;
  const ownFunds = activeOffer
    ? activeOffer.cashOwnFunds + activeOffer.pensionOwnFunds
    : Math.min(finance.ownFundsCash + finance.ownFundsPension, totals.netFinancing);

  const financeResult = calcFinance({
    netFinancing: renoLoan,
    rate: renoRate,
    termYears: renoTerm,
    marginalTaxRate: finance.taxRate,
    totalCost: totals.totalCost,
    annualEnergySaving: totals.annualEnergySaving,
  });

  const renovateOver15 =
    renoLoan +
    financeResult.totalInterest -
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
          const mod = modules.find((m) => m.id === id);
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
                {formatCHF(ct ? priceFor(ct, mod) : mod.estCost)}
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
                Without {modules.find((m) => m.id === excluded)?.name}
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
        <h3 className="mb-3 font-serif text-base font-bold text-navy">Financing</h3>
        <dl className="space-y-2 text-sm">
          <SummaryLine label="Total renovation cost" value={formatCHF(totals.totalCost)} bold />
          <SummaryLine
            label="Subsidies (pre-qualified)"
            value={`− ${formatCHF(totals.totalSubsidies)}`}
            positive
          />
          <SummaryLine
            label="Own funds you bring (cash + pension)"
            value={`− ${formatCHF(ownFunds)}`}
            positive
            muted={ownFunds === 0}
          />
        </dl>
        <div className="my-3 border-t border-line" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-navy">
            {renoLoan > 0
              ? activeOffer
                ? `Loan from ${activeOffer.bankName}`
                : "New financing needed"
              : "Fully covered"}
          </span>
          <span
            className={clsx(
              "font-serif text-xl font-bold",
              renoLoan > 0 ? "text-teal" : "text-emerald",
            )}
          >
            {formatCHF(renoLoan)}
          </span>
        </div>

        {renoLoan > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg border border-line bg-canvas/40 p-3 text-center text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Product · rate</div>
              <div className="mt-0.5 font-bold text-navy">
                {activeOffer
                  ? `${activeOffer.productName} · ${activeOffer.rate.toFixed(2)}%`
                  : `~${ESTIMATE_RATE}% (est.)`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Term</div>
              <div className="mt-0.5 font-bold text-navy">{renoTerm} yrs</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Monthly payment</div>
              <div className="mt-0.5 font-bold text-navy">
                {formatCHF(financeResult.monthlyPayment)}
              </div>
            </div>
          </div>
        )}

        {renoLoan > 0 && !activeOffer && (
          <p className="mt-2 text-[11px] text-muted">
            No bank locked in yet — the figures above use a {ESTIMATE_RATE}% indicative rate. Pick a
            bank in the Calculator step to lock in a real offer.
          </p>
        )}
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
            label={`Energy bills (${formatCHF(building.annualCost)}/yr × ${PROJECTION_YEARS} yrs)`}
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

      {bookedEmail ? (
        <Card className="mt-6 border-l-4 border-l-emerald bg-emerald/5 p-6 no-print">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald text-white">
              <Check size={18} strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-navy">
                Audit booked — invitation sent to{" "}
                <span className="text-emerald">{bookedEmail}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                A certified GEAK auditor will arrive on{" "}
                <strong className="text-navy">{formatLongDate(projectStart)}</strong>.
                Demo complete — thanks for stepping through RenoSwiss.
              </p>
              <p className="mt-3 text-[11px] text-muted">
                In a real product, the calendar invitation, contractor briefs and
                subsidy applications would all dispatch from this confirmation.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 p-6 text-center no-print">
          <Button size="lg" onClick={() => setShowBooking(true)}>
            <Calendar size={16} />
            Book your free GEAK Plus audit
            <ArrowRight size={16} />
          </Button>
          <p className="mt-3 text-[11px] text-muted">
            Certified auditor visits within 5 business days · No obligations
          </p>
        </Card>
      )}

      <div className="no-print">
        <StepNav />
      </div>

      {showBooking && (
        <BookingModal
          initialDate={projectStart ?? ""}
          onClose={() => setShowBooking(false)}
          onConfirm={(date, email) => {
            setProjectStart(date);
            setBookedEmail(email);
            setShowBooking(false);
          }}
        />
      )}
    </>
  );
};

const formatLongDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface BookingModalProps {
  initialDate: string;
  onClose: () => void;
  onConfirm: (date: string, email: string) => void;
}

const BookingModal = ({ initialDate, onClose, onConfirm }: BookingModalProps) => {
  const [date, setDate] = useState(initialDate);
  const [slot, setSlot] = useState<string>("09:00");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const min = today;
  const dateObj = date ? new Date(`${date}T00:00:00`) : null;
  const isWeekend =
    dateObj && (dateObj.getDay() === 0 || dateObj.getDay() === 6);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const dateValid = !!date && !isWeekend;
  const valid = dateValid && emailValid;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-navy"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Step 7 · Book audit
        </div>
        <h3
          id="booking-title"
          className="mt-3 font-serif text-[26px] font-bold leading-tight tracking-tight text-navy"
        >
          Pick a date for your GEAK audit.
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/70">
          We'll send a calendar invitation with your auditor's details and the
          on-site checklist.
        </p>

        <label className="mt-5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Audit date
        </label>
        <input
          type="date"
          value={date}
          min={min}
          onChange={(e) => setDate(e.target.value)}
          onBlur={() => setTouched(true)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        {isWeekend && (
          <p className="mt-1 text-[11px] text-warning">
            Auditors don't visit on weekends — pick a weekday.
          </p>
        )}

        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Preferred slot
        </label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {["09:00", "13:00", "16:00"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={clsx(
                "h-10 rounded-lg border text-[13px] font-semibold transition-colors",
                slot === s
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-line bg-white text-ink/70 hover:border-navy/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="you@example.ch"
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        {touched && !emailValid && (
          <p className="mt-1 text-[11px] text-warning">
            Please enter a valid email address.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="md"
            disabled={!valid}
            onClick={() => valid && onConfirm(date, email)}
          >
            Send invitation
            <ArrowRight size={14} />
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted">
          Free · 90-minute on-site assessment · No obligations
        </p>
      </div>
    </div>
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

const SummaryLine = ({
  label,
  value,
  bold,
  positive,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
  muted?: boolean;
}) => (
  <div className="flex justify-between">
    <span className={muted ? "text-muted" : "text-ink/80"}>{label}</span>
    <span
      className={clsx(
        bold && "font-bold text-navy",
        positive && !muted && "font-bold text-emerald",
        muted && "text-muted",
      )}
    >
      {value}
    </span>
  </div>
);

const BaselineRow = ({ label, value }: { label: string; value: string }) => (
  <li className="flex items-baseline justify-between gap-3">
    <span className="text-ink/80">{label}</span>
    <span className="font-semibold text-navy">{value}</span>
  </li>
);
