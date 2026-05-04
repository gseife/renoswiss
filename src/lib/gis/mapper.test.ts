import { describe, it, expect } from "vitest";
import { mapToBuilding } from "./mapper";
import { cohortFromYear, deriveCondition, geakFromIntensity } from "./condition";
import {
  buildingTypeFromGwr,
  heatingLabelFromGwr,
  isElectricallyDriven,
  parseGwrYear,
  yearFromGwr,
} from "./codes";
import type { GwrAttributes, SolarRoofPotential, PvInstallation } from "./types";

const ROSSMATTENWEG_GWR: GwrAttributes = {
  egid: "4070",
  egrid: "CH170277749680",
  ggdename: "Mettmenstetten",
  ggdenr: 9,
  gdekt: "ZH",
  gbauj: 1924,
  gbaup: 8012,
  garea: 205,
  gastw: 3,
  ganzwhg: 2,
  gkat: 1020,
  gklas: 1121,
  gwaerzh1: 7410,
  genh1: 7511,
  gwaerzh2: 7400,
  genh2: 7500,
  gwaerzw1: 7610,
  genw1: 7511,
  gwaerdath1: "24.01.2023",
  gwaerdatw1: "24.01.2023",
  gkode: 2677362.054,
  gkodn: 1232935.132,
  strname_deinr: "Rossmattenweg 1",
  plz_plz6: "8932/893200",
};

const ROSSMATTENWEG_SOLAR: SolarRoofPotential = {
  pvYieldKwh: 17370,
  surfaceM2: 99,
  bestClass: 3,
  heatingDemandKwh: 77388,
  dhwDemandKwh: 10368,
  gwrEgid: "4070",
};

const ROSSMATTENWEG_PV: PvInstallation[] = [
  {
    totalPowerKw: 9.92,
    beginningOfOperation: "09.02.2021",
    address: "Rossmattenweg 1, 8932 Mettmenstetten",
    canton: "ZH",
  },
];

describe("codes", () => {
  it("buildingTypeFromGwr classifies the small MFH correctly", () => {
    expect(buildingTypeFromGwr(ROSSMATTENWEG_GWR)).toBe(
      "Kleines Mehrfamilienhaus",
    );
  });

  it("buildingTypeFromGwr returns SFH when ganzwhg=1", () => {
    expect(
      buildingTypeFromGwr({ gkat: 1020, gklas: 1110, ganzwhg: 1 }),
    ).toBe("Einfamilienhaus");
  });

  it("heatingLabelFromGwr surfaces the renewal year for HP", () => {
    expect(heatingLabelFromGwr(ROSSMATTENWEG_GWR)).toBe("Wärmepumpe (2023)");
  });

  it("heatingLabelFromGwr falls through to source for fossil", () => {
    expect(
      heatingLabelFromGwr({
        gwaerzh1: 7432,
        genh1: 7513,
        gwaerdath1: "01.06.2001",
      }),
    ).toBe("Heizkessel (Kondensation) (Heizöl) (2001)");
  });

  it("yearFromGwr prefers gbauj over gbaup", () => {
    expect(yearFromGwr({ gbauj: 1924, gbaup: 8012 })).toBe(1924);
    expect(yearFromGwr({ gbauj: null, gbaup: 8016 })).toBe(1985);
    expect(yearFromGwr({ gbauj: null, gbaup: null })).toBeNull();
  });

  it("parseGwrYear extracts the year from DD.MM.YYYY", () => {
    expect(parseGwrYear("24.01.2023")).toBe(2023);
    expect(parseGwrYear(null)).toBeNull();
  });

  it("isElectricallyDriven matches HP and direct electric", () => {
    expect(isElectricallyDriven({ gwaerzh1: 7410, genh1: 7511 })).toBe(true);
    expect(isElectricallyDriven({ gwaerzh1: 7432, genh1: 7513 })).toBe(false);
  });
});

describe("condition", () => {
  it("cohortFromYear assigns to expected band", () => {
    expect(cohortFromYear(1924)).toBe("1919-1948");
    expect(cohortFromYear(1980)).toBe("1979-1994");
    expect(cohortFromYear(2024)).toBe("2011+");
  });

  it("deriveCondition bumps the cohort when heating was renewed long after build", () => {
    const base = deriveCondition({ year: 1924 });
    const bumped = deriveCondition({ year: 1924, heatingRenewedYear: 2023 });
    expect(base.insulation).not.toEqual(bumped.insulation);
  });

  it("deriveCondition ignores recent renewal for newer cohorts", () => {
    const a = deriveCondition({ year: 2005 });
    const b = deriveCondition({ year: 2005, heatingRenewedYear: 2023 });
    expect(a).toEqual(b);
  });

  it("geakFromIntensity bands map correctly", () => {
    expect(geakFromIntensity(45)).toBe("A");
    expect(geakFromIntensity(150)).toBe("E");
    expect(geakFromIntensity(250)).toBe("G");
  });
});

describe("mapToBuilding (Rossmattenweg 1, 8932 Mettmenstetten)", () => {
  it("uses real GWR fields for year, type, area and heating", () => {
    const { building } = mapToBuilding({
      gwr: ROSSMATTENWEG_GWR,
      solar: ROSSMATTENWEG_SOLAR,
      pvInstallations: ROSSMATTENWEG_PV,
      now: new Date("2026-05-04"),
    });
    expect(building.year).toBe(1924);
    expect(building.type).toBe("Kleines Mehrfamilienhaus");
    expect(building.heating).toBe("Wärmepumpe (2023)");
    expect(building.heatingAge).toBe(3);
    // EBF ≈ 205 m² × 3 storeys × 0.85 = 523 m².
    expect(building.area).toBeGreaterThan(500);
    expect(building.area).toBeLessThan(550);
  });

  it("uses BFE per-building demand (not the cohort fallback) when solar is present", () => {
    const { building } = mapToBuilding({
      gwr: ROSSMATTENWEG_GWR,
      solar: ROSSMATTENWEG_SOLAR,
      now: new Date("2026-05-04"),
    });
    // Useful heat = 77388 + 10368 = 87756. With HP COP 3.5 → ~25,073 kWh.
    expect(building.annualEnergy).toBeGreaterThan(24500);
    expect(building.annualEnergy).toBeLessThan(25500);
    // Cost @ 0.27 CHF/kWh ≈ CHF 6,770.
    expect(building.annualCost).toBeGreaterThan(6500);
    expect(building.annualCost).toBeLessThan(7000);
    // CO2 from electric HP: very low.
    expect(building.co2).toBeLessThan(1.5);
  });

  it("flags the three federal hide rules", () => {
    const { eligibility } = mapToBuilding({
      gwr: ROSSMATTENWEG_GWR,
      solar: ROSSMATTENWEG_SOLAR,
      pvInstallations: ROSSMATTENWEG_PV,
      now: new Date("2026-05-04"),
    });
    expect(eligibility.heatingRecentlyRenewed).toBe(true);
    expect(eligibility.dhwRecentlyRenewed).toBe(true);
    expect(eligibility.pvAlreadyInstalled).toBe(true);
    expect(eligibility.installedPvKw).toBe(9.9);
    expect(eligibility.heatingRenewedYear).toBe(2023);
    // 17370 / 1100 ≈ 15.8 kWp roof potential
    expect(eligibility.roofPvPotentialKw).toBeGreaterThan(15);
    expect(eligibility.roofPvPotentialKw).toBeLessThan(17);
  });

  it("does NOT flag heating renewal when fossil (boiler swap-in)", () => {
    const oilBoiler: GwrAttributes = {
      ...ROSSMATTENWEG_GWR,
      gwaerzh1: 7432,
      genh1: 7513,
      gwaerdath1: "01.03.2024",
    };
    const { eligibility } = mapToBuilding({
      gwr: oilBoiler,
      now: new Date("2026-05-04"),
    });
    // Oil boiler renewed recently is *not* a reason to hide the
    // "switch off oil" recommendation — that's the whole point.
    expect(eligibility.heatingRecentlyRenewed).toBe(false);
  });

  it("derives a sensible GEAK letter from useful heat / EBF", () => {
    const { building } = mapToBuilding({
      gwr: ROSSMATTENWEG_GWR,
      solar: ROSSMATTENWEG_SOLAR,
      now: new Date("2026-05-04"),
    });
    // 87756 / 523 ≈ 168 → E (envelope-driven, despite the HP).
    expect(building.geakClass).toBe("E");
  });

  it("uses the address label override when provided", () => {
    const { building } = mapToBuilding({
      gwr: ROSSMATTENWEG_GWR,
      addressLabel: "Custom 1, 8000 Zürich",
    });
    expect(building.address).toBe("Custom 1, 8000 Zürich");
  });

  it("falls back to GWR-built address otherwise", () => {
    const { building } = mapToBuilding({ gwr: ROSSMATTENWEG_GWR });
    expect(building.address).toBe(
      "Rossmattenweg 1, 8932 Mettmenstetten",
    );
  });

  it("falls back to cohort intensity when sonnendach has no demand", () => {
    const { building } = mapToBuilding({
      gwr: ROSSMATTENWEG_GWR,
      now: new Date("2026-05-04"),
    });
    // No solar ⇒ uses 150 kWh/m²·a × EBF.
    expect(building.annualEnergy).toBeGreaterThan(15000);
  });
});
