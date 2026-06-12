# FORETERA — Architecture (as built)

_Living document — updated on every meaningful push (see changelog at the
bottom). Repo `bryanbabb1-bit/Quell`; internal codename "quell" survives in the
bundle id, slug, and folder names. The original pre-build plan (Node + Postgres
+ Firebase + scorecard OCR) is in git history; what follows is what actually
runs._

---

## 1. What Foretera is

A golf head-to-head **match-play network**: post an open match (course, date,
format, handicap window) → another member accepts → both enter scores privately
→ a server-enforced hidden lock keeps each card sealed until both are in → the
engine settles the match net (WHS) and the players watch a hole-by-hole
**reveal**. Around that loop: a per-course **club board** (open invites, live
matches, finals, club pulse), career **records** (rivalries, course form,
milestones, leaderboards), match-scoped **messaging** (text + GIFs), and the
**club network** layer that monetizes it (see `UX_CLUB_NETWORK_STRATEGY.md`
and `PRICING.md`).

Positioning: an exclusive golf network (Black + Gold "Members" brand), NOT a
scorecard app — and explicitly NOT a wagering service. Stakes are display-only;
no money ever moves through the app.

## 2. Stack

| Layer | Tech | Notes |
|---|---|---|
| App | Expo / React Native, Expo Router, TypeScript | One codebase, both stores; EAS builds; OTA for JS |
| Animation | Reanimated + Gesture Handler | Swipe deck, reveal choreography, celebrations |
| State | Zustand stores (`app/store/`) | user, courses (session-cached), favorites, results badge, theme |
| Auth | Clerk (`@clerk/clerk-expo` + `@clerk/backend`) | JWT verified at the edge; token refresh + 401 retry in `lib/api.ts` |
| API | Cloudflare Worker (`api/src/index.ts`) | Route modules in `api/src/routes/` |
| Data | Cloudflare D1 (SQLite) | System of record; migrations in `api/migrations/` |
| Files | Cloudflare R2 (`quell-photos`) | Profile photos via `POST /photo` |
| Push | Expo Push | Token registered on `users`; never returned to clients |
| GIFs | Giphy (proxied) | `GET /gifs` keeps the key server-side |
| Cron | Workers scheduled (hourly) | Score reminders → forfeit; reminder state on `matches` |

Why: near-zero cost when idle, automatic scale when busy — the right shape for
a club that's loud on Saturday and silent on Tuesday.

## 3. Data model (D1, migrations 0001–0014)

- **users** — identity, Handicap Index (manual, GHIN-ready) + `handicap_updated_at`,
  photo, `home_course_id`, timezone, push token (write-only; clients get `push_enabled`).
- **clubs** *(0014 — the monetization object)* — name, crest_url, primary_color,
  contact, **`status: network | prospect`**, joined_at. 1:1 with courses today;
  multi-course clubs merge by repointing `courses.club_id`.
- **courses → tees → holes** — real USGA data (CR/Slope/par per tee incl.
  front/back splits, per-hole par + stroke index). Imported from GolfCourseAPI
  (`scripts/import_courses.mjs`); 11 KC-metro courses seeded.
- **matches** — creator/opponent, status
  (`open|pending|accepted|in_progress|completed|declined|cancelled|expired`),
  course/tee **per player** (`tee_id` / `opponent_tee_id`), date/time, format
  (`front_nine|back_nine|eighteen`), `visibility (private|public)`, stakes
  (display only), hcp window, **handicap snapshots** (creator at post, opponent
  at accept), scorecard ids, result, `match_progression` JSON, scoring-started
  stamps, reminder/forfeit/nudge stamps.
- **scorecards** — hole-by-hole gross per player (`[{hole, gross}]`), unique per
  (match, player).
- **messages** — match-scoped, text or `gif_url` (allowlisted Giphy CDN).
- **favorites / blocks / reports** — social graph + safety; blocks filter both
  directions everywhere (discovery, feed, challenges, accept).

## 4. Invariants the server enforces

1. **Hidden-entry lock** — no API response contains the opponent's card until
   both scorecards exist; the reveal endpoint refuses until `status='completed'`.
2. **Handicap snapshots** — locked onto the match row at post/accept; profile
   changes never rewrite a settled match. Null snapshot ⇒ scratch (0.0).
3. **Per-player tees** — each side's Course Handicap and stroke allocation come
   from THEIR tee (`(HI × Slope/113) + (CR − Par)`, strokes by that tee's SI
   order; nine-hole matches use the nine's segment ratings).
4. **Full-round settle** — the engine plays all holes (true gross totals) but
   locks result/`final_delta` at the closeout hole ("3 & 2").
5. **Guarded transitions** — status changes are conditional UPDATEs
   (`WHERE status IN (...)`), so races (double-accept, cancel-vs-settle,
   cron-vs-player) can't stomp a terminal state.
6. **Privacy projections** — non-participants get display-safe match rows
   (no handicaps/stakes/progression/scorecard ids); public+completed matches
   are the deliberate spectator surface (reveal + scorecard).
7. **Not a betting app** — stakes are a display string end to end.

## 5. Surfaces (5-tab navigation)

| Tab | What it is |
|---|---|
| **Discovery** | Swipe deck of compatible open matches (handicap-window filtered, home-course soft preference) — *action* |
| **Feed** | The club's room: course switcher, gold **Foretera Club** badge (network clubs), club pulse strip, "Looking for a game" open invites with **accept-in-place**, date-browsable Now Playing / Final Results — *community* |
| **My Matches** | The caller's matches across all states |
| **Record** | Career page: W–L–H hero, streaks/bests, milestones, rivalries (+ rematch), course form, recent results, favorites, Home/Global leaderboard |
| **Profile** | Identity, index, home club; **Settings lives behind the header menu (hamburger), not a tab** |

Detail stack: match detail, score entry, reveal (participant + spectator
modes), shared scorecard, player profile, messages, create/challenge (modal),
onboarding, settings.

## 6. Club network layer (the business)

`clubs.status` drives everything (strategy doc A1 — **shipped**):
- `network` → gold badge on the board today; next: crest/colors, club
  leaderboard scope, staff pulse dashboard (A3).
- `prospect` → next: the "ask your pro/GM" card + share-with-club lead-gen with
  demand tracking (A2), then "claim your club" → Stripe checkout flipping the
  flag (A4). Club billing happens OFF-app (B2B SaaS — no app-store cut);
  pricing in `PRICING.md` ($149/mo · $1,490/yr · founders $990/yr).

## 7. Ops & conventions

- **Deploy:** `npx wrangler deploy` from `api/` (Worker
  `match-play-api.bryan-babb1.workers.dev`). App JS ships by reload/OTA; icon,
  splash, and native modules need an EAS build.
- **Migrations:** local via `wrangler d1 migrations apply match-play --local`;
  **remote via `wrangler d1 execute --remote --file=...`** — the remote
  migrations tracker is out of sync; never `migrations apply --remote`.
  Changing an enum CHECK requires a full table rebuild (see 0012).
- **Seeds:** `api/seeds/` (idempotent, `DELETE … LIKE` first).
  `scripts/gen_big_seed.mjs` builds the 52-match network demo (8 clubs, all
  lifecycle states, real tees + pars, scratch-settle progressions). Generate
  via `cmd /c "node … > file"` (PowerShell `>` writes UTF-16, which wrangler
  rejects).
- **QA:** `powershell -File qa.ps1` (api tsc + vitest engine suite + app tsc) on
  every push, plus the testing agents in `.claude/agents/` per the matrix in
  `AGENTS.md` (release-qa always; contract-checker on API changes;
  engine-tester on scoring changes; ux-auditor on screen changes).
- **Hard-won client rules:** never top-level-import a native module in a route
  file (drops the route/boot); Clerk `getToken` never in effect deps (use a
  ref); no stacked iOS Modals; theme tokens only (no hex in screens).
- **Brand assets:** `store-assets/generate_black_gold.ps1` regenerates
  icon/splash/adaptive + store images from the F-pin mark (champagne→bronze on
  `#0C0C0E`).

## 8. Roadmap pointers

Sequenced in `UX_CLUB_NETWORK_STRATEGY.md`: A2 prospect prompt → A3 club payoff
→ A4 claim path → B1 cold-start liquidity → B4 Feed/Discovery sharpening → B5
rematch on the reveal. Plus: reveal premium redesign (Phase 2), reschedule flow
(decisions locked), photo-verification trust layer (the original Quell OCR) as
a later anti-cheat option, GHIN auto-lookup.

---

## Changelog (meaningful pushes)

| Date | HEAD | What changed |
|---|---|---|
| 2026-06-12 | (this push) | **Spectator broadcast mode** on the reveal (named deltas, per-player colors `live`/`liveAlt`, neutral backdrop, legend — no more creator-POV for bystanders); **club masthead** on the Feed (crest/monogram, network lockup, gold-trimmed pulse); first agent-gated release (release-qa PASS + ux-audit findings fixed pre-push) |
| 2026-06-12 | `d7a7847` | Tabs 6→5 (Settings behind the header menu); testing agents (`.claude/agents/` + `AGENTS.md`); `PRICING.md`; white paper v1.1; this doc rewritten as-built |
| 2026-06-12 | `e5da0db` | **Clubs model (A1)** — migration 0014, network/prospect flag, gold badge; accept-from-feed; 52-match seed across 8 clubs; Black + Gold icon/splash/store assets |
| 2026-06-12 | `bb2bccf` | Feed → club board (open invites + pulse); Record → career page (rivals, course form, milestones, bests) |
| 2026-06-10 | `c57a2e6` | Black + Gold "Members" rebrand; member-card discovery; home-course soft preference |
| 2026-06-10 | `12e2880` | Full-review fix batch: status CHECK rebuild (0012), blocks/reports, account deletion, security projections |
| earlier | — | See git history: per-player tees (0009), visibility + course feed (0011), GIFs (0010), forfeit cron (0008), real course data, Clerk/R2/push foundations |
