-- A member's home course (optional). Defaults the discovery feed before filters
-- and the leaderboard's default standings. FK-ish to courses.id (no hard FK so a
-- course row can be reseeded without breaking users).
ALTER TABLE users ADD COLUMN home_course_id TEXT;
