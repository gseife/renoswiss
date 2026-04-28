# RenoSwiss

Interactive demo of a Swiss home-renovation planning platform: building analysis, module selection, contractor matching, subsidy optimization, financing calculator, timeline, and summary.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS · React Router (HashRouter) · Lucide icons.
Deployed to **GitHub Pages** via GitHub Actions.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173/renoswiss/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier --write
npm run build        # tsc -b && vite build
npm run preview      # preview the production build
```

## Deploying to GitHub Pages

The workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

**One-time setup:**

1. Push this repo to GitHub. The repo name **must** be `renoswiss` (so the URL is `https://<user>.github.io/renoswiss/`).
2. In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The Actions tab will show the deploy. After it succeeds, your site is live at `https://<user>.github.io/renoswiss/`.

**Different repo name?** Update `base` in `vite.config.ts` to match (e.g. `/my-repo-name/`).

**Custom domain or root deployment?** Build with `VITE_BASE=/ npm run build`.

## Project structure

```
.
├── index.html              # entry HTML
├── package.json
├── tsconfig.json           # TypeScript config (strict)
├── vite.config.ts          # Vite + alias @/ → src/
├── tailwind.config.js      # design tokens (navy, teal, gold, etc.)
├── postcss.config.js
├── eslint.config.js        # flat config, TS + React Hooks
├── .prettierrc.json
├── src/
│   ├── main.tsx            # React entry
│   ├── App.tsx             # router + providers
│   ├── styles/globals.css  # Tailwind + base styles
│   ├── data/               # building, modules, contractors, subsidies, steps
│   ├── lib/                # store, format, finance, icons, hooks, clsx
│   ├── components/         # Layout, Sidebar, MobileTopBar, Logo, StepNav
│   │   └── ui/             # Card, Button, Badge, Stat, StatBar, RatingStars,
│   │                       # GeakBar, ProgressDots, SectionHeading
│   └── steps/              # one file per step (Landing, BuildingProfile, …)
└── .github/workflows/
    └── deploy.yml          # CI: typecheck + build + publish to Pages
```

## State and persistence

- All user state (selected modules, contractors, address) lives in `src/lib/store.tsx`
  via React Context + a `usePersistedState` hook backed by `localStorage`.
- Refreshing the page preserves progress. Use the **Reset demo** button in the sidebar
  to clear it.

## Routing

Hash-based routes (`/#/building`, `/#/contractors`, …) so the site works on GitHub Pages
without a 404 fallback. Each step has a real URL — bookmarkable, shareable, and the
sidebar uses `NavLink` for active-state styling.

## Responsive layout

- **≥ 1024px (desktop):** persistent sidebar nav with full step list and reset control.
- **< 1024px (mobile/tablet):** sticky top bar with logo and progress dots; `StepNav`
  prev/next buttons at the bottom of each step.

## Design system

Tailwind theme tokens in `tailwind.config.js`:

| Token       | Hex       | Use                              |
| ----------- | --------- | -------------------------------- |
| `navy`      | `#0F2B3C` | primary text, dark backgrounds   |
| `teal`      | `#0E6655` | brand accent, primary actions    |
| `emerald`   | `#1A8C6E` | positive deltas, "done" states   |
| `gold`      | `#B8860B` | premium accents (WCAG-compliant) |
| `gold-soft` | `#D4A843` | gold on dark backgrounds         |
| `mint`      | `#A8D8C8` | mint highlights on navy          |
| `ink`       | `#2C3E50` | body text                        |
| `muted`     | `#7F8C8D` | secondary text                   |
| `line`      | `#E8EDEB` | borders, dividers                |
| `surface`   | `#F7F9F8` | page background                  |
| `canvas`    | `#EDF2EF` | inset background                 |
