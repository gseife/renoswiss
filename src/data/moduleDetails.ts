import type { ModuleId } from "./types";

export interface ModuleDetailContent {
  id: ModuleId;
  oneLiner: string;
  paragraphs: string[];
  costRange: string;
  savingsPerYear: string;
  co2Reduction: string;
  timeline: string;
  subsidies: string[];
}

export const MODULE_DETAILS: Partial<Record<ModuleId, ModuleDetailContent>> = {
  facade: {
    id: "facade",
    oneLiner:
      "An external thermal envelope that turns a leaky shell into the warmest, quietest skin of your home.",
    paragraphs: [
      "A facade renovation wraps your house in a continuous insulation layer — typically 18–22 cm of mineral wool finished with a fresh render. For a typical Swiss EFH built before 1990, this single move cuts heat loss by roughly a third.",
      "It is the move that quietly does the most work. Heat-pump sizing drops, every other module performs better, and the surface temperature inside walls rises enough to eliminate condensation in cold corners.",
      "Best done together with new windows so the seal between frame and wall is detailed correctly. Done alone, it still pays back through lower bills and a noticeably more comfortable interior.",
    ],
    costRange: "CHF 35,000 – 65,000",
    savingsPerYear: "CHF 2,200 – 3,400",
    co2Reduction: "≈ 1.8 t / year",
    timeline: "6 – 10 weeks",
    subsidies: [
      "Federal Building Programme (Gebäudeprogramm) — CHF 40–80 / m²",
      "Cantonal top-ups in most cantons",
      "Tax-deductible energy renovation expense",
    ],
  },
  heating: {
    id: "heating",
    oneLiner:
      "Replace the old fossil boiler with an air-water heat pump and cut both your bills and your CO₂ in one move.",
    paragraphs: [
      "A modern air-water heat pump delivers 3–4 kWh of heat per kWh of electricity — far better than any oil or gas boiler. For a 1970s-era home in the Swiss midlands, that translates into a 60–80% drop in operating cost the first winter.",
      "The job covers more than the unit itself: oil tank removal, new buffer and hot-water cylinder, hydraulic controls, and acoustic siting in the garden. Most installations run 3–5 days on site.",
      "MuKEn 2025 already restricts pure fossil-boiler replacement, and from 2026 will require building-envelope improvements before a new fossil boiler can be installed at all. Switching now keeps subsidies on the table and avoids future compliance work.",
    ],
    costRange: "CHF 32,000 – 48,000",
    savingsPerYear: "CHF 2,800 – 4,200",
    co2Reduction: "≈ 2.8 t / year",
    timeline: "2 – 4 weeks",
    subsidies: [
      "Federal heat-pump bonus — CHF 2,500 – 6,000",
      "Cantonal heat-pump programmes (most cantons)",
      "Free CO₂ levy refund on the displaced fuel",
    ],
  },
  solar: {
    id: "solar",
    oneLiner:
      "A south-facing roof and ten years of feed-in tariffs make rooftop PV one of the safest investments in Swiss real estate.",
    paragraphs: [
      "An 8–10 kWp system on a typical Swiss roof produces around 9,000 kWh per year — comfortably more than most households consume. Pair it with a 10 kWh battery and self-consumption rises to 60–70%.",
      "Combined with a heat pump, the household runs near-zero on grid electricity in summer and shoulder months. The investment pays back in 9–12 years at current tariffs, faster if electricity prices rise.",
      "Practically, this is roof work plus a controller and inverter inside. The grid connection paperwork is the slowest part; installation itself is two to three days.",
    ],
    costRange: "CHF 22,000 – 32,000",
    savingsPerYear: "CHF 1,400 – 2,200",
    co2Reduction: "displaces ≈ 0.9 t / year",
    timeline: "3 – 6 weeks (incl. utility approval)",
    subsidies: [
      "Federal one-off remuneration (Einmalvergütung)",
      "Battery bonus in selected cantons",
      "Reduced VAT on residential PV installations",
    ],
  },
  windows: {
    id: "windows",
    oneLiner:
      "Triple-glazed windows with thermal-break frames eliminate cold spots, condensation and the loudest source of street noise.",
    paragraphs: [
      "Modern triple-glazed units reach U-values around 0.7 W/m²K — roughly four times better than the double glazing common in 1980s and 1990s Swiss homes. The interior glass surface stays warm enough to sit next to in January without a draft.",
      "Replacing windows is also where you upgrade air-tightness. New seals, properly detailed at the wall connection, eliminate the slow infiltration that drives a quarter of heat loss in older homes.",
      "Best paired with a facade upgrade so the new frame can be detailed flush with the new insulation. Done as a stand-alone job, it still delivers a step change in comfort and noise.",
    ],
    costRange: "CHF 22,000 – 38,000",
    savingsPerYear: "CHF 600 – 1,000",
    co2Reduction: "≈ 0.5 t / year",
    timeline: "1 – 3 weeks",
    subsidies: [
      "Federal Building Programme — window component, where wall U-value is also met",
      "Cantonal envelope subsidies",
      "Tax-deductible as energy renovation",
    ],
  },
};
