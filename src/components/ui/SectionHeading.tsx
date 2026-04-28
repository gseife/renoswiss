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
  <div className="mb-5 flex items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && (
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-teal">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-2xl font-bold leading-tight text-navy">{title}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
      )}
    </div>
    {trailing && <div className="shrink-0">{trailing}</div>}
  </div>
);
