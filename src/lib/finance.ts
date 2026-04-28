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
}

/**
 * Annuity payment formula. Falls back to simple division if rate is ~0
 * to avoid divide-by-zero.
 */
const annuityMonthly = (principal: number, annualRatePct: number, years: number): number => {
  if (years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r < 1e-9) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
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

  return {
    monthlyPayment,
    totalInterest,
    monthlyEnergySaving,
    monthlyTaxBenefit,
    netMonthlyCost,
    paybackYears,
    propertyIncrease,
  };
};
