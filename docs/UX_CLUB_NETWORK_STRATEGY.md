# Foretera — UX & Club-Network Strategy

_Reviewed 2026-06-12 against the live UI (Discovery, Feed, My Matches, Record,
Profile, Settings, Create, Match detail). The angle: **clubs are the audience we
sell to; players are the audience that uses it.** Every recommendation below is
scored on that balance._

---

## The core gap

The app already speaks the language of clubs — the Feed says "Around the club,"
"club pulse," "the open network at this course." But under the hood there is **no
club object and no network membership.** A `course` is just a public venue;
`courses.club_id` exists in the schema (`0002_courses_and_scores.sql`) but is
unused, and there is no notion of a course being _in_ or _out_ of the Foretera
network.

That missing distinction is the entire monetization story. Until a club can be
"in the network" (and visibly better off for it), there is nothing to sell a pro
or GM, and no reason for a member at a non-network club to recruit theirs.

**So the #1 recommendation is to make "network club" a first-class concept** and
build the two prompts that flow from it (below). Everything else is polish that
makes the player side sticky enough to be worth a club's money.

---

## A. Build the club network (the money layer)

### A1. Model a `club` and a network flag — _high impact, foundational_
- Promote `courses.club_id` into a real `clubs` table: `id, name, crest_url,
  primary_color, contact_email, contact_name, status ('network' | 'prospect'),
  joined_at`.
- A course belongs to a club; a club is either a paying **network** member or an
  unclaimed **prospect**. This one flag drives every surface below.

### A2. The "join the network" prompt — _the sales hook you described_
When a member views the Feed/board for a course whose club is **not** in the
network, show a tasteful card (not a nag) at the top of that board:

> **Prairie Highlands isn't a Foretera club yet.**
> Want your club's leaderboard, crest, and a members' board here?
> Ask your pro or GM to join. → **[Share with your club]**  ·  _hello@foretera.com_

- One tap to share (prefilled email/text the member sends to staff) turns every
  player into a lead-gen channel — exactly the flywheel.
- Track taps as a demand signal: "37 of your members asked for this" is the
  single most persuasive line in the eventual sales email to that GM.
- Keep it gentle and dismissible. The board must still be fully usable so the
  player never feels walled out.

### A3. In-network payoff — _what the club is buying_
Make network membership visibly better so the upgrade is obvious:
- **Branded board:** club crest + accent color on the Feed header; a verified
  gold "Network Club" badge in discovery and on the board.
- **Members' leaderboard:** the Record tab already has Home vs Global — add a
  **Club** scope that only network clubs get, framed as "your club's standings."
- **Surface priority:** a network club's games float to the top of its members'
  Discovery (the home-course soft-preference already exists — extend it).
- **Staff pulse:** the `CoursePulse` card (matches this week / players active /
  live now) already exists for players. Package the same data as a lightweight
  **pro/GM dashboard** — that's the recurring-value artifact a club pays for.

### A4. A claim/contact path — _close the loop_
- A simple "Is this your club? Claim it" entry on every prospect board → routes
  to `contact_email`/a form. Lets staff self-identify without a sales call.
- Store `contact_email` per club so the prompt can show the right address.

---

## B. Make the player side stickier (so the club layer is worth buying)

A club only pays if its members actually use it. These tighten the player loop.

### B1. Reduce the empty-feed cold start — _highest player-side risk_
The Feed/Discovery are only as good as their liquidity. A brand-new club board
will be empty, which reads as "dead app." Mitigate:
- **Seed visible demand:** let a player post an open invite for a _future_ date
  with one tap ("Looking for a game Saturday") even before anyone's online.
- **Cross-course nudge:** if a player's home board is quiet, surface nearby
  courses' open invites ("3 games within 20 min of you") instead of an empty
  state.
- **Notify on match:** push when a compatible open match posts at the home club
  — the reminders/push plumbing already exists (`lib/notifications.ts`).

### B2. Tighten onboarding to the club — _new-member welcome is the pitch_
- Onboarding already captures home course. Add a one-line outcome: _"You'll see
  games at <Home Club> first."_ so the value is immediate.
- If the chosen home course is a network club, badge it during onboarding ("✓ a
  Foretera club") — reinforces that membership matters.

### B3. Trim the tab bar from 6 → 5 — _navigation altitude_
Six tabs (Discovery, Feed, My Matches, Record, Profile, Settings) is one past
where mobile bottom bars stay legible. **Fold Settings into Profile** (a gear in
the Profile header). Settings is low-frequency; Profile + Settings are both
"about me." That frees the bar for the surfaces members actually live in.

### B4. Make the Feed the club's home, not a parallel Discovery — _clarify roles_
Right now Discovery (swipe) and Feed (board) both surface open matches, which
blurs them. Sharpen the split:
- **Discovery = action** (swipe to accept, personal, handicap-filtered).
- **Feed = the club's room** (who's here, what happened today, the pulse).
This is also what makes the Feed the natural home for club branding (A3).

### B5. One-tap rematch & challenge are buried — _surface the rivalry loop_
Rematch/Challenge exist (Record rivalries, player profile) but are deep. A
"Rematch" affordance directly on a completed match's reveal/result screen keeps
the competitive loop spinning without a tab hunt.

---

## C. Polish & consistency (lower effort, real lift)

- **Brand color drift:** store assets + splash use navy `#050E1B`
  (`store-assets/README.md`, `app.json`), but the in-app theme is Black + Gold
  (`theme.ts`). Pick one master brand statement. Recommended: **black + gold is
  the brand; navy is the deep accent** (this is what the white paper assumes).
  Align the splash/store assets to that so first-launch matches the app.
- **Stakes display:** keep the "context only / not a betting app" framing
  loud at every point stakes appear — it's a store-review and legal safeguard,
  and it's currently strongest only in onboarding copy.
- **Empty states as CTAs:** the Feed empty state ("No one's posted…") is good;
  apply the same "do something" tone to a quiet Discovery deck and the Record
  tab before a first match.
- **Leaderboard self-row:** already highlighted — make the club-scope version the
  default for network-club members (their club is who they care about).

---

## Recommended sequencing

| Priority | Item | Why first |
|---|---|---|
| 1 | A1 `clubs` model + network flag | Unblocks the entire monetization story |
| 2 | A2 "ask your pro/GM" prompt | The growth + sales engine you described |
| 3 | A3 branded board + club leaderboard + staff pulse | The thing a club actually pays for |
| 4 | B1 cold-start liquidity | Keeps boards from looking dead pre-network |
| 5 | B3/B4 navigation + Feed/Discovery split | Cheap clarity that lifts daily use |
| 6 | C brand alignment + copy | Polish that makes #3 credible to a buyer |

The throughline: **A1–A3 give the club something to buy; B1–B4 make members use
it enough that buying is a no-brainer.** That's the balance — sell to clubs,
delight players.
