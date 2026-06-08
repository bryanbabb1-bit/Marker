# Punch List — things to come back to

Living list of deferred setup, decisions, and follow-ups. Newest concerns at top.

## 🔴 Blocked on Bryan — set up Clerk auth (needed to run anything end-to-end)
The backend + app are built and typecheck clean, but nothing runs end-to-end
until a Clerk instance exists. ~3 minutes:

1. dashboard.clerk.com → **Create application**, name it **Match Play**
   (a brand-new app — NOT TrueForecasting's; keep the apps un-intermixed).
2. Enable **Email + Password** sign-in (what the sign-in screen uses).
3. Copy from **API Keys**:
   - Publishable key → `pk_test_…`
   - Secret key → `sk_test_…` (sensitive)
4. Hand both to Claude. Claude then:
   - puts `pk_…` in `app/.env` (`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - puts `sk_…` + `pk_…` in `api/.dev.vars` (local) and via
     `wrangler secret put` (remote)
   - deploys the Worker, points the app at it, runs the full loop
     (sign up → set handicap → post match → accept → message).

Until then: auth-gated endpoints return 401 and the app stops at the sign-in
screen. Everything else is in place.

## 🟡 GHIN / GPA — the source-of-truth integration (long-lead)
Decision settled (see `docs/V1_REVISION.md`): GHIN via the USGA **GPA program**
is viable; indie precedent exists (GolfApp). Open actions:
- Contact USGA GPA team for eligibility / fees / timeline (a phone call, not a
  public price sheet — the one unknown).
- Beta bootstrap meanwhile: players self-enter GHIN# + index, Bryan verifies
  each against the GHIN lookup. `users.ghin_number` already stored as the key.
- Do NOT build on the reverse-engineered `api.ghin.com` (ToS violation).

## 🟡 Real Prairie Highlands scorecard data
The course model ships seeded with a **clearly-labeled SAMPLE course** so the
engine runs end-to-end. Before real play, enter Prairie Highlands' actual
data per tee — par + stroke index per hole, Course Rating, Slope — verified
against the physical card / Prairie's site. (Seed file: `api/seeds/`.)

## 🟢 Deferred polish / later phases
- Discovery **swipe-gesture deck** (currently Accept/Pass buttons — same actions).
- Realtime messaging vendor (currently 5s polling) + push notifications.
- Photo/OCR scorecard verification layer ("Marker" reborn) — post-MVP.
- 9-hole handicap allocation uses a documented approximation (half the 18-hole
  course-handicap difference, allocated within the nine) — revisit for exact
  WHS 9-hole course handicap if it matters in play.
- Player records / hot streaks / per-club leaderboards (Phase 4).
