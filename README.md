# Bolão NFL 2026 — Will vs Sara

A two-person NFL pool for the 2026 season. Will and Sara pick a winner and a winning margin (5 / 10 / 15 / 20) for every game. No passwords. Use **I’m Will** or **I’m Sara** at the top. Each person’s card is separate.

This is not a money site. It is the house board for one bolão.

**Live site:** https://wkk-ai.github.io/nfl-bolao/

Every push to `main` publishes that page (GitHub Pages, static export). You can also run a copy by hand from the Actions tab.

## How to run it locally

1. Install Node.js 20+.
2. In this folder: `npm install`
3. `npm run dev`
4. Open http://127.0.0.1:43147

To preview the same static files GitHub Pages serves: `npm run build` then `npm start`, and open http://127.0.0.1:43147/nfl-bolao/

The app loads the 2026 ESPN week slate (weeks 1–5). If you do not add a Supabase project, picks live in this browser only and a **Demo data** tag shows. That is enough to use every page.

## Scoring (also on the Rules page)

- Right winner: 3 points
- Exact margin bucket: +2
- One bucket off: +1
- Wrong winner: 0
- Every winner right in a finished week: +10 bonus

Buckets: **5** = win by 1–7, **10** = 8–12, **15** = 13–17, **20** = 18+. Games lock at kickoff.

## Optional: Supabase

Copy `.env.example` to `.env.local` and fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor. Tables: players, weeks, games, picks, results, reactions.

## Keep a free Supabase project awake

GitHub Action `.github/workflows/supabase-keepalive.yml` pings the database once a day (and when you run it by hand).

Add these two **repository secrets** (GitHub → Settings → Secrets):

- `SUPABASE_URL` — the same project URL
- `SUPABASE_ANON_KEY` — the same anon key

A static note lives at `/nfl-bolao/health/`. That is not a live database check.

## What is in the app

Home, season weeks, matchups, pick (winner then margin), review, confirmation, leaderboard, week reveal, Will and Sara pages, history, rules, badges. Head-to-head meter, season chart, streaks, weekly awards, trash-talk chips, unpicked reminders, kickoff locks, team logos/colors.

Inspired by Superbru, ESPN Pigskin Pick’em, Yahoo Pick’em, office-pool boards, and Brazilian bolão culture — built as one working two-player board, not a generic dashboard.
