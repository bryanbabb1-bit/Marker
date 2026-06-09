-- more_matches.sql — extra members + a richer batch of OPEN matches so the
-- discovery feed has plenty to swipe AND the filter sheet is meaningful:
--   * mixed match types (front/back/eighteen)
--   * varied handicap windows (narrow scratch + mid + high, plus some 0..40)
--   * repeated course names (Prairie Highlands / Falcon Ridge) for course search
-- All use tee_sample_blue so an accepted match can still settle. play_time NULL
-- (the app shows date only). Idempotent: INSERT OR IGNORE + fixed ids.
--
-- Apply (remote): npx wrangler d1 execute match-play --remote --file=seeds/more_matches.sql
-- Remove later:   DELETE FROM matches WHERE id LIKE 'm_demo_1%' OR id LIKE 'm_demo_2%';
--                 DELETE FROM users   WHERE id LIKE 'user_demo_1%';

INSERT OR IGNORE INTO users (id, email, first_name, last_name, ghin_number, handicap, created_at, updated_at) VALUES
 ('user_demo_11','grace.liu@example.com','Grace','Liu','1234511', 7.8,'2026-06-09T00:00:00.000Z','2026-06-09T00:00:00.000Z'),
 ('user_demo_12','owen.mercer@example.com','Owen','Mercer','1234512',12.3,'2026-06-09T00:00:00.000Z','2026-06-09T00:00:00.000Z'),
 ('user_demo_13','sofia.delgado@example.com','Sofia','Delgado','1234513',18.1,'2026-06-09T00:00:00.000Z','2026-06-09T00:00:00.000Z'),
 ('user_demo_14','jack.romano@example.com','Jack','Romano','1234514', 3.4,'2026-06-09T00:00:00.000Z','2026-06-09T00:00:00.000Z'),
 ('user_demo_15','nina.park@example.com','Nina','Park','1234515',24.0,'2026-06-09T00:00:00.000Z','2026-06-09T00:00:00.000Z'),
 ('user_demo_16','cole.jensen@example.com','Cole','Jensen','1234516',10.7,'2026-06-09T00:00:00.000Z','2026-06-09T00:00:00.000Z');

INSERT OR IGNORE INTO matches
 (id, creator_id, status, course_name, tee_color, tee_id, play_date, play_time, match_type, stakes, hcp_range_min, hcp_range_max, created_at, updated_at) VALUES
 ('m_demo_11','user_demo_11','open','Prairie Highlands','Blue', 'tee_sample_blue','2026-06-10',NULL,'eighteen',  NULL, 0,12,'2026-06-09T12:00:00.000Z','2026-06-09T12:00:00.000Z'),
 ('m_demo_12','user_demo_14','open','Ironhorse','Black',        'tee_sample_blue','2026-06-10',NULL,'eighteen',  NULL, 0, 8,'2026-06-09T12:01:00.000Z','2026-06-09T12:01:00.000Z'),
 ('m_demo_13','user_demo_12','open','Falcon Ridge','White',     'tee_sample_blue','2026-06-11',NULL,'front_nine',NULL, 8,18,'2026-06-09T12:02:00.000Z','2026-06-09T12:02:00.000Z'),
 ('m_demo_14','user_demo_13','open','Deer Creek','White',       'tee_sample_blue','2026-06-11',NULL,'back_nine', NULL,12,24,'2026-06-09T12:03:00.000Z','2026-06-09T12:03:00.000Z'),
 ('m_demo_15','user_demo_15','open','Tomahawk Hills','Red',     'tee_sample_blue','2026-06-12',NULL,'eighteen',  NULL,18,36,'2026-06-09T12:04:00.000Z','2026-06-09T12:04:00.000Z'),
 ('m_demo_16','user_demo_16','open','Prairie Highlands','White','tee_sample_blue','2026-06-12',NULL,'front_nine',NULL, 5,15,'2026-06-09T12:05:00.000Z','2026-06-09T12:05:00.000Z'),
 ('m_demo_17','user_demo_11','open','Shadow Glen','Black',      'tee_sample_blue','2026-06-13',NULL,'eighteen',  NULL, 0,40,'2026-06-09T12:06:00.000Z','2026-06-09T12:06:00.000Z'),
 ('m_demo_18','user_demo_12','open','Falcon Ridge','Blue',      'tee_sample_blue','2026-06-14',NULL,'back_nine', NULL, 6,16,'2026-06-09T12:07:00.000Z','2026-06-09T12:07:00.000Z'),
 ('m_demo_19','user_demo_14','open','The National','Black',     'tee_sample_blue','2026-06-15',NULL,'eighteen',  NULL, 0,10,'2026-06-09T12:08:00.000Z','2026-06-09T12:08:00.000Z'),
 ('m_demo_20','user_demo_13','open','Canyon Farms','White',     'tee_sample_blue','2026-06-16',NULL,'eighteen',  NULL,14,28,'2026-06-09T12:09:00.000Z','2026-06-09T12:09:00.000Z'),
 ('m_demo_21','user_demo_16','open','Sycamore Ridge','Blue',    'tee_sample_blue','2026-06-17',NULL,'front_nine',NULL, 8,20,'2026-06-09T12:10:00.000Z','2026-06-09T12:10:00.000Z'),
 ('m_demo_22','user_demo_15','open','Prairie Highlands','Red',  'tee_sample_blue','2026-06-18',NULL,'back_nine', NULL,20,40,'2026-06-09T12:11:00.000Z','2026-06-09T12:11:00.000Z'),
 ('m_demo_23','user_demo_11','open','Tomahawk Hills','Blue',    'tee_sample_blue','2026-06-19',NULL,'eighteen',  NULL, 0,40,'2026-06-09T12:12:00.000Z','2026-06-09T12:12:00.000Z'),
 ('m_demo_24','user_demo_12','open','Ironhorse','White',        'tee_sample_blue','2026-06-22',NULL,'eighteen',  NULL,10,22,'2026-06-09T12:13:00.000Z','2026-06-09T12:13:00.000Z'),
 ('m_demo_25','user_demo_14','open','Deer Creek','Black',       'tee_sample_blue','2026-06-24',NULL,'front_nine',NULL, 0, 6,'2026-06-09T12:14:00.000Z','2026-06-09T12:14:00.000Z'),
 ('m_demo_26','user_demo_16','open','Falcon Ridge','White',     'tee_sample_blue','2026-06-27',NULL,'eighteen',  NULL, 4,14,'2026-06-09T12:15:00.000Z','2026-06-09T12:15:00.000Z');
