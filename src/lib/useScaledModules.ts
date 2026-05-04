import { useMemo } from "react";
import type { Module, ModuleId } from "@/data/types";
import { MODULES } from "@/data/modules";
import { scaleModules } from "@/lib/gis/moduleScale";
import { useStore } from "./store";

/**
 * Returns the MODULES array with cost/saving figures scaled to the
 * live building. When no live data is present, returns the static
 * fixture unchanged so the demo path keeps its hand-tuned numbers.
 */
export const useScaledModules = (): Module[] => {
  const { building, eligibility, liveBuilding } = useStore();
  return useMemo(() => {
    if (!liveBuilding) return MODULES;
    return scaleModules(MODULES, { building, eligibility });
  }, [building, eligibility, liveBuilding]);
};

export const useScaledModule = (id: ModuleId): Module | undefined =>
  useScaledModules().find((m) => m.id === id);
