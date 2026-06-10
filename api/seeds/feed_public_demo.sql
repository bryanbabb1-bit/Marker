-- Evaluation seed for the course feed: flip the demo matches at Prairie
-- Highlands (Bryan's home course) on 2026-06-10/11 to PUBLIC so the Feed tab has
-- live ("Now playing") + completed ("Final results") + scheduled content to show.
-- Safe to re-run. Real seeding/app-created matches default to private.
UPDATE matches
   SET visibility = 'public'
 WHERE course_name = 'Prairie Highlands Golf Course'
   AND play_date IN ('2026-06-10', '2026-06-11')
   AND status IN ('accepted', 'in_progress', 'completed');
