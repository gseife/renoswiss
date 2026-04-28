import { describe, it, expect } from "vitest";
import { calcFinance } from "./finance";

const baseInputs = {
  netFinancing: 100_000,
  rate: 1.85,
  termYears: 15,
  marginalTaxRate: 25,
  totalCost: 137_600,
  annualEnergySaving: 8_800,
};

describe("calcFinance", () => {
  it("computes a positive monthly payment", () => {
    const r = calcFinance(baseInputs);
    expect(r.monthlyPayment).toBeGreaterThan(0);
    expect(r.monthlyPayment).toBeLessThan(baseInputs.netFinancing);
  });

  it("monthly payment * months > principal (interest is positive)", () => {
    const r = calcFinance(baseInputs);
    expect(r.totalInterest).toBeGreaterThan(0);
    expect(r.monthlyPayment * baseInputs.termYears * 12).toBeCloseTo(
      baseInputs.netFinancing + r.totalInterest,
      1,
    );
  });

  it("falls back to simple division when rate is ~0", () => {
    const r = calcFinance({ ...baseInputs, rate: 0 });
    expect(r.monthlyPayment).toBeCloseTo(baseInputs.netFinancing / (15 * 12), 2);
    expect(r.totalInterest).toBeCloseTo(0, 2);
  });

  it("tax benefit scales with marginal rate", () => {
    const low = calcFinance({ ...baseInputs, marginalTaxRate: 10 });
    const high = calcFinance({ ...baseInputs, marginalTaxRate: 40 });
    expect(high.monthlyTaxBenefit).toBeGreaterThan(low.monthlyTaxBenefit);
    expect(high.monthlyTaxBenefit / low.monthlyTaxBenefit).toBeCloseTo(4, 1);
  });

  it("annual interest deduction matches netFinancing × rate × taxRate / 12", () => {
    const r = calcFinance(baseInputs);
    const expected = (100_000 * 0.0185 * 0.25) / 12;
    expect(r.monthlyTaxBenefit).toBeCloseTo(expected, 2);
  });

  it("net monthly cost = payment − energy savings − tax benefit", () => {
    const r = calcFinance(baseInputs);
    expect(r.netMonthlyCost).toBeCloseTo(
      r.monthlyPayment - r.monthlyEnergySaving - r.monthlyTaxBenefit,
      4,
    );
  });

  it("returns Infinity payback when no savings exist", () => {
    const r = calcFinance({
      ...baseInputs,
      annualEnergySaving: 0,
      marginalTaxRate: 0,
    });
    expect(r.paybackYears).toBe(Infinity);
  });

  it("property uplift is 18% of total cost", () => {
    const r = calcFinance(baseInputs);
    expect(r.propertyIncrease).toBe(Math.round(baseInputs.totalCost * 0.18));
  });

  it("handles zero financing (fully subsidized) gracefully", () => {
    const r = calcFinance({ ...baseInputs, netFinancing: 0 });
    expect(r.monthlyPayment).toBe(0);
    expect(r.totalInterest).toBe(0);
    expect(r.monthlyTaxBenefit).toBe(0);
  });

  it("handles termYears=0 without throwing", () => {
    const r = calcFinance({ ...baseInputs, termYears: 0 });
    expect(r.monthlyPayment).toBe(0);
  });
});
