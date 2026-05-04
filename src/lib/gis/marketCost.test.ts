import { describe, it, expect } from "vitest";
import { marketCostFor } from "./marketCost";
import {
  basementM2,
  facadeM2,
  heatingCapacityKw,
  roofM2,
  windowsM2,
} from "./buildingAreas";
import type { Building } from "@/data/types";
import type { Eligibility } from "./mapper";

const ROSSMATTENWEG: Building = {
  address: "Rossmattenweg 1, 8932 Mettmenstetten",
  year: 1924,
  type: "Kleines Mehrfamilienhaus",
  area: 523,
  floors: 3,
  geakClass: "E",
  heating: "Wärmepumpe (2023)",
  heatingAge: 3,
  insulation: "Minimal (4–8 cm)",
  windows: "Original Doppelverglasung",
  roof: "Unisoliertes Ziegeldach",
  basement: "Unisoliert",
  annualEnergy: 25073,
  annualCost: 6770,
  co2: 1,
  estimatedValue: 3_158_083,
};

const ELIG_RURAL_ZH: Eligibility = {
  heatingRecentlyRenewed: true,
  dhwRecentlyRenewed: true,
  pvAlreadyInstalled: true,
  installedPvKw: 9.9,
  heatingRenewedYear: 2023,
  roofPvPotentialKw: 15.8,
  heritageBlock: false,
  heritageObject: null,
  heritageDistanceM: null,
  districtHeatAvailable: false,
  geothermalZone: "F",
  canton: "ZH",
  bfsGemeindeNr: 9,
  currentHeatingFossil: false,
  currentHeatingClean: false,
};

const STADT_ZH = (e: Eligibility): Eligibility => ({
  ...e,
  bfsGemeindeNr: 261,
});

describe("buildingAreas", () => {
  it("facadeM2 grows with footprint and storeys", () => {
    expect(facadeM2(ROSSMATTENWEG)).toBeGreaterThan(250);
    expect(facadeM2(ROSSMATTENWEG)).toBeLessThan(350);
    const single = { ...ROSSMATTENWEG, area: 100, floors: 1 };
    expect(facadeM2(single)).toBeLessThan(facadeM2(ROSSMATTENWEG));
  });

  it("roofM2 ≈ footprint × 1.15", () => {
    expect(roofM2(ROSSMATTENWEG)).toBeCloseTo(523 / 3 * 1.15, -1);
  });

  it("basementM2 ≈ footprint", () => {
    expect(basementM2(ROSSMATTENWEG)).toBeCloseTo(523 / 3, -1);
  });

  it("windowsM2 = 16% of EBF", () => {
    expect(windowsM2(ROSSMATTENWEG)).toBe(Math.round(523 * 0.16));
  });

  it("heatingCapacityKw clamped 8–40 kW", () => {
    expect(heatingCapacityKw({ ...ROSSMATTENWEG, area: 50 })).toBe(8);
    expect(heatingCapacityKw({ ...ROSSMATTENWEG, area: 5_000 })).toBe(40);
    expect(heatingCapacityKw(ROSSMATTENWEG)).toBeCloseTo(523 * 0.045, 0);
  });
});

describe("marketCostFor — Rossmattenweg (rural ZH)", () => {
  it("facade ≈ wall area × CHF 320", () => {
    const r = marketCostFor("facade", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    const expected = facadeM2(ROSSMATTENWEG) * 320;
    expect(r.cost).toBe(expected);
    expect(r.premium).toBe(false);
    expect(r.breakdown).toContain("Wandfläche");
  });

  it("roof ≈ pitched roof area × CHF 260", () => {
    const r = marketCostFor("roof", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    expect(r.cost).toBe(roofM2(ROSSMATTENWEG) * 260);
  });

  it("windows ≈ glazed area × CHF 1150", () => {
    const r = marketCostFor("windows", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    expect(r.cost).toBe(windowsM2(ROSSMATTENWEG) * 1150);
  });

  it("basement ≈ ceiling area × CHF 95", () => {
    const r = marketCostFor("basement", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    expect(r.cost).toBe(basementM2(ROSSMATTENWEG) * 95);
  });

  it("heating uses base + per-kW pricing", () => {
    const r = marketCostFor("heating", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    const kw = heatingCapacityKw(ROSSMATTENWEG);
    expect(r.cost).toBe(12_000 + kw * 3_000);
  });

  it("solar uses tier rate × headroom (5.9 kWp ⇒ tier 2 = 2000)", () => {
    const r = marketCostFor("solar", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    // 15.8 - 9.9 = 5.9 kWp → 5–15 tier → CHF 2000/kWp
    expect(r.cost).toBeGreaterThan(11_500);
    expect(r.cost).toBeLessThan(12_500);
    expect(r.breakdown).toContain("5.9 kWp");
  });

  it("solar tier escalates for very small headroom (<5 kWp)", () => {
    const small: Eligibility = {
      ...ELIG_RURAL_ZH,
      installedPvKw: 12,
      roofPvPotentialKw: 15,
    }; // 3 kWp headroom
    const r = marketCostFor("solar", ROSSMATTENWEG, small)!;
    expect(r.cost).toBe(Math.round(3 * 2_400));
  });

  it("electrical is flat", () => {
    const r = marketCostFor("electrical", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    expect(r.cost).toBe(9_500);
  });
});

describe("marketCostFor — Stadt Zürich (premium 10%)", () => {
  it("applies +10% to facade for BFS 261", () => {
    const rural = marketCostFor("facade", ROSSMATTENWEG, ELIG_RURAL_ZH)!;
    const city = marketCostFor("facade", ROSSMATTENWEG, STADT_ZH(ELIG_RURAL_ZH))!;
    expect(city.cost).toBe(Math.round(rural.cost * 1.1));
    expect(city.premium).toBe(true);
    expect(city.breakdown).toContain("Stadt/Goldküste");
  });
});

describe("marketCostFor — non-ZH falls through", () => {
  it("returns null for canton BE", () => {
    const bern: Eligibility = { ...ELIG_RURAL_ZH, canton: "BE" };
    expect(marketCostFor("facade", ROSSMATTENWEG, bern)).toBeNull();
  });

  it("returns null when eligibility is null (demo path)", () => {
    expect(marketCostFor("facade", ROSSMATTENWEG, null)).toBeNull();
  });
});
