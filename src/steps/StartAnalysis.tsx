import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { clsx } from "@/lib/clsx";

const ANALYZE_STEPS = [
  "Reading GWR building register",
  "Querying GEAK energy database",
  "Matching cantonal subsidy programs",
  "Comparing renovation benchmarks",
];
const STEP_DURATION = 420;

type StartLocationState = { autoStart?: boolean } | null;

export const StartAnalysis = () => {
  useDocumentTitle("Start your free analysis");
  const navigate = useNavigate();
  const location = useLocation();
  const { address, setAddress } = useStore();

  const initialAuto = (location.state as StartLocationState)?.autoStart === true;

  const [draft, setDraft] = useState(address);
  const [analyzing, setAnalyzing] = useState(initialAuto);
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!analyzing && inputRef.current) inputRef.current.focus();
  }, [analyzing]);

  useEffect(() => {
    if (!analyzing) return;
    if (step >= ANALYZE_STEPS.length) {
      const t = window.setTimeout(() => navigate("/building"), 350);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), STEP_DURATION);
    return () => window.clearTimeout(t);
  }, [analyzing, step, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (value) setAddress(value);
    setStep(0);
    setAnalyzing(true);
  };

  if (analyzing) return <AnalyzingView step={step} />;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-b from-white via-surface to-canvas px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <Logo size="lg" />
        <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Free · Two minutes
        </div>
        <h1 className="mt-6 font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-navy sm:text-[56px]">
          Start with an
          <br />
          <span className="text-teal">address.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink/70 sm:text-[17px]">
          We pull from the GWR register, GEAK database and cantonal subsidy
          programs — then return a complete renovation plan tailored to your
          home.
        </p>

        <form onSubmit={submit} className="mx-auto mt-10 max-w-md text-left">
          <div className="group relative flex h-14 items-center rounded-full border border-line bg-white pl-5 pr-1.5 transition-all focus-within:border-teal focus-within:shadow-card">
            <Building2 size={17} className="text-muted" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Musterstrasse 42, 8001 Zürich"
              className="ml-3 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-navy px-5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Analyze
              <ArrowRight size={14} />
            </button>
          </div>
          <p className="mt-3 pl-2 text-[12px] text-muted">
            Free · No obligations · No account
          </p>
        </form>
      </div>
    </div>
  );
};

const AnalyzingView = ({ step }: { step: number }) => (
  <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-white px-6">
    <div className="w-full max-w-md text-center">
      <Logo size="lg" />
      <h2 className="mt-10 font-serif text-[28px] font-bold tracking-[-0.01em] text-navy">
        Reading your building…
      </h2>
      <p className="mt-2 text-[14px] text-muted">
        Cross-referencing official Swiss data sources.
      </p>

      <ol className="mt-10 space-y-2 text-left">
        {ANALYZE_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              className={clsx(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
                done && "border-emerald/30 bg-emerald/5",
                current && "border-teal/30 bg-teal/5",
                !done && !current && "border-line bg-white opacity-50",
              )}
            >
              <span
                className={clsx(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  done && "bg-emerald text-white",
                  current && "bg-teal text-white",
                  !done && !current && "bg-line text-muted",
                )}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} />
                ) : current ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </span>
              <span
                className={clsx(
                  "text-sm",
                  done && "text-emerald",
                  current && "font-semibold text-navy",
                  !done && !current && "text-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  </div>
);
