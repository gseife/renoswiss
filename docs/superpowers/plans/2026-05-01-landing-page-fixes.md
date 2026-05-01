# Landing page fixes — implementation plan

**Date:** 2026-05-01
**Scope:** `src/steps/Landing.tsx` and the routes/pages it links into.
**Goal:** Fix five concrete bugs on the landing page so the entry flow feels coherent and every CTA goes somewhere meaningful.

## Background

The landing page is one 1843-line file with five discrete problems. The CTAs scroll to inline sections instead of navigating to real pages, the only post-landing destination is `/building`, and several "explore" affordances are dead ends. Fixing this requires both surgical edits in `Landing.tsx` and three new route surfaces: `/start`, `/how`, and `/modules/:id`.

User decisions captured during brainstorming (2026-05-01):
- Q1 → **A**: dedicated `/start` route owns address entry + analyze animation, forwards to `/building`.
- Q2 → **A**: each module gets a real informative detail page.
- Q3 → **A**: `/how` is a real informative page, not a stub.

## Files that will change

**Edited:**
- `src/App.tsx` — register three new routes (`/start`, `/how`, `/modules/:id`).
- `src/steps/Landing.tsx` — rewrite Hero CTAs, trim inline analyze flow, fix headline alignment, restyle three pillars, wrap module cards in `<Link>`.

**Created:**
- `src/steps/StartAnalysis.tsx` — `/start` page: address input + analyze animation.
- `src/steps/HowItWorks.tsx` — `/how` page (informative).
- `src/steps/ModuleDetail.tsx` — `/modules/:id` page (informative).
- `src/data/modules.ts` — content records keyed by module id.

**Note on naming:** the existing in-page section in `Landing.tsx` is currently called `HowItWorks`. Rename the inline component to `HowItWorksStrip` so the new page-level `HowItWorks` does not collide.

---

## Task 1 — Fix the "Start free analysis" CTA

**Why:** The Hero button (`Landing.tsx:196`) is `<a href="#start">`, so clicking it just scrolls down to the inline `StartSection`. On small viewports this looks like the page reloaded into a stripped-down mobile layout. The actual `/building` navigation only fires after a *second* form submit on the inline form.

**What to do:**
1. Add a new route `/start` in `src/App.tsx` rendering `StartAnalysis`.
2. Create `src/steps/StartAnalysis.tsx`:
   - Single-purpose page: the address input + the existing `AnalyzingView` lifted from `Landing.tsx` (lines 1786–1843).
   - Reuse `ANALYZE_STEPS` and `STEP_DURATION` constants — move them into `StartAnalysis.tsx`.
   - On submit: write to `useStore().setAddress`, run the 4-step animation, then `navigate("/building")`.
   - Auto-focus the input on mount.
3. In `Landing.tsx`:
   - Hero "Start free analysis" CTA (line 196) → `useNavigate()` to `/start` instead of `href="#start"`.
   - NavBar "Analyze" button (line 142) → also navigate to `/start`.
   - Delete the inline `analyzing` / `analyzeStep` state (lines 30–31, 38–46, 54).
   - Trim the inline `StartSection` and `FinalCTA` forms: keep them as marketing CTAs but the submit handler navigates to `/start` (passing the typed address through the store) instead of running the local `start()` function.
   - Delete the now-unused `AnalyzingView` component from `Landing.tsx` (it lives in `StartAnalysis.tsx` now).

**Acceptance:**
- Clicking Hero "Start free analysis" navigates to `/start` (URL changes to `#/start`).
- `/start` shows only the address input + analyze flow, nothing else.
- After the animation completes, user lands on `/building` with their address persisted.
- Typing an address in the inline `StartSection` and submitting still works — it carries the address to `/start` and runs the same flow.

---

## Task 2 — Build the "How it works" info page

**Why:** Hero "See how it works" link (`Landing.tsx:202`) is `<a href="#how">` — it scrolls to a tiny on-page section. There is no route that explains what the platform actually does.

**What to do:**
1. Rename the inline `HowItWorks` component in `Landing.tsx` (lines 1289–1339) → `HowItWorksStrip`.
2. Create `src/steps/HowItWorks.tsx` with sections:
   - **Hero strip** — single sentence: what the platform does.
   - **The 4-step process** — same four steps as the inline strip, expanded to one paragraph each (Analyze → Plan → Quote → Decide).
   - **The data behind it** — short blocks for GWR, GEAK, cantonal records, MuKEn 2025. Cross-link to `docs/data-sourcing.md` if relevant.
   - **FAQ** — 4–6 Q&A pairs covering: pricing, data privacy, who it's for, where the contractors come from, what happens after I get my plan.
   - **Bottom CTA** — "Start your free analysis" → navigates to `/start`.
3. Register `/how` in `src/App.tsx`.
4. Update Hero "See how it works" link in `Landing.tsx:202` → `useNavigate()` to `/how`.
5. Update NavBar "How it works" anchor (line 132) → also navigate to `/how`.

**Acceptance:**
- `/how` route renders without errors.
- Page reads as a real informative page (not a placeholder); every section has real copy.
- "Start your free analysis" CTA at the bottom routes to `/start`.
- Hero link and NavBar link both go to `/how`.

---

## Task 3 — Left-align the "Four steps. No spreadsheets." headline

**Why:** `HowItWorksStrip` h2 (`Landing.tsx:1297–1299`) inherits center alignment from the section's `text-center` ancestors. The user explicitly wants this left-aligned, consistent with section headlines elsewhere.

**What to do:**
1. In the renamed `HowItWorksStrip` component, locate the parent `div` (line 1294) and the h2 (line 1297).
2. Add `text-left` to the h2 and remove any centering on the immediate parent if present.
3. While in the file, audit `BigStats` (lines 1345–1374) and `ModuleGallery` heading for the same drift — they should match the left-aligned section pattern used by other sections.

**Acceptance:**
- "Four steps. No spreadsheets." headline renders left-aligned at all viewport widths.
- Section heading alignment is consistent across `HowItWorksStrip`, `BigStats`, and `ModuleGallery`.

---

## Task 4 — Make the "Built on real Swiss data" three pillars consistent

**Why:** The three stat cards (`Landing.tsx:1356–1370`) are pure text — no icons, no visual anchor. They feel cheaper than other three-up sections on the page (HowItWorksStrip, ModuleGallery) and lack rhythm.

**What to do:**
1. In `BigStats`, add a small icon row to each pillar:
   - Pillar 1 ("1,847 buildings analyzed") → `Building2` from lucide-react.
   - Pillar 2 ("CHF 42M subsidies captured") → `BadgeCheck` (or `Sparkles`).
   - Pillar 3 ("4.7★ avg. satisfaction") → `Star`.
2. Apply the same treatment to all three: identical icon size (e.g., 20px), identical color (`text-teal`), identical position (top of card, above the big number).
3. Equal min-height per card so the three cards bottom-align even when the `sub` line wraps.
4. Keep the existing serif number, label, and sub-label hierarchy — do not change those.
5. Match the section eyebrow + heading treatment to `HowItWorksStrip` and `ModuleGallery` so the three sections feel like siblings.

**Acceptance:**
- Each pillar has an icon at the top, all the same size and color.
- All three cards are visually identical in structure and spacing.
- The section header style matches other section headers on the page.
- No regression on mobile: icons + numbers stack cleanly, no overflow.

---

## Task 5 — Make "Pick what to renovate" cards clickable

**Why:** ModuleCard (`Landing.tsx:1451`) is a non-interactive `<div>` that already shows an "Explore →" hover hint, which makes the dead state misleading. The user wants each card to open an informative page about that renovation type.

**What to do:**
1. Create `src/data/modules.ts` exporting one record per module id (`facade`, `heating`, `solar`, `windows`):
   - Fields: `id`, `name`, `oneLiner`, `description` (2–3 paragraphs), `typicalCostCHF` (range), `typicalSavingsCHFPerYear` (range), `co2Reduction`, `typicalTimeline`, `relatedSubsidies` (array of strings), `chip`, `art`.
2. Create `src/steps/ModuleDetail.tsx`:
   - Reads `id` from `useParams()`, looks up the record in `modules.ts`.
   - If id is unknown, render a 404-style fallback that links back to `/`.
   - Layout: hero (name + chip + one-liner), description, cost/savings/timeline grid, subsidies block, CTA "Add to my plan" → `navigate("/plan")` and toggles the module on in the store.
3. Register `/modules/:id` in `src/App.tsx`.
4. In `Landing.tsx` `ModuleCard` (lines 1440–1466):
   - Wrap the card root in `<Link to={`/modules/${id}`}>`.
   - Pass `id` from the parent `ModuleGallery` map (currently passed via `art` only — extend the props).
   - Keep the existing hover styling; the "Explore →" hint is now truthful.

**Acceptance:**
- Clicking any of the four module cards (`Facade`, `Heat pump`, `Solar`, `Windows`) navigates to `/modules/<id>`.
- Each detail page renders real content from `modules.ts` — no Lorem ipsum.
- "Add to my plan" CTA on the detail page selects that module in the store and routes to `/plan`.
- An unknown id (e.g., `/modules/foo`) renders the fallback, not a crash.

---

## Out of scope

- Mobile NavBar redesign.
- Footer changes.
- The `RenovationSequence` scroll-driven house illustration.
- Refactoring `Landing.tsx` into smaller files (the file is too large, but that's a separate cleanup).

## Suggested execution order

1. Task 3 (alignment) — smallest surface, fastest win.
2. Task 4 (three pillars) — visual cleanup, low risk.
3. Task 1 (CTA + `/start`) — touches state, must verify analyze flow still ends at `/building`.
4. Task 5 (module cards + `/modules/:id` + `modules.ts`) — content + routing.
5. Task 2 (`/how` page) — most copy work; do last so the rest of the flow is stable when you write CTAs into it.

Each task should ship as its own commit with a focused message.
