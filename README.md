# RenoSwiss

Interactive demo of a Swiss home-renovation planning platform: building analysis, module selection, contractor matching, subsidy optimization, financing calculator, timeline, and summary.

Built with **React 18 + Vite**. Deployed to **GitHub Pages** via GitHub Actions.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173/renoswiss/
npm run build        # outputs to dist/
npm run preview      # preview the production build
```

## Deploying to GitHub Pages

The workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

**One-time setup:**

1. Push this repo to GitHub. The repo name **must** be `renoswiss` (so the URL is `https://<user>.github.io/renoswiss/`).
2. In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The Actions tab will show the deploy. After it succeeds, your site is live at `https://<user>.github.io/renoswiss/`.

**If your repo has a different name**, update `base` in `vite.config.js` to match (e.g. `/my-repo-name/`).

**Custom domain or root deployment?** Build with `VITE_BASE=/ npm run build`.

## Project structure

```
.
├── index.html              # entry HTML
├── package.json            # deps + scripts
├── vite.config.js          # Vite config (base path for GH Pages)
├── src/
│   ├── main.jsx            # React mount point
│   └── App.jsx             # the entire demo
└── .github/workflows/
    └── deploy.yml          # CI: build + publish to Pages
```
