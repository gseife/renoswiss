import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { computeTotals } from "@/lib/derived";
import { clsx } from "@/lib/clsx";

const ANALYZE_STEPS = [
  "Reading GWR building register",
  "Querying GEAK energy database",
  "Matching cantonal subsidy programs",
  "Comparing renovation benchmarks",
];
const STEP_DURATION = 420;

export const Landing = () => {
  useDocumentTitle();
  const navigate = useNavigate();
  const { address, setAddress, selectedModules, selectedContractors, reset } = useStore();
  const [draft, setDraft] = useState(address);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [showResume, setShowResume] = useState(true);

  const hasResume =
    showResume &&
    (selectedModules.length > 0 || Object.keys(selectedContractors).length > 0);

  useEffect(() => {
    if (!analyzing) return;
    if (analyzeStep >= ANALYZE_STEPS.length) {
      const t = window.setTimeout(() => navigate("/building"), 350);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setAnalyzeStep((s) => s + 1), STEP_DURATION);
    return () => window.clearTimeout(t);
  }, [analyzing, analyzeStep, navigate]);

  const start = () => {
    if (draft.trim()) setAddress(draft.trim());
    setAnalyzeStep(0);
    setAnalyzing(true);
  };

  if (analyzing) return <AnalyzingView step={analyzeStep} />;

  return (
    <div className="bg-white text-navy">
      <NavBar
        onStart={() =>
          document
            .getElementById("start")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />

      <Hero />

      <RenovationSequence onStart={start} />

      <StartSection draft={draft} setDraft={setDraft} onSubmit={start} />

      <HowItWorks />

      <BigStats />

      <ModuleGallery />

      <FinalCTA onSubmit={start} draft={draft} setDraft={setDraft} />

      <Footer />

      {hasResume && (
        <ResumePill
          onContinue={() => navigate("/summary")}
          onReset={() => {
            reset();
            setShowResume(false);
          }}
          onDismiss={() => setShowResume(false)}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Nav                                                                       */
/* -------------------------------------------------------------------------- */

const NavBar = ({ onStart }: { onStart: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-line/70"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6">
        <Logo size="sm" />
        <nav className="hidden items-center gap-7 text-[13px] text-ink/80 md:flex">
          <a href="#start" className="hover:text-navy">
            Start
          </a>
          <a href="#how" className="hover:text-navy">
            How it works
          </a>
          <a href="#numbers" className="hover:text-navy">
            Impact
          </a>
          <a href="#modules" className="hover:text-navy">
            Modules
          </a>
        </nav>
        <button
          onClick={onStart}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-navy px-3.5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          Analyze
          <ArrowRight size={13} />
        </button>
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/*  Hero — oversized type                                                     */
/* -------------------------------------------------------------------------- */

const Hero = () => {
  const eyebrowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (eyebrowRef.current) {
        eyebrowRef.current.style.opacity = String(Math.max(0, 1 - y / 320));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-surface to-canvas">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(14,102,85,0.10),transparent_70%)]" />
      <div className="mx-auto max-w-[1240px] px-6 pt-20 pb-28 text-center sm:pt-28 sm:pb-36">
        <div
          ref={eyebrowRef}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Renovate · 2026
        </div>

        <h1 className="font-serif text-[44px] font-bold leading-[0.98] tracking-[-0.02em] text-navy sm:text-[72px] lg:text-[104px]">
          Your home,
          <br />
          <span className="text-teal">reimagined.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-ink/75 sm:text-[19px]">
          One address. A complete renovation plan — analysis, modules, contractors,
          subsidies, financing.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4 text-[14px]">
          <a
            href="#start"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-6 font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Start free analysis
            <ArrowRight size={15} />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-1.5 font-semibold text-teal hover:underline"
          >
            See how it works
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  House SVG (modern Swiss EFH, ~30° gable, white render, grey shutters)     */
/*  Layered as separate <g> with ids so the scroll sequence can transform     */
/*  individual pieces in viewBox units.                                       */
/* -------------------------------------------------------------------------- */

interface HouseSVGProps {
  roofY?: number;
  roofOpacity?: number;
  solarY?: number;
  solarOpacity?: number;
  solarVisible?: boolean;
  facadeX?: number;
  facadeOpacity?: number;
  windowsY?: number;
  windowsScale?: number;
  heatpumpY?: number;
  heatpumpOpacity?: number;
  heatpumpUnderground?: boolean;
}

const HouseSVG = ({
  roofY = 0,
  roofOpacity = 1,
  solarY = 0,
  solarOpacity = 1,
  solarVisible = false,
  facadeX = 0,
  facadeOpacity = 1,
  windowsY = 0,
  windowsScale = 1,
  heatpumpY = 0,
  heatpumpOpacity = 1,
  heatpumpUnderground = false,
}: HouseSVGProps) => (
  <svg
    viewBox="-40 -120 880 720"
    className="absolute inset-0 h-full w-full"
    role="img"
    aria-label="Modern Swiss single-family house"
  >
    <defs>
      <linearGradient id="renderFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#eef0ee" />
      </linearGradient>
      <linearGradient id="renderSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eceeec" />
        <stop offset="1" stopColor="#d1d4d2" />
      </linearGradient>
      <linearGradient id="renderGable" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fafbfa" />
        <stop offset="1" stopColor="#dde0de" />
      </linearGradient>
      <linearGradient id="tileFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3d4a52" />
        <stop offset="1" stopColor="#1f2a30" />
      </linearGradient>
      <linearGradient id="tileSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2c373d" />
        <stop offset="1" stopColor="#161e22" />
      </linearGradient>
      <linearGradient id="plinth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5a5854" />
        <stop offset="1" stopColor="#3a3835" />
      </linearGradient>
      <linearGradient id="pvCell" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1a3a52" />
        <stop offset="1" stopColor="#08182a" />
      </linearGradient>
      <linearGradient id="pvHi" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dbe9e4" />
        <stop offset="1" stopColor="#5d8b81" />
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e6ebe2" />
        <stop offset="0.5" stopColor="#cdd5c8" />
        <stop offset="1" stopColor="#a4b09c" />
      </linearGradient>
      <linearGradient id="undergroundEarth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6b5942" />
        <stop offset="1" stopColor="#3a2e20" />
      </linearGradient>
      <pattern id="renderPat" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.4" fill="#000" opacity="0.05" />
        <circle cx="4" cy="3" r="0.3" fill="#000" opacity="0.04" />
        <circle cx="2" cy="5" r="0.35" fill="#000" opacity="0.05" />
      </pattern>
      <pattern id="seamPat" width="14" height="14" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="14" y2="0" stroke="#000" strokeWidth="0.3" opacity="0.08" />
        <line x1="0" y1="7" x2="14" y2="7" stroke="#000" strokeWidth="0.3" opacity="0.08" />
        <line x1="0" y1="0" x2="0" y2="14" stroke="#000" strokeWidth="0.3" opacity="0.06" />
      </pattern>
      <pattern id="tilePat" width="14" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="14" y2="0" stroke="#000" strokeWidth="0.4" opacity="0.22" />
        <line x1="7" y1="0" x2="7" y2="6" stroke="#000" strokeWidth="0.3" opacity="0.18" />
      </pattern>
      <pattern id="earthPat" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="2" r="0.4" fill="#fff" opacity="0.10" />
        <circle cx="4" cy="4" r="0.3" fill="#000" opacity="0.20" />
      </pattern>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <clipPath id="undergroundClip">
        <rect x="-40" y="500" width="880" height="220" />
      </clipPath>
    </defs>

    {heatpumpUnderground && (
      <g clipPath="url(#undergroundClip)">
        <rect x="-40" y="500" width="880" height="220" fill="url(#undergroundEarth)" />
        <rect x="-40" y="500" width="880" height="220" fill="url(#earthPat)" />
        <rect x="-40" y="540" width="880" height="2" fill="#000" opacity="0.12" />
        <rect x="-40" y="600" width="880" height="2" fill="#000" opacity="0.10" />
      </g>
    )}

    <rect x="-40" y="500" width="880" height="20" fill="url(#ground)" />
    <ellipse cx="400" cy="500" rx="320" ry="8" fill="#000" opacity="0.10" />

    <g id="plinth">
      <polygon
        points="180,490 400,520 620,490 620,470 400,500 180,470"
        fill="url(#plinth)"
      />
      <polygon
        points="180,490 400,520 620,490 620,470 400,500 180,470"
        fill="url(#seamPat)"
      />
    </g>

    <g id="facade" transform={`translate(${facadeX} 0)`} opacity={facadeOpacity}>
      <polygon points="180,470 400,500 400,300 180,260" fill="url(#renderFront)" />
      <polygon points="180,470 400,500 400,300 180,260" fill="url(#renderPat)" />
      <polygon points="400,500 620,470 620,260 400,300" fill="url(#renderSide)" />
      <polygon points="400,500 620,470 620,260 400,300" fill="url(#renderPat)" />
      <polygon points="180,260 400,300 290,235" fill="url(#renderGable)" />
      <polygon points="180,260 400,300 290,235" fill="url(#renderPat)" />
      <polygon
        points="400,300 620,260 510,225"
        fill="url(#renderSide)"
        opacity="0.95"
      />
      <polygon points="400,300 620,260 510,225" fill="url(#renderPat)" />
      <polygon points="180,260 400,300 400,304 180,264" fill="#000" opacity="0.10" />
      <polygon points="400,300 620,260 620,264 400,304" fill="#000" opacity="0.08" />
    </g>

    <g
      id="windows"
      transform={`translate(${facadeX} ${windowsY}) scale(${windowsScale}) translate(${(1 - windowsScale) * 400} ${(1 - windowsScale) * 380})`}
    >
      {[0, 1].flatMap((row) =>
        [0, 1].map((col) => {
          const x = 220 + col * 90;
          const y = 320 + row * 70 + col * 22;
          const off = row ? 5 : 0;
          return (
            <g key={`fw-${row}-${col}`}>
              <polygon
                points={`${x - 22},${y + off} ${x - 4},${y + 4 + off} ${x - 4},${y + 50 + off} ${x - 22},${y + 46 + off}`}
                fill="#7d8489"
              />
              <line
                x1={x - 19}
                y1={y + 8 + off}
                x2={x - 19}
                y2={y + 44 + off}
                stroke="#5e6469"
                strokeWidth="0.5"
              />
              <line
                x1={x - 13}
                y1={y + 10 + off}
                x2={x - 13}
                y2={y + 46 + off}
                stroke="#5e6469"
                strokeWidth="0.5"
              />
              <polygon
                points={`${x + 44},${y + 10 + off} ${x + 62},${y + 14 + off} ${x + 62},${y + 60 + off} ${x + 44},${y + 56 + off}`}
                fill="#7d8489"
              />
              <line
                x1={x + 47}
                y1={y + 18 + off}
                x2={x + 47}
                y2={y + 54 + off}
                stroke="#5e6469"
                strokeWidth="0.5"
              />
              <line
                x1={x + 53}
                y1={y + 20 + off}
                x2={x + 53}
                y2={y + 56 + off}
                stroke="#5e6469"
                strokeWidth="0.5"
              />
              <polygon
                points={`${x - 4},${y + 4 + off} ${x + 44},${y + 14 + off} ${x + 44},${y + 56 + off} ${x - 4},${y + 46 + off}`}
                fill="#ffffff"
                stroke="#9a9da0"
                strokeWidth="0.8"
              />
              <polygon
                points={`${x},${y + 8 + off} ${x + 40},${y + 18 + off} ${x + 40},${y + 50 + off} ${x},${y + 42 + off}`}
                fill="url(#glass)"
                opacity="0.85"
              />
              <line
                x1={x + 20}
                y1={y + 13 + off}
                x2={x + 20}
                y2={y + 46 + off}
                stroke="#ffffff"
                strokeWidth="1.1"
              />
              <line
                x1={x + 1}
                y1={y + 25 + off}
                x2={x + 39}
                y2={y + 34 + off}
                stroke="#ffffff"
                strokeWidth="0.9"
              />
              <polygon
                points={`${x - 6},${y + 46 + off} ${x + 46},${y + 56 + off} ${x + 46},${y + 60 + off} ${x - 6},${y + 50 + off}`}
                fill="#bfc4c8"
              />
            </g>
          );
        }),
      )}

      {[0, 1, 2].map((col) => {
        const x = 440 + col * 56;
        const y = 330 + col * -14;
        return (
          <g key={`sw-${col}`}>
            <polygon
              points={`${x - 2},${y} ${x + 38},${y - 10} ${x + 38},${y + 44} ${x - 2},${y + 54}`}
              fill="#ffffff"
              stroke="#9a9da0"
              strokeWidth="0.8"
            />
            <polygon
              points={`${x + 1},${y + 3} ${x + 35},${y - 7} ${x + 35},${y + 41} ${x + 1},${y + 51}`}
              fill="url(#glass)"
              opacity="0.85"
            />
            <line
              x1={x + 18}
              y1={y - 2}
              x2={x + 18}
              y2={y + 47}
              stroke="#ffffff"
              strokeWidth="1"
            />
            <polygon
              points={`${x - 4},${y + 50} ${x + 40},${y + 40} ${x + 40},${y + 44} ${x - 4},${y + 54}`}
              fill="#bfc4c8"
            />
          </g>
        );
      })}

      <g>
        <polygon points="396,495 444,485 444,420 396,430" fill="#3a3633" />
        <polygon points="400,490 440,482 440,424 400,433" fill="#52504c" />
        <line x1="420" y1="430" x2="420" y2="486" stroke="#2c2a28" strokeWidth="0.5" />
        <circle cx="437" cy="455" r="1.4" fill="#9a9da0" />
        <polygon points="394,430 446,420 446,424 394,434" fill="#000" opacity="0.25" />
      </g>
    </g>

    <g id="roof" transform={`translate(0 ${roofY})`} opacity={roofOpacity}>
      <polygon points="170,260 400,300 290,225" fill="url(#tileFront)" />
      <polygon points="170,260 400,300 290,225" fill="url(#tilePat)" />
      <polygon points="400,300 630,260 510,215" fill="url(#tileSide)" />
      <polygon points="400,300 630,260 510,215" fill="url(#tilePat)" />
      <line x1="290" y1="225" x2="510" y2="215" stroke="#0a1418" strokeWidth="2" />
      <polygon points="170,260 400,300 400,304 170,264" fill="#1a2226" />
      <polygon points="400,300 630,260 630,264 400,304" fill="#0d1316" />
      <g>
        <polygon points="430,232 458,228 458,200 430,204" fill="#3d4a52" />
        <polygon points="430,232 458,228 458,224 430,228" fill="#1f2a30" />
        <polygon points="427,202 461,198 463,202 429,206" fill="#bfc4c8" />
      </g>
    </g>

    {(solarVisible || solarOpacity > 0) && (
      <g id="solar" transform={`translate(0 ${solarY})`} opacity={solarOpacity}>
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2, 3].map((col) => {
            const baseX = 430 + col * 38 - row * 4;
            const baseY = 250 + row * 16 - col * 8;
            return (
              <g key={`pv-${row}-${col}`}>
                <polygon
                  points={`${baseX},${baseY} ${baseX + 34},${baseY - 9} ${baseX + 34},${baseY + 13} ${baseX},${baseY + 22}`}
                  fill="url(#pvCell)"
                />
                <polygon
                  points={`${baseX},${baseY} ${baseX + 34},${baseY - 9} ${baseX + 34},${baseY + 13} ${baseX},${baseY + 22}`}
                  fill="url(#pvHi)"
                />
                <line
                  x1={baseX + 11}
                  y1={baseY + 1}
                  x2={baseX + 11}
                  y2={baseY + 20}
                  stroke="#0a1f2e"
                  strokeWidth="0.4"
                  opacity="0.6"
                />
                <line
                  x1={baseX + 22}
                  y1={baseY - 2}
                  x2={baseX + 22}
                  y2={baseY + 17}
                  stroke="#0a1f2e"
                  strokeWidth="0.4"
                  opacity="0.6"
                />
                <line
                  x1={baseX + 1}
                  y1={baseY + 11}
                  x2={baseX + 33}
                  y2={baseY + 2}
                  stroke="#0a1f2e"
                  strokeWidth="0.4"
                  opacity="0.6"
                />
              </g>
            );
          }),
        )}
      </g>
    )}

    <g id="heatpump" transform={`translate(0 ${heatpumpY})`} opacity={heatpumpOpacity}>
      {heatpumpUnderground && (
        <g opacity={Math.min(1, heatpumpY / 80)}>
          <line
            x1="660"
            y1="490"
            x2="660"
            y2={490 + heatpumpY}
            stroke="#0E6655"
            strokeWidth="2"
            opacity="0.7"
          />
          <line
            x1="675"
            y1="490"
            x2="675"
            y2={490 + heatpumpY}
            stroke="#B8860B"
            strokeWidth="2"
            opacity="0.7"
          />
        </g>
      )}
      <polygon
        points="640,490 680,480 680,448 640,458"
        fill="#000"
        opacity="0.18"
        filter="url(#softShadow)"
      />
      <polygon points="635,485 675,475 675,445 635,455" fill="#dcdcd6" />
      <polygon points="635,485 675,475 675,478 635,488" fill="#9a9a92" />
      <circle cx="655" cy="466" r="11" fill="#2a2a25" />
      <circle cx="655" cy="466" r="9" fill="none" stroke="#5a5a52" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1="655"
          y1="466"
          x2={655 + Math.cos((i * Math.PI) / 3) * 8}
          y2={466 + Math.sin((i * Math.PI) / 3) * 8}
          stroke="#5a5a52"
          strokeWidth="1"
        />
      ))}
      <circle cx="655" cy="466" r="2" fill="#5a5a52" />
      <rect x="638" y="450" width="14" height="2" fill="#0E6655" opacity="0.7" />
    </g>
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Renovation scroll sequence — pinned, 7 stages                             */
/* -------------------------------------------------------------------------- */

interface RenoStage {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  tone: "teal" | "emerald" | "gold" | "navy";
  stats?: { k: string; v: string }[];
  isCTA?: boolean;
}

const RENO_STAGES: RenoStage[] = [
  {
    id: "intro",
    eyebrow: "Renovation, piece by piece",
    title: "Five upgrades. One coordinated plan.",
    body: "Watch how each part of your home becomes more efficient. Scroll to begin.",
    tone: "navy",
  },
  {
    id: "roof",
    eyebrow: "01 · Roof",
    title: "Insulated from above.",
    body:
      "About a quarter of all heat loss goes through an uninsulated roof. We model 24 cm of mineral wool with a new membrane and re-laid tiles.",
    tone: "teal",
    stats: [
      { k: "Cost", v: "CHF 32,000" },
      { k: "Energy", v: "−1,900 kWh" },
      { k: "CO₂", v: "−1.2 t/yr" },
    ],
  },
  {
    id: "solar",
    eyebrow: "02 · Solar PV",
    title: "Sun on the south slope.",
    body:
      "21 panels, 8.4 kWp, with a 10 kWh battery. About 8,800 kWh per year — most of it consumed on-site.",
    tone: "gold",
    stats: [
      { k: "Cost", v: "CHF 26,000" },
      { k: "Generates", v: "8,800 kWh" },
      { k: "Self-use", v: "≈ 65%" },
    ],
  },
  {
    id: "facade",
    eyebrow: "03 · Facade",
    title: "Wrapped in insulation.",
    body:
      "External thermal insulation composite system — 20 cm mineral wool, finished in silicate render. The single biggest source of savings.",
    tone: "emerald",
    stats: [
      { k: "Cost", v: "CHF 48,000" },
      { k: "Energy", v: "−2,800 kWh" },
      { k: "CO₂", v: "−1.8 t/yr" },
    ],
  },
  {
    id: "windows",
    eyebrow: "04 · Windows",
    title: "Triple-glazed, warm-edge.",
    body:
      "14 windows replaced with triple-pane units, U-value 0.7. Two insulated entrance doors included. Comfort improvement is immediate.",
    tone: "teal",
    stats: [
      { k: "Cost", v: "CHF 28,000" },
      { k: "Energy", v: "−800 kWh" },
      { k: "Comfort", v: "+++" },
    ],
  },
  {
    id: "heatpump",
    eyebrow: "05 · Heat pump",
    title: "From oil to ground.",
    body:
      "The 24-year oil boiler comes out. A 12 kW air–water unit takes its place — or a brine probe drilled into the ground for higher efficiency.",
    tone: "navy",
    stats: [
      { k: "Cost", v: "CHF 38,000" },
      { k: "CO₂", v: "−2.8 t/yr" },
      { k: "COP", v: "≈ 4.2" },
    ],
  },
  {
    id: "cta",
    eyebrow: "Your home",
    title: "Get the full report.",
    body:
      "Address-specific calculations, contractor matches, subsidy paperwork. Free, no commitment.",
    tone: "navy",
    isCTA: true,
  },
];

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const RenovationSequence = ({ onStart }: { onStart: () => void }) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), total);
      const t = total > 0 ? passed / total : 0;
      setProgress(t * (RENO_STAGES.length - 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const seg = (from: number, to: number) => {
    if (progress <= from) return 0;
    if (progress >= to) return 1;
    return easeInOut((progress - from) / (to - from));
  };

  const roofLift = seg(0, 1);
  const roofReturn = seg(5.4, 6);
  const roofY = lerp(0, -180, roofLift) * (1 - roofReturn);

  const solarFly = seg(1, 2);
  const solarY = lerp(-160, 0, solarFly);
  const solarOpacity = solarFly * (1 - roofReturn * 0.3);
  const solarVisible = solarFly > 0.01;

  const facadeSlide = seg(2, 3);
  const facadeReturn = seg(5.4, 6);
  const facadeX = lerp(0, -240, facadeSlide) * (1 - facadeReturn);

  const windowsLift = seg(3, 4);
  const windowsReturn = seg(5.4, 6);
  const windowsY =
    lerp(0, -90, windowsLift) * (1 - windowsReturn) +
    lerp(0, -240, facadeSlide) * (1 - facadeReturn);
  const windowsScale = lerp(1, 1.08, windowsLift * (1 - windowsReturn));

  const heatpumpDown = seg(4, 5);
  const heatpumpReturn = seg(5.4, 6);
  const heatpumpY = lerp(0, 130, heatpumpDown) * (1 - heatpumpReturn);
  const heatpumpUnderground = heatpumpDown > 0.05 && heatpumpReturn < 0.95;

  const activeIdx = Math.min(
    RENO_STAGES.length - 1,
    Math.max(0, Math.round(progress)),
  );
  const stage = RENO_STAGES[activeIdx];

  const totalH = `${RENO_STAGES.length * 100}vh`;

  return (
    <section ref={sectionRef} className="relative bg-canvas" style={{ height: totalH }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #f7faf8 0%, #eef2ee 60%, #d9e0d8 100%)",
          }}
        />

        <div className="relative mx-auto grid h-full max-w-[1400px] items-center gap-6 px-6 lg:grid-cols-12 lg:gap-10">
          <div className="relative h-[60vh] lg:col-span-7 lg:h-[80vh]">
            <HouseSVG
              roofY={roofY}
              solarY={solarY}
              solarOpacity={solarOpacity}
              solarVisible={solarVisible}
              facadeX={facadeX}
              windowsY={windowsY}
              windowsScale={windowsScale}
              heatpumpY={heatpumpY}
              heatpumpUnderground={heatpumpUnderground}
            />

            <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
              {RENO_STAGES.map((s, i) => (
                <span
                  key={s.id}
                  className={clsx(
                    "h-1.5 rounded-full transition-all",
                    i === activeIdx ? "w-6 bg-navy" : "w-1.5 bg-navy/25",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <StageCard stage={stage} onStart={onStart} />
          </div>
        </div>

        {activeIdx === 0 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted">
            <span>Scroll</span>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
              <path
                d="M5 1 L5 12 M1 8 L5 12 L9 8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </section>
  );
};

const StageCard = ({
  stage,
  onStart,
}: {
  stage: RenoStage;
  onStart: () => void;
}) => {
  const accent = {
    teal: "text-teal",
    emerald: "text-emerald",
    gold: "text-gold",
    navy: "text-navy",
  }[stage.tone];
  const accentBg = {
    teal: "bg-teal/10",
    emerald: "bg-emerald/10",
    gold: "bg-gold/10",
    navy: "bg-navy/[0.08]",
  }[stage.tone];
  const accentDot = {
    teal: "bg-teal",
    emerald: "bg-emerald",
    gold: "bg-gold",
    navy: "bg-navy",
  }[stage.tone];

  return (
    <div key={stage.id} className="relative" data-anim="float-in">
      <div className="rounded-2xl border border-line bg-white/90 p-7 shadow-card backdrop-blur-xl sm:p-9">
        <div className="flex items-center gap-2">
          <span className={clsx("h-1.5 w-1.5 rounded-full", accentDot)} />
          <span
            className={clsx(
              "text-[10px] font-semibold uppercase tracking-[0.22em]",
              accent,
            )}
          >
            {stage.eyebrow}
          </span>
        </div>
        <h2 className="mt-5 font-serif text-[34px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[44px]">
          {stage.title}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/75 sm:text-[16px]">
          {stage.body}
        </p>

        {stage.stats && (
          <div className="mt-6 grid grid-cols-3 gap-2">
            {stage.stats.map((s) => (
              <div
                key={s.k}
                className={clsx("rounded-xl px-3 py-3 text-center", accentBg)}
              >
                <div
                  className={clsx(
                    "font-serif text-[16px] font-bold leading-tight",
                    accent,
                  )}
                >
                  {s.v}
                </div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        )}

        {stage.isCTA && (
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onStart}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-navy px-7 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Get your full report
              <ArrowRight size={15} />
            </button>
            <span className="text-[12px] text-muted">
              Free · 2 minutes · No commitment
            </span>
          </div>
        )}

        <style>{`
          @keyframes float-in {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          [data-anim="float-in"] {
            animation: float-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
          }
        `}</style>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Start — address input + sample preview                                    */
/* -------------------------------------------------------------------------- */

const StartSection = ({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
}) => (
  <Reveal>
    <section id="start" className="bg-white py-28 sm:py-36">
      <div className="mx-auto grid max-w-[1240px] gap-16 px-6 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6">
          <Eyebrow>One field. Two minutes.</Eyebrow>
          <h2 className="mt-4 font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[60px]">
            Start with an address.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink/75">
            We pull from the GWR register, GEAK database and cantonal subsidy programs
            — then return a complete renovation plan tailored to your home.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="mt-9 max-w-md"
          >
            <div className="group relative flex h-14 items-center rounded-full border border-line bg-surface pl-5 pr-1.5 transition-all focus-within:border-teal focus-within:bg-white focus-within:shadow-card">
              <Building2 size={17} className="text-muted" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Musterstrasse 42, 8001 Zürich"
                className="ml-3 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-navy px-5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                Analyze
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="mt-3 pl-2 text-[12px] text-muted">
              Free · No obligations · No account
            </p>
          </form>
        </div>

        <div className="lg:col-span-6">
          <SampleReport />
        </div>
      </div>
    </section>
  </Reveal>
);

const SampleReport = () => (
  <div className="relative">
    <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-teal/15 via-mint/20 to-gold/20 blur-3xl" />
    <div className="relative overflow-hidden rounded-[24px] border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line/70 bg-surface/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Live sample · Zürich
          </span>
        </div>
        <span className="text-[11px] text-muted">renoswiss.ch/r/8001</span>
      </div>

      <div className="p-7">
        <div className="font-serif text-[22px] font-bold leading-tight text-navy">
          Musterstrasse 42
        </div>
        <div className="mt-1 text-[13px] text-muted">
          1972 · Einfamilienhaus · 185 m²
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <BigKPI value="F → B" label="GEAK" tone="teal" />
          <BigKPI value="−7.0 t" label="CO₂ / yr" tone="emerald" />
          <BigKPI value="9,800" label="CHF saved / yr" tone="gold" />
        </div>

        <div className="mt-6 space-y-2">
          {[
            { name: "Facade insulation", price: "CHF 47,200", tone: "bg-teal" },
            { name: "Air–water heat pump", price: "CHF 36,500", tone: "bg-emerald" },
            { name: "Solar PV · 8.4 kWp", price: "CHF 25,200", tone: "bg-gold" },
          ].map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-xl border border-line/70 bg-white px-4 py-3 text-[13px]"
            >
              <div className="flex items-center gap-2.5">
                <span className={clsx("h-2 w-2 rounded-full", m.tone)} />
                <span className="font-semibold text-navy">{m.name}</span>
              </div>
              <span className="font-semibold text-ink">{m.price}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-navy px-4 py-3.5 text-[13px] text-white">
          <span className="text-mint">Subsidies identified</span>
          <span className="font-serif text-[18px] font-bold text-gold-soft">
            CHF 37,600
          </span>
        </div>
      </div>
    </div>
  </div>
);

const BigKPI = ({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "teal" | "emerald" | "gold";
}) => {
  const cls: Record<string, string> = {
    teal: "bg-teal/[0.08] text-teal",
    emerald: "bg-emerald/[0.08] text-emerald",
    gold: "bg-gold/[0.08] text-gold",
  };
  return (
    <div className={clsx("rounded-xl px-3 py-4 text-center", cls[tone])}>
      <div className="font-serif text-[20px] font-bold leading-tight">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider opacity-80">
        {label}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  How it works — dark section                                               */
/* -------------------------------------------------------------------------- */

const HowItWorks = () => (
  <section id="how" className="relative overflow-hidden bg-navy py-28 text-white sm:py-36">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_20%,rgba(14,102,85,0.45),transparent_70%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_15%_80%,rgba(184,134,11,0.18),transparent_70%)]" />

    <div className="relative mx-auto max-w-[1240px] px-6">
      <Reveal>
        <Eyebrow tone="mint">From address to action</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] sm:text-[64px]">
          Four steps. <span className="text-mint">No spreadsheets.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            n: "01",
            t: "Analyze",
            d: "GWR + GEAK data tells us your building's age, envelope and energy class.",
          },
          {
            n: "02",
            t: "Plan",
            d: "Pick the modules that matter. We size each one to your house.",
          },
          {
            n: "03",
            t: "Match",
            d: "Verified Swiss contractors with real prices, ratings, lead times.",
          },
          {
            n: "04",
            t: "Fund",
            d: "Subsidies stacked, financing modeled, monthly cost calculated.",
          },
        ].map((s, i) => (
          <Reveal key={s.n} delay={i * 80}>
            <div className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:bg-white/[0.06]">
              <div className="font-serif text-[40px] font-bold text-mint/80">{s.n}</div>
              <div className="mt-6 font-serif text-[22px] font-bold">{s.t}</div>
              <div className="mt-2 text-[14px] leading-relaxed text-white/65">{s.d}</div>
              <div className="mt-auto pt-6 text-[12px] font-semibold uppercase tracking-wider text-mint/80 opacity-0 transition-opacity group-hover:opacity-100">
                {i < 3 ? "Continue →" : "Done"}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/*  Big stats                                                                 */
/* -------------------------------------------------------------------------- */

const BigStats = () => (
  <section id="numbers" className="bg-white py-28 sm:py-36">
    <div className="mx-auto max-w-[1240px] px-6">
      <Reveal>
        <Eyebrow>The numbers</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[64px]">
          Built on <span className="text-teal">real Swiss data.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
        {[
          { v: "1,847", l: "Buildings analyzed", sub: "across 21 cantons" },
          { v: "CHF 42M", l: "Subsidies captured", sub: "for our customers" },
          { v: "4.7★", l: "Avg. satisfaction", sub: "on 1,200+ reviews" },
        ].map((s, i) => (
          <Reveal key={s.l} delay={i * 100}>
            <div className="bg-white p-10 sm:p-14">
              <div className="font-serif text-[56px] font-bold leading-none tracking-[-0.02em] text-navy sm:text-[80px]">
                {s.v}
              </div>
              <div className="mt-5 text-[14px] font-semibold text-navy">{s.l}</div>
              <div className="text-[13px] text-muted">{s.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/*  Module gallery                                                            */
/* -------------------------------------------------------------------------- */

const moduleCards = [
  {
    id: "facade",
    name: "Facade",
    desc: "ETICS · 20 cm mineral wool",
    chip: "−35% heat loss",
    art: "facade",
  },
  {
    id: "heating",
    name: "Heat pump",
    desc: "Air–water · 12 kW",
    chip: "−2.8 t CO₂",
    art: "heat",
  },
  {
    id: "solar",
    name: "Solar",
    desc: "8.4 kWp · 10 kWh battery",
    chip: "2,100 kWh / yr",
    art: "solar",
  },
  {
    id: "windows",
    name: "Windows",
    desc: "Triple-glazed · thermal break",
    chip: "U = 0.7",
    art: "windows",
  },
] as const;

const ModuleGallery = () => (
  <section id="modules" className="bg-canvas py-28 sm:py-36">
    <div className="mx-auto max-w-[1240px] px-6">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Modules</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[60px]">
              Pick what to renovate.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] text-ink/70">
            Each module is sized to your specific building. Mix, match, see the
            financial impact instantly.
          </p>
        </div>
      </Reveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {moduleCards.map((m, i) => (
          <Reveal key={m.id} delay={i * 80}>
            <ModuleCard {...m} />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const ModuleCard = ({
  name,
  desc,
  chip,
  art,
}: {
  name: string;
  desc: string;
  chip: string;
  art: "facade" | "heat" | "solar" | "windows";
}) => (
  <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface to-canvas">
      <ModuleArt kind={art} />
      <span className="absolute left-4 top-4 rounded-full border border-line bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal backdrop-blur">
        {chip}
      </span>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <div className="font-serif text-[20px] font-bold text-navy">{name}</div>
      <div className="mt-1 text-[13px] text-muted">{desc}</div>
      <div className="mt-auto pt-4 text-[12px] font-semibold uppercase tracking-wider text-teal opacity-0 transition-opacity group-hover:opacity-100">
        Explore →
      </div>
    </div>
  </div>
);

const ModuleArt = ({ kind }: { kind: "facade" | "heat" | "solar" | "windows" }) => {
  if (kind === "facade") {
    return (
      <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={20 + col * 32}
              y={20 + row * 28}
              width={28}
              height={24}
              rx={3}
              fill={(row + col) % 2 ? "#EDF2EF" : "#fff"}
              stroke="#D6DDD9"
              strokeWidth={1}
            />
          )),
        )}
        <rect x={0} y={130} width={200} height={20} fill="#0E6655" opacity="0.15" />
      </svg>
    );
  }
  if (kind === "heat") {
    return (
      <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full">
        <rect x="60" y="40" width="80" height="70" rx="6" fill="#fff" stroke="#D6DDD9" />
        <circle cx="100" cy="75" r="22" fill="none" stroke="#0E6655" strokeWidth="2" />
        <circle cx="100" cy="75" r="14" fill="none" stroke="#0E6655" strokeWidth="2" />
        <circle cx="100" cy="75" r="6" fill="#0E6655" />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${70 + i * 22} 130 q 6 -8 12 0 t 12 0`}
            stroke="#A8D8C8"
            strokeWidth="1.5"
            fill="none"
            opacity={0.8 - i * 0.2}
          />
        ))}
      </svg>
    );
  }
  if (kind === "solar") {
    return (
      <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full">
        <circle cx="155" cy="35" r="14" fill="#B8860B" opacity="0.2" />
        <circle cx="155" cy="35" r="8" fill="#B8860B" />
        <g transform="translate(20,55) skewY(-8)">
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 38}
                y={row * 22}
                width={34}
                height={18}
                rx={2}
                fill="#0E6655"
                opacity={0.65 + ((row + col) % 2) * 0.2}
              />
            )),
          )}
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full">
      {[0, 1].map((col) => (
        <g key={col}>
          <rect
            x={30 + col * 80}
            y={25}
            width={60}
            height={100}
            rx={4}
            fill="#A8D8C8"
            opacity="0.5"
          />
          <rect
            x={30 + col * 80}
            y={25}
            width={60}
            height={100}
            rx={4}
            fill="none"
            stroke="#0F2B3C"
            strokeWidth={2}
          />
          <line
            x1={60 + col * 80}
            y1={25}
            x2={60 + col * 80}
            y2={125}
            stroke="#0F2B3C"
            strokeWidth={1.5}
          />
          <line
            x1={30 + col * 80}
            y1={75}
            x2={90 + col * 80}
            y2={75}
            stroke="#0F2B3C"
            strokeWidth={1.5}
          />
        </g>
      ))}
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/*  Final CTA                                                                 */
/* -------------------------------------------------------------------------- */

const FinalCTA = ({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
}) => (
  <section className="relative overflow-hidden bg-navy py-28 text-white sm:py-36">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(14,102,85,0.4),transparent_75%)]" />
    <div className="relative mx-auto max-w-[1040px] px-6 text-center">
      <Reveal>
        <h2 className="font-serif text-[44px] font-bold leading-[0.98] tracking-[-0.02em] sm:text-[88px]">
          Ready to <span className="text-mint">begin?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-[17px] text-white/70">
          Two minutes. One address. The plan your home has been waiting for.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="mx-auto mt-10 flex h-14 max-w-md items-center rounded-full border border-white/15 bg-white/5 pl-5 pr-1.5 backdrop-blur transition-colors focus-within:border-mint/60"
        >
          <Building2 size={17} className="text-white/50" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your address"
            className="ml-3 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-navy transition-transform hover:scale-[1.03]"
          >
            Analyze
            <ArrowRight size={14} />
          </button>
        </form>
      </Reveal>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

const Footer = () => (
  <footer className="border-t border-line bg-white py-10">
    <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-4 px-6 text-[12px] text-muted sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <span className="text-muted/70">· Demo prototype</span>
      </div>
      <div className="flex flex-wrap gap-6">
        <a href="#start" className="hover:text-navy">
          Start
        </a>
        <a href="#how" className="hover:text-navy">
          How it works
        </a>
        <a href="#numbers" className="hover:text-navy">
          Impact
        </a>
        <a href="#modules" className="hover:text-navy">
          Modules
        </a>
      </div>
      <span>© 2026 RenoSwiss</span>
    </div>
  </footer>
);

/* -------------------------------------------------------------------------- */
/*  Resume pill — floating, dismissable                                       */
/* -------------------------------------------------------------------------- */

const ResumePill = ({
  onContinue,
  onReset,
  onDismiss,
}: {
  onContinue: () => void;
  onReset: () => void;
  onDismiss: () => void;
}) => {
  const { selectedModules, selectedContractors } = useStore();
  const totals = computeTotals(selectedModules, selectedContractors);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[340px] items-center gap-3 rounded-2xl border border-line bg-white/90 p-3 pl-4 shadow-card backdrop-blur-xl">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-navy">Welcome back</div>
        <div className="truncate text-[11px] text-muted">
          {selectedModules.length} module{selectedModules.length === 1 ? "" : "s"} ·{" "}
          {totals.geakImprovement}
        </div>
      </div>
      <button
        onClick={onContinue}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-navy px-3 text-[11px] font-semibold text-white"
      >
        Continue
        <ArrowRight size={11} />
      </button>
      <button
        onClick={onReset}
        title="Start over"
        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-navy"
      >
        <RotateCcw size={13} />
      </button>
      <button
        onClick={onDismiss}
        title="Dismiss"
        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-navy"
      >
        <X size={13} />
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Reveal — IntersectionObserver fade-up                                     */
/* -------------------------------------------------------------------------- */

const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={clsx(
        "transition-all duration-700 ease-smooth",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Eyebrow                                                                   */
/* -------------------------------------------------------------------------- */

const Eyebrow = ({
  children,
  tone = "teal",
}: {
  children: React.ReactNode;
  tone?: "teal" | "mint" | "gold";
}) => {
  const cls: Record<string, string> = {
    teal: "text-teal",
    mint: "text-mint",
    gold: "text-gold",
  };
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em]",
        cls[tone],
      )}
    >
      <span className="h-px w-6 bg-current opacity-50" />
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Analyzing view                                                            */
/* -------------------------------------------------------------------------- */

const AnalyzingView = ({ step }: { step: number }) => (
  <div className="flex min-h-screen items-center justify-center bg-white px-6">
    <div className="w-full max-w-md text-center">
      <Logo size="lg" />
      <h2 className="mt-10 font-serif text-[28px] font-bold tracking-[-0.01em] text-navy">
        Reading your building…
      </h2>
      <p className="mt-2 text-[14px] text-muted">
        Cross-referencing official Swiss data sources.
      </p>

      <ol className="mt-10 space-y-2 text-left">
        {ANALYZE_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              className={clsx(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
                done && "border-emerald/30 bg-emerald/5",
                current && "border-teal/30 bg-teal/5",
                !done && !current && "border-line bg-white opacity-50",
              )}
            >
              <span
                className={clsx(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  done && "bg-emerald text-white",
                  current && "bg-teal text-white",
                  !done && !current && "bg-line text-muted",
                )}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} />
                ) : current ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </span>
              <span
                className={clsx(
                  "text-sm",
                  done && "text-emerald",
                  current && "font-semibold text-navy",
                  !done && !current && "text-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  </div>
);
