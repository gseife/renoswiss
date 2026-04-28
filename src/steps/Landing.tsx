import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { KPI } from "@/components/ui/KPI";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { computeTotals } from "@/lib/derived";
import { clsx } from "@/lib/clsx";

const ANALYZE_STEPS = [
  "Reading GWR building register",
  "Querying GEAK energy database",
  "Matching cantonal subsidy programs",
  "Comparing renovation benchmarks",
];
const STEP_DURATION = 420;

export const Landing = () => {
  useDocumentTitle();
  const navigate = useNavigate();
  const { address, setAddress, selectedModules, selectedContractors, reset } = useStore();
  const [draft, setDraft] = useState(address);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);

  const hasResume = selectedModules.length > 0 || Object.keys(selectedContractors).length > 0;

  useEffect(() => {
    if (!analyzing) return;
    if (analyzeStep >= ANALYZE_STEPS.length) {
      const t = window.setTimeout(() => navigate("/building"), 350);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setAnalyzeStep((s) => s + 1), STEP_DURATION);
    return () => window.clearTimeout(t);
  }, [analyzing, analyzeStep, navigate]);

  const start = () => {
    if (draft.trim()) setAddress(draft.trim());
    setAnalyzeStep(0);
    setAnalyzing(true);
  };

  if (analyzing) {
    return <AnalyzingView step={analyzeStep} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <span className="text-xs text-muted">Demo prototype</span>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 lg:grid lg:grid-cols-12 lg:gap-12 lg:pt-16">
        <div className="lg:col-span-7">
          {hasResume && (
            <ResumeBanner
              modulesCount={selectedModules.length}
              onContinue={() => navigate("/summary")}
              onReset={() => reset()}
            />
          )}

          <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-gold">
            <Sparkles size={12} />
            Renovate Smarter
          </div>
          <h1 className="font-serif text-4xl font-bold leading-[1.1] text-navy sm:text-5xl lg:text-6xl">
            Your home renovation,
            <br />
            <span className="text-teal">simplified.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
            Enter your address. We analyze your building, recommend what to renovate, match you
            with verified contractors, optimize subsidies, and calculate your exact financial
            impact — all in one place.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
            className="mt-8 max-w-xl"
          >
            <label htmlFor="address" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Property address
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Building2
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="address"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Musterstrasse 42, 8001 Zürich"
                  className="h-12 w-full rounded-lg border border-line bg-white pl-11 pr-4 text-sm shadow-soft transition-colors focus:border-teal focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg">
                Analyze
                <ArrowRight size={16} />
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck size={13} />
              Free analysis · No obligations · Takes 2 minutes
            </p>
          </form>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-xl">
            {[
              ["1,847", "Buildings analyzed"],
              ["CHF 42M", "Subsidies captured"],
              ["4.7 ★", "Avg. satisfaction"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-line bg-white px-4 py-3 shadow-soft">
                <div className="font-serif text-xl font-bold text-teal">{v}</div>
                <div className="text-[11px] text-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 lg:col-span-5 lg:mt-0">
          <PreviewCard />
        </div>
      </main>
    </div>
  );
};

const ResumeBanner = ({
  modulesCount,
  onContinue,
  onReset,
}: {
  modulesCount: number;
  onContinue: () => void;
  onReset: () => void;
}) => {
  const { selectedModules, selectedContractors } = useStore();
  const totals = computeTotals(selectedModules, selectedContractors);
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-teal/30 bg-teal/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-semibold text-navy">Welcome back</div>
        <div className="text-xs text-muted">
          You had {modulesCount} module{modulesCount === 1 ? "" : "s"} selected (
          {totals.geakImprovement}). Pick up where you left off?
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw size={13} />
          Start over
        </Button>
        <Button size="sm" onClick={onContinue}>
          Continue
          <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
};

const AnalyzingView = ({ step }: { step: number }) => (
  <div className="flex min-h-screen items-center justify-center bg-surface px-6">
    <div className="w-full max-w-md text-center">
      <Logo size="lg" />
      <h2 className="mt-8 font-serif text-2xl text-navy">Analyzing your building…</h2>
      <p className="mt-2 text-sm text-muted">
        Cross-referencing official Swiss building data sources.
      </p>

      <ol className="mt-8 space-y-2 text-left">
        {ANALYZE_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              className={clsx(
                "flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all duration-300",
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

const PreviewCard = () => (
  <div className="relative">
    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-teal/20 via-emerald/10 to-gold/20 blur-2xl" />
    <div className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Sample report preview
        </span>
        <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
          Live demo
        </span>
      </div>

      <div className="mb-1 font-serif text-lg text-navy">Musterstrasse 42, Zürich</div>
      <div className="text-xs text-muted">1972 · Einfamilienhaus · 185 m²</div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <KPI value="F → B" label="GEAK" tone="teal" />
        <KPI value="−7.0 t" label="CO₂/yr" tone="emerald" />
        <KPI value="CHF 9,800" label="Saved/yr" tone="gold" />
      </div>

      <div className="mt-5 space-y-2">
        {[
          { name: "Facade insulation", price: "CHF 47,200" },
          { name: "Heat pump", price: "CHF 36,500" },
          { name: "Solar PV system", price: "CHF 25,200" },
        ].map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal" />
              <span className="font-semibold text-navy">{m.name}</span>
            </div>
            <span className="font-semibold text-ink">{m.price}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-navy px-3 py-2.5 text-xs text-white">
        <span className="text-mint">Total subsidies identified</span>
        <span className="font-serif text-base font-bold text-gold-soft">CHF 37,600</span>
      </div>
    </div>
  </div>
);
