import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";

export const Landing = () => {
  const navigate = useNavigate();
  const { address, setAddress } = useStore();
  const [draft, setDraft] = useState(address);
  const [analyzing, setAnalyzing] = useState(false);

  const start = () => {
    if (draft.trim()) setAddress(draft.trim());
    setAnalyzing(true);
    window.setTimeout(() => navigate("/building"), 1400);
  };

  if (analyzing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md text-center">
          <Logo size="lg" />
          <div className="spinner mx-auto mt-8 h-10 w-10" />
          <h2 className="mt-6 font-serif text-xl text-navy">Analyzing your building…</h2>
          <p className="mt-2 text-sm text-muted">
            Cross-referencing GWR building register, GEAK energy database, cantonal subsidy
            programs and historical renovation data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <span className="text-xs text-muted">Demo prototype</span>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 lg:grid lg:grid-cols-12 lg:gap-12 lg:pt-20">
        <div className="lg:col-span-7">
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

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Metric value="F → B" label="GEAK" tone="teal" />
        <Metric value="−7.0 t" label="CO₂/yr" tone="emerald" />
        <Metric value="CHF 9,800" label="Saved/yr" tone="gold" />
      </div>

      <div className="mt-5 space-y-2">
        {[
          { name: "Facade insulation", price: "CHF 47,200", tone: "Critical" },
          { name: "Heat pump", price: "CHF 36,500", tone: "Critical" },
          { name: "Solar PV system", price: "CHF 25,200", tone: "Recommended" },
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

const toneClass = {
  teal: "bg-teal/10 text-teal",
  emerald: "bg-emerald/10 text-emerald",
  gold: "bg-gold/10 text-gold",
} as const;

const Metric = ({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: keyof typeof toneClass;
}) => (
  <div className={`rounded-lg px-2 py-2.5 ${toneClass[tone]}`}>
    <div className="font-serif text-base font-bold leading-tight">{value}</div>
    <div className="text-[10px] opacity-80">{label}</div>
  </div>
);
