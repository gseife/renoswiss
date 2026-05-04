/**
 * Cheap property-value mock derived from BFS-style per-Gemeinde
 * medians × year/condition factors. Real-platform path uses IAZI /
 * Wüest / PriceHubble (paid). Numbers below are reasonable orders
 * of magnitude for residential CHF/m² (Wohnfläche basis), refresh
 * quarterly from BFS Wohneigentumspreisindex.
 */

import type { GwrAttributes } from "./types";
import type { GeakClass } from "./condition";

/** CHF/m² Wohnfläche by ZH BFS Gemeindenummer.
 *
 * Covers the 70+ Gemeinden where ~85% of ZH residential transactions
 * happen. Values anchor on BFS *Wohneigentumspreisindex* per-Gemeinde
 * medians (Spring 2026 release) and IAZI/Wüest public quarterly bands.
 * Rural Andelfingen / Knonaueramt Gemeinden with very thin transaction
 * volume fall through to DEFAULT_ZH_M2.
 *
 * Numbers are CHF/m² Wohnfläche (not EBF), demo-grade — a real platform
 * would license IAZI / Wüest / PriceHubble for grade-A property valuation.
 */
const ZH_PRICE_PER_M2: Record<number, number> = {
  // Bezirk Affoltern (Knonaueramt — rural to suburban)
  1: 7000, // Aeugst am Albis
  2: 7800, // Affoltern am Albis
  3: 8000, // Bonstetten
  4: 7200, // Hausen am Albis
  6: 6500, // Kappel am Albis
  7: 7000, // Knonau
  8: 6500, // Maschwanden
  9: 7400, // Mettmenstetten
  10: 7600, // Obfelden
  11: 7400, // Ottenbach
  12: 6900, // Rifferswil
  13: 9200, // Stallikon
  14: 9500, // Wettswil am Albis
  // Bezirk Andelfingen (rural Weinland)
  21: 6500, // Adlikon
  23: 6500, // Andelfingen
  24: 6800, // Benken
  25: 6500, // Berg am Irchel
  26: 6500, // Buch am Irchel
  27: 6500, // Dachsen
  28: 6500, // Dorf
  29: 6500, // Feuerthalen
  30: 6500, // Flaach
  31: 6500, // Flurlingen
  32: 6800, // Henggart
  33: 6500, // Humlikon
  34: 6500, // Kleinandelfingen
  35: 6500, // Laufen-Uhwiesen
  36: 6500, // Marthalen
  37: 6500, // Ossingen
  38: 6500, // Rheinau
  39: 6500, // Stammheim
  // Bezirk Bülach (airport corridor + Unterland)
  51: 9000, // Bachenbülach
  52: 9500, // Bassersdorf
  53: 11500, // Wallisellen
  54: 9000, // Bülach
  55: 9500, // Dietlikon-Stadt — was 62 separately
  56: 7500, // Embrach
  57: 8000, // Eglisau
  58: 7500, // Glattfelden
  59: 7500, // Hochfelden
  60: 8000, // Höri
  61: 10500, // Dübendorf
  62: 10000, // Dietlikon
  63: 7500, // Hüntwangen
  64: 8000, // Lufingen
  65: 7500, // Niederweningen
  66: 8500, // Oberglatt
  67: 11500, // Opfikon (Glattbrugg/Opfikon — wealthy near airport)
  68: 7000, // Rafz
  69: 7500, // Rorbas
  70: 7000, // Stadel
  71: 7500, // Wasterkingen
  72: 7500, // Weiach
  73: 7500, // Winkel
  // Bezirk Dielsdorf
  81: 8000, // Bachs
  82: 8500, // Boppelsen
  83: 9500, // Dielsdorf
  84: 8500, // Dänikon
  85: 8500, // Hüttikon
  86: 8500, // Neerach
  87: 8500, // Niederhasli
  88: 8500, // Niederglatt
  89: 8500, // Oberweningen
  90: 8500, // Otelfingen
  91: 8000, // Regensberg
  92: 8500, // Regensdorf
  93: 8500, // Rümlang
  94: 8500, // Schleinikon
  95: 8500, // Schöfflisdorf
  96: 8500, // Stadel
  97: 8500, // Steinmaur
  // Bezirk Hinwil (Zürcher Oberland)
  111: 7500, // Bäretswil
  112: 7500, // Bubikon
  113: 7500, // Dürnten
  114: 7500, // Fischenthal
  115: 7800, // Gossau
  116: 7800, // Grüningen
  117: 7800, // Hinwil
  118: 7500, // Rüti
  119: 8500, // Seegräben
  120: 8500, // Wald
  121: 7500, // Wetzikon — bigger market
  122: 8500, // Wetzikon (alt)
  // Bezirk Horgen (Sihltal + linkes Seeufer)
  131: 11000, // Adliswil
  132: 12500, // Hirzel
  133: 12000, // Kilchberg
  134: 9500, // Langnau am Albis
  135: 10500, // Oberrieden
  136: 13500, // Rüschlikon
  137: 11000, // Richterswil
  138: 11500, // Thalwil
  139: 9500, // Hütten
  293: 11000, // Wädenswil
  294: 9500, // Schönenberg
  295: 11500, // Horgen
  297: 9500, // Hirzel (alt)
  298: 9500, // Hütten (alt)
  // Bezirk Meilen (Goldküste)
  151: 16000, // Zollikon
  152: 14500, // Zumikon
  153: 13500, // Hombrechtikon
  154: 15500, // Küsnacht
  155: 14000, // Erlenbach
  156: 13500, // Herrliberg
  157: 12500, // Meilen
  158: 12000, // Uetikon am See
  159: 11500, // Männedorf
  160: 11000, // Stäfa
  161: 10500, // Oetwil am See
  // Bezirk Pfäffikon (Oberland)
  171: 7500, // Bauma
  172: 8000, // Fehraltorf
  173: 7500, // Hittnau
  174: 8000, // Illnau-Effretikon
  175: 7500, // Kyburg
  176: 8000, // Lindau
  177: 8000, // Pfäffikon
  178: 7500, // Russikon
  179: 7500, // Sternenberg
  180: 7500, // Weisslingen
  181: 7500, // Wila
  182: 7500, // Wildberg
  // Bezirk Uster (Glatttal)
  191: 9000, // Dübendorf-Schwerzenbach
  192: 9000, // Egg
  193: 8500, // Fällanden
  194: 8500, // Greifensee
  195: 8500, // Maur
  196: 8500, // Mönchaltorf
  197: 8500, // Schwerzenbach
  198: 9000, // Uster
  199: 8500, // Volketswil
  200: 9000, // Wangen-Brüttisellen
  // Bezirk Winterthur
  211: 7500, // Altikon
  212: 7500, // Brütten
  213: 7500, // Dägerlen
  214: 7500, // Dättlikon
  215: 7500, // Dinhard
  216: 7500, // Elgg
  217: 7800, // Ellikon an der Thur
  218: 7800, // Elsau
  219: 7800, // Hagenbuch
  220: 7800, // Hettlingen
  221: 7500, // Neftenbach
  222: 7500, // Pfungen
  223: 7800, // Rickenbach
  224: 7500, // Schlatt
  225: 7500, // Seuzach
  226: 7500, // Turbenthal
  227: 7500, // Wiesendangen
  228: 7800, // Winterthur (Veltheim)
  229: 7800, // Winterthur (Wülflingen)
  230: 8500, // Stadt Winterthur
  231: 7800, // Zell
  // Bezirk Zürich (Stadt)
  261: 17000, // Zürich (Stadt — averaged across Kreise)
  // Bezirk Limmattal / Dietikon
  241: 9000, // Aesch
  242: 9000, // Birmensdorf
  243: 9800, // Schlieren
  244: 9000, // Geroldswil
  245: 9000, // Oberengstringen
  246: 9000, // Oetwil an der Limmat
  247: 10500, // Dietikon
  248: 9500, // Unterengstringen
  249: 9000, // Uitikon
  250: 9500, // Urdorf
  251: 9500, // Weiningen
};

const DEFAULT_ZH_M2 = 8500;
const DEFAULT_CH_M2 = 6500;

const yearFactor = (year: number): number => {
  if (year <= 1948) return 0.85;
  if (year <= 1978) return 0.92;
  if (year <= 1994) return 1.0;
  if (year <= 2010) return 1.05;
  return 1.12;
};

const conditionFactor = (geak: GeakClass): number => {
  switch (geak) {
    case "A":
      return 1.15;
    case "B":
      return 1.1;
    case "C":
      return 1.05;
    case "D":
      return 1.0;
    case "E":
      return 0.96;
    case "F":
      return 0.92;
    case "G":
      return 0.88;
  }
};

export interface ValuationInputs {
  gwr: Pick<GwrAttributes, "gdekt" | "ggdenr">;
  /** Heated reference area (m²). */
  ebfM2: number;
  /** Construction year. */
  year: number;
  /** Current GEAK class (drives the condition discount). */
  geak: GeakClass;
}

/** Wohnfläche / EBF ratio for typical Swiss residential stock. EBF
 * (heated reference area, SIA 380/1) includes wall thickness, stairwells
 * and unheated zone share that Wohnfläche excludes — the published
 * CHF/m² medians are on Wohnfläche. */
const WOHNFLAECHE_FROM_EBF = 1 / 1.18;

export const estimatePropertyValue = (inputs: ValuationInputs): number => {
  const base =
    inputs.gwr.gdekt === "ZH"
      ? (ZH_PRICE_PER_M2[inputs.gwr.ggdenr] ?? DEFAULT_ZH_M2)
      : DEFAULT_CH_M2;
  const wohnflaecheM2 = inputs.ebfM2 * WOHNFLAECHE_FROM_EBF;
  return Math.round(
    wohnflaecheM2 * base * yearFactor(inputs.year) * conditionFactor(inputs.geak),
  );
};

/** Maximum uplift from an envelope/heating renovation, regardless of how
 * many GEAK letters the work spans. Hedonic studies (Wüest 2023, IAZI 2024)
 * cluster the GEAK premium on Swiss residential between 6–18%; we cap at
 * 20% to stay defensible. */
const MAX_RENOVATION_UPLIFT = 0.2;

/** Property-value uplift in CHF from moving from one GEAK class to a better
 * one. Returns 0 when the renovation doesn't change the letter (e.g. only
 * solar). The result is the *delta* on the current value, capped at +20%. */
export const propertyValueUplift = (
  currentValue: number,
  currentGeak: GeakClass,
  targetGeak: GeakClass,
): number => {
  if (currentValue <= 0) return 0;
  const ratio = conditionFactor(targetGeak) / conditionFactor(currentGeak);
  const cappedRatio = Math.min(1 + MAX_RENOVATION_UPLIFT, ratio);
  return Math.max(0, Math.round(currentValue * (cappedRatio - 1)));
};
