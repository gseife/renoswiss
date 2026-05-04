# RenoSwiss — GIS Integration Plan

> Concrete plan for wiring real building data into the demo from two GIS sources — federal **`map.geo.admin.ch`** and **GIS-ZH** (`geo.zh.ch` / `maps.zh.ch`) — plus defensible mocking strategies for the fields no GIS layer can provide. Companion to `docs/data-sourcing.md` (broader audit).

Generated 2026-05-03. Target: populate `src/data/building.ts` and the module-eligibility predicates from real APIs for any Canton Zürich address.

---

## 1. Field coverage matrix

Using the `Building` shape in `src/data/building.ts`:

| Field | GeoAdmin (federal) | GIS-ZH (cantonal) | Modeled / mocked |
|---|---|---|---|
| `address` | SearchServer | — | — |
| `year` | GWR `GBAUJ` | AV cross-check | — |
| `type` | GWR `GKAT/GKLAS` | AV | — |
| `area` | GWR `GAREA` × `GASTW` | AV footprint × storeys | — |
| `floors` | GWR `GASTW` | AV | — |
| `heating` | GWR `GENH1`+`GHEIZ` | — | — |
| `heatingAge` | GWR `GWAERZH1` | — | fallback to `year + 25 yr` |
| `geakClass` | `geakpubx` (post-2019 only) | ZH GEAK aggregates (sparse) | **modeled** (typology) |
| `insulation` | — | — | **modeled** (cohort) |
| `windows` | — | — | **modeled** (cohort + retrofit) |
| `roof` | — | — | **modeled** (cohort) |
| `basement` | — | — | **modeled** (cohort) |
| `annualEnergy` | — | — | **modeled** (`area × intensity`) |
| `annualCost` | — | — | **modeled** (`energy × fuel price`) |
| `co2` | — | — | **modeled** (`energy × emission factor`) |
| `estimatedValue` | — | — | **modeled** (BFS hedonic proxy) |
| PV potential | `ch.bfe.solarenergie-eignung-daecher` | — | — |
| Roof orientation/slope | same | — | — |
| Zoning constraints | — | Bauzonen / Nutzungsplanung | — |
| Heritage block | — | Inventar Schutzobjekte / ISOS | — |
| District-heat eligibility | — | Wärmeverbund / Energieplanung KGDM | — |
| Geothermal permit | — | Wärmenutzungsatlas | — |
| Noise context | — | Strassenlärm / Bahnlärm | — |
| Hazard overlay | — | Naturgefahren | — |

GIS sources cover identity + spatial context. **All thermal-condition and economic fields are modeled.** That's where Section 4 below matters.

---

## 2. Source A — `api3.geo.admin.ch`

Open REST. CRS **LV95 (EPSG:2056)**. CORS-enabled. No key.

### Endpoints

| Purpose | URL |
|---|---|
| Address autocomplete | `https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&origins=address&searchText={q}` |
| EGID lookup | `https://api3.geo.admin.ch/rest/services/api/SearchServer?type=featuresearch&features=ch.bfs.gebaeude_wohnungs_register&searchText={q}` |
| Building at point | `https://api3.geo.admin.ch/rest/services/ech/MapServer/identify?layers=all:ch.bfs.gebaeude_wohnungs_register&geometry={E},{N}&geometryType=esriGeometryPoint&sr=2056&geometryFormat=geojson&mapExtent={bbox}&imageDisplay=500,500,96&tolerance=0` |
| GWR by EGID | `https://api3.geo.admin.ch/rest/services/api/MapServer/find?layer=ch.bfs.gebaeude_wohnungs_register&searchField=egid&searchText={EGID}&returnGeometry=true` |
| Roof solar | identify with `layers=all:ch.bfe.solarenergie-eignung-daecher` (returns `klasse`, `ausrichtung`, `neigung`, `mstrahlung`, `flaeche`) |
| Façade solar | `ch.bfe.solarenergie-eignung-fassaden` |
| Terrain height | `https://api3.geo.admin.ch/rest/services/height?easting={E}&northing={N}` |

### Useful GWR attributes

`EGID, GBAUJ, GBAUP, GKAT, GKLAS, GAREA, GASTW, GANZWHG, GHEIZ, GENH1, GENH2, GWAERZH1, GENW1, GWAERSCEH1, EGRID, GDEKT, GDENR`.

Heating codes (`GENH1`): `7200`=oil, `7201`=coal, `7210`=gas, `7220`=electric, `7230`=wood, `7240`=district heat, `7410`=heat pump air, `7411`=heat pump ground, `7510`=solar thermal, etc.

Building period codes (`GBAUP`) when `GBAUJ` is missing: `8011`=before 1919 → `8023`=2021+.

---

## 3. Source B — GIS-ZH (`geo.zh.ch`, `maps.zh.ch`)

OGC services: **WMS, WFS, WCS**. Layer URLs come from the [geodata catalog](https://www.geo.zh.ch/de/geodienste-nutzen/geodienste.html) (filter: `Kategorie = Geoservice`) and the [opendata.swiss org](https://opendata.swiss/de/organization/geoinformation-kanton-zuerich). Don't hard-code endpoints from this doc — pull at integration time.

### Layers to wire up

| Use case | Dataset family on GIS-ZH |
|---|---|
| Verify parcel + footprint | **AV — Liegenschaften / Gebäude** |
| Module zoning gate | **Bauzonen / Nutzungsplanung kommunal** |
| Block façade modules on listed buildings | **Inventar Schutzobjekte / Denkmalschutz** (cross-check with federal **ISOS**) |
| Enable "Anschluss Wärmeverbund" module | **Wärmeverbund / Fernwärme-Versorgungsgebiete**, **Energieplanung kommunal (KGDM)** |
| Enable GSHP | **Wärmenutzungsatlas — Erdwärmesonden zulässig** |
| Boost window-replacement priority | **Strassenlärm / Bahnlärm Tag/Nacht** |
| Site-notes pill | **Naturgefahren (Hochwasser, Rutsch)** |
| QC building age | **Gebäudealter** (cantonal) vs. GWR `GBAUJ` |

### Query pattern

For each layer: `GET {wfs_endpoint}?service=WFS&version=2.0.0&request=GetFeature&typeNames={layer}&bbox={minE},{minN},{maxE},{maxN},EPSG:2056&outputFormat=application/json`.

BBOX = parcel bbox + ~5 m buffer (from the GeoAdmin building polygon).

---

## 4. Implementation plan

### 4.1 New module `src/lib/gis/`

```
src/lib/gis/
├── geoadmin.ts        # SearchServer, identify, find, height, solar
├── gisZh.ts           # generic WFS client + named per-layer helpers
├── mapper.ts          # gwrToBuilding(), solarToPv(), zhContextFromBbox()
├── energyModel.ts     # typology-based energy/cost/CO2 estimator (§4.4)
├── valuation.ts       # BFS-hedonic estimatedValue (§4.5)
└── types.ts
```

All functions return `Result<T>` so the demo never breaks; on any failure the existing fixture in `src/data/building.ts` is used as a fallback.

### 4.2 Address input

Replace the address field on `StartAnalysis.tsx` with a debounced (~250 ms) autocomplete backed by `SearchServer?type=locations&origins=address`. On select, persist `{address, lv95: [E, N], egid}` in the store.

### 4.3 Analysis pipeline (turns the cosmetic step labels real)

The "Reading GWR / Querying GEAK / Matching cantonal subsidies" labels in the analyze step become real calls:

1. `geoadmin.findByEgid(egid)` → `mapper.gwrToBuilding()` → `year, type, area, floors, heating, heatingAge, dwellings`.
2. `geoadmin.identifySolar(footprintCenter)` → PV `kWp`, `kWh/kWp`, orientation, eligible roof area.
3. `Promise.all` over GIS-ZH WFS calls for the parcel BBOX → `ZhContext { zoning, heritage, districtHeat, geothermalAllowed, noiseDb, hazardZones }`.
4. `energyModel.estimate({ year, area, heating, retrofit })` → `annualEnergy, annualCost, co2`.
5. `valuation.estimate({ municipalityBfsNr, type, area, year })` → `estimatedValue`.
6. `mapper.deriveCondition({ year, gwaerzh1, retrofitFlags })` → `insulation, windows, roof, basement` + `geakClass`.

### 4.4 Module eligibility

Add `eligibility(ctx: ZhContext): boolean` to each module in `src/data/modules.ts`:

- Façade insulation → `!ctx.heritage.listed`
- Anschluss Wärmeverbund → `ctx.districtHeat.intersects && ctx.districtHeat.distanceM < 50`
- GSHP (Erdsonden) → `ctx.geothermalAllowed`
- Triple glazing prioritisation → `ctx.noiseDb >= 60`

### 4.5 Cache

Cache GWR identify/find by EGID in `localStorage` (record is stable). Cache GIS-ZH WFS responses for 24 h keyed by parcel BBOX hash.

---

## 5. Mocking the gaps — defensible models

The four condition fields, GEAK class, energy/cost/CO2 and value are not in any GIS layer. Mock them from published Swiss models so the numbers move realistically with `year × heating × area × canton` rather than being hard-coded.

### 5.1 Component condition by cohort

Building stock cohorts (BFE *Gebäudetypologie Schweiz*, EPFL/HSLU studies). Default condition assumes **no retrofit** unless `GWAERZH1 > GBAUJ + 5` (heating renewal is a strong proxy for envelope retrofit too).

| Cohort (`GBAUJ`) | `insulation` (default) | `windows` | `roof` | `basement` |
|---|---|---|---|---|
| ≤ 1918 | None / partial mineral | Wood-frame single, often replaced | Uninsulated tile | Uninsulated stone |
| 1919–1948 | None (5–10 cm if retrofitted) | Box-window or replaced double | Uninsulated tile | Uninsulated |
| 1949–1978 | Minimal (4–8 cm) | Original double-pane | Uninsulated concrete | Uninsulated |
| 1979–1994 | Light (8–12 cm, post SIA 180:1980) | Double IV-glass | Light insulation 8 cm | Partially insulated |
| 1995–2010 | Standard (14–18 cm) | Double low-e | Insulated 16 cm | Insulated |
| 2011+ | Minergie-influenced (20+ cm) | Triple low-e | 22+ cm | Insulated |

If `GWAERZH1 - GBAUJ > 5` and cohort ≤ 1978, **bump one cohort up** for `windows` and `insulation` (heuristic: when owners renew heating they typically also touch envelope).

`heatingAge` fallback when `GWAERZH1` missing: `min(currentYear - GBAUJ, 25)` — Swiss boilers rarely live past 25 years.

### 5.2 GEAK class

GEAK letter is a function of **specific final energy demand** (kWh/m²·a) on the *Gebäudehülle* axis. Use the Baualtersklasse × Heizungstyp matrix from BFE (typology study) as the lookup, then map to letters via SIA 380/1 thresholds. Approximate baseline for SFH (`Einfamilienhaus`) heated with oil/gas, no retrofit:

| Cohort | kWh/m²·a (heating + DHW) | GEAK |
|---|---|---|
| ≤ 1948 | 240–280 | G |
| 1949–1978 | 200–240 | F |
| 1979–1994 | 140–180 | E |
| 1995–2010 | 100–130 | D |
| 2011+ | 60–90 | C |

Adjustments: heat pump → −1 letter; full retrofit (`GWAERZH1` recent + Minergie partner municipality) → −2 letters; MFH (`Mehrfamilienhaus`) → +1 letter (better surface ratio).

### 5.3 Energy / cost / CO₂

```ts
// energyModel.ts — illustrative
const intensity = TYPOLOGY[cohort][type][retrofitState]; // kWh/m²·a
const annualEnergy = area * intensity;

const FUEL_PRICE = { oil: 0.105, gas: 0.115, electricity: 0.27, district: 0.12, wood: 0.08 }; // CHF/kWh, 2026
const annualCost = annualEnergy * FUEL_PRICE[fuel(heating)];

const CO2 = { oil: 0.300, gas: 0.200, electricity: 0.040, district: 0.060, wood: 0.020, hp: 0.040 }; // kg/kWh
const co2 = (annualEnergy * CO2[fuel(heating)]) / 1000; // tonnes
```

Source the per-cohort `intensity` table from the BFE pubdb document (`pubdb.bfe.admin.ch/de/publication/download/1225`). Cache the table as a static JSON in `src/data/energyTypology.json` and refresh annually.

Heat-pump COP correction: if `GENH1 ∈ {7410, 7411}`, divide `annualEnergy` by COP (3.0 air, 4.0 ground) before multiplying by electricity price/factor.

### 5.4 Property value (BFS hedonic proxy)

Without IAZI/Wüest, use the **BFS *Wohneigentumspreisindex*** + **median price/m²** per Gemeinde published quarterly:

```ts
estimatedValue = area * pricePerM2[bfsGemeindeNr][type] * yearFactor(year) * conditionFactor(geakClass);
```

- `pricePerM2` table: scrape BFS *Immobilienpreise* once, store as `src/data/zhMunicipalityPrices.json`.
- `yearFactor`: 0.85 (≤1948) → 0.92 (1949–1978) → 1.00 (1979–1994) → 1.05 (1995–2010) → 1.12 (2011+).
- `conditionFactor`: G=0.88, F=0.92, E=0.96, D=1.00, C=1.05, B=1.10, A=1.15.

`propertyIncrease` after renovation = `valueAt(targetGeak) / valueAt(currentGeak) − 1`. Cap at +20 % to avoid unrealistic claims.

### 5.5 Subsidy amounts

Federal Gebäudeprogramm (HFM 2015 measure codes M-01…M-19): publish as static `src/data/hfm2015.json` keyed by code, with `chfPerM2` × *measure area*. Cantonal ZH top-up (Energieförderung Kt. ZH): same shape but cantonal multipliers; refresh quarterly. Communal top-ups: scrape `energiefranken.ch` keyed by BFS-Nr.

### 5.6 Mock confidence indicator

Each modeled field carries a `source: "gis" | "modeled" | "user"` tag. Render a small pill in the UI when `modeled`, with a tooltip explaining the cohort assumption. Builds user trust *and* signals where a paid data partnership would actually move the needle.

---

## 6. Out-of-scope — needs partnership/paid data

- True GEAK class for pre-2019 buildings → Verein GEAK API or certified expert visit
- Property valuation to bank-grade accuracy → IAZI / Wüest Partner / PriceHubble
- Mortgage rates → Moneyland licence; SIX SARON
- Contractor `onTime` / `onBudget` / `avail` → operate own tender flow

These are listed in `docs/data-sourcing.md` and are unchanged by this plan.

---

## 7. Suggested build order

1. `geoadmin.ts` + address autocomplete on `StartAnalysis` (1 day).
2. `mapper.gwrToBuilding` + replace `BUILDING` fixture with live data (1 day).
3. `energyModel.ts` + condition heuristic (`§5.1`–`§5.3`) (1–2 days).
4. `gisZh.ts` for the three highest-value layers (zoning, heritage, district-heat) + `eligibility()` on modules (2 days).
5. `valuation.ts` + BFS price scrape (1 day).
6. Cache layer + `source` pills in UI (1 day).

Total: ~1–1.5 weeks for a working ZH-only end-to-end. National rollout = same code, different cantonal WFS endpoints.
