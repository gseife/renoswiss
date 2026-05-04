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

  const isZh = identity.attributes.gdekt === "ZH";

  // Use the GWR centroid for downstream layers — it's more reliable than
  // the geocoded address point when the building polygon is offset.
  // ZH layers fan out only when the parcel sits in canton Zürich.
  const [solar, pv, zhContext] = await Promise.all([
    identifySolar(identity.centroid, options.signal).catch(() => null),
    identifyPvInstallations(identity.centroid, options.signal).catch(
      () => [] as Awaited<ReturnType<typeof identifyPvInstallations>>,
    ),
    isZh
      ? buildZhContext(identity.centroid, options.signal)
      : Promise.resolve<ZhContext | null>(null),
  ]);

  const mapped = mapToBuilding({
    gwr: identity.attributes,
    addressLabel: options.addressLabel,
    solar,
    pvInstallations: pv,
    zhContext,
  });

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
