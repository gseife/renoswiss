import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  Trees,
  AlertOctagon,
  ClipboardList,
  Check,
  Phone,
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
import { heatingCapacityKw } from "@/lib/gis/buildingAreas";
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
import type { Building, ModuleId } from "@/data/types";
import type { Eligibility } from "@/lib/gis/mapper";

const PROJECTION_YEARS = 15;
/** Typical residential heating-system lifespan, in years. Below this
 * threshold no forced replacement is expected within the projection. */
const HEATING_LIFESPAN = 20;

type BookingMode = "order" | "callback";

interface ForcedReplacement {
  label: string;
  cost: number;
}

/**
 * The "do nothing" cost of letting the existing heating system age out
 * within the projection window. Returns null when no forced replacement
 * applies — e.g. a Fernwärme connection (no on-site boiler), a recently
 * renewed system (lifespan clock just reset), or a system that won't
 * reach end-of-life inside `years` years. Cost and label adapt to the
 * actual heating type so the baseline tells the truth for each building.
 */
const forcedReplacementFor = (
  building: Building,
  eligibility: Eligibility | null,
  years: number,
): ForcedReplacement | null => {
  const heating = building.heating;

  // No on-site boiler: building is on a district-heat network, the
  // network operator handles their own assets.
  if (heating.includes("Fernwärme")) return null;

  // Recently-renewed: the existing system has at least `HEATING_LIFESPAN`
  // years left, so nothing forced inside the projection window.
  if (eligibility?.heatingRecentlyRenewed) return null;

  // Won't age out inside the projection: the existing system still has
  // years on its clock, even if not "new".
  if (building.heatingAge + years < HEATING_LIFESPAN) return null;

  const kw = heatingCapacityKw(building);

  if (heating.includes("Wärmepumpe")) {
    return {
      label: "Forced heat-pump renewal (lifespan exceeded)",
      cost: Math.round(8_000 + 1_900 * kw),
    };
  }

  if (heating.includes("Solar")) {
    return {
      label: "Solar-thermal system renewal (lifespan exceeded)",
      cost: 12_000,
    };
  }

  // Direct electric: most cantons no longer permit new resistance heat,
  // so the realistic forced path is a HP retrofit when it ages out.
  if (heating.includes("Elektro")) {
    return {
      label: "Forced HP retrofit (electric heating phase-out)",
      cost: Math.round(15_000 + 2_500 * kw),
    };
  }

  if (heating.includes("Holz")) {
    return {
      label: "Forced wood-boiler replacement (lifespan exceeded)",
      cost: Math.round(8_000 + 1_500 * kw),
    };
  }

  // Fossil (oil / gas / coal): the original case. MuKEn 2025 + cantonal
  // phase-outs may push this toward a forced HP retrofit by then; the
  // figure below is the conservative like-for-like estimate.
  return {
    label: "Forced boiler replacement (lifespan exceeded)",
    cost: Math.round(5_000 + 1_400 * kw),
  };
};

export const Summary = () => {
  useDocumentTitle("Step 7 — Summary");
  const {
    selectedModules,
    selectedContractors,
    finance,
    projectStart,
    setProjectStart,
    building,
    eligibility,
  } = useStore();
  const modules = useScaledModules();
  const subsidies = useSubsidies();
  const [excluded, setExcluded] = useState<ModuleId | null>(null);
  const [bookingMode, setBookingMode] = useState<BookingMode | null>(null);
  const [bookedEmail, setBookedEmail] = useState<string | null>(null);
  const [bookedMode, setBookedMode] = useState<BookingMode | null>(null);

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

  const geakCtx = { currentGeak: building.geakClass, eligibility };
  const totals = computeTotals(
    selectedModules,
    selectedContractors,
    modules,
    subsidies,
    geakCtx,
  );
  const activeOffer = resolveActiveOffer(finance, totals, {
    building,
    selectedModules,
    eligibility,
  });

  // Scenario compare: same totals but with one module excluded
  const compareModules = excluded
    ? selectedModules.filter((id) => id !== excluded)
    : selectedModules;
  const compareTotals = computeTotals(
    compareModules,
    selectedContractors,
    modules,
    subsidies,
    geakCtx,
  );

  const trees = treesEquivalent(totals.annualCO2Saving);

  // "Do nothing" baseline. Three components, each scaled to the
  // building rather than flat:
  //  1. Energy bills compounded at the BFS LIK fuel-price trend (~1.5%/yr)
  //     over the projection window.
  //  2. Forced replacement of the heating system when it ages out.
  //     The label and cost adapt to what's actually installed (boiler,
  //     heat pump, wood, electric); buildings on Fernwärme or recently
  //     renewed systems skip this row entirely.
  //  3. Property-value erosion as MuKEn 2025 tightens — bigger drag on
  //     low GEAK letters (G/F lose ~8%, D ~4%, A/B negligible).
  const ENERGY_INFLATION = 0.015;
  const compoundedEnergyCost = (annual: number, years: number): number => {
    if (annual <= 0 || years <= 0) return 0;
    if (Math.abs(ENERGY_INFLATION) < 1e-9) return annual * years;
    const r = ENERGY_INFLATION;
    return Math.round(annual * ((Math.pow(1 + r, years) - 1) / r));
  };
  const energyOver15 = compoundedEnergyCost(building.annualCost, PROJECTION_YEARS);
  const forcedReplacement = forcedReplacementFor(
    building,
    eligibility,
    PROJECTION_YEARS,
  );
  const valueErosionPctByGeak: Record<string, number> = {
    G: 0.09,
    F: 0.07,
    E: 0.05,
    D: 0.04,
    C: 0.02,
    B: 0.01,
    A: 0,
  };
  const valueErosionPct = valueErosionPctByGeak[building.geakClass] ?? 0.05;
  const valueErosion = Math.round(building.estimatedValue * valueErosionPct);
  const doNothingCost =
    energyOver15 + (forcedReplacement?.cost ?? 0) + valueErosion;

  // Ancillary project costs the contractor invoices don't capture but
  // a homeowner still has to budget for. Kept separate from totals.totalCost
  // so the loan / GIS pricing flow stays driven by module spend; surfaced
  // here so the user sees the all-in number before signing.
  //  - Relocation: heat-pump + electrical phase typically forces a ~10-day
  //    move-out (Timeline.tsx). Serviced-flat rate ~CHF 220/night in ZH.
  //  - Permits & engineering: cantonal building permit, structural
  //    engineer, GEAK Plus follow-ups — roughly 2.5% of build spend.
  //  - Contingency: industry-standard 5% buffer for unknowns uncovered
  //    once walls are open.
  const relocationDays =
    selectedModules.includes("heating") || selectedModules.includes("electrical") ? 10 : 0;
  const relocationCost = relocationDays * 220;
  const permitsCost = Math.round(totals.totalCost * 0.025);
  const contingencyCost = Math.round(totals.totalCost * 0.05);
  const ancillariesTotal = relocationCost + permitsCost + contingencyCost;
  const allInProjectCost = totals.totalCost + ancillariesTotal;

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
        <p className="mt-4 text-[10px] leading-relaxed text-white/60">
          Indicative figures only. Energy savings, GEAK letter and CO₂ reduction are
          modelled estimates based on Spring 2026 ZH market rates and BFS energy
          tariffs — actual values depend on the GEAK Plus audit, contractor offers
          and your usage profile.
        </p>
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
              annual climate impact as {forestComparison(trees)}.
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
          <SummaryLine label="Renovation works (modules)" value={formatCHF(totals.totalCost)} bold />
          {ancillariesTotal > 0 && (
            <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[12px]">
              <div className="mb-1.5 flex items-baseline justify-between font-semibold text-navy">
                <span>Project ancillaries</span>
                <span>{formatCHF(ancillariesTotal)}</span>
              </div>
              <ul className="space-y-1 text-muted">
                {relocationCost > 0 && (
                  <li className="flex items-baseline justify-between gap-3">
                    <span>Temporary relocation (~{relocationDays} nights, heat-pump phase)</span>
                    <span className="text-ink">{formatCHF(relocationCost)}</span>
                  </li>
                )}
                <li className="flex items-baseline justify-between gap-3">
                  <span>Permits, engineering &amp; GEAK Plus follow-up (~2.5%)</span>
                  <span className="text-ink">{formatCHF(permitsCost)}</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span>Contingency buffer (~5%)</span>
                  <span className="text-ink">{formatCHF(contingencyCost)}</span>
                </li>
              </ul>
            </div>
          )}
          <SummaryLine
            label="All-in project cost"
            value={formatCHF(allInProjectCost)}
            bold
          />
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
        <p className="mt-3 text-[10px] leading-relaxed text-muted">
          Costs and rates are approximate and reflect current Swiss market conditions.
          Subsidies depend on cantonal program eligibility and are confirmed only after the
          GEAK Plus audit. Final loan terms come from the bank's underwriting.
        </p>
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
            label={`Energy bills (${formatCHF(building.annualCost)}/yr, +1.5%/yr × ${PROJECTION_YEARS} yrs)`}
            value={formatCHF(energyOver15)}
          />
          {forcedReplacement && (
            <BaselineRow
              label={forcedReplacement.label}
              value={formatCHF(forcedReplacement.cost)}
            />
          )}
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

      {bookedEmail && bookedMode ? (
        <Card className="mt-6 border-l-4 border-l-emerald bg-emerald/5 p-6 no-print">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald text-white">
              <Check size={18} strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              {bookedMode === "order" ? (
                <>
                  <div className="text-sm font-semibold text-navy">
                    Order placed — confirmation sent to{" "}
                    <span className="text-emerald">{bookedEmail}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Kickoff is set for{" "}
                    <strong className="text-navy">{formatLongDate(projectStart)}</strong>.
                    From here we orchestrate everything: contractor briefs go out,
                    subsidy applications are filed, and the GEAK Plus audit is
                    scheduled in the first phase. You'll get a single status email
                    every Monday until handover.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-navy">
                    Callback scheduled — invite sent to{" "}
                    <span className="text-emerald">{bookedEmail}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    A RenoSwiss advisor will call you on{" "}
                    <strong className="text-navy">{formatLongDate(projectStart)}</strong>{" "}
                    to walk through this plan, answer open questions and confirm
                    the order whenever you're ready. No obligation until you say go.
                  </p>
                </>
              )}
              <p className="mt-3 text-[11px] text-muted">
                Demo complete — thanks for stepping through RenoSwiss.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 p-6 text-center no-print">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => setBookingMode("order")}>
              <Check size={16} strokeWidth={3} />
              Place order — we orchestrate it
              <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setBookingMode("callback")}
            >
              <Phone size={16} />
              Request a consulting callback
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Place the order to lock in your kickoff, or talk it through with an
            advisor first — both paths are free and non-binding.
          </p>
        </Card>
      )}

      <div className="no-print">
        <StepNav />
      </div>

      {bookingMode && (
        <BookingModal
          mode={bookingMode}
          initialDate={projectStart ?? ""}
          onClose={() => setBookingMode(null)}
          onConfirm={(date, email) => {
            setProjectStart(date);
            setBookedEmail(email);
            setBookedMode(bookingMode);
            setBookingMode(null);
          }}
        />
      )}
    </>
  );
};

/**
 * Climate-impact comparison sized to the number of mature trees the
 * annual CO₂ saving offsets. Small impacts get a recognisable
 * neighbourhood reference; from ~200 trees up we switch to football
 * fields of forest (UEFA-standard pitch ≈ 0.7 ha at ~400 mature trees
 * per pitch) so the magnitude lands intuitively.
 */
const forestComparison = (trees: number): string => {
  if (trees < 15) return "a small backyard's worth of trees";
  if (trees < 50) return "a tree-lined street";
  if (trees < 120) return "a city park";
  if (trees < 220) return "half a football field of forest";
  const fields = Math.max(1, Math.round(trees / 400));
  return `${fields} football field${fields === 1 ? "" : "s"} of forest`;
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
  mode: BookingMode;
  initialDate: string;
  onClose: () => void;
  onConfirm: (date: string, email: string) => void;
}

const MODE_COPY: Record<
  BookingMode,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    submit: string;
    weekendNote: string;
    footnote: string;
  }
> = {
  order: {
    eyebrow: "Step 7 · Place order",
    title: "Confirm your renovation kickoff.",
    subtitle:
      "Lock in the start date and we orchestrate the rest — contractor briefs, subsidy filings and the GEAK Plus audit all dispatch from this confirmation.",
    submit: "Place order",
    weekendNote: "Kickoff lands on weekdays — pick a working day.",
    footnote: "Free · Cancel any time before the first contractor visit",
  },
  callback: {
    eyebrow: "Step 7 · Consulting callback",
    title: "Pick a slot for your advisor call.",
    subtitle:
      "A RenoSwiss advisor will walk through this plan with you, answer open questions and confirm the order whenever you're ready.",
    submit: "Request callback",
    weekendNote: "Advisors call on weekdays — pick a working day.",
    footnote: "Free · 30-minute call · No obligation",
  },
};

const BookingModal = ({ mode, initialDate, onClose, onConfirm }: BookingModalProps) => {
  const copy = MODE_COPY[mode];
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
          {copy.eyebrow}
        </div>
        <h3
          id="booking-title"
          className="mt-3 font-serif text-[26px] font-bold leading-tight tracking-tight text-navy"
        >
          {copy.title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/70">
          {copy.subtitle}
        </p>

        <label className="mt-5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          {mode === "order" ? "Kickoff date" : "Callback date"}
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
          <p className="mt-1 text-[11px] text-warning">{copy.weekendNote}</p>
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
            {copy.submit}
            <ArrowRight size={14} />
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted">
          {copy.footnote}
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
