import type { Subsidy } from "./types";

export const SUBSIDIES: Subsidy[] = [
  {
    source: "Gebäudeprogramm (Federal)",
    amount: 12800,
    status: "Pre-qualified",
    desc: "Envelope measures + heating replacement",
    auto: true,
  },
  {
    source: "Kanton Zürich — Energieförderung",
    amount: 18500,
    status: "Pre-qualified",
    desc: "Comprehensive energy renovation (GEAK Plus)",
    auto: true,
  },
  {
    source: "Stadt Zürich — Energiefonds",
    amount: 4200,
    status: "Eligible",
    desc: "Solar PV installation",
    auto: true,
  },
  {
    source: "ProKilowatt (Federal)",
    amount: 2100,
    status: "To verify",
    desc: "Energy-efficient electrical systems",
    auto: false,
  },
];
