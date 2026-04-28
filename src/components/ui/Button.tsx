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
    "bg-teal text-white hover:bg-teal-dark active:scale-[0.98] disabled:bg-line disabled:text-muted",
  secondary:
    "bg-white text-teal border border-teal hover:bg-teal/5 active:scale-[0.98] disabled:border-line disabled:text-muted",
  ghost:
    "bg-transparent text-ink hover:bg-canvas active:scale-[0.98] disabled:text-muted",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-sm gap-2 rounded-lg",
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
