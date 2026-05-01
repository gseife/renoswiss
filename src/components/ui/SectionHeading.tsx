import { type ReactNode } from "react";

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  trailing?: ReactNode;
}

export const SectionHeading = ({
  title,
  description,
  eyebrow,
  trailing,
}: SectionHeadingProps) => (
  <div className="mb-7 flex items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && (
        <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-teal">
          <span className="h-px w-6 bg-current opacity-50" />
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-[32px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[40px]">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink/70 sm:text-[15px]">
          {description}
        </p>
      )}
    </div>
    {trailing && <div className="shrink-0">{trailing}</div>}
  </div>
);
