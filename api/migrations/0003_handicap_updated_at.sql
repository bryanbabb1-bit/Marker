-- 0003 — track when a user's Handicap Index was last set, so the app can nudge
-- a stale index before posting/accepting a match (the index is locked onto the
-- match at those moments — pre-round — so it can't be gamed at score entry).
ALTER TABLE users ADD COLUMN handicap_updated_at TEXT;
