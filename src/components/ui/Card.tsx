import { type ReactNode, type HTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  highlight?: boolean;
  hoverable?: boolean;
  children: ReactNode;
}

export const Card = ({
  highlight,
  hoverable,
  className,
  children,
  ...rest
}: CardProps) => (
  <div
    {...rest}
    className={clsx(
      "rounded-xl border bg-white shadow-soft transition-all duration-200 ease-smooth",
      highlight ? "border-teal shadow-ring" : "border-line",
      hoverable && "hover:-translate-y-0.5 hover:shadow-card",
      className,
    )}
  >
    {children}
  </div>
);
