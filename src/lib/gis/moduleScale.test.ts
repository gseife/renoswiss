import { describe, it, expect } from "vitest";
import { scaleModule } from "./moduleScale";
import { MODULES } from "@/data/modules";
import type { Building } from "@/data/types";
import type { Eligibility } from "./mapper";

const DEMO_BUILDING: Building = {
  address: "Musterstrasse 42, 8001 Zürich",
  year: 1972,
  type: "Einfamilienhaus",
  area: 185,
  floors: 2,
  geakClass: "F",
  heating: "Heizkessel (Heizöl)",
  heatingAge: 24,
  insulation: "Minimal (4–8 cm)",
  windows: "Original Doppelverglasung",
  roof: "Unisoliertes Betondach",
  basement: "Unisoliert",
  annualEnergy: 28400,
  annualCost: 6100,
  co2: 7.2,
  estimatedValue: 920_000,
};

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
  estimatedValue: 3_120_000,
};

const ZH_BASE = {
  heritageBlock: false,
  heritageObject: null,
  heritageDistanceM: null,
  districtHeatAvailable: false,
  geothermalZone: null,
  canton: "ZH",
  bfsGemeindeNr: 9,
  currentHeatingFossil: false,
} as const;

const ROSS_ELIG: Eligibility = {
  heatingRecentlyRenewed: true,
  dhwRecentlyRenewed: true,
  pvAlreadyInstalled: true,
  installedPvKw: 9.9,
  heatingRenewedYear: 2023,
  roofPvPotentialKw: 15.8,
  ...ZH_BASE,
};

const NO_ELIG: Eligibility = {
  heatingRecentlyRenewed: false,
  dhwRecentlyRenewed: false,
  pvAlreadyInstalled: false,
  installedPvKw: 0,
  heatingRenewedYear: null,
  roofPvPotentialKw: null,
  ...ZH_BASE,
};

const facade = MODULES.find((m) => m.id === "facade")!;
const heating = MODULES.find((m) => m.id === "heating")!;
const solar = MODULES.find((m) => m.id === "solar")!;
const electrical = MODULES.find((m) => m.id === "electrical")!;

describe("scaleModule", () => {
  it("uses market-anchored cost for ZH demo building", () => {
    const sc = scaleModule(facade, {
      building: DEMO_BUILDING,
      eligibility: NO_ELIG,
    });
    // 185 m² SFH → ~145 m² wall × CHF 320 ≈ CHF 46k (vs static demo CHF 48k).
    // Both within typical ETICS market range for an SFH facade.
    expect(sc.estCost).toBeGreaterThan(40_000);
    expect(sc.estCost).toBeLessThan(55_000);
    expect(sc.energySaving).toBeGreaterThanOrEqual(facade.energySaving - 50);
  });

  it("scales facade cost up for the larger Rossmattenweg MFH", () => {
    const sc = scaleModule(facade, {
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG,
    });
    // (523 / 185)^0.7 ≈ 2.05 → ~CHF 98k from base 48k.
    expect(sc.estCost).toBeGreaterThan(facade.estCost * 1.7);
    expect(sc.estCost).toBeLessThan(facade.estCost * 2.5);
  });

  it("scales heating cost sublinearly", () => {
    const sc = scaleModule(heating, {
      building: ROSSMATTENWEG,
      eligibility: NO_ELIG,
    });
    // (523/185)^0.6 ≈ 1.84
    expect(sc.estCost).toBeGreaterThan(heating.estCost * 1.6);
    expect(sc.estCost).toBeLessThan(heating.estCost * 2.2);
  });

  it("solar shrinks to roof headroom when PV already installed", () => {
    const sc = scaleModule(solar, {
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG, // 15.8 potential − 9.9 installed = 5.9 kWp
    });
    // 5.9 kWp at ZH tier rate CHF 2,000/kWp ≈ CHF 11,800.
    expect(sc.estCost).toBeGreaterThan(10_000);
    expect(sc.estCost).toBeLessThan(14_000);
    expect(sc.desc).toContain("5.9 kWp");
    expect(sc.desc).toContain("panels");
  });

  it("solar updates desc to reflect potential when no existing PV", () => {
    const sc = scaleModule(solar, {
      building: ROSSMATTENWEG,
      eligibility: { ...NO_ELIG, roofPvPotentialKw: 15.8 },
    });
    expect(sc.desc).toContain("15.8 kWp");
  });

  it("electrical cost stays flat (not area-scaled)", () => {
    const sc = scaleModule(electrical, {
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG,
    });
    expect(sc.estCost).toBe(electrical.estCost);
  });

  it("envelope savings scale with annualEnergy (not area)", () => {
    // Same area, double energy → double saving (capped by formula).
    const a = scaleModule(facade, {
      building: { ...DEMO_BUILDING, annualEnergy: 28400 },
      eligibility: NO_ELIG,
    });
    const b = scaleModule(facade, {
      building: { ...DEMO_BUILDING, annualEnergy: 56800 },
      eligibility: NO_ELIG,
    });
    expect(b.energySaving).toBeGreaterThan(a.energySaving * 1.8);
    expect(b.energySaving).toBeLessThan(a.energySaving * 2.2);
  });
});
