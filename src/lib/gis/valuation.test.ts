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
    // 523 × 7400 × 0.85 × 0.96 ≈ 3.16M
    expect(v).toBeGreaterThan(3_000_000);
    expect(v).toBeLessThan(3_300_000);
  });

  it("uses ZH default for unmapped Gemeinden", () => {
    const v = estimatePropertyValue({
      gwr: { gdekt: "ZH", ggdenr: 999_999 },
      ebfM2: 200,
      year: 2000,
      geak: "D",
    });
    // 200 × 8500 × 1.05 × 1.0 = 1.785M
    expect(v).toBeGreaterThan(1_700_000);
    expect(v).toBeLessThan(1_900_000);
  });

  it("uses non-ZH default for other cantons", () => {
    const v = estimatePropertyValue({
      gwr: { gdekt: "BE", ggdenr: 351 },
      ebfM2: 200,
      year: 2000,
      geak: "D",
    });
    // 200 × 6500 × 1.05 × 1.0 = 1.365M
    expect(v).toBeGreaterThan(1_300_000);
    expect(v).toBeLessThan(1_500_000);
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
