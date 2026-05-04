import { describe, it, expect } from "vitest";
import { estimatePropertyValue } from "./valuation";

describe("estimatePropertyValue", () => {
  it("uses the per-Gemeinde lookup for Mettmenstetten (BFS-Nr 9)", () => {
    const v = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 9 },
      ebfM2: 523,
      year: 1924,
      geak: "E",
    });
    // (523 / 1.18) × 7400 × 0.85 × 0.96 ≈ 2.68M
    expect(v).toBeGreaterThan(2_500_000);
    expect(v).toBeLessThan(2_800_000);
  });

  it("uses ZH default for unmapped Gemeinden", () => {
    const v = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 999_999 },
      ebfM2: 200,
      year: 2000,
      geak: "D",
    });
    // (200 / 1.18) × 8500 × 1.05 × 1.0 ≈ 1.51M
    expect(v).toBeGreaterThan(1_400_000);
    expect(v).toBeLessThan(1_600_000);
  });

  it("uses non-ZH default for other cantons", () => {
    const v = estimatePropertyValue({
      gwr: { gdekt: "BE", ggdenr: 351 },
      ebfM2: 200,
      year: 2000,
      geak: "D",
    });
    // (200 / 1.18) × 6500 × 1.05 × 1.0 ≈ 1.156M
    expect(v).toBeGreaterThan(1_080_000);
    expect(v).toBeLessThan(1_240_000);
  });

  it("scales with Gemeinde — Goldküste premium over Knonaueramt", () => {
    const aff = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 9 }, // Mettmenstetten
      ebfM2: 200,
      year: 2000,
      geak: "C",
    });
    const küs = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 154 }, // Küsnacht
      ebfM2: 200,
      year: 2000,
      geak: "C",
    });
    expect(küs / aff).toBeGreaterThan(1.8);
  });

  it("applies the GEAK discount", () => {
    const a = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 9 },
      ebfM2: 200,
      year: 2000,
      geak: "A",
    });
    const g = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 9 },
      ebfM2: 200,
      year: 2000,
      geak: "G",
    });
    expect(a).toBeGreaterThan(g);
  });
});
