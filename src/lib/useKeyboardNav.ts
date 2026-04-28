import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { STEPS } from "@/data/steps";

const isInteractive = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.getAttribute("role") === "button"
  );
};

export const useKeyboardNav = (currentIndex: number): void => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInteractive(e.target)) return;

      if (e.key === "ArrowRight") {
        if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
          e.preventDefault();
          navigate(STEPS[currentIndex + 1].path);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          e.preventDefault();
          navigate(STEPS[currentIndex - 1].path);
        } else if (currentIndex === 0) {
          e.preventDefault();
          navigate("/");
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, navigate]);
};
