import { Logo } from "./Logo";
import { ProgressDots } from "./ui/ProgressDots";
import { STEPS } from "@/data/steps";

interface MobileTopBarProps {
  currentIndex: number;
}

export const MobileTopBar = ({ currentIndex }: MobileTopBarProps) => (
  <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur lg:hidden">
    <div className="flex items-center justify-between px-4 pb-2 pt-3">
      <Logo size="sm" />
      {currentIndex >= 0 && (
        <span className="text-[11px] font-semibold text-muted">
          Step {currentIndex + 1} of {STEPS.length}
        </span>
      )}
    </div>
    {currentIndex >= 0 && <ProgressDots current={currentIndex} total={STEPS.length} />}
  </header>
);
