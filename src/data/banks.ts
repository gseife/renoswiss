/**
 * Swiss residential mortgage rates and green-renovation discounts.
 *
 * Values reflect publicly-listed product pages and Comparis / Moneyland
 * indices for Spring 2026, when SARON sat near 0.7% after the SNB cut
 * cycle of 2024-25. A production deployment would refresh these via a
 * Moneyland B2B feed or a twice-weekly Comparis scrape; for the demo
 * they are static one-time values.
 *
 * Green discounts are GEAK-tied (typically B or better, sometimes A only)
 * and stack on top of any LTV/risk surcharge.
 *
 * Sources:
 *  - ZKB Umweltdarlehen (CHF 0.30 off for GEAK A/B)
 *  - Raiffeisen Eco-Hypothek (CHF 0.25 off for energy renovations)
 *  - UBS Eco Renovation (CHF 0.15 for Minergie)
 *  - Migros Bank Öko (CHF 0.20 off for GEAK B)
 *  - PostFinance green renovation loan (CHF 0.10 off)
 */

export type ProductId = "saron" | "fixed5" | "fixed10";

export const PRODUCTS: Record<
  ProductId,
  { id: ProductId; name: string; description: string }
> = {
  saron: {
    id: "saron",
    name: "SARON",
    description: "Variable rate, tracks the SARON reference. Cheapest today, but moves with the market.",
  },
  fixed5: {
    id: "fixed5",
    name: "Fixed 5y",
    description: "Rate locked for 5 years. Middle ground between flexibility and certainty.",
  },
  fixed10: {
    id: "fixed10",
    name: "Fixed 10y",
    description: "Rate locked for 10 years. Highest rate but full predictability.",
  },
};

export const PRODUCT_ORDER: ProductId[] = ["saron", "fixed5", "fixed10"];

export interface Bank {
  id: string;
  name: string;
  short: string;
  rates: Record<ProductId, number>;
  /** GEAK-tied discount, applied via priceBankOffer when renovation is green. */
  greenDiscount: number;
  bg: string;
  fg: string;
  monogram: string;
}

export const BANKS: Bank[] = [
  {
    id: "zkb",
    name: "Zürcher Kantonalbank",
    short: "ZKB",
    rates: { saron: 1.18, fixed5: 1.6, fixed10: 1.74 },
    greenDiscount: 0.3,
    bg: "#005CA9",
    fg: "#FFFFFF",
    monogram: "ZKB",
  },
  {
    id: "raiffeisen",
    name: "Raiffeisen",
    short: "Raiffeisen",
    rates: { saron: 1.2, fixed5: 1.65, fixed10: 1.78 },
    greenDiscount: 0.25,
    bg: "#1E1E1E",
    fg: "#FFD200",
    monogram: "R",
  },
  {
    id: "migrosbank",
    name: "Migros Bank",
    short: "Migros Bank",
    rates: { saron: 1.25, fixed5: 1.68, fixed10: 1.8 },
    greenDiscount: 0.2,
    bg: "#FF6600",
    fg: "#FFFFFF",
    monogram: "M",
  },
  {
    id: "ubs",
    name: "UBS",
    short: "UBS",
    rates: { saron: 1.3, fixed5: 1.78, fixed10: 1.92 },
    greenDiscount: 0.15,
    bg: "#E60100",
    fg: "#FFFFFF",
    monogram: "UBS",
  },
  {
    id: "postfinance",
    name: "PostFinance",
    short: "PostFinance",
    rates: { saron: 1.32, fixed5: 1.72, fixed10: 1.84 },
    greenDiscount: 0.1,
    bg: "#FFCC00",
    fg: "#1E1E1E",
    monogram: "P",
  },
];
