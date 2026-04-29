import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";
import { STEPS } from "@/data/steps";

interface StepNavProps {
  currentIndex: number;
}

export const StepNav = ({ currentIndex }: StepNavProps) => {
  const navigate = useNavigate();
  const prev = currentIndex > 0 ? STEPS[currentIndex - 1] : null;
  const next = currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;

  const goPrev = () => (prev ? navigate(prev.path) : navigate("/"));
  const goNext = () => next && navigate(next.path);

  return (
    <div className="no-print mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
      <Button variant="secondary" size="md" onClick={goPrev}>
        <ArrowLeft size={16} />
        {prev ? prev.shortLabel : "Home"}
      </Button>
      {next && (
        <Button variant="primary" size="md" onClick={goNext}>
          {next.shortLabel}
          <ArrowRight size={16} />
        </Button>
      )}
    </div>
  );
};
