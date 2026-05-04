import { useState } from "react";
import {
  ChevronDown,
  User,
  Home,
  Hotel,
  Bot,
  Activity,
  Hammer,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { clsx } from "@/lib/clsx";
import type { ModuleId } from "@/data/types";

type Status = "done" | "current" | "upcoming";

type Involvement = "you-action" | "at-home" | "relocation" | "passive" | "monitoring";

interface Phase {
  phase: string;
  weeks: number; // 0 = ongoing / open-ended
  detail: string;
  involvement: Involvement;
  /** Modules whose chosen contractor executes this phase. */
  modules?: ModuleId[];
  /** What the platform / contractors do during this phase. */
  activities: string[];
  /** What the homeowner needs to do (empty = nothing required). */
  youDo: string[];
  /** Days you need to be out of the house (for involvement="relocation"). */
  relocationDays?: number;
  optional?: boolean;
  test?: (selected: string[]) => boolean;
}

const PHASES: Phase[] = [
  {
    phase: "GEAK Plus audit",
    weeks: 2,
    detail: "Certified auditor on-site assessment",
    involvement: "you-action",
    activities: [
      "Auditor walkthrough (~90 min on-site)",
      "Thermal-imaging + air-tightness check",
      "GEAK Plus report delivered to your platform inbox",
    ],
    youDo: [
      "Be home for the 90-minute on-site visit",
      "Hand over the last 3 years of energy bills",
    ],
  },
  {
    phase: "Subsidy applications filed",
    weeks: 1,
    detail: "Applications filed simultaneously via platform",
    involvement: "passive",
    activities: [
      "Cantonal energy program form prepared",
      "Federal CO₂ refund + MuKEn climate fund bundled",
      "Pre-qualification confirmation tracked in your dashboard",
    ],
    youDo: ["e-Sign the bundled application (single click in the platform)"],
  },
  {
    phase: "Financing confirmed",
    weeks: 1,
    detail: "Green mortgage pre-approved with GEAK data",
    involvement: "you-action",
    activities: [
      "Selected bank pre-approves with GEAK report attached",
      "Notary draft prepared & shared",
    ],
    youDo: [
      "Sign the mortgage agreement at the notary (~45 min)",
      "Hand in pay slips, ID, and existing-mortgage statement",
    ],
  },
  {
    phase: "Phase 1: Envelope",
    weeks: 5,
    detail: "Facade, roof and basement insulation (parallel where possible)",
    involvement: "at-home",
    modules: ["facade", "roof", "basement"],
    activities: [
      "Scaffolding erected around the building",
      "20 cm mineral-wool ETICS on the facade + new render",
      "Roof: between- and over-rafter insulation, new membrane and tiles",
      "Basement ceiling insulation from below (no interior disruption)",
    ],
    youDo: [
      "Move outdoor furniture and plants away from facade walls",
      "Expect site noise on weekdays 08:00–17:00 — interior usable throughout",
    ],
    optional: true,
    test: (s) =>
      s.includes("facade") || s.includes("roof") || s.includes("basement"),
  },
  {
    phase: "Phase 2: Windows & doors",
    weeks: 2,
    detail: "Triple-glazed windows + insulated doors installed",
    involvement: "at-home",
    modules: ["windows"],
    activities: [
      "Old windows and frames removed room-by-room",
      "Triple-glazed units installed with thermal-break frames",
      "Insulated entrance doors fitted",
      "Sealing, finishing and clean-up",
    ],
    youDo: [
      "Take down curtains and blinds the day before",
      "Each room is briefly unusable (~4h) on the day it's swapped",
    ],
    optional: true,
    test: (s) => s.includes("windows"),
  },
  {
    phase: "Phase 3: Heating & electrical",
    weeks: 3,
    detail: "Heat pump install + panel upgrade + oil tank removal",
    involvement: "relocation",
    relocationDays: 10,
    modules: ["heating", "electrical"],
    activities: [
      "Oil tank drained, decommissioned and removed",
      "Outdoor heat-pump unit + indoor module + hot-water cylinder",
      "Electrical panel upgraded for heat pump load",
      "Smart thermostat and zone controls commissioned",
    ],
    youDo: [
      "Pick your stay from curated options (Aparthotel, serviced flat, Airbnb) — you pay direct, we negotiate the rate",
      "Forward mail to the platform pickup address (one click)",
    ],
    optional: true,
    test: (s) => s.includes("heating") || s.includes("electrical"),
  },
  {
    phase: "Phase 4: Solar PV",
    weeks: 1,
    detail: "PV panels, battery and inverter installation",
    involvement: "at-home",
    modules: ["solar"],
    activities: [
      "Roof rails and mounting brackets installed",
      "Panels mounted and wired to the inverter",
      "Battery cabinet wired in the garage / utility room",
      "Grid connection registered with the local utility",
    ],
    youDo: [
      "Garage / utility room briefly used during inverter install (~1 day)",
    ],
    optional: true,
    test: (s) => s.includes("solar"),
  },
  {
    phase: "Independent quality inspection",
    weeks: 1,
    detail: "Third-party inspector verifies all completed work",
    involvement: "you-action",
    activities: [
      "Independent inspector on-site (no contractor present)",
      "Punch list issued, contractors notified",
      "Any deficiencies fixed before sign-off",
    ],
    youDo: ["Walk through with the inspector and counter-sign (~2h)"],
  },
  {
    phase: "Smart meter activated",
    weeks: 0,
    detail: "12-month energy tracking begins",
    involvement: "monitoring",
    activities: [
      "Smart meter logs energy use 24/7",
      "Subsidy disbursements triggered automatically after 12 months",
      "Annual GEAK re-rating offered free of charge",
    ],
    youDo: [],
  },
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatPhaseDate = (start: Date, end: Date) => {
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (sameYear) {
    return `${MONTH_NAMES[start.getMonth()]}–${MONTH_NAMES[end.getMonth()]} ${start.getFullYear()}`;
  }
  return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()} – ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
};

const addWeeks = (d: Date, weeks: number) => {
  const out = new Date(d);
  out.setDate(out.getDate() + weeks * 7);
  return out;
};

const INVOLVEMENT_META: Record<
  Involvement,
  {
    label: string;
    Icon: typeof User;
    chip: string;
    accent: string;
  }
> = {
  "you-action": {
    label: "Your action needed",
    Icon: User,
    chip: "bg-gold/15 text-[#a36106]",
    accent: "border-l-gold",
  },
  "at-home": {
    label: "Stay home · some disruption",
    Icon: Home,
    chip: "bg-teal/10 text-teal",
    accent: "border-l-teal",
  },
  relocation: {
    label: "Short relocation",
    Icon: Hotel,
    chip: "bg-warning/15 text-[#a36106]",
    accent: "border-l-warning",
  },
  passive: {
    label: "Platform handles it",
    Icon: Bot,
    chip: "bg-canvas text-muted",
    accent: "border-l-line",
  },
  monitoring: {
    label: "Ongoing tracking",
    Icon: Activity,
    chip: "bg-emerald/10 text-emerald",
    accent: "border-l-emerald",
  },
};

export const Timeline = () => {
  useDocumentTitle("Step 6 — Timeline");
  const { selectedModules, selectedContractors, projectStart, setProjectStart } = useStore();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const active = PHASES.filter((p) => !p.optional || p.test?.(selectedModules));
  const totalWeeks = active.reduce((acc, p) => acc + p.weeks, 0);
  const totalRelocationDays = active.reduce(
    (acc, p) => acc + (p.involvement === "relocation" ? (p.relocationDays ?? 0) : 0),
    0,
  );
  const youActionCount = active.filter((p) => p.involvement === "you-action").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = projectStart ? new Date(`${projectStart}T00:00:00`) : null;

  let cursor = start ? new Date(start) : null;
  const rendered = active.map((p) => {
    if (!cursor) {
      return {
        ...p,
        dur: p.weeks === 0 ? "Ongoing" : `${p.weeks} week${p.weeks === 1 ? "" : "s"}`,
        date: "—",
        status: "upcoming" as Status,
      };
    }
    const phaseStart = new Date(cursor);
    const phaseEnd = p.weeks === 0 ? new Date(cursor) : addWeeks(cursor, p.weeks);
    let status: Status;
    if (p.weeks === 0) {
      status = phaseStart <= today ? "current" : "upcoming";
    } else if (phaseEnd < today) {
      status = "done";
    } else if (phaseStart <= today && today <= phaseEnd) {
      status = "current";
    } else {
      status = "upcoming";
    }
    const dateLabel =
      p.weeks === 0
        ? `${MONTH_NAMES[phaseStart.getMonth()]} ${phaseStart.getFullYear()}+`
        : formatPhaseDate(phaseStart, phaseEnd);
    if (p.weeks > 0) cursor = phaseEnd;
    return {
      ...p,
      dur: p.weeks === 0 ? "Ongoing" : `${p.weeks} week${p.weeks === 1 ? "" : "s"}`,
      date: dateLabel,
      status,
    };
  });

  const totalDurationLabel =
    totalWeeks >= 17
      ? `~${Math.round(totalWeeks / 4)} months`
      : `${totalWeeks} weeks`;

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <>
      <SectionHeading
        eyebrow="Step 6"
        title="Project timeline"
        description="Pick a kickoff date to see your phase-by-phase schedule. Gold cards mark the moments you're personally needed — every other phase, we orchestrate end-to-end."
      />

      <Card className="mb-4 p-4">
        <label
          htmlFor="project-start"
          className="block text-[11px] font-semibold uppercase tracking-wider text-muted"
        >
          Project start date
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            id="project-start"
            type="date"
            value={projectStart ?? ""}
            min={todayIso}
            onChange={(e) => setProjectStart(e.target.value || null)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20 sm:w-auto"
          />
          {projectStart && (
            <button
              type="button"
              onClick={() => setProjectStart(null)}
              className="text-[11px] font-semibold text-muted hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          We'll align phases against this kickoff. You can adjust it anytime — it
          carries through to the Summary booking step.
        </p>
      </Card>

      {start ? (
        <>
          {/* Involvement summary banner */}
          <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-3">
            <InvolvementSummary
              Icon={User}
              tone="gold"
              value={String(youActionCount)}
              label={`Moment${youActionCount === 1 ? "" : "s"} you're needed`}
            />
            <InvolvementSummary
              Icon={Hotel}
              tone={totalRelocationDays > 0 ? "warning" : "muted"}
              value={totalRelocationDays > 0 ? `${totalRelocationDays}d` : "0"}
              label={
                totalRelocationDays > 0
                  ? "Relocation — options curated"
                  : "No relocation needed"
              }
            />
            <InvolvementSummary
              Icon={Bot}
              tone="teal"
              value={`${active.filter((p) => p.involvement === "passive" || p.involvement === "monitoring").length}`}
              label="Phases handled for you"
            />
          </Card>

          {totalRelocationDays > 0 && (
            <Card className="mb-4 flex items-start gap-3 border-l-4 border-l-warning bg-warning/5 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning/15 text-[#a36106]">
                <Hotel size={16} />
              </div>
              <div className="min-w-0 flex-1 text-xs text-ink/80">
                <div className="text-sm font-semibold text-navy">
                  You'll need to be out of the house for ~{totalRelocationDays} days.
                </div>
                <p className="mt-0.5">
                  We curate three options within 5 km — Aparthotel (~CHF 180/night),
                  serviced flat (~CHF 130/night) and a vetted Airbnb (~CHF 90/night)
                  — at pre-negotiated rates. You pick and pay directly, so there
                  are no hidden mark-ups in the project price.
                </p>
              </div>
            </Card>
          )}

          <div className="relative pl-6">
            <div className="absolute bottom-2 left-2 top-2 w-px bg-line" />
            <ol className="space-y-3">
              {rendered.map((st, i) => {
                const meta = INVOLVEMENT_META[st.involvement];
                const Icon = meta.Icon;
                const isOpen = openIndex === i;
                const phaseContractors = (st.modules ?? [])
                  .map((id) => ({ id, ct: selectedContractors[id] }))
                  .filter((x): x is { id: ModuleId; ct: NonNullable<typeof x.ct> } =>
                    Boolean(x.ct),
                  );
                return (
                  <li key={i} className="relative">
                    <span
                      className={clsx(
                        "absolute -left-5 top-3 grid h-3 w-3 place-items-center rounded-full ring-4 ring-surface",
                        st.status === "done" && "bg-emerald",
                        st.status === "current" && "bg-gold",
                        st.status === "upcoming" && "bg-line",
                      )}
                    />
                    <Card
                      className={clsx(
                        "border-l-4 p-0 transition-shadow",
                        meta.accent,
                        st.status === "current" && "bg-[#FFFDF5]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-navy">
                              {st.phase}
                            </span>
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                meta.chip,
                              )}
                            >
                              <Icon size={10} />
                              {st.involvement === "relocation" && st.relocationDays
                                ? `Relocate ~${st.relocationDays}d`
                                : meta.label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-muted">{st.detail}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right">
                            <div
                              className={clsx(
                                "text-xs font-semibold",
                                st.status === "done" ? "text-emerald" : "text-ink",
                              )}
                            >
                              {st.date}
                            </div>
                            <div className="text-[10px] text-muted">{st.dur}</div>
                          </div>
                          <ChevronDown
                            size={16}
                            className={clsx(
                              "text-muted transition-transform",
                              isOpen && "rotate-180",
                            )}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-line px-4 pb-4 pt-3 text-xs">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <DetailList
                              icon={<Hammer size={12} />}
                              title="What gets done"
                              items={st.activities}
                              tone="navy"
                            />
                            <DetailList
                              icon={<User size={12} />}
                              title="What you do"
                              items={st.youDo.length > 0 ? st.youDo : ["Nothing — we handle it."]}
                              tone={st.youDo.length > 0 ? "gold" : "muted"}
                            />
                          </div>

                          {st.involvement === "relocation" && st.relocationDays && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-[11px] text-ink/80">
                              <Hotel
                                size={14}
                                className="mt-0.5 shrink-0 text-[#a36106]"
                              />
                              <span>
                                <strong className="text-navy">
                                  Out for ~{st.relocationDays} days.
                                </strong>{" "}
                                We pre-negotiate three transparent options within
                                5 km (Aparthotel, serviced flat, Airbnb — roughly
                                CHF 90–180 / night) and arrange mail forwarding. You
                                book and pay the option you prefer — no mark-up on
                                our side. Flag pets, kids or accessibility needs in
                                the dashboard.
                              </span>
                            </div>
                          )}

                          {phaseContractors.length > 0 && (
                            <div className="mt-3 rounded-lg border border-line bg-canvas/40 p-3">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                                Contractor{phaseContractors.length === 1 ? "" : "s"} on site
                              </div>
                              <ul className="mt-1.5 space-y-1.5">
                                {phaseContractors.map(({ id, ct }) => (
                                  <li
                                    key={id}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <div className="min-w-0">
                                      <div className="truncate text-xs font-semibold text-navy">
                                        {ct.name}
                                      </div>
                                      <div className="truncate text-[10px] text-muted">
                                        {ct.loc} · {ct.years} yrs · {ct.certs.join(", ")}
                                      </div>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-semibold text-emerald">
                                      ✓ Confirmed
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {st.modules && phaseContractors.length === 0 && (
                            <p className="mt-3 text-[11px] text-muted">
                              No contractors picked yet for this phase. Choose them
                              on Step 3 — Contractors.
                            </p>
                          )}

                          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                            <Clock size={11} />
                            <span>
                              {st.dur} · {st.date}
                            </span>
                            {st.status === "done" && (
                              <span className="inline-flex items-center gap-1 text-emerald">
                                <CheckCircle2 size={11} /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ol>
          </div>

          <Card className="mt-5 border-0 !bg-navy p-5 text-white">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={totalDurationLabel} label="With RenoSwiss" tone="white" />
              <Stat value="12–18 mo" label="Without platform" tone="danger" />
            </div>
            <p className="mt-3 text-center text-[10px] text-white/60">
              Without coordination, subsidies file sequentially, banks are shopped
              one-by-one, and contractors don't run in parallel.
            </p>
          </Card>
        </>
      ) : (
        <Card className="border-l-4 border-l-gold bg-gold/5 p-4 text-sm text-ink/80">
          Pick a start date above to view phase dates and a total schedule.
          Indicative duration: <strong className="text-navy">{totalDurationLabel}</strong>.
        </Card>
      )}

      <StepNav />
    </>
  );
};

const InvolvementSummary = ({
  Icon,
  tone,
  value,
  label,
}: {
  Icon: typeof User;
  tone: "gold" | "warning" | "teal" | "muted";
  value: string;
  label: string;
}) => {
  const toneMap = {
    gold: "bg-gold/15 text-[#a36106]",
    warning: "bg-warning/15 text-[#a36106]",
    teal: "bg-teal/10 text-teal",
    muted: "bg-canvas text-muted",
  } as const;
  return (
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
          toneMap[tone],
        )}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="font-serif text-lg font-bold leading-none text-navy">
          {value}
        </div>
        <div className="mt-1 text-[11px] leading-tight text-muted">{label}</div>
      </div>
    </div>
  );
};

const DetailList = ({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: "navy" | "gold" | "muted";
}) => {
  const toneMap = {
    navy: "text-navy",
    gold: "text-[#a36106]",
    muted: "text-muted",
  } as const;
  return (
    <div>
      <div
        className={clsx(
          "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
          toneMap[tone],
        )}
      >
        {icon}
        {title}
      </div>
      <ul className="mt-1.5 space-y-1 text-[11.5px] leading-snug text-ink/85">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-line" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
