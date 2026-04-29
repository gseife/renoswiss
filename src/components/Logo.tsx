import type { MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modifier-clicks fall through (cmd/ctrl-click → new tab, shift → new
    // window, middle-click etc.) so the logo behaves like any normal link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;

    if (location.pathname === "/") {
      // Already on the home page — don't reload, just scroll to top.
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Navigating cross-route. SPA navigation preserves scrollY by default,
      // so explicitly land the user at the top of the home page.
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    }
  };

  return (
    <Link
      to="/"
      onClick={handleClick}
      aria-label="RenoSwiss — back to home"
      className="group inline-flex items-center gap-2.5 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
    >
      <div
        className={clsx(
          "relative flex items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-[0.97]",
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
    </Link>
  );
};
