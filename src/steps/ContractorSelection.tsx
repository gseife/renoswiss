import { useState } from "react";
import { Check, ChevronDown, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { StatBar } from "@/components/ui/StatBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNav } from "@/components/StepNav";
import { CONTRACTORS } from "@/data/contractors";
import { moduleIcons } from "@/lib/icons";
import { formatCHF } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useScaledModules } from "@/lib/useScaledModules";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useToast } from "@/lib/toast";
import { clsx } from "@/lib/clsx";
import type { Contractor, Module } from "@/data/types";

export const ContractorSelection = () => {
  useDocumentTitle("Step 3 — Contractors");
  const { selectedModules, selectedContractors, selectContractor } = useStore();
  const modules = useScaledModules();
  const toast = useToast();
  const activeModules = modules.filter((m) => selectedModules.includes(m.id));
  const [expanded, setExpanded] = useState<string | null>(activeModules[0]?.id ?? null);

  const handleSelect = (modId: Module["id"], contractor: Contractor) => {
    const wasChosen = selectedContractors[modId]?.name === contractor.name;
    const mod = modules.find((m) => m.id === modId);
    selectContractor(modId, contractor);
    if (mod) {
      toast(
        wasChosen
          ? `Cleared ${mod.name} contractor`
          : `${contractor.name} selected for ${mod.name}`,
        wasChosen ? "info" : "success",
      );
    }
  };

  const pickAllRecommended = () => {
    let count = 0;
    activeModules.forEach((mod) => {
      const list = CONTRACTORS[mod.id] ?? [];
      const top = list.find((c) => c.badge === "Top Rated") ?? list[0];
      if (top && selectedContractors[mod.id]?.name !== top.name) {
        selectContractor(mod.id, top);
        count++;
      }
    });
    toast(count > 0 ? `Selected top-rated for ${count} module${count === 1 ? "" : "s"}` : "Top-rated already selected", "success");
  };

  if (activeModules.length === 0) {
    return (
      <>
        <SectionHeading eyebrow="Step 3" title="Choose your contractors" />
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm text-muted">
            Pick at least one module on the previous step to see contractor matches.
          </p>
        </Card>
        <StepNav />
      </>
    );
  }

  const allChosen = activeModules.every((m) => selectedContractors[m.id]);

  return (
    <>
      <SectionHeading
        eyebrow="Step 3"
        title="Choose your contractors"
        description="Ranked by verified data from completed projects in Kanton Zürich. One contractor per module."
        trailing={
          <Button variant="secondary" size="sm" onClick={pickAllRecommended}>
            <Sparkles size={14} />
            Use top-rated
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["Verified ratings only", "Price benchmarked", "On-budget tracked"].map((label) => (
          <Badge key={label} tone="teal" className="gap-1">
            <Check size={11} strokeWidth={3} />
            {label}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        {activeModules.map((mod) => {
          const contractors = CONTRACTORS[mod.id] ?? [];
          const isExpanded = expanded === mod.id;
          const chosen = selectedContractors[mod.id];
          return (
            <ModuleAccordion
              key={mod.id}
              mod={mod}
              contractors={contractors}
              chosen={chosen}
              expanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : mod.id)}
              onSelect={(c) => handleSelect(mod.id, c)}
            />
          );
        })}
      </div>

      {!allChosen && (
        <p className="mt-5 text-xs text-muted">
          {activeModules.length - Object.keys(selectedContractors).filter((k) => activeModules.some((m) => m.id === k)).length} modules still need a contractor.
        </p>
      )}

      <StepNav />
    </>
  );
};

interface AccordionProps {
  mod: Module;
  contractors: Contractor[];
  chosen: Contractor | undefined;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (c: Contractor) => void;
}

const ModuleAccordion = ({ mod, contractors, chosen, expanded, onToggle, onSelect }: AccordionProps) => {
  const Icon = moduleIcons[mod.iconKey] ?? moduleIcons.facade;
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className={clsx(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-canvas",
          chosen && "bg-teal/[0.03]",
        )}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-canvas text-ink/70">
            <Icon size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-navy">{mod.name}</div>
            {chosen ? (
              <div className="flex items-center gap-1 text-xs text-teal">
                <Check size={12} strokeWidth={3} />
                <span>
                  {chosen.name} · {formatCHF(chosen.price)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-warning">No contractor selected</div>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={clsx("text-muted transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas/40 px-4 py-4">
          <p className="mb-3 text-[11px] text-muted">
            {contractors.length} verified contractors · Data from{" "}
            {contractors.reduce((s, c) => s + c.projects, 0)}+ completed projects
          </p>
          <div className="space-y-2">
            {contractors.map((ct, i) => (
              <ContractorRow
                key={ct.name}
                contractor={ct}
                rank={i}
                module={mod}
                isChosen={chosen?.name === ct.name}
                onSelect={() => onSelect(ct)}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const badgeTone = (rank: number): "gold" | "emerald" | "info" =>
  rank === 0 ? "gold" : rank === 1 ? "emerald" : "info";

interface RowProps {
  contractor: Contractor;
  rank: number;
  module: Module;
  isChosen: boolean;
  onSelect: () => void;
}

const ContractorRow = ({ contractor: ct, rank, module, isChosen, onSelect }: RowProps) => (
  <Card
    className={clsx(
      "cursor-pointer p-4 transition-all",
      isChosen ? "border-teal bg-teal/[0.04]" : "hover:border-ink/20",
    )}
    hoverable={!isChosen}
    onClick={onSelect}
    role="button"
    aria-pressed={isChosen}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    }}
  >
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-navy">{ct.name}</span>
          <Badge tone="teal" className="gap-1">
            <ShieldCheck size={11} strokeWidth={2.5} />
            Verified
          </Badge>
          {ct.badge && <Badge tone={badgeTone(rank)}>{ct.badge}</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} />
            {ct.loc}
          </span>
          <span aria-hidden="true">·</span>
          <span>{ct.years} years in business</span>
          <span aria-hidden="true">·</span>
          <span>{ct.certs.join(", ")}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-serif text-lg font-bold text-navy">{formatCHF(ct.price)}</div>
        <div className={clsx("text-[11px]", ct.priceDelta <= 0 ? "text-emerald" : "text-warning")}>
          {ct.priceDelta <= 0 ? ct.priceDelta : `+${ct.priceDelta}`}% vs. market avg.
        </div>
      </div>
    </div>

    <div className="mb-3 flex items-center gap-2">
      <RatingStars rating={ct.rating} />
      <span className="text-[11px] text-muted">({ct.projects} verified projects)</span>
    </div>

    <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
      <StatBar value={ct.satisfaction} label="Customer satisfaction" tone="teal" />
      <StatBar value={ct.onTime} label="On-time delivery" tone="info" />
      <StatBar value={ct.onBudget} label="On-budget completion" tone="emerald" />
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted">Earliest start:</span>
        <span className="font-semibold text-navy">{ct.avail}</span>
      </div>
    </div>

    {isChosen && (
      <div className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal/10 px-3 py-1.5 text-[11px] font-semibold text-teal">
        <Check size={12} strokeWidth={3} />
        Selected for {module.name}
      </div>
    )}
  </Card>
);
