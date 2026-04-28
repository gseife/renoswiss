export interface StepDef {
  path: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const STEPS: StepDef[] = [
  { path: "/building", label: "Building Profile", shortLabel: "Building", description: "Your home's current state" },
  { path: "/plan", label: "Renovation Plan", shortLabel: "Plan", description: "Choose what to renovate" },
  { path: "/contractors", label: "Contractors", shortLabel: "Contractors", description: "Match with verified pros" },
  { path: "/subsidies", label: "Subsidies", shortLabel: "Subsidies", description: "Capture every program" },
  { path: "/calculator", label: "Calculator", shortLabel: "Finance", description: "See your real net cost" },
  { path: "/timeline", label: "Timeline", shortLabel: "Timeline", description: "Plan your construction" },
  { path: "/summary", label: "Summary", shortLabel: "Summary", description: "Review and book" },
];

export const stepIndex = (path: string): number =>
  STEPS.findIndex((s) => s.path === path);
