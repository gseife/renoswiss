/**
 * Maps federal-data eligibility flags into per-module gates. A "gated"
 * module is shown but disabled with a reason string — the platform
 * never silently drops a recommendation, it explains the skip.
 */

import type { ModuleId } from "@/data/types";
import type { Eligibility } from "./mapper";

export interface ModuleGate {
  /** True when the module is suppressed by federal data. */
  skipped: boolean;
  /** Short explanation, ready to render as a chip. */
  reason: string | null;
}

const NO_GATE: ModuleGate = { skipped: false, reason: null };

export const gateForModule = (
  id: ModuleId,
  eligibility: Eligibility | null,
): ModuleGate => {
  if (!eligibility) return NO_GATE;

  if (id === "heating" && eligibility.heatingRecentlyRenewed) {
    const yr = eligibility.heatingRenewedYear;
    return {
      skipped: true,
      reason: yr
        ? `Heating renewed ${yr} — replacement skipped`
        : "Heating recently renewed",
    };
  }

  if (id === "solar" && eligibility.pvAlreadyInstalled) {
    const kw = eligibility.installedPvKw;
    return {
      skipped: true,
      reason: kw
        ? `${kw.toFixed(1)} kWp PV already installed`
        : "PV already installed",
    };
  }

  return NO_GATE;
};
