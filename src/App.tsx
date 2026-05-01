import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/lib/toast";

const Landing = lazy(() => import("@/steps/Landing").then((m) => ({ default: m.Landing })));
const StartAnalysis = lazy(() => import("@/steps/StartAnalysis").then((m) => ({ default: m.StartAnalysis })));
const HowItWorksPage = lazy(() => import("@/steps/HowItWorks").then((m) => ({ default: m.HowItWorks })));
const ModuleDetail = lazy(() => import("@/steps/ModuleDetail").then((m) => ({ default: m.ModuleDetail })));
const BuildingProfile = lazy(() => import("@/steps/BuildingProfile").then((m) => ({ default: m.BuildingProfile })));
const ModuleSelection = lazy(() => import("@/steps/ModuleSelection").then((m) => ({ default: m.ModuleSelection })));
const ContractorSelection = lazy(() => import("@/steps/ContractorSelection").then((m) => ({ default: m.ContractorSelection })));
const SubsidyView = lazy(() => import("@/steps/SubsidyView").then((m) => ({ default: m.SubsidyView })));
const FinancialCalc = lazy(() => import("@/steps/FinancialCalc").then((m) => ({ default: m.FinancialCalc })));
const Timeline = lazy(() => import("@/steps/Timeline").then((m) => ({ default: m.Timeline })));
const Summary = lazy(() => import("@/steps/Summary").then((m) => ({ default: m.Summary })));

const StepFallback = () => (
  <div className="grid min-h-[40vh] place-items-center">
    <div className="spinner h-8 w-8" />
  </div>
);

export const App = () => (
  <StoreProvider>
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route
              index
              element={
                <Suspense fallback={<StepFallback />}>
                  <Landing />
                </Suspense>
              }
            />
            <Route
              path="start"
              element={
                <Suspense fallback={<StepFallback />}>
                  <StartAnalysis />
                </Suspense>
              }
            />
            <Route
              path="how"
              element={
                <Suspense fallback={<StepFallback />}>
                  <HowItWorksPage />
                </Suspense>
              }
            />
            <Route
              path="modules/:id"
              element={
                <Suspense fallback={<StepFallback />}>
                  <ModuleDetail />
                </Suspense>
              }
            />
            <Route
              path="building"
              element={
                <Suspense fallback={<StepFallback />}>
                  <BuildingProfile />
                </Suspense>
              }
            />
            <Route
              path="plan"
              element={
                <Suspense fallback={<StepFallback />}>
                  <ModuleSelection />
                </Suspense>
              }
            />
            <Route
              path="contractors"
              element={
                <Suspense fallback={<StepFallback />}>
                  <ContractorSelection />
                </Suspense>
              }
            />
            <Route
              path="subsidies"
              element={
                <Suspense fallback={<StepFallback />}>
                  <SubsidyView />
                </Suspense>
              }
            />
            <Route
              path="calculator"
              element={
                <Suspense fallback={<StepFallback />}>
                  <FinancialCalc />
                </Suspense>
              }
            />
            <Route
              path="timeline"
              element={
                <Suspense fallback={<StepFallback />}>
                  <Timeline />
                </Suspense>
              }
            />
            <Route
              path="summary"
              element={
                <Suspense fallback={<StepFallback />}>
                  <Summary />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<StepFallback />}>
                  <Landing />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  </StoreProvider>
);
