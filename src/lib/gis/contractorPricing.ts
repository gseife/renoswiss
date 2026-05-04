/**
 * Derives the price a contractor would quote for a given module by
 * applying their `priceDelta` (% offset vs market average) to the
 * scaled module's `estCost`. This way, when the module cost scales
 * with building size, contractor quotes scale proportionally.
 */

import type { Contractor, Module } from "@/data/types";

export const priceFor = (contractor: Contractor, module: Module): number => {
  const factor = 1 + (contractor.priceDelta ?? 0) / 100;
  return Math.round(module.estCost * factor);
};
