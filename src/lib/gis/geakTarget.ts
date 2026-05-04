import type { ModuleId } from "@/data/types";
import type { GeakClass } from "./condition";
import type { Eligibility } from "./mapper";

const ORDER: GeakClass[] = ["G", "F", "E", "D", "C", "B", "A"];

/**
 * Estimates the realistic post-retrofit GEAK letter from the current
 * letter and the modules selected. Heuristic — not a SIA 380/1
 * calculation. Caps at +3 letters of improvement.
 *
 * Weights:
 *  - Each envelope module (facade/roof/windows/basement) contributes
 *    one half-letter, capped at 2 letters total (you can't out-insulate
 *    physics).
 *  - Heating swap to HP contributes one letter (only when not gated).
 *  - Solar contributes a half-letter (electricity offset, not envelope).
 */
export const targetGeakFor = (
  current: GeakClass,
  selected: ModuleId[],
  eligibility: Eligibility | null,
): GeakClass => {
  const envelopeIds: ModuleId[] = ["facade", "roof", "windows", "basement"];
  const envelopeCount = envelopeIds.filter((id) => selected.includes(id)).length;
  const envelopeBonus = Math.min(2, envelopeCount * 0.6);

  const heatingApplied =
    selected.includes("heating") && !eligibility?.heatingRecentlyRenewed;
  const heatingBonus = heatingApplied ? 1 : 0;

  const solarApplied =
    selected.includes("solar") && !eligibility?.pvAlreadyInstalled;
  const solarBonus = solarApplied ? 0.5 : 0;

  const totalBonus = Math.min(3, envelopeBonus + heatingBonus + solarBonus);
  const currentIdx = ORDER.indexOf(current);
  const targetIdx = Math.min(ORDER.length - 1, currentIdx + Math.round(totalBonus));
  return ORDER[targetIdx];
};
