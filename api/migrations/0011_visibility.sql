-- 0011 — per-match visibility. Private (the default) = only the two players can
-- see the match and its result. Public = also surfaced in the course feed
-- (today's activity at a course). The creator can flip it until a scorecard is
-- in, then it locks (you can't retroactively expose a result mid-play). No money
-- is ever exposed — stakes are gone app-wide.
ALTER TABLE matches ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'public'));

-- Feed reads filter by course_name + play_date + visibility, so index those.
CREATE INDEX IF NOT EXISTS idx_matches_feed
  ON matches (course_name, play_date, visibility);
