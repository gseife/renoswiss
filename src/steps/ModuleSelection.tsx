import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { MODULES } from "@/data/modules";
import { moduleIcons } from "@/lib/icons";
import { formatCHF } from "@/lib/format";
import { useStore } from "@/lib/store";
import { clsx } from "@/lib/clsx";
import type { Priority } from "@/data/types";

const priorityTone: Record<Priority, "danger" | "gold" | "muted"> = {
  Critical: "danger",
  Recommended: "gold",
  Optional: "muted",
};

export const ModuleSelection = () => {
  const { selectedModules, toggleModule } = useStore();
  const totalCost = MODULES.filter((m) => selectedModules.includes(m.id)).reduce(
    (s, m) => s + m.estCost,
    0,
  );
  const totalSaving = MODULES.filter((m) => selectedModules.includes(m.id)).reduce(
    (s, m) => s + m.energySaving,
    0,
  );

  return (
    <>
      <SectionHeading
        eyebrow="Step 2"
        title="Recommended renovation measures"
        description="Based on your building's condition. Click to select or deselect — you choose what to include."
      />

      <div className="space-y-2">
        {MODULES.map((m) => {
          const sel = selectedModules.includes(m.id);
          const Icon = moduleIcons[m.iconKey] ?? moduleIcons.facade;
          return (
            <Card
              key={m.id}
              className={clsx(
                "cursor-pointer p-4 transition-all",
                sel ? "border-teal bg-teal/[0.03]" : "hover:border-ink/20",
              )}
              hoverable={!sel}
              onClick={() => toggleModule(m.id)}
              role="button"
              aria-pressed={sel}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleModule(m.id);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors",
                    sel ? "bg-teal text-white" : "bg-canvas text-ink/70",
                  )}
                >
                  {sel ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-navy">{m.name}</span>
                    <Badge tone={priorityTone[m.priority]}>{m.priority}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{m.desc}</p>
                  <p className="mt-2 text-xs italic text-teal">{m.reason}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-base font-bold text-navy">{formatCHF(m.estCost)}</div>
                  <div className="text-xs font-medium text-emerald">
                    −{formatCHF(m.energySaving)}/yr
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedModules.length === 0 ? (
        <Card className="mt-5 border-dashed bg-transparent p-6 text-center">
          <p className="text-sm text-muted">
            Select at least one module to see your renovation plan.
          </p>
        </Card>
      ) : (
        <Card className="mt-5 border-0 bg-navy p-5 text-white">
          <div className="grid grid-cols-3 gap-2">
            <Stat value={formatCHF(totalCost)} label="Estimated total" tone="white" />
            <Stat value={formatCHF(totalSaving)} label="Annual savings" tone="mint" />
            <Stat
              value={`${selectedModules.length} of ${MODULES.length}`}
              label="Modules selected"
              tone="gold"
            />
          </div>
        </Card>
      )}

      <StepNav currentIndex={1} />
    </>
  );
};
