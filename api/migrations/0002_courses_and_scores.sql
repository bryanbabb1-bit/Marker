-- 0002 — national course model + manual score entry (Phase 3).
--
-- Course data is structured for nationwide scale (course -> tees -> holes) and
-- carries everything the WHS course-handicap math needs: Course Rating, Slope,
-- Par per tee, and par + stroke index per hole. users.handicap is the
-- Handicap Index; the engine course-adjusts it at determination time.

CREATE TABLE courses (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  club_id     TEXT,            -- -> clubs.id (clubs land in Phase 4)
  city        TEXT,
  state       TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE tees (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL,   -- -> courses.id
  name          TEXT NOT NULL,   -- 'Blue' / 'White' / 'Black' ...
  gender        TEXT NOT NULL DEFAULT 'M' CHECK (gender IN ('M','F')),
  course_rating REAL NOT NULL,   -- e.g. 71.5
  slope_rating  INTEGER NOT NULL,-- 55..155
  par           INTEGER NOT NULL
);

CREATE TABLE holes (
  id            TEXT PRIMARY KEY,
  tee_id        TEXT NOT NULL,   -- -> tees.id
  hole_number   INTEGER NOT NULL,-- 1..18
  par           INTEGER NOT NULL,
  stroke_index  INTEGER NOT NULL -- 1..18 difficulty rank (allocation order)
);

CREATE INDEX idx_tees_course ON tees(course_id);
CREATE INDEX idx_holes_tee   ON holes(tee_id, hole_number);

-- Link a match to the tee actually played, so the engine can pull pars +
-- stroke indexes + rating/slope. Nullable: free-text matches (no linked tee)
-- simply can't auto-compute a result until a tee is attached.
ALTER TABLE matches ADD COLUMN tee_id TEXT;

-- Reshape scorecards from photo/OCR fields to MANUAL hole-by-hole entry.
-- The table is empty (nothing played yet), so drop + recreate cleanly.
DROP TABLE IF EXISTS scorecards;
CREATE TABLE scorecards (
  id           TEXT PRIMARY KEY,
  match_id     TEXT NOT NULL,   -- -> matches.id
  player_id    TEXT NOT NULL,   -- -> users.id
  hole_scores  TEXT NOT NULL,   -- JSON: [{ "hole": 1, "gross": 4 }, ...]
  total_gross  INTEGER NOT NULL,
  submitted_at TEXT NOT NULL
);
-- One scorecard per player per match.
CREATE UNIQUE INDEX idx_scorecards_match_player ON scorecards(match_id, player_id);
