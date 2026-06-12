# Foretera — Pricing & Monetization Strategy

_Drafted 2026-06-12. Companion to `UX_CLUB_NETWORK_STRATEGY.md`: clubs are who
we sell to, players are who we delight. Pricing follows that split — **the club
pays; the player plays free.** Status: PROPOSAL for Bryan to pressure-test._

---

## 1. The shape of the market (anchors)

| Comparable | What it is | Price |
|---|---|---|
| Golf Genius TM Club Premium | Club tournament software (the incumbent staff tool) | **~$3,500/yr** + $500 onboarding ([pricing](https://golfgenius.com/products/tm/pricing), [GAM](https://gam.org/membership/club-services/golf-genius-tm/)) |
| Golf Genius Trip | Consumer event organizer | $249 / 6 months |
| TheGrint Pro | Consumer handicap + stats app | $19.99/yr (handicap) / ~$7.99/mo premium ([roundup](https://outofboundsgolf.com/top-golf-apps/)) |
| 18Birdies Premium | Consumer GPS/stats app | free core + premium tier (~$99/yr ballpark) ([18Birdies](https://help.18birdies.com/article/520-is-the-app-free)) |

Two takeaways:
1. **Clubs already budget thousands per year** for member-facing golf software —
   a $1–2k line item that demonstrably engages members is an easy yes next to a
   $3.5k Golf Genius renewal.
2. **Players expect free core + a modest optional premium** ($20–100/yr). Nobody
   pays to *post a match* — charging players for liquidity kills the network.

---

## 2. Primary revenue: Club Network Membership (B2B)

The product a club buys (strategy doc A3): branded board (crest + club color),
gold **Foretera Club** status, the members' leaderboard scope, the staff pulse
dashboard (matches/week, players active, live now — recurring proof of value),
surface priority in member discovery, and the member-onboarding kit (QR poster
for the pro shop).

### The two offerings (Bryan's framing: monthly or annual)

| | **Monthly** | **Annual** |
|---|---|---|
| Club Network Membership | **$149/mo** | **$1,490/yr** (2 months free) |
| Founders rate (first 10 clubs, locked for life) | $99/mo | $990/yr |

- One flat price per club (a club = a course today; 27/36-hole properties count
  as one club). No per-member pricing — GMs hate variable invoices, and flat
  pricing makes the member-count growth *our* upside argument, not their cost.
- Annual is the push (cash up front, renewal ritual once a year, matches club
  budget cycles); monthly exists to kill the commitment objection.
- **Founders tier is the wedge**: "first 10 clubs in the metro lock $990/yr
  forever" creates urgency and seeds the network density the product needs.

### Why $149/mo
- ~40% of the Golf Genius anchor for a tool members touch daily, not 6
  tournaments a year.
- Less than one cart fee a day. The sales line: *"one extra member round a
  month covers it; 37 of your members already asked for this."* (The A2 demand
  counter is the close.)
- High enough to signal "real product," low enough that a GM can approve it
  without a board vote.

### Billing mechanics (important)
- **Sell club memberships OUTSIDE the app** (Stripe invoice/checkout from a
  claim link) — B2B SaaS owes Apple nothing. Never route club billing through
  IAP (30% haircut + review entanglement).
- The claim path (A4) ends at a Stripe checkout; `clubs.status` flips to
  `network` on webhook. That's the entire billing integration for v1.

### Revenue math (annual plan)
| Network clubs | ARR |
|---|---|
| 10 (founders) | ~$10k |
| 50 | ~$75k |
| 200 | ~$300k |
| 500 | ~$745k |

KC metro alone has ~60 public/semi-private courses; the model scales by metro.

---

## 3. Secondary revenue: player premium (LATER — do not ship yet)

Core stays free forever: posting, accepting, scoring, the reveal, the feed,
records. Liquidity is the product; a paywall anywhere in the match loop is
fatal (strategy doc B1).

When liquidity is real, add **Foretera Member+** (working name):
- **$4.99/mo or $39.99/yr** (between TheGrint and 18Birdies; impulse-priced).
- What's plausibly premium *without* touching liquidity: deep career analytics
  (rivalry breakdowns, course-form trends, season recap "wrapped" share), vanity
  (profile flair, custom reveal themes, animated crests), early access features,
  multi-club leaderboard views.
- Billed via IAP (consumer) — reuse the TrueForecast RevenueCat stack
  (entitlements, paywall, App Store compliance already solved there).
- A member at a NETWORK club could get Member+ included — makes the club sale
  richer ("your members each get a $40 perk") at zero marginal cost.

## 4. Tertiary levers (parking lot)
- **Event mode**: member-guest / league brackets as a one-off ($199–249 per
  event, Golf Genius Trip anchor) — staff-run, complements the network sub.
- **Association/white-label**: state golf associations license the network for
  their club roster (per-club wholesale).
- **Local sponsorships**: a pro shop or 19th-hole sponsor card on a club board,
  sold BY the club (we provide the slot as a network feature, club keeps the
  revenue — strengthens the club's ROI story rather than competing with it).

## 5. Sequencing
1. **Now (pre-revenue):** grow prospect-board demand signals (A2) — every tap is
   pipeline. Free everywhere.
2. **First dollar:** founders annual ($990) hand-sold to ~10 KC clubs once A3
   payoff surfaces exist (branded board + club leaderboard + staff pulse).
3. **Standard pricing** ($149/$1,490) once founders slots fill.
4. **Member+** only after open-invite fill rate and weekly active boards say
   liquidity is durable.

## 6. Open questions for Bryan
- Founders count: 10 clubs or 25? (Smaller = more urgency, less early ARR.)
- Does a network club's staff get comp'd Member+ seats for the pro/GM?
- Private clubs vs public: same price? (Privates may want member-only boards —
  a future `clubs.visibility` flag.)
- Annual-only at launch? (Simplifies ops; monthly can arrive with self-serve.)

Sources: [Golf Genius TM pricing](https://golfgenius.com/products/tm/pricing) ·
[GAM on TM Club](https://gam.org/membership/club-services/golf-genius-tm/) ·
[Out of Bounds golf-app roundup](https://outofboundsgolf.com/top-golf-apps/) ·
[18Birdies free/premium](https://help.18birdies.com/article/520-is-the-app-free)
