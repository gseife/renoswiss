import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Check, Info, AlertTriangle, X } from "lucide-react";
import { clsx } from "./clsx";

type ToastTone = "success" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContext {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContext | null>(null);

let nextId = 1;
const TOAST_DURATION = 2400;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const toneStyles: Record<ToastTone, { bg: string; icon: typeof Check }> = {
  success: { bg: "bg-emerald", icon: Check },
  info: { bg: "bg-info", icon: Info },
  warning: { bg: "bg-warning", icon: AlertTriangle },
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
  const [exiting, setExiting] = useState(false);
  const Icon = toneStyles[toast.tone].icon;

  useEffect(() => {
    const t1 = window.setTimeout(() => setExiting(true), TOAST_DURATION);
    const t2 = window.setTimeout(onDismiss, TOAST_DURATION + 200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-card",
        "transition-all duration-200 ease-smooth",
        exiting ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <span
        className={clsx(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-white",
          toneStyles[toast.tone].bg,
        )}
      >
        <Icon size={14} strokeWidth={3} />
      </span>
      <span className="flex-1 text-sm text-ink">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-canvas hover:text-ink"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const useToast = (): ToastContext["toast"] => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
};
