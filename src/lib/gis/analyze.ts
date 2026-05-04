/**
 * Orchestrates the full analysis pipeline for an address: GWR identify
 * (sequential, since the building centroid drives the next two calls)
 * then solar + PV checks in parallel, then map into a Building.
 */

import {
  identifyBuilding,
  identifyPvInstallations,
  identifySolar,
} from "./geoadmin";
import { mapToBuilding, type Eligibility, type MapperResult } from "./mapper";
import type { Lv95 } from "./types";

export interface AnalyzeResult extends MapperResult {
  egid: string;
  centroid: Lv95;
}

export interface AnalyzeOptions {
  addressLabel?: string;
  signal?: AbortSignal;
}

export async function analyzeAddress(
  lv95: Lv95,
  options: AnalyzeOptions = {},
): Promise<AnalyzeResult | null> {
  const identity = await identifyBuilding(lv95, options.signal);
  if (!identity) return null;

  // Use the GWR centroid for downstream layers — it's more reliable than
  // the geocoded address point when the building polygon is offset.
  const [solar, pv] = await Promise.all([
    identifySolar(identity.centroid, options.signal).catch(() => null),
    identifyPvInstallations(identity.centroid, options.signal).catch(
      () => [] as Awaited<ReturnType<typeof identifyPvInstallations>>,
    ),
  ]);

  const mapped = mapToBuilding({
    gwr: identity.attributes,
    addressLabel: options.addressLabel,
    solar,
    pvInstallations: pv,
  });

  return {
    ...mapped,
    egid: identity.egid,
    centroid: identity.centroid,
  };
}

export type { Eligibility };
