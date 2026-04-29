import { clsx } from "@/lib/clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

const sizes = {
  sm: { mark: "h-7 w-7", svg: 18, text: "text-[15px]" },
  md: { mark: "h-9 w-9", svg: 22, text: "text-[17px]" },
  lg: { mark: "h-12 w-12", svg: 30, text: "text-[22px]" },
};

export const Logo = ({ size = "md", inverted = false }: LogoProps) => {
  const s = sizes[size];
  return (
    <div className="inline-flex items-center gap-2.5" aria-label="RenoSwiss home">
      <div
        className={clsx(
          "relative flex items-center justify-center rounded-[10px]",
          s.mark,
          inverted ? "bg-white" : "bg-teal",
        )}
      >
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {/* house silhouette */}
          <path
            d="M4 11 L12 5 L20 11 L20 19 L4 19 Z"
            fill={inverted ? "#0E6655" : "#ffffff"}
          />
          {/* roof line */}
          <path
            d="M3 11.6 L12 4.4 L21 11.6"
            stroke={inverted ? "#0E6655" : "#ffffff"}
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          {/* doorway with swiss cross */}
          <rect
            x="10"
            y="13"
            width="4"
            height="6"
            fill={inverted ? "#ffffff" : "#0E6655"}
          />
          <rect x="11.55" y="14.4" width="0.9" height="3.2" fill="#B8860B" />
          <rect x="10.6" y="15.55" width="2.8" height="0.9" fill="#B8860B" />
        </svg>
      </div>
      <span className={clsx("font-serif font-bold tracking-tight", s.text)}>
        <span className={inverted ? "text-white" : "text-navy"}>Reno</span>
        <span className={inverted ? "text-mint" : "text-teal"}>Swiss</span>
      </span>
    </div>
  );
};
