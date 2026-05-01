# RenoSwiss — Data-Sourcing Audit

> Where each value the prototype displays could come from in a real Swiss build-out. Cost is not a constraint; the goal is to enumerate **viable real sources** for every field, including paid APIs, B2B contracts and partnerships.

Generated 2026-04-30. Files inspected: `src/data/building.ts`, `src/data/modules.ts`, `src/data/subsidies.ts`, `src/data/contractors.ts`, `src/data/banks.ts`, `src/lib/finance.ts`, `src/lib/derived.ts`, `src/steps/Landing.tsx`.

---

## 1. Address & geocoding

| Field | Source candidates | Access mode | URL / contact |
|---|---|---|---|
| `address` (free-text input) | swisstopo GeoAdmin SearchServer; Swiss Post addresses; IAZI Address Validation API; Google Geocoding | Open REST API; paid licence (Post); paid API; paid API | <https://api3.geo.admin.ch/rest/services/api/SearchServer> · <https://service.post.ch/zopa> · <https://www.iazicifi.ch/en/software-solutions/apis/> |
| `address` → EGID/EGRID building key | swisstopo `ch.bfs.gebaeude_wohnungs_register` layer; GWR FeatureServer | Open REST API | <https://api3.geo.admin.ch/rest/services/api/MapServer/identify> · <https://www.housing-stat.ch> |

## 2. Building characteristics

| Field | Source candidates | Access mode | URL / contact |
|---|---|---|---|
| `year`, `type`, `area`, `floors`, `heating`, `heatingAge` | Federal GWR (Level A open; Level B/C via BFS contract); cantonal GWR exports (e.g. `data.tg.ch`); QualiCasa via Houzy partnership | Open API (Level A); B2B contract (Level B/C); partnership | <https://www.housing-stat.ch> · housing-stat@bfs.admin.ch · <https://en.houzy.ch/renovation-calculator> |
| `insulation`, `windows`, `roof`, `basement` (component condition) | Not in GWR — collected via QualiCasa survey, GEAK Plus advisor visit, or user self-report | B2B contract (QualiCasa); per-record manual (GEAK expert) | <https://www.qualicasa.ch> · <https://www.geak.ch> |
| `geakClass: "F"` | GEAKPUBX open dataset (only post-2019 certificates); GEAK central DB via cantonal access | Open data (sparse); B2B with Verein GEAK | <https://opendata.swiss/de/dataset/gebaudeenergieausweis-der-kantone-geak-offentlich> · info@geak.ch |

## 3. Energy & emissions

| Field | Source candidates | Access mode | URL / contact |
|---|---|---|---|
| `annualEnergy` (kWh), `annualCost` (CHF), `co2` (t) | BFE oil-heated buildings benchmark study (kWh/m²·a × area); EnergieSchweiz typology curves; cantonal energy-consumption datasets (KT ZH, BS) | Open PDF/dataset; open data | <https://pubdb.bfe.admin.ch/de/publication/download/1225> · <https://www.bfe.admin.ch/bfe/en/home/efficiency/buildings.html> · <https://opendata.swiss> |
| Heating-oil/gas spot price (drives `annualCost`) | BFS LIK fuel index; Avenergy weekly oil price | Open data; scraping/contract | <https://www.bfs.admin.ch/bfs/en/home/statistics/prices.html> · <https://www.avenergy.ch> |

## 4. Energy class (GEAK)

| Field | Source | Access | URL |
|---|---|---|---|
| `geakClass`, `geakImprovement` (`F → C`) | Verein GEAK central DB; GEAK Plus advisor commission; SIA 380/1 calc engine licence | B2B / manual lookup / certified expert | <https://www.geak.ch> · <https://www.sia.ch> (norm 380/1) |

## 5. Property valuation

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `estimatedValue`, `propertyIncrease` (+18%) | IAZI hedonic API; Wüest Partner Data; Fahrländer Partner; PriceHubble; bank tools (Raiffeisen ImmoSpot) | Paid API / data licence | <https://www.iazicifi.ch/en/software-solutions/apis/> · <https://www.wuestpartner.com/expertise/data> · <https://pricehubble.com> |

## 6. Renovation cost & saving benchmarks per module

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `estCost`, `energySaving`, `co2Saving` per module | EnDK HFM 2015 (subsidy table doubles as cost basis); SIA construction-cost norms; CRB / Baukostenplan Hochbau eBKP-H; QualiCasa via Houzy; energieheld.ch / Buildigo benchmarks | PDF download; paid data licence; partnership | <https://endk.ch/wp-content/uploads/2025/07/Harmonisiertes-Foerdermodell-2015-D.pdf> · <https://www.crb.ch> · <https://en.houzy.ch/renovation-calculator> |

## 7. Subsidies (federal + cantonal + communal)

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `Gebäudeprogramm (Federal)` amount/eligibility | dasgebaeudeprogramm.ch cantonal portals; HFM 2015 measure codes (M-01..M-19) | PDF + per-canton scraping | <https://www.dasgebaeudeprogramm.ch> · <https://endk.ch> |
| `Kanton Zürich — Energieförderung` | Baudirektion KT ZH energy fund | Manual rule sheet; scraping | <https://www.zh.ch/de/umwelt-tiere/energie/energiefoerderung.html> |
| `Stadt Zürich — Energiefonds` | ewz Förderprogramm; Stadt Zürich Umwelt- und Gesundheitsschutz | Per-canton scraping | <https://www.stadt-zuerich.ch/foerderprogramm> |
| `ProKilowatt (Federal)` | BFE ProKilowatt programme list | Open PDF/list | <https://www.prokw.ch> |
| Communal top-ups (~2,200 communes) | energiefranken.ch curated DB; Energieheld API; manual canton-by-canton | Partnership / scraping | <https://www.energiefranken.ch> |

## 8. Contractor directory + ratings/availability

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `name`, `loc`, `years`, `certs` | Minergie Fachpartnerliste (~1,500); FWS Wärmepumpen-Spezialisten; Suissetec member directory; Pronovo Solarprofis; HEV/SIA registers; ZEFIX commercial register | Public directories; scraping; Minergie B2B | <https://www.minergie.ch/de/partner/fachpartnerliste/> · <https://www.fws.ch/waermepumpen-spezialisten/> · <https://www.suissetec.ch> · <https://www.solarprofis.ch> · <https://www.zefix.ch> |
| `rating`, `satisfaction`, `projects` | Google Places API; Trustpilot Service Reviews API; Houzz; local.ch reviews | Paid API | <https://developers.google.com/maps/documentation/places> · <https://developers.trustpilot.com/service-reviews-api/> |
| `onTime`, `onBudget`, `price`, `priceDelta`, `avail` | No public source — must come from a tender/marketplace platform you operate (Buildigo, Houzy Offerten, Renovero, Ofri) | B2B partnership / build internally | <https://www.buildigo.ch> · <https://en.houzy.ch> · <https://www.renovero.ch> · <https://www.ofri.ch> |

## 9. Mortgage products + rates + green discounts

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `rates.{saron,fixed5,fixed10}` per bank | moneyland.ch Swiss Mortgage Index (twice-daily 30+ banks); Comparis; HypoPlus; MoneyPark; bank rate-sheet scraping | Data licence (Moneyland B2B); scraping | <https://www.moneyland.ch/en/mortgages-comparison> · <https://en.comparis.ch/hypotheken/zinssatz> · <https://www.moneypark.ch> |
| `greenDiscount` per bank | Bank product pages (UBS Eco, ZKB Umweltdarlehen, Raiffeisen Eco, Migros Bank Öko); HEV Hypovergleich | Scraping / partner pricing API | <https://www.ubs.com> · <https://www.zkb.ch> · <https://www.raiffeisen.ch> |
| SARON reference (drives variable rate) | SIX Swiss Reference Rates; SNB data portal | Real-time licence (SIX); free historical (SNB) | <https://www.six-group.com/en/market-data/indices/switzerland/saron.html> · <https://data.snb.ch/en> |
| Affordability calc (`calcAffordability`, 5%/1%/15y/65%) | FINMA self-regulation; SBA/SBVg directives | Open PDF | <https://www.finma.ch> · <https://www.swissbanking.ch> |

## 10. Solar yield / PV-specific data

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `8.4 kWp`, `1,050 kWh/kWp Zürich`, roof orientation | sonnendach.ch via GeoAdmin layer `ch.bfe.solarenergie-eignung-daecher`; sonnenfassade.ch; MeteoSwiss radiation data; PVGIS (EU) | Open REST API | <https://api3.geo.admin.ch> · <https://www.uvek-gis.admin.ch/BFE/sonnendach/> · <https://re.jrc.ec.europa.eu/pvg_tools/> |
| Feed-in tariff / one-off remuneration (EIV) | Pronovo subsidy registry | Open data | <https://pronovo.ch> |

## 11. Trust / marketing metrics (Landing)

| Field | Source candidates | Access | URL |
|---|---|---|---|
| `1,847 buildings analyzed`, `21 cantons` | Internal product analytics (Mixpanel, Posthog, BigQuery) | Internal | n/a |
| `CHF 42M subsidies captured` | Internal subsidy-application tracking (cumulative HFM payouts logged per case) | Internal | n/a |
| `4.7★ on 1,200+ reviews` | Trustpilot Business + Google Business Profile aggregated | Paid widget / API | <https://business.trustpilot.com> · <https://developers.google.com/my-business> |
| Analyze-step labels (`Reading GWR`, `Querying GEAK`, `Matching cantonal subsidy programs`) | Same APIs as rows above (cosmetic) | — | — |

---

## Practical sourcing recipe

To ship a real version of RenoSwiss:

- **swisstopo GeoAdmin SearchServer + GWR (BFS Level B contract for full attributes)** for address → building characteristics
- **sonnendach.ch (`ch.bfe.solarenergie-eignung-daecher`)** for PV yield and roof orientation
- **IAZI APIs** (or Wüest Partner / PriceHubble) for property valuation and `propertyIncrease`
- **BFE pubdb typology coefficients + EnDK HFM 2015 measure codes** as the engine for energy benchmarks and module cost/saving figures, refined with a **QualiCasa partnership** (the same data layer Houzy uses)
- Subsidies via a hybrid: federal Gebäudeprogramm modeled from HFM 2015; cantonal/communal top-ups **curated manually from each canton's portal plus energiefranken.ch**, refreshed quarterly
- Mortgages via a **Moneyland data licence** (or twice-daily scrape of comparis.ch) for bank rates, **SIX SARON licence** for the variable-rate display, and bank product pages for green discounts
- Contractors: start with **Minergie / FWS / Suissetec / Pronovo Solarprofis** open directories, enrich with **Google Places + Trustpilot APIs** for ratings; live `onTime` / `onBudget` / `price` / `avail` only by **operating your own quote/tender flow** (Buildigo or Renovero partnership, or build it)
- Trust metrics on the Landing: turn off until real, or wire to **internal product analytics + Trustpilot/Google aggregate scores**
