import type {
  AddressSuggestion,
  BuildingIdentity,
  GwrAttributes,
  Lv95,
  PvInstallation,
  SolarRoofPotential,
} from "./types";

export type {
  AddressSuggestion,
  BuildingIdentity,
  GwrAttributes,
  Lv95,
  PvInstallation,
  SolarRoofPotential,
};

const SEARCH_URL = "https://api3.geo.admin.ch/rest/services/api/SearchServer";
const IDENTIFY_URL =
  "https://api3.geo.admin.ch/rest/services/ech/MapServer/identify";

const GWR_LAYER = "ch.bfs.gebaeude_wohnungs_register";
const SOLAR_LAYER = "ch.bfe.solarenergie-eignung-daecher";
const PV_LAYER = "ch.bfe.elektrizitaetsproduktionsanlagen";

const stripHtml = (s: string): string => s.replace(/<[^>]+>/g, "");

export interface SearchOptions {
  /** Optional canton filter (e.g. "ZH"). */
  canton?: string;
  /** Maximum suggestions (server-side cap). */
  limit?: number;
  signal?: AbortSignal;
}

interface RawSearchAttrs {
  label: string;
  /** GeoAdmin convention: x is northing in LV95. */
  x: number;
  /** GeoAdmin convention: y is easting in LV95. */
  y: number;
  lat: number;
  lon: number;
  featureId: string | null;
}

export async function searchAddresses(
  query: string,
  options: SearchOptions = {},
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    type: "locations",
    origins: "address",
    sr: "2056",
    limit: String(options.limit ?? 8),
    searchText: trimmed,
  });
  if (options.canton) params.set("filter", `kanton:${options.canton}`);

  const res = await fetch(`${SEARCH_URL}?${params}`, { signal: options.signal });
  if (!res.ok) throw new Error(`SearchServer ${res.status}`);
  const json = (await res.json()) as { results?: Array<{ attrs?: RawSearchAttrs }> };

  return (json.results ?? [])
    .map((r) => r.attrs)
    .filter((a): a is RawSearchAttrs => Boolean(a))
    .map((a) => ({
      label: stripHtml(a.label),
      // Normalise GeoAdmin's (northing, easting) into LV95 [easting, northing].
      lv95: [a.y, a.x] as const,
      latLon: [a.lat, a.lon] as const,
      featureId: a.featureId ?? "",
    }));
}

interface RawIdentifyResult {
  layerBodId: string;
  featureId: string;
  properties: Record<string, unknown>;
}

export async function identifyBuilding(
  lv95: Lv95,
  signal?: AbortSignal,
): Promise<BuildingIdentity | null> {
  const [easting, northing] = lv95;
  // 200 m bbox around the point. Tolerance 5 px lets the click slide
  // off the centroid without missing the polygon.
  const half = 100;
  const params = new URLSearchParams({
    geometry: `${easting},${northing}`,
    geometryType: "esriGeometryPoint",
    layers: `all:${GWR_LAYER}`,
    mapExtent: `${easting - half},${northing - half},${easting + half},${northing + half}`,
    imageDisplay: "500,500,96",
    tolerance: "5",
    sr: "2056",
    geometryFormat: "geojson",
    returnGeometry: "false",
  });

  const res = await fetch(`${IDENTIFY_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`MapServer/identify ${res.status}`);
  const json = (await res.json()) as { results?: RawIdentifyResult[] };
  const first = json.results?.[0];
  if (!first) return null;

  const attrs = first.properties as unknown as GwrAttributes;
  const centroid: Lv95 =
    typeof attrs.gkode === "number" && typeof attrs.gkodn === "number"
      ? [attrs.gkode, attrs.gkodn]
      : lv95;

  return { egid: String(attrs.egid), centroid, attributes: attrs };
}

const buildIdentifyParams = (
  lv95: Lv95,
  layer: string,
  options: { tolerance?: number; halfBboxM?: number } = {},
): URLSearchParams => {
  const [easting, northing] = lv95;
  const half = options.halfBboxM ?? 100;
  return new URLSearchParams({
    geometry: `${easting},${northing}`,
    geometryType: "esriGeometryPoint",
    layers: `all:${layer}`,
    mapExtent: `${easting - half},${northing - half},${easting + half},${northing + half}`,
    imageDisplay: "500,500,96",
    tolerance: String(options.tolerance ?? 0),
    sr: "2056",
    geometryFormat: "geojson",
    returnGeometry: "false",
  });
};

interface RawSolarProperties {
  building_id?: number;
  klasse?: number;
  flaeche?: number;
  stromertrag?: number;
  bedarf_heizung?: number | null;
  bedarf_warmwasser?: number | null;
  gwr_egid?: number | null;
}

export async function identifySolar(
  lv95: Lv95,
  signal?: AbortSignal,
): Promise<SolarRoofPotential | null> {
  const params = buildIdentifyParams(lv95, SOLAR_LAYER);
  const res = await fetch(`${IDENTIFY_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`MapServer/identify ${res.status}`);
  const json = (await res.json()) as { results?: RawIdentifyResult[] };
  const rows = (json.results ?? []).map((r) => r.properties as RawSolarProperties);
  if (rows.length === 0) return null;

  let pvYieldKwh = 0;
  let surfaceM2 = 0;
  let bestClass = 0;
  let heatingDemandKwh: number | null = null;
  let dhwDemandKwh: number | null = null;
  let gwrEgid: string | null = null;

  for (const r of rows) {
    pvYieldKwh += r.stromertrag ?? 0;
    surfaceM2 += r.flaeche ?? 0;
    if ((r.klasse ?? 0) > bestClass) bestClass = r.klasse ?? 0;
    if (heatingDemandKwh == null && r.bedarf_heizung != null) {
      heatingDemandKwh = r.bedarf_heizung;
    }
    if (dhwDemandKwh == null && r.bedarf_warmwasser != null) {
      dhwDemandKwh = r.bedarf_warmwasser;
    }
    if (gwrEgid == null && r.gwr_egid != null) gwrEgid = String(r.gwr_egid);
  }

  return {
    pvYieldKwh: Math.round(pvYieldKwh),
    surfaceM2: Math.round(surfaceM2),
    bestClass,
    heatingDemandKwh,
    dhwDemandKwh,
    gwrEgid,
  };
}

interface RawPvProperties {
  total_power?: string;
  initial_power?: string;
  beginning_of_operation?: string | null;
  address?: string;
  canton?: string;
  sub_category_en?: string;
  sub_category_de?: string;
}

const parsePowerKw = (s: string | undefined): number => {
  if (!s) return 0;
  // e.g. "9.92 kW", "100 kW", "1.5 MW"
  const match = /([\d.]+)\s*(MW|kW|W)?/i.exec(s);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] ?? "kW").toUpperCase();
  if (unit === "MW") return value * 1000;
  if (unit === "W") return value / 1000;
  return value;
};

const isPvInstallation = (p: RawPvProperties): boolean => {
  const en = (p.sub_category_en ?? "").toLowerCase();
  const de = (p.sub_category_de ?? "").toLowerCase();
  return en.includes("photovoltaic") || de.includes("photovoltaik");
};

export async function identifyPvInstallations(
  lv95: Lv95,
  signal?: AbortSignal,
): Promise<PvInstallation[]> {
  // Wider tolerance (20 px) — installations are point geometries that may
  // not sit exactly on the building centroid we pass in.
  const params = buildIdentifyParams(lv95, PV_LAYER, { tolerance: 20 });
  const res = await fetch(`${IDENTIFY_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`MapServer/identify ${res.status}`);
  const json = (await res.json()) as { results?: RawIdentifyResult[] };

  return (json.results ?? [])
    .map((r) => r.properties as RawPvProperties)
    .filter(isPvInstallation)
    .map((p) => ({
      totalPowerKw: parsePowerKw(p.total_power ?? p.initial_power),
      beginningOfOperation: p.beginning_of_operation ?? null,
      address: p.address ?? "",
      canton: p.canton ?? "",
    }));
}
