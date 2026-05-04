import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { MODULE_DETAILS, type ModuleDetailContent } from "@/data/moduleDetails";
import type { ModuleId } from "@/data/types";
import { useStore } from "@/lib/store";
import { useScaledModules } from "@/lib/useScaledModules";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const KNOWN_IDS: ModuleId[] = ["facade", "heating", "solar", "windows"];

export const ModuleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const modules = useScaledModules();
  const detail = id && (KNOWN_IDS as string[]).includes(id)
    ? MODULE_DETAILS[id as ModuleId]
    : undefined;
  const baseModule = id ? modules.find((m) => m.id === id) : undefined;

  useDocumentTitle(baseModule?.name ?? "Module");

  if (!detail || !baseModule) return <NotFound />;

  return (
    <div className="min-h-screen bg-white text-navy">
      <PageNav />
      <ModuleHero
        name={baseModule.name}
        oneLiner={detail.oneLiner}
        chip={baseModule.priority}
      />
      <ModuleBody detail={detail} moduleId={baseModule.id} />
      <PageFooter />
    </div>
  );
};

const PageNav = () => (
  <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur-xl">
    <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
      <Logo size="sm" />
      <Link
        to="/#modules"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink/70 hover:text-navy"
      >
        <ArrowLeft size={14} />
        All modules
      </Link>
    </div>
  </header>
);

const ModuleHero = ({
  name,
  oneLiner,
  chip,
}: {
  name: string;
  oneLiner: string;
  chip: string;
}) => (
  <section className="relative overflow-hidden bg-gradient-to-b from-white via-surface to-canvas">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(50%_50%_at_50%_0%,rgba(14,102,85,0.10),transparent_70%)]" />
    <div className="mx-auto max-w-[1100px] px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
        {chip}
      </div>
      <h1 className="mt-5 max-w-3xl font-serif text-[44px] font-bold leading-[1.02] tracking-[-0.02em] text-navy sm:text-[72px]">
        {name}
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/75 sm:text-[19px]">
        {oneLiner}
      </p>
    </div>
  </section>
);

const ModuleBody = ({
  detail,
  moduleId,
}: {
  detail: ModuleDetailContent;
  moduleId: ModuleId;
}) => {
  const navigate = useNavigate();
  const { selectedModules, toggleModule } = useStore();
  const alreadyOn = selectedModules.includes(moduleId);

  const addToPlan = () => {
    if (!alreadyOn) toggleModule(moduleId);
    navigate("/plan");
  };

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-[1100px] gap-16 px-6 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <div className="space-y-6 text-[16px] leading-relaxed text-ink/85 sm:text-[17px]">
            {detail.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-12">
            <h3 className="font-serif text-[22px] font-bold text-navy">Subsidies & incentives</h3>
            <ul className="mt-5 space-y-3">
              {detail.subsidies.map((s) => (
                <li key={s} className="flex items-start gap-3 text-[15px] text-ink/80">
                  <span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal/10 text-teal">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-line bg-surface p-7">
            <FactRow label="Typical cost" value={detail.costRange} />
            <FactRow label="Yearly savings" value={detail.savingsPerYear} />
            <FactRow label="CO₂ impact" value={detail.co2Reduction} />
            <FactRow label="Timeline" value={detail.timeline} last />

            <button
              type="button"
              onClick={addToPlan}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              {alreadyOn ? "Open my plan" : "Add to my plan"}
              <ArrowRight size={15} />
            </button>
            <p className="mt-3 text-center text-[12px] text-muted">
              You can adjust modules anytime.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

const FactRow = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <div className={`flex items-baseline justify-between gap-4 py-3 ${last ? "" : "border-b border-line/70"}`}>
    <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
      {label}
    </span>
    <span className="text-right font-serif text-[18px] font-bold text-navy">
      {value}
    </span>
  </div>
);

const PageFooter = () => (
  <footer className="border-t border-line bg-canvas py-10">
    <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-3 px-6 text-[12px] text-muted sm:flex-row">
      <span>© RenoSwiss · Built on Swiss data</span>
      <Link to="/#modules" className="hover:text-navy">
        See all modules
      </Link>
    </div>
  </footer>
);

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-white px-6">
    <div className="max-w-md text-center">
      <Logo size="lg" />
      <h1 className="mt-8 font-serif text-[32px] font-bold text-navy">Module not found.</h1>
      <p className="mt-3 text-[15px] text-ink/70">
        We don't have a detail page for that module yet.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-navy px-6 text-[14px] font-semibold text-white"
      >
        <ArrowLeft size={14} />
        Back to home
      </Link>
    </div>
  </div>
);
