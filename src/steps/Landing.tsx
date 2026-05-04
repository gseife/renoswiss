import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  RotateCcw,
  Star,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useScaledModules } from "@/lib/useScaledModules";
import { useSubsidies } from "@/lib/useSubsidies";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { computeTotals } from "@/lib/derived";
import { clsx } from "@/lib/clsx";

export const Landing = () => {
  useDocumentTitle();
  const navigate = useNavigate();
  const { address, setAddress, selectedModules, selectedContractors, reset } = useStore();
  const [draft, setDraft] = useState(address);
  const [showResume, setShowResume] = useState(true);

  const hasResume =
    showResume &&
    (selectedModules.length > 0 || Object.keys(selectedContractors).length > 0);

  const startAnalysis = () => {
    const value = draft.trim();
    if (value) setAddress(value);
    navigate("/start", { state: { autoStart: !!value } });
  };

  return (
    <div className="bg-white text-navy">
      <NavBar onAnalyze={() => navigate("/start")} onHow={() => navigate("/how")} />

      <Hero onAnalyze={() => navigate("/start")} onHow={() => navigate("/how")} />

      <RenovationSequence onStart={startAnalysis} />

      <StartSection draft={draft} setDraft={setDraft} onSubmit={startAnalysis} />

      <HowItWorksStrip />

      <BigStats />

      <ModuleGallery />

      <FinalCTA onSubmit={startAnalysis} draft={draft} setDraft={setDraft} />

      <Footer />

      {hasResume && (
        <ResumePill
          onContinue={() => {
            // Land the user on the earliest incomplete step instead of dumping
            // them on /summary unconditionally.
            const missingContractor = selectedModules.some(
              (m) => !selectedContractors[m],
            );
            if (selectedModules.length === 0) navigate("/plan");
            else if (missingContractor) navigate("/contractors");
            else navigate("/summary");
          }}
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

const NavBar = ({
  onAnalyze,
  onHow,
}: {
  onAnalyze: () => void;
  onHow: () => void;
}) => {
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
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-2 px-6 py-1.5 text-[11px] font-medium tracking-wide text-white/85">
          <span className="hidden h-1 w-1 rounded-full bg-mint sm:inline-block" />
          <span>
            From analysis to handover — we orchestrate every step.
          </span>
          <span className="hidden text-white/40 sm:inline">·</span>
          <span className="hidden text-white/70 sm:inline">
            Free analysis · Verified contractors · Subsidies handled
          </span>
        </div>
      </div>
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6">
        <Logo size="sm" />
        <nav className="hidden items-center gap-7 text-[13px] text-ink/80 md:flex">
          <button type="button" onClick={onAnalyze} className="hover:text-navy">
            Start
          </button>
          <button type="button" onClick={onHow} className="hover:text-navy">
            How it works
          </button>
        </nav>
        <button
          onClick={onAnalyze}
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

const Hero = ({
  onAnalyze,
  onHow,
}: {
  onAnalyze: () => void;
  onHow: () => void;
}) => {
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
          <button
            type="button"
            onClick={onAnalyze}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-6 font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Start free analysis
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onHow}
            className="inline-flex items-center gap-1.5 font-semibold text-teal hover:underline"
          >
            See how it works
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  House SVG (modern Swiss EFH, ~30° gable, white render)                    */
/*  Front-3/4 view. Front face dominant with 2×2 windows + central door.      */
/*  Side face with 2 vertically-aligned windows. Layered <g> with ids so      */
/*  the scroll sequence can transform individual pieces in viewBox units.     */
/* -------------------------------------------------------------------------- */

type Pt = readonly [number, number];

// Front face: FLT(160,270) → FRT(440,295) → FRB(440,495) → FLB(160,470)
const F = (u: number, v: number): Pt =>
  [160 + 280 * u, 270 + 25 * u + 200 * v] as const;
// Side face: FRT(440,295) → BRT(560,273) → BRB(560,473) → FRB(440,495)
const S = (u: number, v: number): Pt =>
  [440 + 120 * u, 295 - 22 * u + 200 * v] as const;
// East roof slope: FrontPeak(300,200) ↔ BackPeak(420,178) ↔ BRT(560,273) ↔ FRT(440,295)
const R = (u: number, v: number): Pt => [
  300 + 120 * u + 140 * v,
  200 - 22 * u + 95 * v,
];

const FLT: Pt = [160, 270];
const FRT: Pt = [440, 295];
const FRB: Pt = [440, 495];
const FLB: Pt = [160, 470];
const BRT: Pt = [560, 273];
const BRB: Pt = [560, 473];
const FrontPeak: Pt = [300, 200];
const BackPeak: Pt = [420, 178];

const pts = (...points: Pt[]) =>
  points.map((p) => `${p[0]},${p[1]}`).join(" ");

const FrontWindow = ({
  uc,
  vc,
  k,
}: {
  uc: number;
  vc: number;
  k: string;
}) => {
  const hu = 0.085;
  const hv = 0.10;
  const tl = F(uc - hu, vc - hv);
  const tr = F(uc + hu, vc - hv);
  const br = F(uc + hu, vc + hv);
  const bl = F(uc - hu, vc + hv);
  const ins = 0.012;
  const gtl = F(uc - hu + ins, vc - hv + ins * 1.4);
  const gtr = F(uc + hu - ins, vc - hv + ins * 1.4);
  const gbr = F(uc + hu - ins, vc + hv - ins * 1.4);
  const gbl = F(uc - hu + ins, vc + hv - ins * 1.4);
  const mt = F(uc, vc - hv);
  const mb = F(uc, vc + hv);
  const ml = F(uc - hu, vc);
  const mr = F(uc + hu, vc);
  const sillExt = 0.014;
  const sillH = 0.018;
  const sl = F(uc - hu - sillExt, vc + hv);
  const sr = F(uc + hu + sillExt, vc + hv);
  const sl2 = F(uc - hu - sillExt, vc + hv + sillH);
  const sr2 = F(uc + hu + sillExt, vc + hv + sillH);
  return (
    <g key={k}>
      <polygon
        points={pts(tl, tr, br, bl)}
        fill="#ffffff"
        stroke="#9a9da0"
        strokeWidth="0.7"
      />
      <polygon
        points={pts(gtl, gtr, gbr, gbl)}
        fill="url(#glass)"
        opacity="0.85"
      />
      <line
        x1={mt[0]}
        y1={mt[1]}
        x2={mb[0]}
        y2={mb[1]}
        stroke="#ffffff"
        strokeWidth="1.2"
      />
      <line
        x1={ml[0]}
        y1={ml[1]}
        x2={mr[0]}
        y2={mr[1]}
        stroke="#ffffff"
        strokeWidth="0.9"
      />
      <polygon points={pts(sl, sr, sr2, sl2)} fill="#bfc4c8" />
    </g>
  );
};

const SideWindow = ({
  uc,
  vc,
  k,
}: {
  uc: number;
  vc: number;
  k: string;
}) => {
  const hu = 0.16;
  const hv = 0.10;
  const tl = S(uc - hu, vc - hv);
  const tr = S(uc + hu, vc - hv);
  const br = S(uc + hu, vc + hv);
  const bl = S(uc - hu, vc + hv);
  const ins = 0.022;
  const gtl = S(uc - hu + ins, vc - hv + ins * 1.0);
  const gtr = S(uc + hu - ins, vc - hv + ins * 1.0);
  const gbr = S(uc + hu - ins, vc + hv - ins * 1.0);
  const gbl = S(uc - hu + ins, vc + hv - ins * 1.0);
  const mt = S(uc, vc - hv);
  const mb = S(uc, vc + hv);
  const ml = S(uc - hu, vc);
  const mr = S(uc + hu, vc);
  const sillExt = 0.025;
  const sillH = 0.018;
  const sl = S(uc - hu - sillExt, vc + hv);
  const sr = S(uc + hu + sillExt, vc + hv);
  const sl2 = S(uc - hu - sillExt, vc + hv + sillH);
  const sr2 = S(uc + hu + sillExt, vc + hv + sillH);
  return (
    <g key={k}>
      <polygon
        points={pts(tl, tr, br, bl)}
        fill="#ffffff"
        stroke="#9a9da0"
        strokeWidth="0.7"
      />
      <polygon
        points={pts(gtl, gtr, gbr, gbl)}
        fill="url(#glass)"
        opacity="0.85"
      />
      <line
        x1={mt[0]}
        y1={mt[1]}
        x2={mb[0]}
        y2={mb[1]}
        stroke="#ffffff"
        strokeWidth="1.2"
      />
      <line
        x1={ml[0]}
        y1={ml[1]}
        x2={mr[0]}
        y2={mr[1]}
        stroke="#ffffff"
        strokeWidth="0.9"
      />
      <polygon points={pts(sl, sr, sr2, sl2)} fill="#bfc4c8" />
    </g>
  );
};

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
  undergroundOpacity?: number;
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
  undergroundOpacity = 0,
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

    {/* Underground earth — fades in smoothly as the heat pump descends */}
    {undergroundOpacity > 0.001 && (
      <g clipPath="url(#undergroundClip)" opacity={undergroundOpacity}>
        <rect x="-40" y="500" width="880" height="220" fill="url(#undergroundEarth)" />
        <rect x="-40" y="500" width="880" height="220" fill="url(#earthPat)" />
        <rect x="-40" y="540" width="880" height="2" fill="#000" opacity="0.12" />
        <rect x="-40" y="600" width="880" height="2" fill="#000" opacity="0.10" />
      </g>
    )}

    {/* Ground line — soft cross-fade between grass and exposed soil edge */}
    <rect x="-40" y="500" width="880" height="20" fill="url(#ground)" />
    <rect
      x="-40"
      y="500"
      width="880"
      height="3"
      fill="#3a2e20"
      opacity={undergroundOpacity * 0.7}
    />
    <ellipse
      cx="360"
      cy="500"
      rx="260"
      ry="6"
      fill="#000"
      opacity={0.10 * (1 - undergroundOpacity * 0.6)}
    />

    {/* Plinth — concrete strip at the base of the walls */}
    <g id="plinth">
      <polygon
        points={pts(
          [160, 488],
          [440, 513],
          [560, 491],
          [560, 477],
          [440, 499],
          [160, 474],
        )}
        fill="url(#plinth)"
      />
      <polygon
        points={pts(
          [160, 488],
          [440, 513],
          [560, 491],
          [560, 477],
          [440, 499],
          [160, 474],
        )}
        fill="url(#seamPat)"
      />
    </g>

    {/* Facade — front + side walls and the south gable */}
    <g id="facade" transform={`translate(${facadeX} 0)`} opacity={facadeOpacity}>
      <polygon points={pts(FLT, FRT, FRB, FLB)} fill="url(#renderFront)" />
      <polygon points={pts(FLT, FRT, FRB, FLB)} fill="url(#renderPat)" />
      <polygon points={pts(FRT, BRT, BRB, FRB)} fill="url(#renderSide)" />
      <polygon points={pts(FRT, BRT, BRB, FRB)} fill="url(#renderPat)" />
      <polygon points={pts(FLT, FRT, FrontPeak)} fill="url(#renderGable)" />
      <polygon points={pts(FLT, FRT, FrontPeak)} fill="url(#renderPat)" />
      {/* eave shadow lines under the roof */}
      <polygon
        points={pts(FLT, FRT, [FRT[0], FRT[1] + 4], [FLT[0], FLT[1] + 4])}
        fill="#000"
        opacity="0.10"
      />
      <polygon
        points={pts(FRT, BRT, [BRT[0], BRT[1] + 4], [FRT[0], FRT[1] + 4])}
        fill="#000"
        opacity="0.08"
      />
      {/* corner edge between front and side */}
      <line
        x1={FRT[0]}
        y1={FRT[1]}
        x2={FRB[0]}
        y2={FRB[1]}
        stroke="#000"
        strokeWidth="0.6"
        opacity="0.10"
      />
    </g>

    {/* Windows + door — translated/scaled with facade so they stay attached */}
    <g
      id="windows"
      transform={`translate(${facadeX} ${windowsY}) scale(${windowsScale}) translate(${(1 - windowsScale) * 360} ${(1 - windowsScale) * 380})`}
    >
      {/* Front face: 2×2 grid of identical windows around a central door */}
      <FrontWindow uc={0.20} vc={0.27} k="fw-tl" />
      <FrontWindow uc={0.80} vc={0.27} k="fw-tr" />
      <FrontWindow uc={0.20} vc={0.65} k="fw-bl" />
      <FrontWindow uc={0.80} vc={0.65} k="fw-br" />

      {/* Side face: two windows aligned vertically with the front floors */}
      <SideWindow uc={0.50} vc={0.27} k="sw-t" />
      <SideWindow uc={0.50} vc={0.65} k="sw-b" />

      {/* Door — centered on the front face, ground-level */}
      <FrontDoor />
    </g>

    {/* Roof — east slope (south-facing) + ridge + chimney */}
    <g id="roof" transform={`translate(0 ${roofY})`} opacity={roofOpacity}>
      <polygon
        points={pts(FrontPeak, BackPeak, BRT, FRT)}
        fill="url(#tileFront)"
      />
      <polygon
        points={pts(FrontPeak, BackPeak, BRT, FRT)}
        fill="url(#tilePat)"
      />
      {/* eave shadow under roof */}
      <polygon
        points={pts(FRT, BRT, [BRT[0], BRT[1] + 4], [FRT[0], FRT[1] + 4])}
        fill="#000"
        opacity="0.18"
      />
      {/* ridge line */}
      <line
        x1={FrontPeak[0]}
        y1={FrontPeak[1]}
        x2={BackPeak[0]}
        y2={BackPeak[1]}
        stroke="#0a1418"
        strokeWidth="2"
      />
      {/* gable trim — thin strip along the south gable's edges */}
      <polygon
        points={pts(FLT, FrontPeak, [FrontPeak[0] - 3, FrontPeak[1] + 4], [FLT[0] - 3, FLT[1] + 4])}
        fill="#1f2a30"
      />
      <polygon
        points={pts(FRT, FrontPeak, [FrontPeak[0] + 3, FrontPeak[1] + 4], [FRT[0] + 3, FRT[1] + 4])}
        fill="#1f2a30"
      />
      {/* chimney */}
      <g>
        <polygon points={pts([352, 192], [378, 188], [378, 162], [352, 166])} fill="#3d4a52" />
        <polygon points={pts([352, 192], [378, 188], [378, 184], [352, 188])} fill="#1f2a30" />
        <polygon points={pts([350, 166], [380, 162], [382, 165], [352, 169])} fill="#bfc4c8" />
      </g>
    </g>

    {/* Solar PV — laid in a 3×4 grid on the east (south-facing) roof slope */}
    {(solarVisible || solarOpacity > 0) && (
      <g id="solar" transform={`translate(0 ${solarY})`} opacity={solarOpacity}>
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2, 3].map((col) => {
            const u = 0.10 + col * 0.20;
            const v = 0.18 + row * 0.26;
            const w = 0.17;
            const h = 0.22;
            const tl = R(u, v);
            const tr = R(u + w, v);
            const br = R(u + w, v + h);
            const bl = R(u, v + h);
            return (
              <g key={`pv-${row}-${col}`}>
                <polygon points={pts(tl, tr, br, bl)} fill="url(#pvCell)" />
                <polygon points={pts(tl, tr, br, bl)} fill="url(#pvHi)" />
                <line
                  x1={(tl[0] + tr[0]) / 2}
                  y1={(tl[1] + tr[1]) / 2}
                  x2={(bl[0] + br[0]) / 2}
                  y2={(bl[1] + br[1]) / 2}
                  stroke="#0a1f2e"
                  strokeWidth="0.4"
                  opacity="0.6"
                />
                <line
                  x1={(tl[0] + bl[0]) / 2}
                  y1={(tl[1] + bl[1]) / 2}
                  x2={(tr[0] + br[0]) / 2}
                  y2={(tr[1] + br[1]) / 2}
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

    {/* Heat pump — sits on the ground to the right of the house */}
    <g id="heatpump" opacity={heatpumpOpacity}>
      {/* Pipes — anchored at ground level, reach down to the descending unit */}
      {undergroundOpacity > 0.001 && heatpumpY > 0.5 && (
        <g opacity={undergroundOpacity}>
          <line
            x1="600"
            y1="500"
            x2="600"
            y2={500 + heatpumpY}
            stroke="#0E6655"
            strokeWidth="2"
            opacity="0.75"
          />
          <line
            x1="615"
            y1="500"
            x2="615"
            y2={500 + heatpumpY}
            stroke="#B8860B"
            strokeWidth="2"
            opacity="0.75"
          />
        </g>
      )}
      {/* contact shadow — fades out as the unit moves underground */}
      <ellipse
        cx="610"
        cy={498 + heatpumpY}
        rx="40"
        ry="4"
        fill="#000"
        opacity={0.20 * (1 - undergroundOpacity)}
      />
      {/* outdoor unit body — translated by heatpumpY only on the body */}
    </g>
    <g
      id="heatpump-body"
      transform={`translate(0 ${heatpumpY})`}
      opacity={heatpumpOpacity}
    >{/* outdoor unit body — flat 2D rect with iso depth */}
      <polygon points="585,496 635,496 635,460 585,460" fill="#dcdcd6" />
      <polygon points="635,460 635,496 645,491 645,455" fill="#bfbfb6" />
      <polygon points="585,460 635,460 645,455 595,455" fill="#eeeee6" />
      <polygon points="585,496 635,496 635,494 585,494" fill="#9a9a92" />
      {/* fan grille */}
      <circle cx="610" cy="478" r="11" fill="#2a2a25" />
      <circle cx="610" cy="478" r="9" fill="none" stroke="#5a5a52" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1="610"
          y1="478"
          x2={610 + Math.cos((i * Math.PI) / 3) * 8}
          y2={478 + Math.sin((i * Math.PI) / 3) * 8}
          stroke="#5a5a52"
          strokeWidth="1"
        />
      ))}
      <circle cx="610" cy="478" r="2" fill="#5a5a52" />
      {/* brand strip */}
      <rect x="592" y="464" width="14" height="2" fill="#0E6655" opacity="0.7" />
    </g>
  </svg>
);

const FrontDoor = () => {
  const uc = 0.50;
  const vc = 0.78;
  const hu = 0.07;
  const hv = 0.21;
  const tl = F(uc - hu, vc - hv);
  const tr = F(uc + hu, vc - hv);
  const br = F(uc + hu, vc + hv);
  const bl = F(uc - hu, vc + hv);
  // panel inset
  const ins = 0.010;
  const ptl = F(uc - hu + ins, vc - hv + ins * 1.2);
  const ptr = F(uc + hu - ins, vc - hv + ins * 1.2);
  const pbr = F(uc + hu - ins, vc + hv);
  const pbl = F(uc - hu + ins, vc + hv);
  // glass band — upper third of the door
  const gtl = F(uc - hu + 0.018, vc - hv + 0.030);
  const gtr = F(uc + hu - 0.018, vc - hv + 0.030);
  const gbr = F(uc + hu - 0.018, vc - hv + 0.115);
  const gbl = F(uc - hu + 0.018, vc - hv + 0.115);
  // step
  const sl = F(uc - hu - 0.020, vc + hv);
  const sr = F(uc + hu + 0.020, vc + hv);
  const sl2 = F(uc - hu - 0.020, vc + hv + 0.020);
  const sr2 = F(uc + hu + 0.020, vc + hv + 0.020);
  // handle — small circle on the right side
  const handle = F(uc + hu - 0.018, vc + 0.05);
  return (
    <g>
      <polygon points={pts(tl, tr, br, bl)} fill="#3a3633" />
      <polygon points={pts(ptl, ptr, pbr, pbl)} fill="#52504c" />
      <polygon points={pts(gtl, gtr, gbr, gbl)} fill="url(#glass)" opacity="0.7" />
      <line
        x1={F(uc - hu + 0.018, vc - hv + 0.115)[0]}
        y1={F(uc - hu + 0.018, vc - hv + 0.115)[1]}
        x2={F(uc + hu - 0.018, vc - hv + 0.115)[0]}
        y2={F(uc + hu - 0.018, vc - hv + 0.115)[1]}
        stroke="#2c2a28"
        strokeWidth="0.6"
      />
      <circle cx={handle[0]} cy={handle[1]} r="1.6" fill="#bfc4c8" />
      <polygon points={pts(sl, sr, sr2, sl2)} fill="#bfc4c8" />
    </g>
  );
};

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
  const [completed, setCompleted] = useState(false);
  const lastStage = RENO_STAGES.length - 1;

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), total);
      const t = total > 0 ? passed / total : 0;
      const next = t * lastStage;
      // Only advance forward — scrolling up freezes the house at its highest
      // reached state instead of reverse-splitting.
      setProgress((prev) => (next > prev ? next : prev));
      // Once the animation has played out, mark complete so the section
      // collapses to a single viewport (no more long pinned scroll).
      if (next >= lastStage - 0.02) {
        setCompleted(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [lastStage]);

  // When the section collapses, land the user just past the (now-collapsed)
  // section — at the top of the next section — so they continue forward
  // instead of being yanked back through the house.
  useLayoutEffect(() => {
    if (!completed) return;
    const el = sectionRef.current;
    if (!el) return;
    window.scrollTo(0, el.offsetTop + window.innerHeight);
  }, [completed]);

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
  // Smooth fade for the underground earth + geothermal pipes — replaces the
  // old hard on/off so the transition no longer pops.
  const undergroundOpacity = heatpumpDown * (1 - heatpumpReturn);

  const activeIdx = Math.min(
    RENO_STAGES.length - 1,
    Math.max(0, Math.round(progress)),
  );
  const stage = RENO_STAGES[activeIdx];

  // Full pinned-scroll height while the animation is playing. Once it has
  // played out, collapse to a single viewport so scrolling back up doesn't
  // require traversing the whole long section.
  const totalH = completed ? "100vh" : `${RENO_STAGES.length * 100}vh`;

  return (
    <section ref={sectionRef} className="relative bg-canvas" style={{ height: totalH }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* gradient backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #f7faf8 0%, #eef2ee 60%, #d9e0d8 100%)",
          }}
        />

        {/* house — full bleed across the section */}
        <div className="absolute inset-0">
          <HouseSVG
            roofY={roofY}
            solarY={solarY}
            solarOpacity={solarOpacity}
            solarVisible={solarVisible}
            facadeX={facadeX}
            windowsY={windowsY}
            windowsScale={windowsScale}
            heatpumpY={heatpumpY}
            undergroundOpacity={undergroundOpacity}
          />
        </div>

        {/* soft right-side wash so the overlay card stays legible */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] bg-gradient-to-l from-white/65 via-white/30 to-transparent lg:block" />

        {/* stage card — overlay, anchored bottom on mobile, right on lg+ */}
        <div className="pointer-events-none absolute inset-0 flex items-end px-6 pb-24 sm:items-center sm:pb-0">
          <div className="pointer-events-auto w-full sm:ml-auto sm:mr-8 sm:max-w-[440px] lg:mr-14 xl:mr-24">
            <StageCard stage={stage} onStart={onStart} />
          </div>
        </div>

        {/* stage indicator dots */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
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

        {activeIdx === 0 && (
          <div className="pointer-events-none absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted">
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
            Type your address. We read your building from the federal GWR register
            and GEAK energy database, match every cantonal and federal subsidy you
            qualify for, and orchestrate the whole renovation — plan, contractors,
            subsidies and financing — end-to-end.
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
/*  How it works strip — dark section on the landing page                     */
/*  (full informative page lives in src/steps/HowItWorks.tsx)                 */
/* -------------------------------------------------------------------------- */

const HowItWorksStrip = () => (
  <section id="how" className="relative overflow-hidden bg-navy py-28 text-white sm:py-36">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_20%,rgba(14,102,85,0.45),transparent_70%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_15%_80%,rgba(184,134,11,0.18),transparent_70%)]" />

    <div className="relative mx-auto max-w-[1240px] px-6">
      <Reveal>
        <Eyebrow tone="mint">From address to action</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-left font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] sm:text-[64px]">
          Four steps.
          <br />
          <span className="text-mint">No spreadsheets.</span>
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
        <h2 className="mt-4 max-w-3xl text-left font-serif text-[40px] font-bold leading-[1.05] tracking-[-0.015em] text-navy sm:text-[64px]">
          Built on
          <br />
          <span className="text-teal">real Swiss data.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
        {[
          { icon: Building2, v: "1,847", l: "Buildings analyzed", sub: "across 21 cantons" },
          { icon: BadgeCheck, v: "CHF 42M", l: "Subsidies captured", sub: "for our customers" },
          { icon: Star, v: "4.7★", l: "Avg. satisfaction", sub: "on 1,200+ reviews" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.l} delay={i * 100}>
              <div className="flex h-full min-h-[300px] flex-col bg-white p-10 sm:p-14">
                <Icon size={26} strokeWidth={1.75} className="text-teal" />
                <div className="mt-8 font-serif text-[56px] font-bold leading-none tracking-[-0.02em] text-navy sm:text-[80px]">
                  {s.v}
                </div>
                <div className="mt-5 text-[14px] font-semibold text-navy">{s.l}</div>
                <div className="text-[13px] text-muted">{s.sub}</div>
              </div>
            </Reveal>
          );
        })}
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
  id,
  name,
  desc,
  chip,
  art,
}: {
  id: string;
  name: string;
  desc: string;
  chip: string;
  art: "facade" | "heat" | "solar" | "windows";
}) => (
  <Link
    to={`/modules/${id}`}
    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
  >
    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface to-canvas">
      <ModuleArt kind={art} />
      <span className="absolute left-4 top-4 rounded-full border border-line bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal backdrop-blur">
        {chip}
      </span>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <div className="font-serif text-[20px] font-bold text-navy">{name}</div>
      <div className="mt-1 text-[13px] text-muted">{desc}</div>
      <div className="mt-auto pt-4 text-[12px] font-semibold uppercase tracking-wider text-teal opacity-60 transition-opacity group-hover:opacity-100">
        Explore →
      </div>
    </div>
  </Link>
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
  const modules = useScaledModules();
  const subsidies = useSubsidies();
  const totals = computeTotals(selectedModules, selectedContractors, modules, subsidies);
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

