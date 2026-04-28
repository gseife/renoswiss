import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { StoreProvider } from "@/lib/store";
import { Landing } from "@/steps/Landing";
import { BuildingProfile } from "@/steps/BuildingProfile";
import { ModuleSelection } from "@/steps/ModuleSelection";
import { ContractorSelection } from "@/steps/ContractorSelection";
import { SubsidyView } from "@/steps/SubsidyView";
import { FinancialCalc } from "@/steps/FinancialCalc";
import { Timeline } from "@/steps/Timeline";
import { Summary } from "@/steps/Summary";

export const App = () => (
  <StoreProvider>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="building" element={<BuildingProfile />} />
          <Route path="plan" element={<ModuleSelection />} />
          <Route path="contractors" element={<ContractorSelection />} />
          <Route path="subsidies" element={<SubsidyView />} />
          <Route path="calculator" element={<FinancialCalc />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="summary" element={<Summary />} />
          <Route path="*" element={<Landing />} />
        </Route>
      </Routes>
    </HashRouter>
  </StoreProvider>
);
