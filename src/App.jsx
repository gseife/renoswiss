import { useState } from "react";

// ═══════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════
const C = {
  navy: "#0F2B3C", teal: "#0E6655", emerald: "#1A8C6E", mint: "#A8D8C8",
  gold: "#D4A843", light: "#F7F9F8", white: "#FFFFFF", offwhite: "#EDF2EF",
  charcoal: "#2C3E50", gray: "#7F8C8D", lightgray: "#E8EDEB", red: "#E74C3C",
  orange: "#F39C12", blue: "#3498DB",
};

const font = "'Segoe UI', system-ui, -apple-system, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

// ═══════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════
const BUILDING = {
  address: "Musterstrasse 42, 8001 Zürich",
  year: 1972, type: "Einfamilienhaus", area: 185, floors: 2,
  geakClass: "F", heating: "Oil boiler (2001)", heatingAge: 24,
  insulation: "Minimal (original 1972)", windows: "Double-pane (2005)",
  roof: "Uninsulated concrete tile", basement: "Uninsulated",
  annualEnergy: 28400, annualCost: 6100, co2: 7.2,
  estimatedValue: 920000,
};

const MODULES = [
  {
    id: "facade", name: "Facade Insulation", icon: "🏗️", priority: "Critical",
    desc: "External thermal insulation composite system (ETICS), mineral wool 20cm, new render finish",
    reason: "Original 1972 facade has no insulation. Single largest source of heat loss (~35% of total).",
    estCost: 48000, energySaving: 2800, co2Saving: 1.8,
    recommended: true, category: "envelope",
  },
  {
    id: "roof", name: "Roof Insulation", icon: "🏠", priority: "Critical",
    desc: "Between-rafter + over-rafter insulation, 24cm mineral wool, new membrane and tiles",
    reason: "Uninsulated roof accounts for ~25% of heat loss. Especially critical in a 2-storey house.",
    estCost: 32000, energySaving: 1900, co2Saving: 1.2,
    recommended: true, category: "envelope",
  },
  {
    id: "heating", name: "Heat Pump", icon: "♨️", priority: "Critical",
    desc: "Air-water heat pump (12kW), including oil tank removal, new hot water cylinder, controls",
    reason: "Oil boiler is 24 years old (avg. lifespan: 20–25 years). Replacement is overdue.",
    estCost: 38000, energySaving: 3200, co2Saving: 2.8,
    recommended: true, category: "heating",
  },
  {
    id: "windows", name: "Windows & Doors", icon: "🪟", priority: "Recommended",
    desc: "14x triple-glazed windows with thermal break frames, 2x insulated entrance doors",
    reason: "Double-pane windows from 2005 are below current standards. Thermal bridges at frames.",
    estCost: 28000, energySaving: 800, co2Saving: 0.5,
    recommended: true, category: "envelope",
  },
  {
    id: "solar", name: "Solar PV System", icon: "☀️", priority: "Recommended",
    desc: "8.4 kWp rooftop PV (21 panels), 10 kWh battery storage, smart inverter",
    reason: "South-facing roof with good solar yield potential (~1,050 kWh/kWp in Zürich).",
    estCost: 26000, energySaving: 2100, co2Saving: 0,
    recommended: true, category: "energy",
  },
  {
    id: "electrical", name: "Electrical & Smart Home", icon: "⚡", priority: "Optional",
    desc: "Panel upgrade for heat pump, EV charger prep, smart energy management system",
    reason: "Existing electrical panel may be insufficient for heat pump. Smart controls optimize consumption.",
    estCost: 9500, energySaving: 400, co2Saving: 0,
    recommended: false, category: "electrical",
  },
  {
    id: "basement", name: "Basement Ceiling Insulation", icon: "🧱", priority: "Optional",
    desc: "8cm insulation boards on basement ceiling, vapor barrier",
    reason: "Cold bridge from unheated basement. Low-cost measure with good return.",
    estCost: 4500, energySaving: 600, co2Saving: 0.3,
    recommended: false, category: "envelope",
  },
];

const CONTRACTORS = {
  facade: [
    { name: "Energo Bau AG", loc: "Zürich", rating: 4.8, projects: 142, onTime: 91, onBudget: 87, price: 47200, priceDelta: -2, satisfaction: 94, years: 18, certs: ["Minergie", "SIA"], avail: "Apr 2025", badge: "Top Rated" },
    { name: "IsoDämmTech GmbH", loc: "Winterthur", rating: 4.6, projects: 89, onTime: 88, onBudget: 92, price: 44800, priceDelta: -7, satisfaction: 91, years: 12, certs: ["Minergie"], avail: "Mar 2025", badge: "Best Price" },
    { name: "Fassaden Plus AG", loc: "Uster", rating: 4.7, projects: 206, onTime: 94, onBudget: 85, price: 49500, priceDelta: 3, satisfaction: 93, years: 24, certs: ["Minergie", "SIA", "ISO 9001"], avail: "May 2025", badge: "Most Experienced" },
  ],
  roof: [
    { name: "DachProfi Zürich AG", loc: "Zürich", rating: 4.9, projects: 178, onTime: 95, onBudget: 90, price: 31200, priceDelta: -3, satisfaction: 96, years: 22, certs: ["Minergie", "Suissetec"], avail: "Apr 2025", badge: "Top Rated" },
    { name: "SolarDach GmbH", loc: "Dübendorf", rating: 4.5, projects: 64, onTime: 86, onBudget: 88, price: 29800, priceDelta: -7, satisfaction: 89, years: 8, certs: ["Suissetec"], avail: "Mar 2025", badge: "Best Price" },
    { name: "Baumann Bedachungen", loc: "Kloten", rating: 4.7, projects: 312, onTime: 92, onBudget: 84, price: 33500, priceDelta: 5, satisfaction: 92, years: 35, certs: ["Minergie", "SIA"], avail: "May 2025", badge: "Most Experienced" },
  ],
  heating: [
    { name: "WärmeTech GmbH", loc: "Winterthur", rating: 4.9, projects: 94, onTime: 93, onBudget: 91, price: 36500, priceDelta: -4, satisfaction: 96, years: 15, certs: ["FWS", "Suissetec"], avail: "Apr 2025", badge: "Top Rated" },
    { name: "Heiztechnik Meier", loc: "Zürich", rating: 4.6, projects: 127, onTime: 89, onBudget: 86, price: 35200, priceDelta: -7, satisfaction: 90, years: 20, certs: ["FWS"], avail: "Mar 2025", badge: "Best Price" },
    { name: "Alpiq InTec", loc: "Zürich", rating: 4.7, projects: 483, onTime: 91, onBudget: 83, price: 39800, priceDelta: 5, satisfaction: 93, years: 30, certs: ["FWS", "Suissetec", "ISO 14001"], avail: "Jun 2025", badge: "Most Experienced" },
  ],
  windows: [
    { name: "FensterProfi AG", loc: "Uster", rating: 4.7, projects: 68, onTime: 92, onBudget: 93, price: 27200, priceDelta: -3, satisfaction: 94, years: 14, certs: ["Minergie"], avail: "Mar 2025", badge: "Top Rated" },
    { name: "4B Fenster AG", loc: "Hochdorf", rating: 4.8, projects: 520, onTime: 94, onBudget: 88, price: 29500, priceDelta: 5, satisfaction: 95, years: 40, certs: ["Minergie", "SIA"], avail: "Apr 2025", badge: "Most Experienced" },
    { name: "EgoKiefer Partner", loc: "Zürich", rating: 4.5, projects: 245, onTime: 87, onBudget: 90, price: 26800, priceDelta: -4, satisfaction: 91, years: 25, certs: ["Minergie"], avail: "Apr 2025", badge: "Best Price" },
  ],
  solar: [
    { name: "SolarZüri AG", loc: "Zürich", rating: 4.8, projects: 218, onTime: 90, onBudget: 89, price: 25200, priceDelta: -3, satisfaction: 95, years: 10, certs: ["Pronovo", "SIA"], avail: "Apr 2025", badge: "Top Rated" },
    { name: "Helion Energy", loc: "Zürich", rating: 4.7, projects: 1240, onTime: 88, onBudget: 85, price: 27100, priceDelta: 4, satisfaction: 92, years: 15, certs: ["Pronovo", "ISO 9001"], avail: "Mar 2025", badge: "Most Experienced" },
    { name: "BE Netz AG", loc: "Luzern", rating: 4.6, projects: 340, onTime: 91, onBudget: 91, price: 24500, priceDelta: -6, satisfaction: 91, years: 20, certs: ["Pronovo"], avail: "May 2025", badge: "Best Price" },
  ],
  electrical: [
    { name: "ElektroPlan AG", loc: "Zürich", rating: 4.6, projects: 89, onTime: 90, onBudget: 92, price: 9200, priceDelta: -3, satisfaction: 92, years: 12, certs: ["ESTI"], avail: "Apr 2025", badge: "Top Rated" },
    { name: "SmartHome Swiss", loc: "Winterthur", rating: 4.5, projects: 45, onTime: 88, onBudget: 87, price: 10100, priceDelta: 6, satisfaction: 90, years: 5, certs: ["ESTI", "KNX"], avail: "Mar 2025", badge: "Smart Home Specialist" },
  ],
  basement: [
    { name: "KellerDämm GmbH", loc: "Zürich", rating: 4.5, projects: 156, onTime: 94, onBudget: 95, price: 4200, priceDelta: -7, satisfaction: 92, years: 18, certs: ["Minergie"], avail: "Mar 2025", badge: "Best Price" },
    { name: "Energo Bau AG", loc: "Zürich", rating: 4.8, projects: 142, onTime: 91, onBudget: 87, price: 4800, priceDelta: 7, satisfaction: 94, years: 18, certs: ["Minergie", "SIA"], avail: "Apr 2025", badge: "Top Rated" },
  ],
};

const SUBSIDIES = [
  { source: "Gebäudeprogramm (Federal)", amount: 12800, status: "Pre-qualified", desc: "Envelope measures + heating replacement", auto: true },
  { source: "Kanton Zürich — Energieförderung", amount: 18500, status: "Pre-qualified", desc: "Comprehensive energy renovation (GEAK Plus)", auto: true },
  { source: "Stadt Zürich — Energiefonds", amount: 4200, status: "Eligible", desc: "Solar PV installation", auto: true },
  { source: "ProKilowatt (Federal)", amount: 2100, status: "To verify", desc: "Energy-efficient electrical systems", auto: false },
];

// ═══════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════
const Card = ({ children, style, onClick, highlight }) => (
  <div onClick={onClick} style={{
    background: C.white, borderRadius: 10, border: `1px solid ${highlight ? C.teal : C.lightgray}`,
    boxShadow: highlight ? `0 0 0 2px ${C.teal}20` : "0 1px 3px rgba(0,0,0,0.04)",
    cursor: onClick ? "pointer" : "default", transition: "all 0.15s", ...style,
  }}>{children}</div>
);

const Badge = ({ text, color = C.teal }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: color + "18", color }}>{text}</span>
);

const Stat = ({ value, label, color = C.navy, big }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: big ? 26 : 17, fontWeight: 700, color, fontFamily: serif }}>{value}</div>
    <div style={{ fontSize: 10, color: C.gray, marginTop: 1 }}>{label}</div>
  </div>
);

const ProgressDots = ({ current, total }) => (
  <div style={{ display: "flex", gap: 3, justifyContent: "center", padding: "10px 0" }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, background: i <= current ? C.teal : C.lightgray, transition: "all 0.3s" }} />
    ))}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, small, style: s }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "8px 16px" : "11px 22px", borderRadius: 8, border: variant === "primary" ? "none" : `1.5px solid ${C.teal}`,
    background: disabled ? C.lightgray : variant === "primary" ? C.teal : "transparent",
    color: disabled ? C.gray : variant === "primary" ? "#fff" : C.teal,
    fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    fontFamily: font, transition: "all 0.15s", ...s,
  }}>{children}</button>
);

const GeakBar = ({ current, target }) => {
  const cls = ["A", "B", "C", "D", "E", "F", "G"];
  const cols = ["#1A8C6E", "#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#FF5722", "#D32F2F"];
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {cls.map((c, i) => (
        <div key={c} style={{ flex: 1, textAlign: "center" }}>
          {c === current && <div style={{ fontSize: 8, fontWeight: 700, color: C.red, marginBottom: 2 }}>NOW</div>}
          {c === target && <div style={{ fontSize: 8, fontWeight: 700, color: C.emerald, marginBottom: 2 }}>TARGET</div>}
          <div style={{ height: 22, borderRadius: 3, background: cols[i], opacity: c === current || c === target ? 1 : 0.18, border: c === current ? `2px solid ${C.red}` : c === target ? `2px solid ${C.emerald}` : "none" }} />
          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>{c}</div>
        </div>
      ))}
    </div>
  );
};

const RatingStars = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: C.gold, fontSize: 13, letterSpacing: -1 }}>
      {"★".repeat(full)}{half ? "½" : ""}
      <span style={{ color: C.lightgray }}>{"★".repeat(5 - full - (half ? 1 : 0))}</span>
      <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 700, color: C.navy }}>{rating}</span>
    </span>
  );
};

const StatBar = ({ value, max = 100, color = C.teal, label, suffix = "%" }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
      <span style={{ color: C.charcoal }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}{suffix}</span>
    </div>
    <div style={{ height: 5, borderRadius: 3, background: C.lightgray, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// STEP 0: LANDING
// ═══════════════════════════════════════════════════
const Landing = ({ onStart }) => (
  <div style={{ textAlign: "center", padding: "28px 16px" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 4, marginBottom: 8 }}>RENOSWISS</div>
    <h1 style={{ fontSize: 22, color: C.navy, fontFamily: serif, marginBottom: 4, fontWeight: 700, lineHeight: 1.3 }}>Your Home Renovation,<br/>Simplified.</h1>
    <p style={{ color: C.gray, fontSize: 13, maxWidth: 400, margin: "0 auto 20px", lineHeight: 1.5 }}>
      Enter your address. We analyze your building, recommend what to renovate, match you with verified contractors, optimize your subsidies, and calculate your exact financial impact — all in one place.
    </p>
    <div style={{ display: "flex", gap: 6, maxWidth: 400, margin: "0 auto 16px" }}>
      <input type="text" defaultValue="Musterstrasse 42, 8001 Zürich" style={{
        flex: 1, padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.lightgray}`,
        fontSize: 13, fontFamily: font, outline: "none",
      }} />
      <Btn onClick={onStart}>Analyze →</Btn>
    </div>
    <div style={{ fontSize: 10, color: C.gray }}>Free analysis • No obligations • Takes 2 minutes</div>
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
      {[["1,847", "Buildings analyzed"], ["CHF 42M", "Subsidies captured"], ["4.7 ★", "Avg. satisfaction"]].map(([v, l]) => (
        <div key={l} style={{ background: C.offwhite, borderRadius: 8, padding: "10px 14px", minWidth: 100 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, fontFamily: serif }}>{v}</div>
          <div style={{ fontSize: 9, color: C.gray }}>{l}</div>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// STEP 1: BUILDING PROFILE
// ═══════════════════════════════════════════════════
const BuildingProfile = () => {
  const b = BUILDING;
  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Your Building Profile</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 12 }}>Data from Swiss Federal Building Register (GWR), GEAK database & cantonal records</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[
          ["Address", b.address], ["Year / Type", `${b.year} • ${b.type} • ${b.area}m²`],
          ["Heating", b.heating, C.red], ["Insulation", b.insulation, C.orange],
          ["Windows", b.windows, C.orange], ["Roof", b.roof, C.orange],
        ].map(([l, v, col]) => (
          <Card key={l} style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: C.gray }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: col || C.navy }}>{v}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 8 }}>GEAK Energy Rating</div>
        <GeakBar current="F" target="B" />
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
          <Stat value={`${b.annualEnergy.toLocaleString()} kWh`} label="Annual consumption" color={C.navy} />
          <Stat value={`CHF ${b.annualCost.toLocaleString()}`} label="Annual cost" color={C.red} />
          <Stat value={`${b.co2}t CO₂`} label="Per year" color={C.orange} />
        </div>
      </Card>

      <Card style={{ padding: 10, borderLeft: `3px solid ${C.gold}`, background: "#FFFDF5" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>⚠️ Renovation urgency: High</div>
        <div style={{ fontSize: 11, color: C.charcoal, marginTop: 2 }}>
          Oil boiler is {b.heatingAge} years old (typical lifespan: 20–25 years). GEAK class F. MuKEn 2025 tightening means acting within 12 months maximizes available subsidies. From 2026, fossil boiler replacement will require insulation first.
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STEP 2: MODULE SELECTION
// ═══════════════════════════════════════════════════
const ModuleSelection = ({ selected, onToggle }) => {
  const totalCost = MODULES.filter(m => selected.includes(m.id)).reduce((s, m) => s + m.estCost, 0);
  const totalSaving = MODULES.filter(m => selected.includes(m.id)).reduce((s, m) => s + m.energySaving, 0);

  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Recommended Renovation Measures</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 12 }}>Based on your building's condition. Tap to select/deselect. You choose what to include.</p>

      {MODULES.map(m => {
        const sel = selected.includes(m.id);
        return (
          <Card key={m.id} onClick={() => onToggle(m.id)} highlight={sel} style={{
            padding: "10px 12px", marginBottom: 6, borderLeft: `3px solid ${sel ? C.teal : C.lightgray}`,
            background: sel ? "#F0FAF6" : C.white,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0, marginTop: 2,
                  background: sel ? C.teal : C.offwhite,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>
                  {sel ? <span style={{ color: "#fff", fontSize: 12 }}>✓</span> : m.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{m.name}</span>
                    <Badge text={m.priority} color={m.priority === "Critical" ? C.red : m.priority === "Recommended" ? C.gold : C.gray} />
                  </div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 1 }}>{m.desc}</div>
                  <div style={{ fontSize: 10, color: C.teal, fontStyle: "italic", marginTop: 2 }}>{m.reason}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>CHF {m.estCost.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: C.emerald }}>-CHF {m.energySaving.toLocaleString()}/yr</div>
              </div>
            </div>
          </Card>
        );
      })}

      <Card style={{ padding: 12, background: C.navy, marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <Stat value={`CHF ${totalCost.toLocaleString()}`} label="Estimated total" color="#fff" />
          <Stat value={`CHF ${totalSaving.toLocaleString()}`} label="Annual savings" color={C.mint} />
          <Stat value={`${selected.length} of ${MODULES.length}`} label="Modules selected" color={C.gold} />
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STEP 3: CONTRACTOR SELECTION
// ═══════════════════════════════════════════════════
const ContractorSelection = ({ selectedModules, selectedContractors, onSelect }) => {
  const [expandedModule, setExpandedModule] = useState(null);
  const activeModules = MODULES.filter(m => selectedModules.includes(m.id));

  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Choose Your Contractors</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 4 }}>Select one contractor per module. Ranked by verified data from completed projects in Kanton Zürich.</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {["Verified ratings only", "Price benchmarked", "On-budget tracked"].map(t => (
          <Badge key={t} text={`✓ ${t}`} color={C.teal} />
        ))}
      </div>

      {activeModules.map(mod => {
        const contractors = CONTRACTORS[mod.id] || [];
        const isExpanded = expandedModule === mod.id;
        const chosen = selectedContractors[mod.id];

        return (
          <Card key={mod.id} style={{ marginBottom: 8, overflow: "hidden" }}>
            <div onClick={() => setExpandedModule(isExpanded ? null : mod.id)} style={{
              padding: "10px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: chosen ? "#F0FAF6" : C.white,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{mod.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{mod.name}</div>
                  {chosen ? (
                    <div style={{ fontSize: 11, color: C.teal }}>✓ {chosen.name} — CHF {chosen.price.toLocaleString()}</div>
                  ) : (
                    <div style={{ fontSize: 11, color: C.orange }}>No contractor selected yet</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 16, color: C.gray, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 12px 12px", background: C.light }}>
                <div style={{ fontSize: 10, color: C.gray, padding: "6px 0 8px" }}>
                  Showing {contractors.length} verified contractors • Data from {contractors.reduce((s, c) => s + c.projects, 0)}+ completed projects
                </div>
                {contractors.map((ct, ci) => {
                  const isChosen = chosen?.name === ct.name;
                  return (
                    <Card key={ci} highlight={isChosen} onClick={() => onSelect(mod.id, ct)} style={{
                      padding: 12, marginBottom: 6, background: isChosen ? "#F0FAF6" : C.white,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{ct.name}</span>
                            <Badge text="VERIFIED" color={C.teal} />
                            {ct.badge && <Badge text={ct.badge} color={ci === 0 ? C.gold : ci === 1 ? C.emerald : C.blue} />}
                          </div>
                          <div style={{ fontSize: 11, color: C.gray }}>{ct.loc} • {ct.years} years in business • {ct.certs.join(", ")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>CHF {ct.price.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: ct.priceDelta <= 0 ? C.emerald : C.orange }}>{ct.priceDelta <= 0 ? ct.priceDelta : "+" + ct.priceDelta}% vs. market avg.</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                        <RatingStars rating={ct.rating} />
                        <span style={{ fontSize: 10, color: C.gray, marginLeft: 6 }}>({ct.projects} verified projects)</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                        <StatBar value={ct.satisfaction} label="Customer satisfaction" color={C.teal} />
                        <StatBar value={ct.onTime} label="On-time delivery" color={C.blue} />
                        <StatBar value={ct.onBudget} label="On-budget completion" color={C.emerald} />
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                          <span style={{ color: C.gray }}>Earliest start:</span>
                          <span style={{ fontWeight: 600, color: C.navy }}>{ct.avail}</span>
                        </div>
                      </div>
                      {isChosen && (
                        <div style={{ marginTop: 8, padding: "6px 8px", background: C.teal + "10", borderRadius: 6, textAlign: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.teal }}>✓ Selected for {mod.name}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STEP 4: SUBSIDIES
// ═══════════════════════════════════════════════════
const SubsidyView = () => {
  const total = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Subsidy Optimization</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 12 }}>Auto-identified across federal, cantonal & municipal programs for your property in Kanton Zürich</p>

      {SUBSIDIES.map((sub, i) => (
        <Card key={i} style={{ padding: "10px 12px", marginBottom: 6, borderLeft: `3px solid ${sub.auto ? C.emerald : C.gold}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{sub.source}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{sub.desc}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.emerald }}>CHF {sub.amount.toLocaleString()}</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "flex-end" }}>
                <Badge text={sub.status} color={sub.status === "Pre-qualified" ? C.emerald : C.gold} />
                {sub.auto && <span style={{ fontSize: 9, color: C.teal }}>Auto-filed</span>}
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Card style={{ padding: 14, marginTop: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <Stat value={`CHF ${total.toLocaleString()}`} label="Total subsidies identified" color="#fff" />
          <Stat value="3 of 4" label="Auto-filed by platform" color={C.mint} />
          <Stat value="~40%" label="More than avg. homeowner" color={C.gold} />
        </div>
      </Card>

      <div style={{ marginTop: 8, padding: 10, background: C.offwhite, borderRadius: 8, fontSize: 11, color: C.charcoal }}>
        <strong>Important:</strong> Most cantonal programs require applications before construction begins. Missing this deadline means forfeiting the subsidy. RenoSwiss files 3 of 4 applications automatically — ensuring no money is left on the table.
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STEP 5: FINANCIAL CALCULATOR
// ═══════════════════════════════════════════════════
const FinancialCalc = ({ selectedModules, selectedContractors }) => {
  const [rate, setRate] = useState(1.85);
  const [term, setTerm] = useState(15);
  const [taxRate, setTaxRate] = useState(25);

  const totalCost = selectedModules.reduce((s, id) => {
    const ct = selectedContractors[id];
    const mod = MODULES.find(m => m.id === id);
    return s + (ct ? ct.price : mod.estCost);
  }, 0);

  const totalSubsidies = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  const netFinancing = totalCost - totalSubsidies;
  const monthlyPayment = (netFinancing * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -term * 12));
  const totalInterest = monthlyPayment * term * 12 - netFinancing;

  const annualSaving = selectedModules.reduce((s, id) => s + (MODULES.find(m => m.id === id)?.energySaving || 0), 0);
  const monthlySaving = annualSaving / 12;
  const monthlyTaxBenefit = (monthlyPayment * (rate / 100) * (taxRate / 100)) / 12 * 3;
  const netMonthlyCost = monthlyPayment - monthlySaving - monthlyTaxBenefit;
  const propertyIncrease = Math.round(totalCost * 0.18);
  const paybackYears = netFinancing / (annualSaving + monthlyTaxBenefit * 12);

  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Financial Calculator</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 12 }}>Adjust parameters to see your real net cost. All figures based on your selected modules and contractors.</p>

      <Card style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Cost Overview</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.charcoal }}>Total renovation cost</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>CHF {totalCost.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.charcoal }}>Subsidies (pre-qualified)</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.emerald }}>– CHF {totalSubsidies.toLocaleString()}</span>
        </div>
        <div style={{ height: 1, background: C.lightgray, margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Net financing needed</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>CHF {Math.round(netFinancing).toLocaleString()}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: C.lightgray, marginTop: 8, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${(totalSubsidies / totalCost) * 100}%`, background: C.emerald }} />
          <div style={{ flex: 1, background: C.teal }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9 }}>
          <span style={{ color: C.emerald, fontWeight: 600 }}>{Math.round((totalSubsidies / totalCost) * 100)}% subsidized</span>
          <span style={{ color: C.teal, fontWeight: 600 }}>{Math.round((netFinancing / totalCost) * 100)}% financed</span>
        </div>
      </Card>

      <Card style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Financing Parameters</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span>Interest rate</span><span style={{ fontWeight: 700 }}>{rate}%</span>
          </div>
          <input type="range" min="1.0" max="3.5" step="0.05" value={rate} onChange={e => setRate(+e.target.value)}
            style={{ width: "100%", accentColor: C.teal }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span>Loan term</span><span style={{ fontWeight: 700 }}>{term} years</span>
          </div>
          <input type="range" min="5" max="25" step="1" value={term} onChange={e => setTerm(+e.target.value)}
            style={{ width: "100%", accentColor: C.teal }} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span>Marginal tax rate</span><span style={{ fontWeight: 700 }}>{taxRate}%</span>
          </div>
          <input type="range" min="10" max="40" step="1" value={taxRate} onChange={e => setTaxRate(+e.target.value)}
            style={{ width: "100%", accentColor: C.teal }} />
        </div>
      </Card>

      <Card style={{ padding: 14, marginBottom: 10, background: C.navy }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 10 }}>Monthly Net Impact</div>
        {[
          ["Mortgage payment", `CHF ${Math.round(monthlyPayment).toLocaleString()}`, "#fff", "+"],
          ["Energy savings", `CHF ${Math.round(monthlySaving).toLocaleString()}`, C.mint, "–"],
          ["Tax deduction benefit", `CHF ${Math.round(monthlyTaxBenefit).toLocaleString()}`, C.mint, "–"],
        ].map(([l, v, col, sign]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
            <span style={{ color: "#ffffff90" }}>{sign} {l}</span>
            <span style={{ color: col, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: "#ffffff20", margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: "#fff", fontWeight: 700 }}>= Your net monthly cost</span>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 18 }}>CHF {Math.round(netMonthlyCost).toLocaleString()}</span>
        </div>
      </Card>

      <Card style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Long-term Value</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ textAlign: "center", padding: "8px 4px", background: C.offwhite, borderRadius: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.emerald, fontFamily: serif }}>CHF {propertyIncrease.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: C.gray }}>Property value increase</div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 4px", background: C.offwhite, borderRadius: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, fontFamily: serif }}>CHF {annualSaving.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: C.gray }}>Annual energy savings</div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 4px", background: C.offwhite, borderRadius: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: serif }}>{Math.round(paybackYears)} yrs</div>
            <div style={{ fontSize: 9, color: C.gray }}>Estimated payback</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: C.gray, textAlign: "center" }}>
          Total interest over {term} years: CHF {Math.round(totalInterest).toLocaleString()} • Total energy savings over {term} years: CHF {(annualSaving * term).toLocaleString()}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STEP 6: TIMELINE
// ═══════════════════════════════════════════════════
const Timeline = ({ selectedModules }) => {
  const steps = [
    { phase: "GEAK Plus Audit", dur: "2 weeks", date: "Apr 2025", status: "done", detail: "Certified auditor on-site assessment" },
    { phase: "Subsidy Applications Filed", dur: "1 week", date: "Apr 2025", status: "done", detail: "3 applications filed simultaneously via platform" },
    { phase: "Financing Confirmed", dur: "1 week", date: "Apr 2025", status: "current", detail: "Green mortgage pre-approved with GEAK data" },
    ...(selectedModules.includes("facade") || selectedModules.includes("roof") || selectedModules.includes("basement") ? [
      { phase: "Phase 1: Envelope", dur: "5 weeks", date: "May–Jun 2025", status: "upcoming", detail: "Facade, roof & basement insulation (parallel where possible)" },
    ] : []),
    ...(selectedModules.includes("windows") ? [
      { phase: "Phase 2: Windows & Doors", dur: "2 weeks", date: "Jun 2025", status: "upcoming", detail: "Triple-glazed windows + insulated doors installed" },
    ] : []),
    ...(selectedModules.includes("heating") || selectedModules.includes("electrical") ? [
      { phase: "Phase 3: Heating & Electrical", dur: "3 weeks", date: "Jul 2025", status: "upcoming", detail: "Heat pump install + panel upgrade + oil tank removal" },
    ] : []),
    ...(selectedModules.includes("solar") ? [
      { phase: "Phase 4: Solar PV", dur: "1 week", date: "Jul 2025", status: "upcoming", detail: "PV panels, battery & inverter installation" },
    ] : []),
    { phase: "Independent Quality Inspection", dur: "1 week", date: "Aug 2025", status: "upcoming", detail: "Third-party inspector verifies all completed work" },
    { phase: "Smart Meter Activated", dur: "Ongoing", date: "Aug 2025+", status: "upcoming", detail: "12-month energy tracking begins" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Project Timeline</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 12 }}>Contractors pre-coordinated. Parallel scheduling where possible.</p>

      <div style={{ position: "relative", paddingLeft: 20 }}>
        <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, background: C.lightgray }} />
        {steps.map((st, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 8 }}>
            <div style={{
              position: "absolute", left: -17, top: 5, width: 10, height: 10, borderRadius: "50%", zIndex: 1,
              background: st.status === "done" ? C.emerald : st.status === "current" ? C.gold : C.lightgray,
            }} />
            <Card style={{
              padding: "8px 10px",
              borderLeft: `3px solid ${st.status === "done" ? C.emerald : st.status === "current" ? C.gold : C.lightgray}`,
              background: st.status === "current" ? "#FFFDF5" : C.white,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{st.phase}</div>
                  <div style={{ fontSize: 10, color: C.gray }}>{st.detail}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: st.status === "done" ? C.emerald : C.charcoal }}>{st.date}</div>
                  <div style={{ fontSize: 9, color: C.gray }}>{st.dur}</div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <Card style={{ padding: 10, background: C.navy, marginTop: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <Stat value="~5 months" label="Total duration" color="#fff" />
          <Stat value="vs. 12–18" label="Without platform" color={C.red} />
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STEP 7: SUMMARY
// ═══════════════════════════════════════════════════
const Summary = ({ selectedModules, selectedContractors }) => {
  const totalCost = selectedModules.reduce((s, id) => {
    const ct = selectedContractors[id];
    const mod = MODULES.find(m => m.id === id);
    return s + (ct ? ct.price : mod.estCost);
  }, 0);
  const totalSubsidies = SUBSIDIES.reduce((s, sub) => s + sub.amount, 0);
  const annualSaving = selectedModules.reduce((s, id) => s + (MODULES.find(m => m.id === id)?.energySaving || 0), 0);
  const co2Saving = selectedModules.reduce((s, id) => s + (MODULES.find(m => m.id === id)?.co2Saving || 0), 0);

  return (
    <div>
      <h2 style={{ fontSize: 17, color: C.navy, fontFamily: serif, marginBottom: 2 }}>Your Renovation Summary</h2>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 12 }}>Review your complete plan before booking the GEAK Plus audit.</p>

      <Card style={{ padding: 16, marginBottom: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <Stat value="F → B" label="GEAK improvement" color="#fff" big />
          <Stat value={`CHF ${annualSaving.toLocaleString()}`} label="Annual savings" color={C.mint} big />
          <Stat value={`-${co2Saving.toFixed(1)}t`} label="CO₂ per year" color={C.gold} big />
        </div>
      </Card>

      <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Selected Modules & Contractors</div>
      {selectedModules.map(id => {
        const mod = MODULES.find(m => m.id === id);
        const ct = selectedContractors[id];
        return (
          <Card key={id} style={{ padding: "8px 10px", marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{mod.icon} {mod.name}</span>
                <span style={{ fontSize: 11, color: C.gray, marginLeft: 8 }}>{ct ? ct.name : "Not selected"}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>CHF {(ct ? ct.price : mod.estCost).toLocaleString()}</span>
            </div>
          </Card>
        );
      })}

      <Card style={{ padding: 10, marginTop: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12 }}>
          <div><span style={{ color: C.gray }}>Total cost:</span> <strong>CHF {totalCost.toLocaleString()}</strong></div>
          <div><span style={{ color: C.gray }}>Subsidies:</span> <strong style={{ color: C.emerald }}>CHF {totalSubsidies.toLocaleString()}</strong></div>
          <div><span style={{ color: C.gray }}>Net financing:</span> <strong style={{ color: C.teal }}>CHF {(totalCost - totalSubsidies).toLocaleString()}</strong></div>
          <div><span style={{ color: C.gray }}>Timeline:</span> <strong>~5 months</strong></div>
        </div>
      </Card>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Btn onClick={() => {}}>Book Your Free GEAK Plus Audit →</Btn>
        <div style={{ fontSize: 10, color: C.gray, marginTop: 6 }}>Certified auditor visits within 5 business days • No obligations</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [step, setStep] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState(["facade", "roof", "heating", "windows", "solar"]);
  const [selectedContractors, setSelectedContractors] = useState({});

  const toggleModule = (id) => setSelectedModules(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectContractor = (modId, contractor) => setSelectedContractors(s => ({ ...s, [modId]: s[modId]?.name === contractor.name ? undefined : contractor }));

  const STEPS = [
    { label: "Building Profile", comp: <BuildingProfile /> },
    { label: "Renovation Plan", comp: <ModuleSelection selected={selectedModules} onToggle={toggleModule} /> },
    { label: "Contractors", comp: <ContractorSelection selectedModules={selectedModules} selectedContractors={selectedContractors} onSelect={selectContractor} /> },
    { label: "Subsidies", comp: <SubsidyView /> },
    { label: "Calculator", comp: <FinancialCalc selectedModules={selectedModules} selectedContractors={selectedContractors} /> },
    { label: "Timeline", comp: <Timeline selectedModules={selectedModules} /> },
    { label: "Summary", comp: <Summary selectedModules={selectedModules} selectedContractors={selectedContractors} /> },
  ];

  if (loading) {
    return (
      <div style={{ fontFamily: font, maxWidth: 540, margin: "0 auto", padding: "50px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: 3, marginBottom: 12 }}>RENOSWISS</div>
        <div style={{ width: 30, height: 30, border: `3px solid ${C.lightgray}`, borderTopColor: C.teal, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 13, color: C.charcoal, fontWeight: 600 }}>Analyzing your building...</div>
        <div style={{ fontSize: 11, color: C.gray, marginTop: 4, maxWidth: 300, margin: "4px auto 0" }}>
          Cross-referencing GWR building register, GEAK energy database, cantonal subsidy programs & historical renovation data
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font, maxWidth: 540, margin: "0 auto", background: C.light, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: `1px solid ${C.lightgray}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>R</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, letterSpacing: 1 }}>RENOSWISS</span>
        </div>
        {step >= 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {STEPS.map((s, i) => (
              <div key={i} onClick={() => setStep(i)} style={{
                padding: "3px 6px", borderRadius: 4, fontSize: 9, cursor: "pointer",
                background: i === step ? C.teal : "transparent", color: i === step ? "#fff" : i < step ? C.teal : C.gray,
                fontWeight: i === step ? 700 : 400,
              }}>{i + 1}</div>
            ))}
          </div>
        )}
      </div>

      {step >= 0 && <ProgressDots current={step} total={STEPS.length} />}

      <div style={{ padding: "8px 16px 20px" }}>
        {step === -1 ? (
          <Landing onStart={() => { setLoading(true); setTimeout(() => { setLoading(false); setStep(0); }, 1600); }} />
        ) : (
          <>
            {STEPS[step].comp}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
              <Btn variant="secondary" onClick={() => setStep(s => Math.max(-1, s - 1))}>
                ← {step === 0 ? "Home" : "Back"}
              </Btn>
              {step < STEPS.length - 1 && (
                <Btn onClick={() => setStep(s => s + 1)}>
                  {STEPS[step + 1].label} →
                </Btn>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
