import type { Subsidy } from "./types";

/**
 * Demo-fixture subsidy bundle for the static (no-live-data) flow.
 * For ZH addresses the live computeSubsidies() output replaces this.
 *
 * Programme references:
 *  - Gebäudeprogramm (federal, HFM 2015 measure codes M-01..M-06)
 *  - Kanton Zürich Energieförderung (GEAK-Plus comprehensive top-up)
 *  - Stadt Zürich ewz Energiefonds (PV + smart-home programme)
 */
export const SUBSIDIES: Subsidy[] = [
  {
    source: "Gebäudeprogramm (Federal)",
    amount: 12800,
    status: "Pre-qualified",
    desc: "Envelope measures + heating replacement (HFM 2015)",
    auto: true,
  },
  {
    source: "Kanton Zürich — Energieförderung",
    amount: 18500,
    status: "Pre-qualified",
    desc: "Comprehensive energy renovation (GEAK Plus path)",
    auto: true,
  },
  {
    source: "Pronovo EIV (Federal)",
    amount: 3400,
    status: "Pre-qualified",
    desc: "One-off remuneration for new PV installation",
    auto: true,
  },
  {
    source: "ewz Energiefonds (Stadt Zürich)",
    amount: 800,
    status: "To verify",
    desc: "Smart-home + energy-management installation bonus",
    auto: false,
  },
];
