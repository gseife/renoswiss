export type Priority = "Critical" | "Recommended" | "Optional";
export type ModuleCategory = "envelope" | "heating" | "energy" | "electrical";

export type ModuleId =
  | "facade"
  | "roof"
  | "heating"
  | "windows"
  | "solar"
  | "electrical"
  | "basement";

export interface Module {
  id: ModuleId;
  name: string;
  iconKey: string;
  priority: Priority;
  desc: string;
  reason: string;
  estCost: number;
  energySaving: number;
  co2Saving: number;
  recommended: boolean;
  category: ModuleCategory;
}

export interface Contractor {
  name: string;
  loc: string;
  rating: number;
  projects: number;
  onTime: number;
  onBudget: number;
  price: number;
  priceDelta: number;
  satisfaction: number;
  years: number;
  certs: string[];
  avail: string;
  badge: string;
}

export type ContractorMap = Record<ModuleId, Contractor[]>;

export interface Subsidy {
  source: string;
  amount: number;
  status: "Pre-qualified" | "Eligible" | "To verify";
  desc: string;
  auto: boolean;
}

export interface Building {
  address: string;
  year: number;
  type: string;
  area: number;
  floors: number;
  geakClass: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  heating: string;
  heatingAge: number;
  insulation: string;
  windows: string;
  roof: string;
  basement: string;
  annualEnergy: number;
  annualCost: number;
  co2: number;
  estimatedValue: number;
}
