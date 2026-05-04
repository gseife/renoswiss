import { describe, it, expect } from "vitest";
import { reasonForModule } from "./moduleCopy";
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
  estimatedValue: 3_120_000,
};

const OIL_BOILER_SFH: Building = {
  ...ROSSMATTENWEG,
  type: "Einfamilienhaus",
  heating: "Heizkessel (Heizöl) (2001)",
  heatingAge: 25,
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
  currentHeatingClean: false,
} as const;

const RENOSWISS_GATED: Eligibility = {
  heatingRecentlyRenewed: true,
  dhwRecentlyRenewed: true,
  pvAlreadyInstalled: true,
  installedPvKw: 9.9,
  heatingRenewedYear: 2023,
  roofPvPotentialKw: 15.8,
  ...ZH_BASE,
};

const NO_GATES: Eligibility = {
  heatingRecentlyRenewed: false,
  dhwRecentlyRenewed: false,
  pvAlreadyInstalled: false,
  installedPvKw: 0,
  heatingRenewedYear: null,
  roofPvPotentialKw: null,
  ...ZH_BASE,
};

const STATIC = "STATIC FALLBACK";

describe("reasonForModule", () => {
  it("returns dynamic copy regardless of build cohort (no static fallback)", () => {
    const old = reasonForModule("facade", STATIC, {
      building: ROSSMATTENWEG, // 1924
      eligibility: null,
    });
    const modern = reasonForModule("facade", STATIC, {
      building: { ...ROSSMATTENWEG, year: 2020 },
      eligibility: null,
    });
    expect(old).not.toBe(STATIC);
    expect(old).toContain("1924");
    expect(modern).not.toBe(STATIC);
    expect(modern).toContain("2020");
  });

  it("facade copy interpolates the build year and current insulation", () => {
    const r = reasonForModule("facade", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: NO_GATES,
    });
    expect(r).toContain("1924");
    expect(r).toContain(ROSSMATTENWEG.insulation);
  });

  it("heating copy interpolates fuel + age for fossil systems", () => {
    const r = reasonForModule("heating", STATIC, {
      building: OIL_BOILER_SFH,
      eligibility: NO_GATES,
    });
    expect(r).toContain("Heizöl");
    expect(r).toContain("25 years");
  });

  it("heating copy mentions the renewal year when recently renewed", () => {
    const r = reasonForModule("heating", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: RENOSWISS_GATED,
    });
    expect(r).not.toBe(STATIC);
    expect(r).toContain("2023");
  });

  it("heating copy reflects the existing clean system instead of recommending replacement", () => {
    const r = reasonForModule("heating", STATIC, {
      building: ROSSMATTENWEG, // Wärmepumpe (2023)
      eligibility: NO_GATES,
    });
    expect(r).not.toBe(STATIC);
    expect(r).toContain("Wärmepumpe");
    expect(r).toContain("already in place");
  });

  it("solar copy reports the installed kWp instead of recommending fresh install", () => {
    const r = reasonForModule("solar", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: RENOSWISS_GATED, // 9.9 kWp installed
    });
    expect(r).not.toBe(STATIC);
    expect(r).toContain("9.9 kWp");
  });

  it("solar copy mentions the heat-pump synergy when applicable", () => {
    const r = reasonForModule("solar", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: NO_GATES,
    });
    expect(r).toContain("sonnendach");
  });

  it("windows copy reflects already-triple-glazed without recommending replacement", () => {
    const r = reasonForModule("windows", STATIC, {
      building: { ...ROSSMATTENWEG, windows: "Dreifachverglasung Low-E" },
      eligibility: NO_GATES,
    });
    expect(r).not.toBe(STATIC);
    expect(r).toContain("Dreifachverglasung");
    expect(r).toMatch(/already|not cost-effective/i);
  });

  it("basement copy reflects already-insulated state", () => {
    const r = reasonForModule("basement", STATIC, {
      building: { ...ROSSMATTENWEG, basement: "Gedämmt" },
      eligibility: NO_GATES,
    });
    expect(r).not.toBe(STATIC);
    expect(r).toMatch(/already insulated/i);
  });

  it("basement copy still recommends insulation when only partially insulated", () => {
    const r = reasonForModule("basement", STATIC, {
      building: { ...ROSSMATTENWEG, basement: "Teilweise gedämmt" },
      eligibility: NO_GATES,
    });
    expect(r).toContain("Teilweise gedämmt");
    expect(r).toMatch(/cheapest|pays back/i);
  });

  it("basement copy interpolates current condition otherwise", () => {
    const r = reasonForModule("basement", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: NO_GATES,
    });
    expect(r).toContain("Unisoliert");
  });

  it("electrical copy mentions EV-charger prep when HP + no PV", () => {
    const r = reasonForModule("electrical", STATIC, {
      building: ROSSMATTENWEG, // HP
      eligibility: NO_GATES, // no existing PV
    });
    expect(r).toContain("EV-charger");
  });
});
