/**
 * Mortgage and tax calculations for Swiss energy renovation.
 * Simplified model — for demo purposes only.
 */

export interface FinanceInputs {
  netFinancing: number;
  rate: number; // annual interest rate as percent (e.g. 1.85)
  termYears: number;
  marginalTaxRate: number; // percent (e.g. 25)
  totalCost: number;
  annualEnergySaving: number;
}

export interface FinanceResult {
  monthlyPayment: number;
  totalInterest: number;
  monthlyEnergySaving: number;
  monthlyTaxBenefit: number;
  netMonthlyCost: number;
  paybackYears: number;
  propertyIncrease: number;
  annualPayment: number;
  annualInterest: number;
  annualAmortisation: number;
  annualTaxBenefit: number;
  netAnnualCost: number;
}

/**
 * Annuity payment formula. Falls back to simple division if rate is ~0
 * to avoid divide-by-zero.
 */
export const annuityMonthly = (
  principal: number,
  annualRatePct: number,
  years: number,
): number => {
  if (years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r < 1e-9) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
};

export interface ScheduleYear {
  year: number;
  interest: number;
  principal: number;
  balance: number;
}

/**
 * Build a year-by-year amortisation schedule for an annuity loan.
 * Splits each annual payment into the interest and principal portion and
 * tracks the remaining balance. Used by the schedule chart.
 */
export const buildSchedule = (
  principal: number,
  annualRatePct: number,
  years: number,
): ScheduleYear[] => {
  if (principal <= 0 || years <= 0) return [];
  const monthly = annuityMonthly(principal, annualRatePct, years);
  const r = annualRatePct / 100 / 12;
  let balance = principal;
  const out: ScheduleYear[] = [];
  for (let y = 1; y <= years; y++) {
    let interest = 0;
    let paid = 0;
    for (let m = 0; m < 12; m++) {
      const i = balance * r;
      const p = monthly - i;
      interest += i;
      paid += p;
      balance -= p;
    }
    out.push({
      year: y,
      interest,
      principal: paid,
      balance: Math.max(0, balance),
    });
  }
  return out;
};

export const calcFinance = ({
  netFinancing,
  rate,
  termYears,
  marginalTaxRate,
  totalCost,
  annualEnergySaving,
}: FinanceInputs): FinanceResult => {
  const monthlyPayment = annuityMonthly(netFinancing, rate, termYears);
  const totalInterest = monthlyPayment * termYears * 12 - netFinancing;

  // Simplified Swiss tax model: interest paid on the renovation loan is
  // deductible from taxable income, generating a tax saving roughly equal to
  // (interest × marginal rate). We approximate annual interest as
  // outstanding balance × rate (ignoring amortization).
  const annualInterest = netFinancing * (rate / 100);
  const annualTaxBenefit = annualInterest * (marginalTaxRate / 100);

  const monthlyEnergySaving = annualEnergySaving / 12;
  const monthlyTaxBenefit = annualTaxBenefit / 12;
  const netMonthlyCost = monthlyPayment - monthlyEnergySaving - monthlyTaxBenefit;

  const annualNetSaving = annualEnergySaving + annualTaxBenefit;
  const paybackYears = annualNetSaving > 0 ? netFinancing / annualNetSaving : Infinity;

  // Conservative property-value uplift estimate (~18% of renovation spend).
  const propertyIncrease = Math.round(totalCost * 0.18);

  const annualPayment = monthlyPayment * 12;
  const annualAmortisation = Math.max(0, annualPayment - annualInterest);
  const netAnnualCost = annualPayment - annualEnergySaving - annualTaxBenefit;

  return {
    monthlyPayment,
    totalInterest,
    monthlyEnergySaving,
    monthlyTaxBenefit,
    netMonthlyCost,
    paybackYears,
    propertyIncrease,
    annualPayment,
    annualInterest,
    annualAmortisation,
    annualTaxBenefit,
    netAnnualCost,
  };
};

/**
 * Swiss bank affordability assessment ("Tragbarkeit" + "Belehnung").
 * Banks use a calculatory interest rate (~5%) regardless of the actual market
 * rate, plus 1% imputed maintenance and a mandatory amortisation of any
 * portion above 65% LTV down to 65% within 15 years. The total annual housing
 * cost must stay below ~33% of gross household income.
 */
export interface AffordabilityInputs {
  grossIncome: number;
  propertyValueAfter: number;
  totalMortgage: number;
  calculatoryRate?: number;
  maintenanceRate?: number;
  amortisationYears?: number;
}

export type Verdict = "ok" | "tight" | "decline";

export interface AffordabilityResult {
  ltv: number;
  imputedInterest: number;
  imputedAmortisation: number;
  imputedMaintenance: number;
  imputedTotal: number;
  tragbarkeit: number;
  ltvOk: boolean;
  tragbarkeitOk: boolean;
  verdict: Verdict;
  reasons: string[];
}

export const calcAffordability = ({
  grossIncome,
  propertyValueAfter,
  totalMortgage,
  calculatoryRate = 5,
  maintenanceRate = 1,
  amortisationYears = 15,
}: AffordabilityInputs): AffordabilityResult => {
  const ltv = propertyValueAfter > 0 ? (totalMortgage / propertyValueAfter) * 100 : Infinity;
  const firstMortgageCap = propertyValueAfter * 0.65;
  const secondMortgage = Math.max(0, totalMortgage - firstMortgageCap);

  const imputedInterest = totalMortgage * (calculatoryRate / 100);
  const imputedAmortisation = secondMortgage / amortisationYears;
  const imputedMaintenance = propertyValueAfter * (maintenanceRate / 100);
  const imputedTotal = imputedInterest + imputedAmortisation + imputedMaintenance;

  const tragbarkeit = grossIncome > 0 ? (imputedTotal / grossIncome) * 100 : Infinity;

  const ltvOk = ltv <= 80;
  const tragbarkeitOk = tragbarkeit <= 33;

  const reasons: string[] = [];
  if (ltv > 80) reasons.push(`Loan-to-value ${ltv.toFixed(0)}% exceeds the 80% legal cap`);
  else if (ltv > 75) reasons.push(`Loan-to-value ${ltv.toFixed(0)}% is high — limited headroom`);
  if (tragbarkeit > 40) reasons.push(`Imputed cost is ${tragbarkeit.toFixed(0)}% of income`);
  else if (tragbarkeit > 33) reasons.push(`Imputed cost ${tragbarkeit.toFixed(0)}% > 33% guideline`);

  let verdict: Verdict = "ok";
  if (!ltvOk || tragbarkeit > 40) verdict = "decline";
  else if (!tragbarkeitOk || ltv > 75) verdict = "tight";

  return {
    ltv,
    imputedInterest,
    imputedAmortisation,
    imputedMaintenance,
    imputedTotal,
    tragbarkeit,
    ltvOk,
    tragbarkeitOk,
    verdict,
    reasons,
  };
};

export interface BankPricingInputs {
  baseRate: number;
  greenDiscount: number;
  ltv: number;
  tragbarkeit: number;
  isGreenEligible: boolean;
}

export interface BankOffer {
  effectiveRate: number;
  greenApplied: number;
  ltvSurcharge: number;
  riskSurcharge: number;
  approved: boolean;
  declineReason?: string;
}

/**
 * Risk-based pricing: starts from the bank's base rate, applies a green
 * renovation discount, then surcharges for high LTV / tight tragbarkeit.
 * Banks decline outright if the file fails the affordability check.
 */
export const priceBankOffer = ({
  baseRate,
  greenDiscount,
  ltv,
  tragbarkeit,
  isGreenEligible,
}: BankPricingInputs): BankOffer => {
  const greenApplied = isGreenEligible ? greenDiscount : 0;
  const ltvSurcharge = ltv > 75 ? 0.15 : ltv > 67 ? 0.05 : 0;
  const riskSurcharge = tragbarkeit > 33 ? 0.2 : tragbarkeit > 28 ? 0.05 : 0;

  if (ltv > 80) {
    return {
      effectiveRate: NaN,
      greenApplied,
      ltvSurcharge,
      riskSurcharge,
      approved: false,
      declineReason: "Loan-to-value above 80%",
    };
  }
  if (tragbarkeit > 40) {
    return {
      effectiveRate: NaN,
      greenApplied,
      ltvSurcharge,
      riskSurcharge,
      approved: false,
      declineReason: "Imputed cost above 40% of income",
    };
  }

  const effectiveRate = Math.max(0.5, baseRate - greenApplied + ltvSurcharge + riskSurcharge);
  return { effectiveRate, greenApplied, ltvSurcharge, riskSurcharge, approved: true };
};

/**
 * Swiss "hard equity" rule: at least half of own funds should be cash/savings,
 * not pension assets. For purchases the legal floor is 10% of property value
 * in hard equity; for renovations it's an informational guideline.
 */
export interface EquityCheck {
  totalOwn: number;
  hardShare: number;
  hardEquityOk: boolean;
  message: string | null;
}

export const checkEquitySplit = (cash: number, pension: number): EquityCheck => {
  const totalOwn = cash + pension;
  if (totalOwn === 0) {
    return { totalOwn, hardShare: 1, hardEquityOk: true, message: null };
  }
  const hardShare = cash / totalOwn;
  const hardEquityOk = hardShare >= 0.5;
  return {
    totalOwn,
    hardShare,
    hardEquityOk,
    message: hardEquityOk
      ? null
      : "Pension funds make up more than half of your own equity. Banks usually expect at least half in cash or savings.",
  };
};
