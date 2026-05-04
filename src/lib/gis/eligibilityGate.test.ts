import { describe, it, expect } from "vitest";
import { gateForModule } from "./eligibilityGate";
import type { Eligibility } from "./mapper";

const NONE: Eligibility = {
  heatingRecentlyRenewed: false,
  dhwRecentlyRenewed: false,
  pvAlreadyInstalled: false,
  installedPvKw: 0,
  heatingRenewedYear: null,
  roofPvPotentialKw: null,
  heritageBlock: false,
  heritageObject: null,
  heritageDistanceM: null,
  districtHeatAvailable: false,
  geothermalZone: null,
  canton: "ZH",
  bfsGemeindeNr: 9,
  currentHeatingFossil: false,
};

describe("gateForModule", () => {
  it("returns no gate when eligibility is null (legacy demo mode)", () => {
    expect(gateForModule("heating", null).skipped).toBe(false);
    expect(gateForModule("solar", null).skipped).toBe(false);
  });

  it("does not gate when no flags are set", () => {
    expect(gateForModule("heating", NONE).skipped).toBe(false);
    expect(gateForModule("solar", NONE).skipped).toBe(false);
  });

  it("gates heating when heatingRecentlyRenewed", () => {
    const g = gateForModule("heating", {
      ...NONE,
      heatingRecentlyRenewed: true,
      heatingRenewedYear: 2023,
    });
    expect(g.skipped).toBe(true);
    expect(g.reason).toContain("2023");
  });

  it("gates solar when pvAlreadyInstalled", () => {
    const g = gateForModule("solar", {
      ...NONE,
      pvAlreadyInstalled: true,
      installedPvKw: 9.92,
    });
    expect(g.skipped).toBe(true);
    expect(g.reason).toContain("9.9");
  });

  it("does not gate other modules even when flags are set", () => {
    const all: Eligibility = {
      ...NONE,
      heatingRecentlyRenewed: true,
      dhwRecentlyRenewed: true,
      pvAlreadyInstalled: true,
      installedPvKw: 9.9,
      heatingRenewedYear: 2023,
      roofPvPotentialKw: 15.8,
    };
    expect(gateForModule("facade", all).skipped).toBe(false);
    expect(gateForModule("roof", all).skipped).toBe(false);
    expect(gateForModule("windows", all).skipped).toBe(false);
    expect(gateForModule("basement", all).skipped).toBe(false);
    expect(gateForModule("electrical", all).skipped).toBe(false);
  });

  it("gates facade when heritage object is on the parcel", () => {
    const g = gateForModule("facade", {
      ...NONE,
      heritageBlock: true,
      heritageObject: {
        id: 6433,
        objekt: "Pfarrhaus",
        strasse: "Albisstrasse 10",
        ensemble: null,
        inventarblatt: null,
      },
    });
    expect(g.skipped).toBe(true);
    expect(g.reason).toContain("Pfarrhaus");
  });

  it("also gates solar when heritage block applies (visible roof)", () => {
    const g = gateForModule("solar", {
      ...NONE,
      heritageBlock: true,
      heritageObject: null,
    });
    expect(g.skipped).toBe(true);
    expect(g.reason).toContain("Heritage");
  });

  it("does not gate roof/windows/basement on heritage (interior measures)", () => {
    const e: Eligibility = {
      ...NONE,
      heritageBlock: true,
    };
    expect(gateForModule("roof", e).skipped).toBe(false);
    expect(gateForModule("windows", e).skipped).toBe(false);
    expect(gateForModule("basement", e).skipped).toBe(false);
  });
});
