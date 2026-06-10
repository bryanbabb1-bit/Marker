-- 0009 — per-player tees. Golf lets opponents play different tees (WHS handles
-- it via each player's own Course Rating/Slope/Par). The match already stores the
-- CREATOR's tee in tee_id/tee_color; add the OPPONENT's so each side's course
-- handicap + stroke allocation come from the tee they actually play.
ALTER TABLE matches ADD COLUMN opponent_tee_id TEXT;     -- -> tees.id; NULL until accepted
ALTER TABLE matches ADD COLUMN opponent_tee_color TEXT;  -- display name ('Blue'/'White'/...)

-- Backfill already-accepted matches to the same tee as the creator (the prior
-- behavior), so nothing in flight changes result.
UPDATE matches
   SET opponent_tee_id = tee_id, opponent_tee_color = tee_color
 WHERE opponent_id IS NOT NULL AND opponent_tee_id IS NULL;
