/**
 * Canton Zürich renovation market rates — 2026 working estimates.
 *
 * Used by `marketCostFor` to anchor module costs in real CHF/m² (or
 * CHF/kW, CHF/kWp) rather than scaling from a 185 m² SFH calibration.
 *
 * SOURCES (cross-referenced, latest editions cited):
 *  - HEV Renovationskostenrechner 2024 — CHF/m² ranges per measure
 *  - EnergieSchweiz "Typische Renovationskosten" benchmark sheets 2023
 *  - Buildigo Marktbericht 2024 — actual quote medians per trade
 *  - HFM 2015 measure rates × inverse subsidy ratio (~10–15% coverage)
 *  - Suissetec 2025 reference Stundenansätze (labour component)
 *
 * Time-adjusted to 2026 with KOF Baukostenindex (+5–8% vs 2024 base).
 *
 * "ZH baseline" = rural/suburban Zürich (Affoltern, Pfäffikon, …).
 * "Premium" = Stadt Zürich + Goldküste (BFS 261, 151, 154–160) gets
 * +10% for access difficulty, demand pressure, and labour rates.
 *
 * Refresh quarterly. A real platform would fetch the KOF index live.
 */

/** BFS Gemeindenummern with elevated installation costs. */
export const PREMIUM_GEMEINDEN_ZH = new Set<number>([
  261, // Stadt Zürich
  151, // Zollikon
  154, // Küsnacht
  155, // Erlenbach
  156, // Herrliberg
  157, // Meilen
  158, // Uetikon am See
  159, // Männedorf
  160, // Stäfa
]);

export const PREMIUM_FACTOR = 1.1;

/** Facade Kompaktfassade (ETICS), mineral wool 18–22 cm, new render.
 * HEV 2024: CHF 220–280/m²; Buildigo median 2024: CHF 290–330/m².
 * ZH 2026 baseline: CHF 320/m² applied wall area. */
export const FACADE_CHF_PER_M2 = 320;

/** Pitched-roof Aufsparren-Dämmung 22 cm + new tiles + foil.
 * HEV 2024: CHF 180–260/m²; EnergieSchweiz: CHF 200–300/m².
 * ZH 2026 baseline: CHF 260/m² of roof surface. */
export const ROOF_CHF_PER_M2 = 260;

/** Windows: triple-glazed Holz-Alu or PVC, including frames + dismantle.
 * HEV 2024: CHF 800–1,200/m²; EnergieSchweiz: CHF 900–1,400/m².
 * ZH 2026 baseline: CHF 1,150/m² glazed area. */
export const WINDOWS_CHF_PER_M2 = 1150;

/** Basement-ceiling insulation, foam boards 12–14 cm + vapour barrier.
 * HEV 2024: CHF 60–100/m²; EnergieSchweiz: CHF 80–120/m².
 * ZH 2026 baseline: CHF 95/m² of basement ceiling. */
export const BASEMENT_CHF_PER_M2 = 95;

/** Air-water heat-pump replacement (incl. tank removal, DHW conversion,
 * plumbing), per kW capacity + base. Suissetec reference rates +
 * Buildigo medians. ZH 2026: CHF 12,000 base + CHF 3,000/kW. */
export const HEATING_BASE_CHF = 12_000;
export const HEATING_CHF_PER_KW = 3_000;

/** Solar PV installed cost — size-tiered (smaller systems pay more
 * /kWp due to fixed overhead). Pronovo registry medians 2025 +
 * VESE quotes 2025. */
export const PV_PRICE_TIERS: ReadonlyArray<{
  upToKwp: number;
  chfPerKwp: number;
}> = [
  { upToKwp: 5, chfPerKwp: 2_400 },
  { upToKwp: 15, chfPerKwp: 2_000 },
  { upToKwp: Infinity, chfPerKwp: 1_800 },
];

/** Battery storage for residential PV. Optional add-on, default off. */
export const BATTERY_BASE_CHF = 0;

/** Electrical panel + EV-charger prep + smart energy management bundle.
 * Buildigo 2024 medians: CHF 8,000–12,000 for the typical scope. */
export const ELECTRICAL_BUNDLE_CHF = 9_500;
