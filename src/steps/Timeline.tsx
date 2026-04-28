import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { clsx } from "@/lib/clsx";

type Status = "done" | "current" | "upcoming";

interface Step {
  phase: string;
  dur: string;
  date: string;
  status: Status;
  detail: string;
}

export const Timeline = () => {
  useDocumentTitle("Step 6 — Timeline");
  const { selectedModules } = useStore();

  const steps: Step[] = [
    { phase: "GEAK Plus audit", dur: "2 weeks", date: "Apr 2025", status: "done", detail: "Certified auditor on-site assessment" },
    { phase: "Subsidy applications filed", dur: "1 week", date: "Apr 2025", status: "done", detail: "3 applications filed simultaneously via platform" },
    { phase: "Financing confirmed", dur: "1 week", date: "Apr 2025", status: "current", detail: "Green mortgage pre-approved with GEAK data" },
    ...(selectedModules.includes("facade") || selectedModules.includes("roof") || selectedModules.includes("basement")
      ? [{ phase: "Phase 1: Envelope", dur: "5 weeks", date: "May–Jun 2025", status: "upcoming" as const, detail: "Facade, roof and basement insulation (parallel where possible)" }]
      : []),
    ...(selectedModules.includes("windows")
      ? [{ phase: "Phase 2: Windows & doors", dur: "2 weeks", date: "Jun 2025", status: "upcoming" as const, detail: "Triple-glazed windows + insulated doors installed" }]
      : []),
    ...(selectedModules.includes("heating") || selectedModules.includes("electrical")
      ? [{ phase: "Phase 3: Heating & electrical", dur: "3 weeks", date: "Jul 2025", status: "upcoming" as const, detail: "Heat pump install + panel upgrade + oil tank removal" }]
      : []),
    ...(selectedModules.includes("solar")
      ? [{ phase: "Phase 4: Solar PV", dur: "1 week", date: "Jul 2025", status: "upcoming" as const, detail: "PV panels, battery and inverter installation" }]
      : []),
    { phase: "Independent quality inspection", dur: "1 week", date: "Aug 2025", status: "upcoming", detail: "Third-party inspector verifies all completed work" },
    { phase: "Smart meter activated", dur: "Ongoing", date: "Aug 2025+", status: "upcoming", detail: "12-month energy tracking begins" },
  ];

  return (
    <>
      <SectionHeading
        eyebrow="Step 6"
        title="Project timeline"
        description="Contractors pre-coordinated. Parallel scheduling where possible."
      />

      <div className="relative pl-6">
        <div className="absolute bottom-2 left-2 top-2 w-px bg-line" />
        <ol className="space-y-3">
          {steps.map((st, i) => (
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
          <Stat value="~5 months" label="Total duration" tone="white" />
          <Stat value="vs. 12–18" label="Without platform" tone="danger" />
        </div>
      </Card>

      <StepNav currentIndex={5} />
    </>
  );
};
