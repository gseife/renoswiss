import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Contractor, ModuleId } from "@/data/types";
import { usePersistedState, clearPersisted } from "./usePersistedState";

const STORAGE_KEYS = {
  modules: "renoswiss.modules.v1",
  contractors: "renoswiss.contractors.v1",
  address: "renoswiss.address.v1",
};

const DEFAULT_MODULES: ModuleId[] = ["facade", "roof", "heating", "windows", "solar"];
const DEFAULT_ADDRESS = "Musterstrasse 42, 8001 Zürich";

type ContractorSelection = Partial<Record<ModuleId, Contractor>>;

interface Store {
  selectedModules: ModuleId[];
  selectedContractors: ContractorSelection;
  address: string;
  toggleModule: (id: ModuleId) => void;
  selectContractor: (moduleId: ModuleId, contractor: Contractor) => void;
  setAddress: (value: string) => void;
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

  const value = useMemo<Store>(
    () => ({
      selectedModules,
      selectedContractors,
      address,
      toggleModule: (id) =>
        setSelectedModules((prev) => {
          if (prev.includes(id)) {
            // Also drop the contractor for this module
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
      reset: () => {
        clearPersisted(STORAGE_KEYS.modules, STORAGE_KEYS.contractors, STORAGE_KEYS.address);
        setSelectedModules(DEFAULT_MODULES);
        setSelectedContractors({});
        setAddress(DEFAULT_ADDRESS);
      },
    }),
    [selectedModules, selectedContractors, address, setSelectedModules, setSelectedContractors, setAddress],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): Store => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
