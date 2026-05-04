import { useMemo } from "react";
import type { Subsidy } from "@/data/types";
import { SUBSIDIES } from "@/data/subsidies";
import { computeSubsidies } from "@/lib/gis/subsidies";
import { useStore } from "./store";
import { useScaledModules } from "./useScaledModules";

/**
 * Returns subsidies derived from the live building when present, or
 * the static demo SUBSIDIES otherwise. Recomputes when the user
 * toggles a module so the list reflects what would actually pay out.
 */
export const useSubsidies = (): Subsidy[] => {
  const { selectedModules, building, eligibility, liveBuilding } = useStore();
  const modules = useScaledModules();
  return useMemo(() => {
    if (!liveBuilding || !eligibility) return SUBSIDIES;
    return computeSubsidies({
      selectedModules,
      modules,
      building,
      eligibility,
    });
  }, [liveBuilding, eligibility, selectedModules, modules, building]);
};
