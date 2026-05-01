import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-navy text-white hover:scale-[1.03] hover:bg-navy active:scale-[0.97] disabled:bg-line disabled:text-muted disabled:hover:scale-100",
  secondary:
    "bg-white text-navy border border-line hover:border-navy/30 hover:bg-canvas active:scale-[0.98] disabled:border-line disabled:text-muted",
  ghost:
    "bg-transparent text-ink hover:bg-canvas active:scale-[0.98] disabled:text-muted",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[12px] gap-1.5 rounded-full",
  md: "h-10 px-5 text-[13px] gap-2 rounded-full",
  lg: "h-12 px-7 text-[14px] gap-2 rounded-full",
};

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    className={clsx(
      "inline-flex items-center justify-center font-semibold transition-all duration-150 ease-smooth select-none",
      "disabled:cursor-not-allowed",
      variantClass[variant],
      sizeClass[size],
      className,
    )}
  >
    {children}
  </button>
);
