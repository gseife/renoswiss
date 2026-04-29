import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Contractor, ModuleId } from "@/data/types";
import type { ProductId } from "@/data/banks";
import { BUILDING } from "@/data/building";
import { usePersistedState, clearPersisted } from "./usePersistedState";

const STORAGE_KEYS = {
  modules: "renoswiss.modules.v1",
  contractors: "renoswiss.contractors.v1",
  address: "renoswiss.address.v1",
  finance: "renoswiss.finance.v1",
};

const DEFAULT_MODULES: ModuleId[] = ["facade", "roof", "heating", "windows", "solar"];
const DEFAULT_ADDRESS = "Musterstrasse 42, 8001 Zürich";

type ContractorSelection = Partial<Record<ModuleId, Contractor>>;

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
  finance: FinanceState;
  toggleModule: (id: ModuleId) => void;
  selectContractor: (moduleId: ModuleId, contractor: Contractor) => void;
  setAddress: (value: string) => void;
  updateFinance: (patch: Partial<FinanceState>) => void;
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
  const [finance, setFinance] = usePersistedState<FinanceState>(
    STORAGE_KEYS.finance,
    DEFAULT_FINANCE,
  );

  const value = useMemo<Store>(
    () => ({
      selectedModules,
      selectedContractors,
      address,
      finance,
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
      updateFinance: (patch) => setFinance((prev) => ({ ...prev, ...patch })),
      reset: () => {
        clearPersisted(
          STORAGE_KEYS.modules,
          STORAGE_KEYS.contractors,
          STORAGE_KEYS.address,
          STORAGE_KEYS.finance,
        );
        setSelectedModules(DEFAULT_MODULES);
        setSelectedContractors({});
        setAddress(DEFAULT_ADDRESS);
        setFinance(DEFAULT_FINANCE);
      },
    }),
    [
      selectedModules,
      selectedContractors,
      address,
      finance,
      setSelectedModules,
      setSelectedContractors,
      setAddress,
      setFinance,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): Store => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
