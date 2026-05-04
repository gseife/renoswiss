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
import {
  identifyDistrictHeatAvailable,
  identifyGeothermalZone,
  identifyHeritage,
} from "./gisZh";
import {
  mapToBuilding,
  type Eligibility,
  type MapperResult,
  type ZhContext,
} from "./mapper";
import type { Lv95 } from "./types";

export interface AnalyzeResult extends MapperResult {
  egid: string;
  centroid: Lv95;
}

/** Coarse milestones the UI can tick as each real data source resolves.
 * Tied to the actual federal/cantonal layers below, not to a wall-clock
 * timer — a step appears unticked if its source failed or didn't apply. */
export type AnalyzeProgress = "gwr" | "energy" | "cantonal" | "profile";

export interface AnalyzeOptions {
  addressLabel?: string;
  signal?: AbortSignal;
  /** Fired with a step key as each backing layer resolves. */
  onProgress?: (step: AnalyzeProgress) => void;
}

export async function analyzeAddress(
  lv95: Lv95,
  options: AnalyzeOptions = {},
): Promise<AnalyzeResult | null> {
  const { onProgress } = options;
  const identity = await identifyBuilding(lv95, options.signal);
  if (!identity) return null;
  onProgress?.("gwr");

  const isZh = identity.attributes.gdekt === "ZH";

  // Use the GWR centroid for downstream layers — it's more reliable than
  // the geocoded address point when the building polygon is offset.
  // ZH layers fan out only when the parcel sits in canton Zürich.
  const solarP = identifySolar(identity.centroid, options.signal).catch(
    () => null,
  );
  const pvP = identifyPvInstallations(identity.centroid, options.signal).catch(
    () => [] as Awaited<ReturnType<typeof identifyPvInstallations>>,
  );
  // Tick "energy" only when both Sonnendach + Pronovo have settled.
  void Promise.all([solarP, pvP]).then(() => onProgress?.("energy"));

  const zhP: Promise<ZhContext | null> = isZh
    ? buildZhContext(identity.centroid, options.signal)
    : Promise.resolve(null);
  void zhP.then(() => onProgress?.("cantonal"));

  const [solar, pv, zhContext] = await Promise.all([solarP, pvP, zhP]);

  const mapped = mapToBuilding({
    gwr: identity.attributes,
    addressLabel: options.addressLabel,
    solar,
    pvInstallations: pv,
    zhContext,
  });
  onProgress?.("profile");

  return {
    ...mapped,
    egid: identity.egid,
    centroid: identity.centroid,
  };
}

const buildZhContext = async (
  lv95: Lv95,
  signal?: AbortSignal,
): Promise<ZhContext> => {
  const [heritage, districtHeat, geothermal] = await Promise.all([
    identifyHeritage(lv95, { signal }).catch(() => ({
      nearest: null,
      distanceM: null,
      blocksFacade: false,
    })),
    identifyDistrictHeatAvailable(lv95, signal).catch(() => false),
    identifyGeothermalZone(lv95, signal).catch(() => null),
  ]);

  return {
    heritageBlock: heritage.blocksFacade,
    heritageObject: heritage.nearest,
    heritageDistanceM: heritage.distanceM,
    districtHeatAvailable: districtHeat,
    geothermalZone: geothermal,
  };
};

export type { Eligibility };
