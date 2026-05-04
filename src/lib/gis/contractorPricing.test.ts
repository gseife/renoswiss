import { describe, it, expect } from "vitest";
import { priceFor } from "./contractorPricing";
import type { Contractor, Module } from "@/data/types";

const baseModule: Module = {
  id: "facade",
  name: "Facade",
  iconKey: "facade",
  priority: "Critical",
  desc: "",
  reason: "",
  estCost: 100_000,
  energySaving: 0,
  co2Saving: 0,
  recommended: true,
  category: "envelope",
};

const ctr = (priceDelta: number): Contractor => ({
  name: "X",
  loc: "Zürich",
  rating: 4,
  projects: 10,
  onTime: 90,
  onBudget: 90,
  price: 0,
  priceDelta,
  satisfaction: 90,
  years: 10,
  certs: [],
  avail: "now",
  badge: "",
});

describe("priceFor", () => {
  it("returns the module estCost at 0% delta (market price)", () => {
    expect(priceFor(ctr(0), baseModule)).toBe(100_000);
  });

  it("discounts when priceDelta is negative", () => {
    expect(priceFor(ctr(-5), baseModule)).toBe(95_000);
  });

  it("premium when positive", () => {
    expect(priceFor(ctr(7), baseModule)).toBe(107_000);
  });

  it("scales with the module's estCost (so a bigger building yields a bigger quote)", () => {
    const big: Module = { ...baseModule, estCost: 250_000 };
    expect(priceFor(ctr(-5), big)).toBe(237_500);
  });
});
