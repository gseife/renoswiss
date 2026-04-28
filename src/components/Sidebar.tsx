import { NavLink } from "react-router-dom";
import { Check, RotateCcw } from "lucide-react";
import { Logo } from "./Logo";
import { STEPS } from "@/data/steps";
import { useStore } from "@/lib/store";
import { clsx } from "@/lib/clsx";

interface SidebarProps {
  currentIndex: number;
}

export const Sidebar = ({ currentIndex }: SidebarProps) => {
  const { reset } = useStore();
  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-white px-5 py-6 lg:flex lg:sticky lg:top-0">
      <div className="mb-8">
        <Logo size="md" />
        <p className="mt-2 text-xs text-muted">Home renovation, simplified.</p>
      </div>

      <nav className="flex-1">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Your renovation plan
        </div>
        <ol className="space-y-0.5">
          {STEPS.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={s.path}>
                <NavLink
                  to={s.path}
                  className={({ isActive }) =>
                    clsx(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-teal/10 text-teal"
                        : "text-ink hover:bg-canvas",
                    )
                  }
                >
                  <span
                    className={clsx(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                      active && "bg-teal text-white",
                      done && "bg-emerald text-white",
                      !active && !done && "bg-line text-muted group-hover:bg-canvas",
                    )}
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className={clsx("truncate font-semibold", active && "text-teal")}>
                      {s.label}
                    </div>
                    <div className="truncate text-[11px] text-muted">{s.description}</div>
                  </div>
                </NavLink>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="border-t border-line pt-4">
        <button
          onClick={() => {
            if (window.confirm("Reset your renovation plan? This cannot be undone.")) reset();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <RotateCcw size={14} />
          Reset demo
        </button>
        <p className="mt-3 px-3 text-[10px] leading-relaxed text-muted">
          Demo prototype · Data is illustrative · Saved locally in your browser
        </p>
      </div>
    </aside>
  );
};
