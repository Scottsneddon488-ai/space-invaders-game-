# Build Brief: Personal Finance Dashboard

## Status

Built and merged to `main`. This document records what was built and how
it's structured, for reference in future sessions.

## What this app is

A single-page personal finance dashboard, built with Vite + React. Despite
the repository name (`space-invaders-game-`), the app that was actually
requested and implemented is a finance dashboard, not a game.

## Stack

- **Build tool:** Vite 5
- **UI:** React 18
- **Charts:** Recharts (`AreaChart` for the cashflow view)
- **Icons:** lucide-react
- **Persistence:** `window.storage` (get/set), with a `localStorage`-backed
  shim installed in `src/main.jsx` so the app also works standalone, outside
  the hosting runtime that originally provided `window.storage`.

## Structure

- `index.html` — app shell, mounts `#root`, sets light/dark background to
  avoid a flash of the wrong color before React hydrates.
- `src/main.jsx` — React entry point; installs the `localStorage` fallback
  for `window.storage` before rendering.
- `src/PersonalDashboard.jsx` — the entire app (single component file):
  - **Theming:** a light/dark token set (`theme`), resolved per-mode via
    `tone(mode)`. Follows `prefers-color-scheme` by default; a header
    toggle sets an explicit override that's persisted via `window.storage`.
  - **Data adapter (`financeAdapter`):** currently backed by in-memory
    sample data (`sampleAccounts`, `sampleBills`, `sampleCashflow`). Written
    as an adapter so a real bank feed or payments API can be swapped in
    later without changing the UI.
  - **Tabs:**
    - `overview` — account balances and upcoming bills (both editable),
      plus an income/expenses cashflow area chart.
    - `todo` — a to-do list.
    - `diary` — a diary/notes view.
  - All user edits (balances, bills, to-dos, diary entries, theme
    preference) persist through `window.storage`.

## Deployment

A draft PR (#2, `netlify.toml`) adds a Netlify build config
(`npm run build`, publish `dist/`) so the app can be deployed by connecting
this repo to Netlify.

## Possible follow-ups

- Replace the sample data in `financeAdapter` with a real data source
  (bank feed, CSV import, or a payments API).
- Consider renaming/re-describing the repository, since its name
  (`space-invaders-game-`) no longer matches its contents.
- Merge PR #2 (Netlify config) once ready to deploy.
