import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { clsx } from "@/lib/clsx";

interface Step {
  n: string;
  t: string;
  lead: string;
  body: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    t: "Analyze",
    lead: "We start with one address.",
    body:
      "Behind the scenes we cross-reference the Federal Building & Dwelling Register (GWR), the GEAK energy database, and cantonal records to build a complete picture of your home — its age, envelope, heating system, energy class, and renovation history. No contractor visits, no questionnaires.",
  },
  {
    n: "02",
    t: "Plan",
    lead: "You pick the modules that matter.",
    body:
      "Facade, roof, heat pump, windows, solar — each one is sized to your specific building and energy profile. We surface the trade-offs in real time: what each module costs, what it saves, and how it interacts with the others. You see the full picture before you commit to any of it.",
  },
  {
    n: "03",
    t: "Match",
    lead: "We connect you to verified Swiss contractors.",
    body:
      "For every module you select, we shortlist contractors who have done that exact work in your canton — with real prices, ratings, lead times, and certifications. You compare them side-by-side, request quotes, and pick the one you want to work with. No middlemen, no kickbacks.",
  },
  {
    n: "04",
    t: "Fund",
    lead: "Subsidies, financing, monthly cost — solved.",
    body:
      "We stack every federal, cantonal and communal subsidy you qualify for, and model the financing — including pension capital, fixed and SARON mortgages, and tax effects. You see your real net cost month by month, before you sign anything.",
  },
];

interface DataSource {
  name: string;
  what: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: "GWR — Federal Building & Dwelling Register",
    what: "Construction year, building type, surface area, number of floors, dwellings, and recorded heating system.",
  },
  {
    name: "GEAK — Cantonal energy certificate database",
    what: "Energy class, envelope quality, and historical consumption for buildings that have been audited.",
  },
  {
    name: "Cantonal subsidy programmes",
    what: "Live programme data from each canton — eligibility rules, amounts, deadlines, and stacking with the federal Building Programme.",
  },
  {
    name: "MuKEn 2025",
    what: "The cantonal energy directives that govern what you can install when. We flag where regulation already constrains your options or will starting 2026.",
  },
];

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "Is RenoSwiss free?",
    a: "Yes — the analysis, the plan, the contractor matching and the financing model are all free for homeowners. We are paid by the contractors when a project goes ahead, not by you.",
  },
  {
    q: "What about my data?",
    a: "Your address is the only personal data we need to start. Everything else comes from public registers. We never sell or share your details, and you can delete your project at any time.",
  },
  {
    q: "Who is this for?",
    a: "Owners of single-family homes and small multi-family buildings in Switzerland. The platform is most useful for buildings constructed before 2000, which is roughly 70% of the Swiss residential stock.",
  },
  {
    q: "Where do the contractors come from?",
    a: "We work with a vetted network of Swiss-registered contractors who have track records in their canton, valid certifications (Minergie, GEAK Plus auditor, etc.), and references from completed projects.",
  },
  {
    q: "Do I have to use a contractor you suggest?",
    a: "No. The platform is designed to help you compare and decide. If you already have a contractor in mind, you can use the rest of the tools — module sizing, subsidies, financing — independently.",
  },
  {
    q: "What happens after I get my plan?",
    a: "You can request quotes from the shortlisted contractors directly through the platform, save the plan, share it with your bank or partner, or come back later. Nothing happens automatically.",
  },
];

export const HowItWorks = () => {
  useDocumentTitle("How it works");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-navy">
      <PageNav />
      <PageHero onStart={() => navigate("/start")} />
      <StepsSection />
      <DataSection />
      <FAQSection />
      <BottomCTA onStart={() => navigate("/start")} />
      <PageFooter />
    </div>
  );
};

const PageNav = () => (
  <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur-xl">
    <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
      <Logo size="sm" />
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink/70 hover:text-navy"
      >
        <ArrowLeft size={14} />
        Home
      </Link>
    </div>
  </header>
);

const PageHero = ({ onStart }: { onStart: () => void }) => (
  <section className="relative overflow-hidden bg-gradient-to-b from-white via-surface to-canvas">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(50%_50%_at_50%_0%,rgba(14,102,85,0.10),transparent_70%)]" />
    <div className="mx-auto max-w-[1100px] px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
        How it works
      </div>
      <h1 className="mt-5 max-w-3xl font-serif text-[44px] font-bold leading-[1.02] tracking-[-0.02em] text-navy sm:text-[72px]">
        Address in.
        <br />
        <span className="text-teal">Renovation plan out.</span>
      </h1>
      <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-ink/75 sm:text-[19px]">
        RenoSwiss turns the most fragmented decision in homeownership — what to
        renovate, who to hire, what it costs after subsidies — into one short,
        honest flow. Here is what happens when you type in an address.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-navy px-6 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
      >
        Start your free analysis
        <ArrowRight size={15} />
      </button>
    </div>
  </section>
);

const StepsSection = () => (
  <section className="bg-white py-24 sm:py-32">
    <div className="mx-auto max-w-[1100px] px-6">
      <SectionTitle eyebrow="The four steps" title={<>From address <span className="text-teal">to plan.</span></>} />
      <div className="mt-14 grid gap-8 md:gap-12">
        {STEPS.map((s, i) => (
          <article
            key={s.n}
            className={clsx(
              "grid gap-6 border-b border-line/70 pb-10 md:grid-cols-12 md:gap-10",
              i === STEPS.length - 1 && "border-b-0 pb-0",
            )}
          >
            <div className="md:col-span-3">
              <div className="font-serif text-[40px] font-bold leading-none text-teal/80 sm:text-[56px]">
                {s.n}
              </div>
              <h3 className="mt-3 font-serif text-[24px] font-bold text-navy sm:text-[28px]">
                {s.t}
              </h3>
            </div>
            <div className="md:col-span-9">
              <p className="font-serif text-[20px] leading-snug text-navy sm:text-[24px]">
                {s.lead}
              </p>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/75 sm:text-[16px]">
                {s.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const DataSection = () => (
  <section className="bg-canvas py-24 sm:py-32">
    <div className="mx-auto max-w-[1100px] px-6">
      <SectionTitle
        eyebrow="The data"
        title={<>Every recommendation, <span className="text-teal">sourced.</span></>}
        description="No surveys, no guesswork. Everything we tell you about your building is traceable to an official register or a regulated standard."
      />
      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
        {DATA_SOURCES.map((d) => (
          <div key={d.name} className="bg-white p-7 sm:p-9">
            <h4 className="font-serif text-[18px] font-bold text-navy">{d.name}</h4>
            <p className="mt-3 text-[14px] leading-relaxed text-ink/75 sm:text-[15px]">
              {d.what}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQSection = () => (
  <section className="bg-white py-24 sm:py-32">
    <div className="mx-auto max-w-[860px] px-6">
      <SectionTitle eyebrow="Questions" title={<>The honest <span className="text-teal">answers.</span></>} />
      <div className="mt-12 divide-y divide-line/70 border-y border-line/70">
        {FAQS.map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    </div>
  </section>
);

const FAQItem = ({ q, a }: FAQ) => {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="group py-5"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left">
        <span className="font-serif text-[18px] font-bold text-navy sm:text-[20px]">{q}</span>
        <ChevronDown
          size={18}
          className={clsx(
            "shrink-0 text-ink/60 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </summary>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink/75">{a}</p>
    </details>
  );
};

const BottomCTA = ({ onStart }: { onStart: () => void }) => (
  <section className="relative overflow-hidden bg-navy py-24 text-white sm:py-32">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_30%,rgba(14,102,85,0.45),transparent_70%)]" />
    <div className="relative mx-auto max-w-[860px] px-6 text-center">
      <h2 className="font-serif text-[40px] font-bold leading-[1.02] tracking-[-0.02em] sm:text-[64px]">
        Ready when you are.
      </h2>
      <p className="mx-auto mt-5 max-w-md text-[16px] text-white/70 sm:text-[17px]">
        Two minutes. One address. The plan your home has been waiting for.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-navy transition-transform hover:scale-[1.03]"
      >
        Start your free analysis
        <ArrowRight size={15} />
      </button>
    </div>
  </section>
);

const PageFooter = () => (
  <footer className="border-t border-line bg-canvas py-10">
    <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-3 px-6 text-[12px] text-muted sm:flex-row">
      <span>© RenoSwiss · Built on Swiss data</span>
      <Link to="/" className="hover:text-navy">
        Back to home
      </Link>
    </div>
  </footer>
);

const SectionTitle = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) => (
  <div>
    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-teal">
      <span className="h-px w-6 bg-current opacity-50" />
      {eyebrow}
    </div>
    <h2 className="mt-4 max-w-3xl font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[56px]">
      {title}
    </h2>
    {description && (
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink/70 sm:text-[16px]">
        {description}
      </p>
    )}
  </div>
);
