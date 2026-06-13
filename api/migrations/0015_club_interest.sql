-- 0015 — club demand signals (UX_CLUB_NETWORK_STRATEGY.md item A2).
--
-- Every "Tell your pro" tap on a prospect board lands here, one row per member
-- per club (a count of PEOPLE, not taps — "37 of your members asked" must be
-- honest). This counter is the single most persuasive line in the sales email
-- to that club's GM, and the claim screen shows it back as social proof.
--
-- ⚠️ Apply remote via `wrangler d1 execute match-play --remote --file=...`
-- (the remote migration tracker is out of sync; never `migrations apply --remote`).

CREATE TABLE IF NOT EXISTS club_interest (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL,   -- -> clubs.id
  user_id    TEXT NOT NULL,   -- -> users.id
  created_at TEXT NOT NULL
);

-- One signal per member per club.
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_interest_unique ON club_interest(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_club_interest_club ON club_interest(club_id);
