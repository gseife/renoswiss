import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { clsx } from "@/lib/clsx";

type Status = "done" | "current" | "upcoming";

interface Phase {
  phase: string;
  weeks: number; // 0 = ongoing / open-ended
  detail: string;
  optional?: boolean;
  test?: (selected: string[]) => boolean;
}

// Each phase's duration in weeks. Dates and statuses are derived from the
// user's chosen project start (set on the Summary page).
const PHASES: Phase[] = [
  {
    phase: "GEAK Plus audit",
    weeks: 2,
    detail: "Certified auditor on-site assessment",
  },
  {
    phase: "Subsidy applications filed",
    weeks: 1,
    detail: "Applications filed simultaneously via platform",
  },
  {
    phase: "Financing confirmed",
    weeks: 1,
    detail: "Green mortgage pre-approved with GEAK data",
  },
  {
    phase: "Phase 1: Envelope",
    weeks: 5,
    detail: "Facade, roof and basement insulation (parallel where possible)",
    optional: true,
    test: (s) =>
      s.includes("facade") || s.includes("roof") || s.includes("basement"),
  },
  {
    phase: "Phase 2: Windows & doors",
    weeks: 2,
    detail: "Triple-glazed windows + insulated doors installed",
    optional: true,
    test: (s) => s.includes("windows"),
  },
  {
    phase: "Phase 3: Heating & electrical",
    weeks: 3,
    detail: "Heat pump install + panel upgrade + oil tank removal",
    optional: true,
    test: (s) => s.includes("heating") || s.includes("electrical"),
  },
  {
    phase: "Phase 4: Solar PV",
    weeks: 1,
    detail: "PV panels, battery and inverter installation",
    optional: true,
    test: (s) => s.includes("solar"),
  },
  {
    phase: "Independent quality inspection",
    weeks: 1,
    detail: "Third-party inspector verifies all completed work",
  },
  {
    phase: "Smart meter activated",
    weeks: 0,
    detail: "12-month energy tracking begins",
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

export const Timeline = () => {
  useDocumentTitle("Step 6 — Timeline");
  const { selectedModules, projectStart } = useStore();

  const active = PHASES.filter((p) => !p.optional || p.test?.(selectedModules));
  const totalWeeks = active.reduce((acc, p) => acc + p.weeks, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = projectStart ? new Date(`${projectStart}T00:00:00`) : null;

  // Walk through phases and derive each phase's window.
  let cursor = start ? new Date(start) : null;
  const rendered = active.map((p) => {
    if (!cursor) {
      return {
        phase: p.phase,
        detail: p.detail,
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
      phase: p.phase,
      detail: p.detail,
      dur: p.weeks === 0 ? "Ongoing" : `${p.weeks} week${p.weeks === 1 ? "" : "s"}`,
      date: dateLabel,
      status,
    };
  });

  const totalDurationLabel =
    totalWeeks >= 17
      ? `~${Math.round(totalWeeks / 4)} months`
      : `${totalWeeks} weeks`;

  return (
    <>
      <SectionHeading
        eyebrow="Step 6"
        title="Project timeline"
        description={
          start
            ? "Contractors pre-coordinated. Parallel scheduling where possible."
            : "Set a project start date on the Summary step to see exact phase dates."
        }
      />

      {!start && (
        <Card className="mb-4 border-l-4 border-l-gold bg-gold/5 p-4 text-sm text-ink/80">
          No start date set yet. We'll show indicative durations below — finish
          the flow and pick a date in the Summary step to lock in a schedule.
        </Card>
      )}

      <div className="relative pl-6">
        <div className="absolute bottom-2 left-2 top-2 w-px bg-line" />
        <ol className="space-y-3">
          {rendered.map((st, i) => (
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
                  "border-l-4 p-4",
                  st.status === "done" && "border-l-emerald",
                  st.status === "current" && "border-l-gold bg-[#FFFDF5]",
                  st.status === "upcoming" && "border-l-line",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-navy">{st.phase}</div>
                    <div className="mt-0.5 text-xs text-muted">{st.detail}</div>
                  </div>
                  <div className="shrink-0 text-right">
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
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      <Card className="mt-5 border-0 bg-navy p-5 text-white">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={totalDurationLabel} label="Total duration" tone="white" />
          <Stat value="vs. 12–18" label="Without platform" tone="danger" />
        </div>
      </Card>

      <StepNav />
    </>
  );
};
