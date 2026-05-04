import { Check, MinusCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { moduleIcons } from "@/lib/icons";
import { formatCHF } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useScaledModules } from "@/lib/useScaledModules";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useToast } from "@/lib/toast";
import { clsx } from "@/lib/clsx";
import { gateForModule } from "@/lib/gis/eligibilityGate";
import { reasonForModule } from "@/lib/gis/moduleCopy";
import type { Priority, ModuleId } from "@/data/types";

const priorityTone: Record<Priority, "danger" | "gold" | "muted"> = {
  Critical: "danger",
  Recommended: "gold",
  Optional: "muted",
};

export const ModuleSelection = () => {
  useDocumentTitle("Step 2 — Renovation Plan");
  const { selectedModules, toggleModule, eligibility, building } = useStore();
  const modules = useScaledModules();
  const toast = useToast();
  const handleToggle = (id: ModuleId) => {
    const wasSelected = selectedModules.includes(id);
    const mod = modules.find((m) => m.id === id);
    toggleModule(id);
    if (mod) {
      toast(
        wasSelected ? `Removed ${mod.name}` : `Added ${mod.name}`,
        wasSelected ? "info" : "success",
      );
    }
  };
  const totalCost = modules
    .filter((m) => selectedModules.includes(m.id))
    .reduce((s, m) => s + m.estCost, 0);
  const totalSaving = modules
    .filter((m) => selectedModules.includes(m.id))
    .reduce((s, m) => s + m.energySaving, 0);

  return (
    <>
      <SectionHeading
        eyebrow="Step 2"
        title="Recommended renovation measures"
        description="Based on your building's condition. Click to select or deselect — you choose what to include."
      />

      <div className="space-y-2">
        {modules.map((m) => {
          const sel = selectedModules.includes(m.id);
          const Icon = moduleIcons[m.iconKey] ?? moduleIcons.facade;
          const gate = gateForModule(m.id, eligibility);
          const interactive = !gate.skipped;
          return (
            <Card
              key={m.id}
              className={clsx(
                "p-4 transition-all",
                interactive && "cursor-pointer",
                gate.skipped && "opacity-60",
                sel && interactive && "border-teal bg-teal/[0.03]",
                interactive && !sel && "hover:border-ink/20",
              )}
              hoverable={interactive && !sel}
              onClick={interactive ? () => handleToggle(m.id) : undefined}
              role={interactive ? "button" : undefined}
              aria-pressed={interactive ? sel : undefined}
              aria-disabled={!interactive}
              tabIndex={interactive ? 0 : -1}
              onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(m.id);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors",
                    gate.skipped
                      ? "bg-canvas text-muted"
                      : sel
                        ? "bg-teal text-white"
                        : "bg-canvas text-ink/70",
                  )}
                >
                  {gate.skipped ? (
                    <MinusCircle size={18} />
                  ) : sel ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        "text-sm font-semibold",
                        gate.skipped ? "text-muted line-through" : "text-navy",
                      )}
                    >
                      {m.name}
                    </span>
                    {gate.skipped ? (
                      <Badge tone="muted">Skipped</Badge>
                    ) : (
                      <Badge tone={priorityTone[m.priority]}>{m.priority}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">{m.desc}</p>
                  {gate.skipped && gate.reason ? (
                    <p className="mt-2 text-xs italic text-emerald">
                      {gate.reason}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs italic text-teal">
                      {reasonForModule(m.id, m.reason, { building, eligibility })}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={clsx(
                      "text-base font-bold",
                      gate.skipped ? "text-muted line-through" : "text-navy",
                    )}
                  >
                    {formatCHF(m.estCost)}
                  </div>
                  {!gate.skipped && (
                    <div className="text-xs font-medium text-emerald">
                      −{formatCHF(m.energySaving)}/yr
                    </div>
                  )}
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
        <Card className="mt-5 overflow-hidden border-0 bg-gradient-to-br from-navy to-teal p-5 text-white">
          <div className="grid grid-cols-3 gap-2">
            <Stat value={formatCHF(totalCost)} label="Estimated total" tone="white" />
            <Stat value={formatCHF(totalSaving)} label="Annual savings" tone="mint" />
            <Stat
              value={`${selectedModules.length} of ${modules.length}`}
              label="Modules selected"
              tone="gold"
            />
          </div>
        </Card>
      )}

      <StepNav />
    </>
  );
};
