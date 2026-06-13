-- 0016 — the network-club VALUE tier (UX_CLUB_NETWORK_STRATEGY A3).
--
-- Until now club.status only drove cosmetics. This adds the two things a club
-- actually pays for: monthly CHAMPIONS (member hook) and a STAFF roster so the
-- in-app pulse dashboard can be gated. Plus the pinned-note field for the
-- personalized board.
--
-- ⚠️ Apply remote via `wrangler d1 execute match-play --remote --file=...`
-- (remote migration tracker is out of sync; never `migrations apply --remote`).

-- Who manages a club (gates the staff dashboard + crest/settings writes).
-- Beta: seeded by hand until claim→checkout auto-provisions it.
CREATE TABLE IF NOT EXISTS club_staff (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL,   -- -> clubs.id
  user_id    TEXT NOT NULL,   -- -> users.id
  role       TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_staff_unique ON club_staff(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_club_staff_user ON club_staff(user_id);

-- Permanent monthly crowns, written by the month-end cron (network clubs only).
-- Three categories per club per month; the live current-month leaders are
-- derived on the fly and never stored here.
CREATE TABLE IF NOT EXISTS club_champions (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL,   -- -> clubs.id
  month      TEXT NOT NULL,   -- 'YYYY-MM'
  category   TEXT NOT NULL CHECK (category IN ('won','played','win_pct')),
  user_id    TEXT NOT NULL,   -- -> users.id (the crowned member)
  value      REAL NOT NULL,   -- wins / matches / win-pct, per category
  detail     TEXT,            -- human label, e.g. '9 wins' / '82% (11–2)'
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_champions_unique ON club_champions(club_id, month, category);
CREATE INDEX IF NOT EXISTS idx_club_champions_club ON club_champions(club_id, month);

-- Staff-set note shown on the personalized board (Pillar 3 display).
ALTER TABLE clubs ADD COLUMN pinned_message TEXT;
ALTER TABLE clubs ADD COLUMN pinned_at TEXT;
