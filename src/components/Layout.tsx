import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileTopBar } from "./MobileTopBar";
import { stepIndex } from "@/data/steps";
import { useKeyboardNav } from "@/lib/useKeyboardNav";

export const Layout = () => {
  const location = useLocation();
  const idx = stepIndex(location.pathname);
  const isLanding = location.pathname === "/";
  useKeyboardNav(idx);

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <Sidebar currentIndex={idx} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopBar currentIndex={idx} />
        <main className="flex-1">
          <div key={location.pathname} className="step-enter mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
