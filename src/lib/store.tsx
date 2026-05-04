import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Building, Contractor, ModuleId } from "@/data/types";
import type { ProductId } from "@/data/banks";
import type { Lv95 } from "@/lib/gis/types";
import type { Eligibility } from "@/lib/gis/mapper";
import { BUILDING } from "@/data/building";
import { usePersistedState, clearPersisted } from "./usePersistedState";

const STORAGE_KEYS = {
  modules: "renoswiss.modules.v1",
  contractors: "renoswiss.contractors.v1",
  address: "renoswiss.address.v1",
  addressMeta: "renoswiss.addressMeta.v1",
  liveBuilding: "renoswiss.liveBuilding.v1",
  eligibility: "renoswiss.eligibility.v1",
  finance: "renoswiss.finance.v1",
  projectStart: "renoswiss.projectStart.v1",
};

const DEFAULT_MODULES: ModuleId[] = ["facade", "roof", "heating", "windows", "solar"];
const DEFAULT_ADDRESS = "Musterstrasse 42, 8001 Zürich";

type ContractorSelection = Partial<Record<ModuleId, Contractor>>;

/** Geocoded metadata attached to the user's address, when available.
 * `egid` is null when an address was geocoded but the building polygon
 * could not be identified (rare, e.g. a brand-new address). */
export interface AddressMeta {
  lv95: Lv95;
  egid: string | null;
}

export interface FinanceState {
  grossIncome: number;
  propertyValue: number;
  existingMortgage: number;
  ownFundsCash: number;
  ownFundsPension: number;
  term: number;
  taxRate: number;
  selectedBankId: string | null;
  selectedProductId: ProductId;
}

const DEFAULT_FINANCE: FinanceState = {
  grossIncome: 150_000,
  propertyValue: BUILDING.estimatedValue,
  existingMortgage: Math.round(BUILDING.estimatedValue * 0.6),
  ownFundsCash: 0,
  ownFundsPension: 0,
  term: 15,
  taxRate: 25,
  selectedBankId: null,
  selectedProductId: "fixed10",
};

interface Store {
  selectedModules: ModuleId[];
  selectedContractors: ContractorSelection;
  address: string;
  addressMeta: AddressMeta | null;
  /** Live building data assembled from federal sources. Falls back to the
   * static demo fixture when null. */
  liveBuilding: Building | null;
  /** Federal-data-derived flags that gate which renovation modules to show. */
  eligibility: Eligibility | null;
  /** Convenience: the building consumers should display (live ?? fixture). */
  building: Building;
  finance: FinanceState;
  /** ISO date (YYYY-MM-DD) of the project kick-off; null until the user sets one in Summary. */
  projectStart: string | null;
  toggleModule: (id: ModuleId) => void;
  setSelectedModules: (value: ModuleId[]) => void;
  selectContractor: (moduleId: ModuleId, contractor: Contractor) => void;
  setAddress: (value: string) => void;
  setAddressMeta: (value: AddressMeta | null) => void;
  setLiveBuilding: (value: Building | null) => void;
  setEligibility: (value: Eligibility | null) => void;
  updateFinance: (patch: Partial<FinanceState>) => void;
  setProjectStart: (value: string | null) => void;
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [selectedModules, setSelectedModules] = usePersistedState<ModuleId[]>(
    STORAGE_KEYS.modules,
    DEFAULT_MODULES,
  );
  const [selectedContractors, setSelectedContractors] = usePersistedState<ContractorSelection>(
    STORAGE_KEYS.contractors,
    {},
  );
  const [address, setAddress] = usePersistedState<string>(
    STORAGE_KEYS.address,
    DEFAULT_ADDRESS,
  );
  const [addressMeta, setAddressMeta] = usePersistedState<AddressMeta | null>(
    STORAGE_KEYS.addressMeta,
    null,
  );
  const [liveBuilding, setLiveBuilding] = usePersistedState<Building | null>(
    STORAGE_KEYS.liveBuilding,
    null,
  );
  const [eligibility, setEligibility] = usePersistedState<Eligibility | null>(
    STORAGE_KEYS.eligibility,
    null,
  );
  const [finance, setFinance] = usePersistedState<FinanceState>(
    STORAGE_KEYS.finance,
    DEFAULT_FINANCE,
  );
  const [projectStart, setProjectStart] = usePersistedState<string | null>(
    STORAGE_KEYS.projectStart,
    null,
  );

  const value = useMemo<Store>(
    () => ({
      selectedModules,
      selectedContractors,
      address,
      addressMeta,
      liveBuilding,
      eligibility,
      building: liveBuilding ?? BUILDING,
      finance,
      projectStart,
      toggleModule: (id) =>
        setSelectedModules((prev) => {
          if (prev.includes(id)) {
            setSelectedContractors((c) => {
              const next = { ...c };
              delete next[id];
              return next;
            });
            return prev.filter((m) => m !== id);
          }
          return [...prev, id];
        }),
      setSelectedModules: (value) => {
        setSelectedModules(value);
        setSelectedContractors((c) => {
          const allowed = new Set(value);
          const next: ContractorSelection = {};
          for (const k of Object.keys(c) as ModuleId[]) {
            if (allowed.has(k)) next[k] = c[k];
          }
          return next;
        });
      },
      selectContractor: (moduleId, contractor) =>
        setSelectedContractors((prev) => {
          if (prev[moduleId]?.name === contractor.name) {
            const next = { ...prev };
            delete next[moduleId];
            return next;
          }
          return { ...prev, [moduleId]: contractor };
        }),
      setAddress,
      setAddressMeta,
      setLiveBuilding,
      setEligibility,
      updateFinance: (patch) => setFinance((prev) => ({ ...prev, ...patch })),
      setProjectStart,
      reset: () => {
        clearPersisted(
          STORAGE_KEYS.modules,
          STORAGE_KEYS.contractors,
          STORAGE_KEYS.address,
          STORAGE_KEYS.addressMeta,
          STORAGE_KEYS.liveBuilding,
          STORAGE_KEYS.eligibility,
          STORAGE_KEYS.finance,
          STORAGE_KEYS.projectStart,
        );
        setSelectedModules(DEFAULT_MODULES);
        setSelectedContractors({});
        setAddress(DEFAULT_ADDRESS);
        setAddressMeta(null);
        setLiveBuilding(null);
        setEligibility(null);
        setFinance(DEFAULT_FINANCE);
        setProjectStart(null);
      },
    }),
    [
      selectedModules,
      selectedContractors,
      address,
      addressMeta,
      liveBuilding,
      eligibility,
      finance,
      projectStart,
      setSelectedModules,
      setSelectedContractors,
      setAddress,
      setAddressMeta,
      setLiveBuilding,
      setEligibility,
      setFinance,
      setProjectStart,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): Store => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
