/**
 * Canton Zürich GIS client. Calls the open WFS at maps.zh.ch.
 * All layers we use are available without auth, CORS-enabled, and
 * speak EPSG:2056 (LV95).
 */

import type { HeritageObject, Lv95 } from "./types";

const WFS_URL = "https://maps.zh.ch/wfs/OGDZHWFS";
const SR = "EPSG:2056";

const HERITAGE_LAYER = "ms:ogd-0368_giszhpub_arv_kaz_denkmalschutzobjekte_p";
const DISTRICT_HEAT_LAYER =
  "ms:ogd-0172_giszhpub_en_eignungsgeb_rohr_energien_f";
const GEOTHERMAL_LAYER = "ms:ogd-0316_giszhpub_gs_waermenutzungsatlas_f";

/** Different layers on this server permit different output formats —
 * try the strict subtype form first; fall through to plain JSON for
 * the few layers (e.g. heritage) that only allow that. */
const OUTPUT_FORMATS = [
  "application/json; subtype=geojson",
  "application/json",
] as const;

interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  numberMatched?: number;
}

const buildBbox = (lv95: Lv95, halfM: number): string => {
  const [e, n] = lv95;
  return `${e - halfM},${n - halfM},${e + halfM},${n + halfM},${SR}`;
};

interface GetFeatureOptions {
  layer: string;
  lv95: Lv95;
  halfM: number;
  signal?: AbortSignal;
}

const getFeatures = async ({
  layer,
  lv95,
  halfM,
  signal,
}: GetFeatureOptions): Promise<GeoJsonFeature[]> => {
  let lastErr: unknown = null;
  for (const fmt of OUTPUT_FORMATS) {
    const params = new URLSearchParams({
      service: "WFS",
      version: "2.0.0",
      request: "GetFeature",
      typeNames: layer,
      bbox: buildBbox(lv95, halfM),
      outputFormat: fmt,
      count: "20",
    });
    try {
      const res = await fetch(`${WFS_URL}?${params}`, { signal });
      if (!res.ok) {
        // 400 typically means "this layer doesn't permit this output format" —
        // try the next one.
        lastErr = new Error(`WFS ${res.status} for ${layer}`);
        continue;
      }
      const json = (await res.json()) as FeatureCollection;
      return json.features ?? [];
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error(`WFS request failed for ${layer}`);
};

const distanceM = (a: Lv95, b: Lv95): number => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const featureCentroid = (f: GeoJsonFeature): Lv95 | null => {
  const g = f.geometry;
  if (!g) return null;
  if (g.type === "Point") {
    const c = g.coordinates as [number, number];
    return [c[0], c[1]];
  }
  // For polygons: take the first ring's first point as a cheap centroid proxy.
  // Good enough for "is this within X m of my parcel" checks.
  if (g.type === "Polygon") {
    const ring = (g.coordinates as number[][][])[0];
    if (ring && ring.length > 0) return [ring[0][0], ring[0][1]];
  }
  if (g.type === "MultiPolygon") {
    const ring = (g.coordinates as number[][][][])[0]?.[0];
    if (ring && ring.length > 0) return [ring[0][0], ring[0][1]];
  }
  return null;
};

interface RawHeritage {
  odb_id?: number;
  objekt?: string;
  strasse?: string;
  ensemble?: string;
  inventarblatt?: string;
}

export interface HeritageResult {
  /** Closest heritage object within the search radius, if any. */
  nearest: HeritageObject | null;
  /** Distance in metres to that object (haversine-free, LV95-Euclidean). */
  distanceM: number | null;
  /** True when the closest object is within `blockRadiusM`. */
  blocksFacade: boolean;
}

export async function identifyHeritage(
  lv95: Lv95,
  options: { blockRadiusM?: number; signal?: AbortSignal } = {},
): Promise<HeritageResult> {
  const blockRadius = options.blockRadiusM ?? 25;
  // Search in a 200m bounding box, then filter by exact distance.
  const features = await getFeatures({
    layer: HERITAGE_LAYER,
    lv95,
    halfM: 200,
    signal: options.signal,
  });

  let best: { obj: HeritageObject; dist: number } | null = null;
  for (const f of features) {
    const c = featureCentroid(f);
    if (!c) continue;
    const d = distanceM(lv95, c);
    const p = f.properties as RawHeritage;
    if (!best || d < best.dist) {
      best = {
        dist: d,
        obj: {
          id: p.odb_id ?? 0,
          objekt: p.objekt ?? "Schutzobjekt",
          strasse: p.strasse ?? "",
          ensemble: p.ensemble || null,
          inventarblatt: p.inventarblatt || null,
        },
      };
    }
  }

  if (!best) return { nearest: null, distanceM: null, blocksFacade: false };
  return {
    nearest: best.obj,
    distanceM: Math.round(best.dist),
    blocksFacade: best.dist <= blockRadius,
  };
}

export async function identifyDistrictHeatAvailable(
  lv95: Lv95,
  signal?: AbortSignal,
): Promise<boolean> {
  const features = await getFeatures({
    layer: DISTRICT_HEAT_LAYER,
    lv95,
    halfM: 100,
    signal,
  });
  return features.length > 0;
}

interface RawGeothermal {
  zonen?: string;
}

export async function identifyGeothermalZone(
  lv95: Lv95,
  signal?: AbortSignal,
): Promise<string | null> {
  const features = await getFeatures({
    layer: GEOTHERMAL_LAYER,
    lv95,
    halfM: 50,
    signal,
  });
  // Take the first zone code (most parcels sit in a single zone).
  for (const f of features) {
    const p = f.properties as RawGeothermal;
    if (p.zonen) return p.zonen;
  }
  return null;
}
