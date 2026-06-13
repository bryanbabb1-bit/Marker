-- Seed Bryan as admin of his home club (Prairie Highlands) so the in-app staff
-- dashboard is testable immediately. Idempotent.
INSERT OR IGNORE INTO club_staff (id, club_id, user_id, role, created_at)
SELECT 'cs_bryan_prairie', c.club_id, 'user_3Es8Hu1MgtEoscuILUXZWwtC0WY', 'admin',
       strftime('%Y-%m-%dT%H:%M:%fZ','now')
  FROM courses c
 WHERE c.name = 'Prairie Highlands Golf Course'
 LIMIT 1;
