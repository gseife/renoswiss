import { MODULES } from "@/data/modules";
import { SUBSIDIES } from "@/data/subsidies";
import type { Contractor, ModuleId } from "@/data/types";
import { calcFinance } from "./finance";

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
): PlanTotals => {
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

  const annualCO2Saving = selectedModules.reduce(
    (s, id) => s + (MODULES.find((m) => m.id === id)?.co2Saving ?? 0),
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
    modulesTotal: MODULES.length,
    contractorsChosen,
  };
};

export const treesEquivalent = (tonnesCO2PerYear: number): number => {
  // ~21 kg CO₂/yr per mature tree (commonly cited figure)
  return Math.round((tonnesCO2PerYear * 1000) / 21);
};
