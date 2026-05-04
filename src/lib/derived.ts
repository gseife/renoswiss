import { MODULES } from "@/data/modules";
import { SUBSIDIES } from "@/data/subsidies";
import { BANKS } from "@/data/banks";
import type { Contractor, Module, ModuleId, Subsidy } from "@/data/types";
import type { FinanceState } from "./store";
import { calcAffordability, calcFinance, priceBankOffer } from "./finance";
import { priceFor } from "./gis/contractorPricing";

export interface PlanTotals {
  totalCost: number;
  totalSubsidies: number;
  netFinancing: number;
  annualEnergySaving: number;
  annualCO2Saving: number;
  geakImprovement: string;
  monthlyPaymentEstimate: number;
  netMonthlyCostEstimate: number;
  modulesSelected: number;
  modulesTotal: number;
  contractorsChosen: number;
}

export const ESTIMATE_RATE = 1.85;
export const ESTIMATE_TERM = 15;
export const ESTIMATE_TAX_RATE = 25;

export const computeTotals = (
  selectedModules: ModuleId[],
  selectedContractors: Partial<Record<ModuleId, Contractor>>,
  modules: Module[] = MODULES,
  subsidies: Subsidy[] = SUBSIDIES,
): PlanTotals => {
  const totalCost = selectedModules.reduce((s, id) => {
    const mod = modules.find((m) => m.id === id);
    if (!mod) return s;
    const ct = selectedContractors[id];
    return s + (ct ? priceFor(ct, mod) : mod.estCost);
  }, 0);

  const totalSubsidies = subsidies.reduce((s, sub) => s + sub.amount, 0);
  const netFinancing = Math.max(0, totalCost - totalSubsidies);

  const annualEnergySaving = selectedModules.reduce(
    (s, id) => s + (modules.find((m) => m.id === id)?.energySaving ?? 0),
    0,
  );

  const annualCO2Saving = selectedModules.reduce(
    (s, id) => s + (modules.find((m) => m.id === id)?.co2Saving ?? 0),
    0,
  );

  const finance = calcFinance({
    netFinancing,
    rate: ESTIMATE_RATE,
    termYears: ESTIMATE_TERM,
    marginalTaxRate: ESTIMATE_TAX_RATE,
    totalCost,
    annualEnergySaving,
  });

  // GEAK improvement: rough heuristic — F → E/D/C/B based on coverage of critical envelope+heating modules
  const envelopeIds: ModuleId[] = ["facade", "roof", "windows", "basement"];
  const envelopeScore = envelopeIds.filter((id) => selectedModules.includes(id)).length;
  const hasHeating = selectedModules.includes("heating");
  let target = "F";
  if (hasHeating && envelopeScore >= 3) target = "B";
  else if (hasHeating && envelopeScore >= 2) target = "C";
  else if (hasHeating || envelopeScore >= 2) target = "D";
  else if (envelopeScore >= 1) target = "E";
  const geakImprovement = `F → ${target}`;

  const contractorsChosen = selectedModules.filter((id) => selectedContractors[id]).length;

  return {
    totalCost,
    totalSubsidies,
    netFinancing,
    annualEnergySaving,
    annualCO2Saving,
    geakImprovement,
    monthlyPaymentEstimate: finance.monthlyPayment,
    netMonthlyCostEstimate: finance.netMonthlyCost,
    modulesSelected: selectedModules.length,
    modulesTotal: modules.length,
    contractorsChosen,
  };
};

export const treesEquivalent = (tonnesCO2PerYear: number): number => {
  // ~21 kg CO₂/yr per mature tree (commonly cited figure)
  return Math.round((tonnesCO2PerYear * 1000) / 21);
};

export interface ActiveOffer {
  bankId: string;
  bankName: string;
  productName: string;
  rate: number;
  renovationLoan: number;
  cashOwnFunds: number;
  pensionOwnFunds: number;
}

/**
 * Resolves the user's selected (or auto-picked cheapest) bank offer using the
 * persisted finance inputs. Falls back to a generic estimate when no module
 * is selected or when no bank approves.
 */
export const resolveActiveOffer = (
  finance: FinanceState,
  totals: PlanTotals,
): ActiveOffer | null => {
  if (totals.netFinancing <= 0) return null;

  const ownFundsCap = Math.min(
    finance.ownFundsCash + finance.ownFundsPension,
    totals.netFinancing,
  );
  const renovationLoan = Math.max(0, totals.netFinancing - ownFundsCap);
  if (renovationLoan <= 0) return null;

  const totalMortgage = finance.existingMortgage + renovationLoan;
  const propertyValueAfter = finance.propertyValue + Math.round(totals.totalCost * 0.18);
  const affordability = calcAffordability({
    grossIncome: finance.grossIncome,
    propertyValueAfter,
    totalMortgage,
  });

  const offers = BANKS.map((bank) => ({
    bank,
    offer: priceBankOffer({
      baseRate: bank.rates[finance.selectedProductId],
      greenDiscount: bank.greenDiscount,
      ltv: affordability.ltv,
      tragbarkeit: affordability.tragbarkeit,
      isGreenEligible: totals.totalCost > 0,
    }),
  }));
  const approved = offers.filter((o) => o.offer.approved);
  if (approved.length === 0) return null;

  const selected =
    approved.find((o) => o.bank.id === finance.selectedBankId) ??
    approved.reduce((best, o) =>
      o.offer.effectiveRate < best.offer.effectiveRate ? o : best,
    );

  return {
    bankId: selected.bank.id,
    bankName: selected.bank.name,
    productName: finance.selectedProductId === "saron"
      ? "SARON"
      : finance.selectedProductId === "fixed5"
        ? "Fixed 5y"
        : "Fixed 10y",
    rate: selected.offer.effectiveRate,
    renovationLoan,
    cashOwnFunds: Math.min(finance.ownFundsCash, totals.netFinancing),
    pensionOwnFunds: Math.min(
      finance.ownFundsPension,
      Math.max(0, totals.netFinancing - finance.ownFundsCash),
    ),
  };
};
