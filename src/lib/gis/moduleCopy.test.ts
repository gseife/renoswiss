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

const RENOSWISS_GATED: Eligibility = {
  heatingRecentlyRenewed: true,
  dhwRecentlyRenewed: true,
  pvAlreadyInstalled: true,
  installedPvKw: 9.9,
  heatingRenewedYear: 2023,
  roofPvPotentialKw: 15.8,
};

const NO_GATES: Eligibility = {
  heatingRecentlyRenewed: false,
  dhwRecentlyRenewed: false,
  pvAlreadyInstalled: false,
  installedPvKw: 0,
  heatingRenewedYear: null,
  roofPvPotentialKw: null,
};

const STATIC = "STATIC FALLBACK";

describe("reasonForModule", () => {
  it("returns static when no live data ctx (eligibility null is fine)", () => {
    const r = reasonForModule("facade", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: null,
    });
    // Building is 1924, so facade IS dynamic — use a 2020s building to test fallback.
    const r2 = reasonForModule("facade", STATIC, {
      building: { ...ROSSMATTENWEG, year: 2020 },
      eligibility: null,
    });
    expect(r).not.toBe(STATIC);
    expect(r2).toBe(STATIC);
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

  it("heating copy is null (gate takes over) when recently renewed", () => {
    // We can't read null directly — reasonForModule always returns a string —
    // but we verify the static fallback is used (which is what the gate path
    // would replace anyway with its own chip).
    const r = reasonForModule("heating", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: RENOSWISS_GATED,
    });
    expect(r).toBe(STATIC);
  });

  it("heating copy is null when the system is already clean (HP)", () => {
    const r = reasonForModule("heating", STATIC, {
      building: ROSSMATTENWEG, // HP
      eligibility: NO_GATES,
    });
    expect(r).toBe(STATIC);
  });

  it("solar copy is null when PV already installed", () => {
    const r = reasonForModule("solar", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: RENOSWISS_GATED,
    });
    expect(r).toBe(STATIC);
  });

  it("solar copy mentions the heat-pump synergy when applicable", () => {
    const r = reasonForModule("solar", STATIC, {
      building: ROSSMATTENWEG,
      eligibility: NO_GATES,
    });
    expect(r).toContain("sonnendach");
  });

  it("windows copy falls through for triple-glazed buildings", () => {
    const r = reasonForModule("windows", STATIC, {
      building: { ...ROSSMATTENWEG, windows: "Dreifachverglasung Low-E" },
      eligibility: NO_GATES,
    });
    expect(r).toBe(STATIC);
  });

  it("basement copy falls through when already insulated", () => {
    const r = reasonForModule("basement", STATIC, {
      building: { ...ROSSMATTENWEG, basement: "Gedämmt" },
      eligibility: NO_GATES,
    });
    expect(r).toBe(STATIC);
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
