/**
 * LV95 (CH1903+) coordinates as [easting, northing].
 * Easting ~2.5M, northing ~1.1M. Note: GeoAdmin's REST responses
 * use the inverted convention (`x = northing`, `y = easting`); the
 * geoadmin client normalises into this tuple before returning.
 */
export type Lv95 = readonly [number, number];

export interface AddressSuggestion {
  /** Plain-text address label (HTML-stripped). */
  label: string;
  /** LV95 coordinates of the address. */
  lv95: Lv95;
  /** Latitude/longitude (WGS84). */
  latLon: readonly [number, number];
  /** GeoAdmin internal feature id (e.g. "4070_0"). */
  featureId: string;
}

/**
 * Subset of GWR attributes returned by api3.geo.admin.ch identify on
 * the layer `ch.bfs.gebaeude_wohnungs_register`. Field names mirror
 * the BFS GWR specification — keep them lower-case so Json mapping
 * is direct, no rename layer.
 */
export interface GwrAttributes {
  egid: string;
  egrid: string | null;
  ggdename: string;
  ggdenr: number;
  gdekt: string;
  /** Construction year (Baujahr). */
  gbauj: number | null;
  /** Building period code (Bauperiode), used when gbauj is absent. */
  gbaup: number | null;
  /** Footprint area (m²). */
  garea: number | null;
  /** Number of storeys. */
  gastw: number | null;
  /** Number of dwellings. */
  ganzwhg: number | null;
  /** Building category code. */
  gkat: number | null;
  /** Building class code (subdivision of gkat). */
  gklas: number | null;
  /** Heating generator code (primary). */
  gwaerzh1: number | null;
  /** Heating energy source code (primary). */
  genh1: number | null;
  /** Heating generator code (secondary). */
  gwaerzh2: number | null;
  /** Heating energy source code (secondary). */
  genh2: number | null;
  /** DHW generator code (primary). */
  gwaerzw1: number | null;
  /** DHW energy source code (primary). */
  genw1: number | null;
  /** Date the primary heating was installed/renewed (DD.MM.YYYY). */
  gwaerdath1: string | null;
  /** Date the primary DHW was installed/renewed (DD.MM.YYYY). */
  gwaerdatw1: string | null;
  /** Building centroid easting in LV95. */
  gkode: number | null;
  /** Building centroid northing in LV95. */
  gkodn: number | null;
  strname_deinr: string;
  plz_plz6: string;
}

export interface BuildingIdentity {
  egid: string;
  /** Building centroid in LV95, taken from gkode/gkodn when present. */
  centroid: Lv95;
  attributes: GwrAttributes;
}

/**
 * Aggregate roof solar data from `ch.bfe.solarenergie-eignung-daecher`.
 * BFE returns one feature per roof surface; we sum across surfaces that
 * share the same building. The `bedarf_*` fields are per-building
 * (constant across surfaces) so we keep the first non-null value.
 */
export interface SolarRoofPotential {
  /** Annual PV electricity yield (kWh/yr) summed across surfaces. */
  pvYieldKwh: number;
  /** Total roof surface area (m²). */
  surfaceM2: number;
  /** Suitability class 1 (poor) – 5 (excellent), maximum across surfaces. */
  bestClass: number;
  /** Per-building heating demand (kWh/yr), from BFE building model. */
  heatingDemandKwh: number | null;
  /** Per-building DHW demand (kWh/yr). */
  dhwDemandKwh: number | null;
  /** GWR EGID cross-link, if BFE published it. */
  gwrEgid: string | null;
}

/**
 * Single PV installation registered in BFE's HKN system
 * (`ch.bfe.elektrizitaetsproduktionsanlagen`). Filtered to photovoltaic.
 */
export interface PvInstallation {
  totalPowerKw: number;
  beginningOfOperation: string | null;
  address: string;
  canton: string;
}

/** A heritage object near (or at) the parcel, from GIS-ZH
 * `ogd-0368_giszhpub_arv_kaz_denkmalschutzobjekte_p`. */
export interface HeritageObject {
  /** Stable internal ID. */
  id: number;
  /** Human-readable description ("Pfarrhaus", "Bauernhaus" …). */
  objekt: string;
  /** Address as published in the inventory. */
  strasse: string;
  /** Cantonal vs regional importance — stub field, filled when present. */
  ensemble: string | null;
  /** Source PDF inventory sheet, when published. */
  inventarblatt: string | null;
}
