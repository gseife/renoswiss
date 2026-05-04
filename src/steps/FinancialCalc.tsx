import { useMemo } from "react";
import { Check, AlertTriangle, X, Sparkles, Printer, ArrowLeft, Wallet, PiggyBank } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BankLogo } from "@/components/ui/BankLogo";
import { StepNav } from "@/components/StepNav";
import { useScaledModules } from "@/lib/useScaledModules";
import { SUBSIDIES } from "@/data/subsidies";
import { BANKS, PRODUCTS, PRODUCT_ORDER, type Bank } from "@/data/banks";
import { formatCHF } from "@/lib/format";
import {
  calcFinance,
  calcAffordability,
  priceBankOffer,
  buildSchedule,
  checkEquitySplit,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { clsx } from "@/lib/clsx";

const STRESS_DELTAS = [-2, -1, 0, 1, 2, 3] as const;

export const FinancialCalc = () => {
  useDocumentTitle("Step 5 — Calculator");
  const { selectedModules, selectedContractors, finance, updateFinance } = useStore();
  const modules = useScaledModules();

  const totalCost = selectedModules.reduce((s, id) => {
    const ct = selectedContractors[id];
    const mod = modules.find((m) => m.id === id);
    return s + (ct ? ct.price : (mod?.estCost ?? 0));
  }, 0);
  const totalSubsidies = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  const annualEnergySaving = selectedModules.reduce(
    (s, id) => s + (modules.find((m) => m.id === id)?.energySaving ?? 0),
    0,
  );
  const renovationFundingNeed = Math.max(0, totalCost - totalSubsidies);

  const cashOwn = Math.min(finance.ownFundsCash, renovationFundingNeed);
  const pensionOwnCap = Math.max(0, renovationFundingNeed - cashOwn);
  const pensionOwn = Math.min(finance.ownFundsPension, pensionOwnCap);
  const totalOwn = cashOwn + pensionOwn;
  const equity = checkEquitySplit(cashOwn, pensionOwn);

  const renovationLoan = Math.max(0, renovationFundingNeed - totalOwn);
  const totalMortgage = finance.existingMortgage + renovationLoan;
  const propertyValueAfter = finance.propertyValue + Math.round(totalCost * 0.18);

  const affordability = useMemo(
    () =>
      calcAffordability({
        grossIncome: finance.grossIncome,
        propertyValueAfter,
        totalMortgage,
      }),
    [finance.grossIncome, propertyValueAfter, totalMortgage],
  );

  const offers = useMemo(
    () =>
      BANKS.map((bank) => ({
        bank,
        offer: priceBankOffer({
          baseRate: bank.rates[finance.selectedProductId],
          greenDiscount: bank.greenDiscount,
          ltv: affordability.ltv,
          tragbarkeit: affordability.tragbarkeit,
          isGreenEligible: totalCost > 0,
        }),
      })),
    [affordability.ltv, affordability.tragbarkeit, totalCost, finance.selectedProductId],
  );

  const approvedOffers = offers.filter((o) => o.offer.approved);
  const cheapest = approvedOffers.reduce<{ bank: Bank; rate: number } | null>(
    (best, { bank, offer }) =>
      !best || offer.effectiveRate < best.rate ? { bank, rate: offer.effectiveRate } : best,
    null,
  );

  const activeBankId = finance.selectedBankId ?? cheapest?.bank.id ?? null;
  const activeEntry = offers.find((o) => o.bank.id === activeBankId);
  const activeApproved = activeEntry?.offer.approved ? activeEntry : null;
  const activeRate = activeApproved?.offer.effectiveRate ?? 0;

  const result = useMemo(
    () =>
      calcFinance({
        netFinancing: renovationLoan,
        rate: activeRate,
        termYears: finance.term,
        marginalTaxRate: finance.taxRate,
        totalCost,
        annualEnergySaving,
      }),
    [renovationLoan, activeRate, finance.term, finance.taxRate, totalCost, annualEnergySaving],
  );

  const schedule = useMemo(
    () => buildSchedule(renovationLoan, activeRate, finance.term),
    [renovationLoan, activeRate, finance.term],
  );

  const stressRows = useMemo(
    () =>
      STRESS_DELTAS.map((d) => {
        const rate = Math.max(0, activeRate + d);
        const stressed = calcFinance({
          netFinancing: renovationLoan,
          rate,
          termYears: finance.term,
          marginalTaxRate: finance.taxRate,
          totalCost,
          annualEnergySaving,
        });
        return {
          delta: d,
          monthly: stressed.monthlyPayment,
          rate,
          floored: activeRate + d < 0,
        };
      }),
    [renovationLoan, activeRate, finance.term, finance.taxRate, totalCost, annualEnergySaving],
  );

  if (selectedModules.length === 0) {
    return (
      <>
        <SectionHeading
          eyebrow="Step 5"
          title="Financial calculator"
          description="Pick at least one renovation module first — there's nothing to finance yet."
        />
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-muted">
            <Wallet size={22} />
          </div>
          <p className="text-sm text-muted">
            The calculator quotes Swiss banks based on your renovation scope. Choose your modules
            on Step 2 to see live offers here.
          </p>
          <Link
            to="/plan"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-canvas"
          >
            <ArrowLeft size={14} /> Back to modules
          </Link>
        </Card>
        <StepNav />
      </>
    );
  }

  return (
    <>
      <SectionHeading
        eyebrow="Step 5"
        title="Financial calculator"
        description="See how Swiss banks would assess your file, compare live offers, and check your real net cost."
        trailing={
          <Button variant="secondary" size="sm" onClick={() => window.print()} className="no-print">
            <Printer size={14} />
            Print
          </Button>
        }
      />

      <Card className="p-5">
        <h3 className="mb-4 font-serif text-base font-bold text-navy">Cost overview</h3>
        <dl className="space-y-2 text-sm">
          <Line label="Total renovation cost" value={formatCHF(totalCost)} bold />
          <Line label="Subsidies (pre-qualified)" value={`− ${formatCHF(totalSubsidies)}`} positive />
          <Line label="Own funds you bring" value={`− ${formatCHF(totalOwn)}`} positive />
        </dl>
        <div className="my-3 border-t border-line" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-navy">New financing needed</span>
          <span className="font-serif text-xl font-bold text-teal">{formatCHF(renovationLoan)}</span>
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <h3 className="mb-1 font-serif text-base font-bold text-navy">Your situation</h3>
        <p className="mb-4 text-xs text-muted">
          Banks need these to price an offer and run the affordability check.
        </p>
        <div className="space-y-5">
          <Slider
            label="Gross household income"
            value={`${formatCHF(finance.grossIncome)} / yr`}
            min={60_000}
            max={400_000}
            step={5_000}
            val={finance.grossIncome}
            onChange={(v) => updateFinance({ grossIncome: v })}
          />
          <Slider
            label="Current property value"
            value={formatCHF(finance.propertyValue)}
            min={400_000}
            max={3_000_000}
            step={10_000}
            val={finance.propertyValue}
            onChange={(v) => updateFinance({ propertyValue: v })}
          />
          <Slider
            label="Existing mortgage"
            value={formatCHF(finance.existingMortgage)}
            min={0}
            max={Math.max(finance.propertyValue, 100_000)}
            step={10_000}
            val={Math.min(finance.existingMortgage, finance.propertyValue)}
            onChange={(v) => updateFinance({ existingMortgage: v })}
          />

          <div className="rounded-lg border border-line bg-canvas/40 p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-navy">Own funds for the renovation</span>
              <span className="text-xs font-bold text-teal">
                {formatCHF(totalOwn)} of {formatCHF(renovationFundingNeed)}
              </span>
            </div>
            <div className="space-y-3">
              <Slider
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet size={12} /> Cash &amp; savings
                  </span>
                }
                value={formatCHF(cashOwn)}
                min={0}
                max={Math.max(renovationFundingNeed, 1)}
                step={1_000}
                val={cashOwn}
                onChange={(v) => updateFinance({ ownFundsCash: v })}
              />
              <Slider
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <PiggyBank size={12} /> Pillar 3a / pension
                  </span>
                }
                value={formatCHF(pensionOwn)}
                min={0}
                max={Math.max(pensionOwnCap, 1)}
                step={1_000}
                val={pensionOwn}
                onChange={(v) => updateFinance({ ownFundsPension: v })}
              />
            </div>
            {equity.message && (
              <div className="mt-2 flex items-start gap-1.5 rounded bg-warning/10 p-2 text-[11px] text-[#a36106]">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                <span>{equity.message}</span>
              </div>
            )}
            {renovationFundingNeed === 0 && (
              <p className="mt-2 text-[11px] text-muted">
                Subsidies already cover the full cost — no own funds needed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Slider
              label="Loan term"
              value={`${finance.term} yrs`}
              min={5}
              max={20}
              step={1}
              val={Math.min(finance.term, 20)}
              onChange={(v) => updateFinance({ term: v })}
            />
            <Slider
              label="Marginal tax rate"
              value={`${finance.taxRate}%`}
              min={10}
              max={40}
              step={1}
              val={finance.taxRate}
              onChange={(v) => updateFinance({ taxRate: v })}
            />
          </div>
        </div>
      </Card>

      <AffordabilityCard
        ltv={affordability.ltv}
        tragbarkeit={affordability.tragbarkeit}
        verdict={affordability.verdict}
        reasons={affordability.reasons}
        propertyValueAfter={propertyValueAfter}
        totalMortgage={totalMortgage}
        imputedInterest={affordability.imputedInterest}
        imputedAmortisation={affordability.imputedAmortisation}
        imputedMaintenance={affordability.imputedMaintenance}
        imputedTotal={affordability.imputedTotal}
        grossIncome={finance.grossIncome}
      />

      <Card className="mt-3 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-serif text-base font-bold text-navy">Mortgage offers</h3>
          <span className="text-[11px] text-muted">
            {approvedOffers.length} of {BANKS.length} banks would lend
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Mortgage product type"
          className="mb-3 flex rounded-lg border border-line bg-canvas/50 p-0.5 text-xs"
        >
          {PRODUCT_ORDER.map((pid) => {
            const active = finance.selectedProductId === pid;
            return (
              <button
                key={pid}
                role="tab"
                aria-selected={active}
                onClick={() => updateFinance({ selectedProductId: pid })}
                className={clsx(
                  "flex-1 rounded-lg px-2 py-1.5 font-semibold transition-colors",
                  active ? "bg-white text-navy shadow-soft" : "text-muted hover:text-ink",
                )}
              >
                {PRODUCTS[pid].name}
              </button>
            );
          })}
        </div>
        <p className="mb-3 text-[11px] italic text-muted">
          {PRODUCTS[finance.selectedProductId].description}
        </p>

        <div className="space-y-2">
          {offers.map(({ bank, offer }) => {
            const isActive = bank.id === activeBankId;
            const isBest = cheapest?.bank.id === bank.id && offer.approved;
            const monthly = offer.approved
              ? calcFinance({
                  netFinancing: renovationLoan,
                  rate: offer.effectiveRate,
                  termYears: finance.term,
                  marginalTaxRate: finance.taxRate,
                  totalCost,
                  annualEnergySaving,
                }).monthlyPayment
              : 0;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => offer.approved && updateFinance({ selectedBankId: bank.id })}
                disabled={!offer.approved}
                className={clsx(
                  "group flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition-all",
                  offer.approved && "hover:border-ink/20 hover:shadow-card",
                  isActive && offer.approved && "border-teal shadow-ring",
                  !offer.approved && "cursor-not-allowed border-line opacity-60",
                )}
                aria-pressed={isActive}
              >
                <BankLogo bank={bank} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-navy">{bank.name}</span>
                    <Badge tone="muted">{PRODUCTS[finance.selectedProductId].name}</Badge>
                    {isBest && (
                      <Badge tone="emerald">
                        <Sparkles size={9} className="mr-0.5" /> Best rate
                      </Badge>
                    )}
                    {offer.greenApplied > 0 && offer.approved && (
                      <Badge tone="teal">−{offer.greenApplied.toFixed(2)}% green</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {offer.approved ? (
                      <>
                        Base {bank.rates[finance.selectedProductId].toFixed(2)}%
                        {offer.ltvSurcharge > 0 && ` · LTV +${offer.ltvSurcharge.toFixed(2)}%`}
                        {offer.riskSurcharge > 0 && ` · Risk +${offer.riskSurcharge.toFixed(2)}%`}
                      </>
                    ) : (
                      <span className="text-danger">Declined — {offer.declineReason}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {offer.approved ? (
                    <>
                      <div className="font-serif text-xl font-bold text-navy">
                        {offer.effectiveRate.toFixed(2)}%
                      </div>
                      <div className="text-[11px] text-muted">{formatCHF(monthly)}/mo</div>
                    </>
                  ) : (
                    <div className="text-xs font-semibold text-danger">No offer</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-muted">
          Indicative rates for educational purposes. Actual offers depend on full underwriting,
          property appraisal and bank policy.
        </p>
      </Card>

      {activeApproved && renovationLoan > 0 && (
        <Card className="print:keep-bg mt-3 overflow-hidden border-0 bg-gradient-to-br from-navy to-teal p-6 text-white">
          <div className="mb-3 flex items-center gap-3">
            <BankLogo bank={activeApproved.bank} size={36} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/60">
                Selected offer
              </div>
              <div className="text-sm font-semibold">
                {activeApproved.bank.name} · {PRODUCTS[finance.selectedProductId].name} ·{" "}
                {activeApproved.offer.effectiveRate.toFixed(2)}%
              </div>
            </div>
          </div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-soft">
            Monthly net impact
          </h3>
          <DarkLine label="Mortgage payment" value={formatCHF(result.monthlyPayment)} sign="+" />
          <DarkLine
            label="Energy savings"
            value={formatCHF(result.monthlyEnergySaving)}
            sign="−"
            tone="mint"
          />
          <DarkLine
            label="Tax deduction benefit"
            value={formatCHF(result.monthlyTaxBenefit)}
            sign="−"
            tone="mint"
          />
          <div className="my-3 border-t border-white/15" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold">
              {result.netMonthlyCost >= 0 ? "Your net monthly cost" : "Your net monthly savings"}
            </span>
            <span
              className={clsx(
                "font-serif text-2xl font-bold",
                result.netMonthlyCost >= 0 ? "text-gold-soft" : "text-mint",
              )}
            >
              {formatCHF(Math.abs(result.netMonthlyCost))}
            </span>
          </div>
        </Card>
      )}

      {activeApproved && renovationLoan > 0 && (
        <Card className="mt-3 p-5">
          <h3 className="mb-1 font-serif text-base font-bold text-navy">Annual breakdown</h3>
          <p className="mb-4 text-xs text-muted">
            Year-1 view of what the renovation costs and saves you per year.
          </p>
          <dl className="space-y-2 text-sm">
            <Line label="Amortisation (principal repayment)" value={formatCHF(result.annualAmortisation)} />
            <Line label="Cost of capital (interest)" value={formatCHF(result.annualInterest)} />
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-sm font-bold text-navy">Annual cost</span>
              <span className="font-serif text-base font-bold text-navy">
                {formatCHF(result.annualPayment)}
              </span>
            </div>
            <div className="my-2 border-t border-line" />
            <Line label="Energy savings" value={`− ${formatCHF(annualEnergySaving)}`} positive />
            <Line label="Tax deduction benefit" value={`− ${formatCHF(result.annualTaxBenefit)}`} positive />
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-sm font-bold text-navy">Annual savings</span>
              <span className="font-serif text-base font-bold text-emerald">
                {formatCHF(annualEnergySaving + result.annualTaxBenefit)}
              </span>
            </div>
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm font-bold text-navy">
              {result.netAnnualCost > 0 ? "Net cost per year" : "Net profit per year"}
            </span>
            <span
              className={`font-serif text-xl font-bold ${result.netAnnualCost > 0 ? "text-teal" : "text-emerald"}`}
            >
              {formatCHF(Math.abs(result.netAnnualCost))}
            </span>
          </div>
        </Card>
      )}

      {activeApproved && renovationLoan > 0 && (
        <Card className="mt-3 p-5">
          <h3 className="mb-1 font-serif text-base font-bold text-navy">Rate stress test</h3>
          <p className="mb-3 text-xs text-muted">
            Banks already stress-test you at 5% — here's how your monthly payment moves if your
            mortgage rate shifts. Rates are floored at 0% (they don't go negative).
          </p>
          <div className="space-y-2">
            {(() => {
              const max = Math.max(...stressRows.map((r) => r.monthly));
              const baseline = stressRows.find((r) => r.delta === 0)?.monthly ?? 0;
              return stressRows.map(({ delta, monthly, rate, floored }) => {
                const pct = max > 0 ? (monthly / max) * 100 : 0;
                const diff = monthly - baseline;
                const barColor =
                  delta < 0
                    ? "bg-emerald"
                    : delta === 0
                      ? "bg-teal"
                      : delta < 2
                        ? "bg-warning"
                        : "bg-danger";
                const diffColor = delta < 0 ? "text-emerald" : "text-warning";
                const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
                return (
                  <div key={delta} className="text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-navy">
                        {delta === 0 ? "Today" : `${sign}${Math.abs(delta)}%`}
                        <span className="ml-2 text-muted">
                          ({rate.toFixed(2)}%
                          {floored && " floor"})
                        </span>
                      </span>
                      <span className="font-bold text-navy">
                        {formatCHF(monthly)}/mo
                        {delta !== 0 && (
                          <span className={clsx("ml-1 text-[10px] font-semibold", diffColor)}>
                            {diff > 0 ? "+" : "−"}
                            {formatCHF(Math.abs(diff))}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                      <div
                        className={clsx("h-full transition-[width]", barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>
      )}

      {activeApproved && renovationLoan > 0 && schedule.length > 0 && (
        <Card className="mt-3 p-5">
          <h3 className="mb-1 font-serif text-base font-bold text-navy">Amortisation schedule</h3>
          <p className="mb-4 text-xs text-muted">
            Each column is one year of the loan. Interest shrinks and principal grows as the
            balance comes down.
          </p>
          <ScheduleChart schedule={schedule} />
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm bg-teal" />
              Principal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm bg-warning/80" />
              Interest
            </span>
          </div>
        </Card>
      )}

      {!activeApproved && renovationLoan > 0 && (
        <Card className="mt-3 border-danger/30 bg-danger/5 p-5 text-sm text-navy">
          <strong className="text-danger">No bank would approve at these levels.</strong> Try
          increasing your own funds, lowering the renovation scope, or extending the term to bring
          the affordability ratio under 33%.
        </Card>
      )}

      {renovationLoan === 0 && totalCost > 0 && (
        <Card className="mt-3 border-emerald/30 bg-emerald/5 p-5 text-sm text-navy">
          <strong className="text-emerald">No financing needed.</strong> Your own funds and
          subsidies cover the full renovation. You'll still benefit from{" "}
          {formatCHF(annualEnergySaving)} in annual energy savings.
        </Card>
      )}

      <StepNav />
    </>
  );
};

interface AffordabilityCardProps {
  ltv: number;
  tragbarkeit: number;
  verdict: "ok" | "tight" | "decline";
  reasons: string[];
  propertyValueAfter: number;
  totalMortgage: number;
  imputedInterest: number;
  imputedAmortisation: number;
  imputedMaintenance: number;
  imputedTotal: number;
  grossIncome: number;
}

const AffordabilityCard = ({
  ltv,
  tragbarkeit,
  verdict,
  reasons,
  propertyValueAfter,
  totalMortgage,
  imputedInterest,
  imputedAmortisation,
  imputedMaintenance,
  imputedTotal,
  grossIncome,
}: AffordabilityCardProps) => {
  const verdictMeta = {
    ok: {
      label: "Likely approved",
      tone: "bg-emerald/10 text-emerald",
      Icon: Check,
      desc: "Your file passes the standard Swiss bank affordability test.",
    },
    tight: {
      label: "Tight — case-by-case",
      tone: "bg-warning/15 text-[#a36106]",
      Icon: AlertTriangle,
      desc: "Some banks would still lend, but expect higher rates and stricter conditions.",
    },
    decline: {
      label: "Likely declined",
      tone: "bg-danger/10 text-danger",
      Icon: X,
      desc: "Most Swiss banks won't approve at these levels. Adjust own funds, term, or scope.",
    },
  }[verdict];
  const Icon = verdictMeta.Icon;

  return (
    <Card className="mt-3 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div
          className={clsx(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            verdictMeta.tone,
          )}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted">Affordability check</div>
          <div className="text-base font-bold text-navy">{verdictMeta.label}</div>
          <p className="mt-0.5 text-xs text-muted">{verdictMeta.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Gauge
          label="Loan-to-value"
          help={`${formatCHF(totalMortgage)} on ${formatCHF(propertyValueAfter)}`}
          value={ltv}
          unit="%"
          warning={75}
          decline={80}
        />
        <Gauge
          label="Tragbarkeit"
          help={
            grossIncome > 0
              ? `${formatCHF(imputedTotal)} of ${formatCHF(grossIncome)}`
              : "Enter your income to compute"
          }
          value={tragbarkeit}
          unit="%"
          warning={33}
          decline={40}
        />
      </div>

      <details className="mt-4 text-xs">
        <summary className="cursor-pointer font-semibold text-navy">
          How banks calculate this
        </summary>
        <dl className="mt-2 space-y-1 text-muted">
          <ImputedLine label="Calculatory interest @ 5%" value={formatCHF(imputedInterest)} />
          <ImputedLine
            label="Mandatory amortisation (above 65% LTV, over 15 yrs)"
            value={formatCHF(imputedAmortisation)}
          />
          <ImputedLine
            label="Imputed maintenance @ 1% of value"
            value={formatCHF(imputedMaintenance)}
          />
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold text-navy">
            <span>Imputed annual cost</span>
            <span>{formatCHF(imputedTotal)}</span>
          </div>
        </dl>
        <p className="mt-2 leading-relaxed text-muted">
          Banks stress-test affordability at a calculatory rate (~5%), not the market rate, so the
          mortgage stays serviceable if rates rise. They also assume 1% upkeep and require any
          portion above 65% LTV to be amortised within 15 years.
        </p>
      </details>

      {reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-warning" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const Gauge = ({
  label,
  help,
  value,
  unit,
  warning,
  decline,
}: {
  label: string;
  help: string;
  value: number;
  unit: string;
  warning: number;
  decline: number;
}) => {
  const valid = Number.isFinite(value);
  const tone = !valid
    ? "text-muted"
    : value > decline
      ? "text-danger"
      : value > warning
        ? "text-[#a36106]"
        : "text-emerald";
  const barTone = !valid
    ? "bg-line"
    : value > decline
      ? "bg-danger"
      : value > warning
        ? "bg-warning"
        : "bg-emerald";
  const pct = valid ? Math.min(100, Math.max(0, (value / decline) * 100)) : 0;
  const warningPct = Math.min(100, (warning / decline) * 100);
  const display = valid ? value.toFixed(0) : "—";
  return (
    <div className="rounded-lg border border-line bg-canvas/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={clsx("mt-1 font-serif text-2xl font-bold", tone)}>
        {display}
        {valid && unit}
      </div>
      <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={clsx("h-full transition-[width]", barTone)} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 h-full w-px bg-ink/40"
          style={{ left: `${warningPct}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1 text-[10px] text-muted">{help}</div>
    </div>
  );
};

const ScheduleChart = ({
  schedule,
}: {
  schedule: { year: number; interest: number; principal: number }[];
}) => {
  const width = 320;
  const height = 140;
  const pad = { top: 8, right: 8, bottom: 22, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...schedule.map((s) => s.interest + s.principal));
  const colW = innerW / schedule.length;
  const gap = Math.min(2, colW * 0.15);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Amortisation schedule by year"
    >
      {schedule.map((s, i) => {
        const total = s.interest + s.principal;
        const h = (total / max) * innerH;
        const principalH = (s.principal / total) * h;
        const interestH = h - principalH;
        const x = pad.left + i * colW + gap / 2;
        const y = pad.top + (innerH - h);
        const w = colW - gap;
        return (
          <g key={s.year}>
            <rect x={x} y={y} width={w} height={principalH} className="fill-teal" rx={1} />
            <rect
              x={x}
              y={y + principalH}
              width={w}
              height={interestH}
              className="fill-warning/80"
              rx={1}
            />
            {(i === 0 || i === schedule.length - 1 || (i + 1) % 5 === 0) && (
              <text
                x={x + w / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted text-[9px]"
              >
                Y{s.year}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const Line = ({
  label,
  value,
  bold,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}) => (
  <div className="flex justify-between">
    <span className="text-ink/80">{label}</span>
    <span
      className={`${bold ? "font-bold text-navy" : ""} ${positive ? "font-bold text-emerald" : ""}`}
    >
      {value}
    </span>
  </div>
);

const ImputedLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span>{label}</span>
    <span className="font-medium text-ink">{value}</span>
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
    <span className={tone === "mint" ? "font-semibold text-mint" : "font-semibold text-white"}>
      {value}
    </span>
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
  label: React.ReactNode;
  value: string;
  min: number;
  max: number;
  step: number;
  val: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between text-xs">
      <span className="text-ink/80">{label}</span>
      <span className="font-bold text-navy">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={val}
      onChange={(e) => onChange(+e.target.value)}
      aria-label={typeof label === "string" ? label : undefined}
    />
  </div>
);
