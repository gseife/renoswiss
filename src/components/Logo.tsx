import { clsx } from "@/lib/clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

const sizes = {
  sm: { mark: "h-7 w-7 text-xs", text: "text-sm" },
  md: { mark: "h-9 w-9 text-base", text: "text-base" },
  lg: { mark: "h-12 w-12 text-xl", text: "text-xl" },
};

export const Logo = ({ size = "md", inverted = false }: LogoProps) => {
  const s = sizes[size];
  return (
    <div className="inline-flex items-center gap-2.5" aria-label="RenoSwiss home">
      <div
        className={clsx(
          "flex items-center justify-center rounded-lg font-serif font-bold",
          s.mark,
          inverted ? "bg-white text-teal" : "bg-teal text-white",
        )}
      >
        R
      </div>
      <span
        className={clsx(
          "font-serif font-bold tracking-wide",
          s.text,
          inverted ? "text-white" : "text-navy",
        )}
      >
        RenoSwiss
      </span>
    </div>
  );
};
