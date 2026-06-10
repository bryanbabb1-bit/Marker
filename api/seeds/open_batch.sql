-- A fat batch of OPEN matches so Discovery has plenty to swipe + evaluate.
-- Wide handicap windows (0-54) so they show for any tester; real course names
-- (so the home-course default surfaces them); future dates. All point at a real
-- tee so an accepted one is scorable. Idempotent: INSERT OR IGNORE + fixed ids.
--   Apply: npx wrangler d1 execute match-play --remote --file=seeds/open_batch.sql
--   Remove: DELETE FROM matches WHERE id LIKE 'm_seed_%';

INSERT OR IGNORE INTO matches
 (id, creator_id, status, course_name, tee_color, tee_id, play_date, play_time, match_type, stakes, hcp_range_min, hcp_range_max, created_at, updated_at) VALUES
 ('m_seed_01','user_demo_01','open','Prairie Highlands Golf Course','Blue','tee_api_10516_blue','2026-06-11',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:00:00.000Z','2026-06-10T13:00:00.000Z'),
 ('m_seed_02','user_demo_03','open','Prairie Highlands Golf Course','White','tee_api_10516_blue','2026-06-11',NULL,'front_nine',NULL,0,54,'2026-06-10T13:01:00.000Z','2026-06-10T13:01:00.000Z'),
 ('m_seed_03','user_demo_06','open','Prairie Highlands Golf Course','Black','tee_api_10516_blue','2026-06-12',NULL,'eighteen',  NULL,0,12,'2026-06-10T13:02:00.000Z','2026-06-10T13:02:00.000Z'),
 ('m_seed_04','user_demo_11','open','Prairie Highlands Golf Course','Blue','tee_api_10516_blue','2026-06-12',NULL,'back_nine', NULL,0,54,'2026-06-10T13:03:00.000Z','2026-06-10T13:03:00.000Z'),
 ('m_seed_05','user_demo_14','open','Prairie Highlands Golf Course','Blue','tee_api_10516_blue','2026-06-13',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:04:00.000Z','2026-06-10T13:04:00.000Z'),
 ('m_seed_06','user_demo_02','open','Prairie Highlands Golf Course','White','tee_api_10516_blue','2026-06-13',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:05:00.000Z','2026-06-10T13:05:00.000Z'),
 ('m_seed_07','user_demo_08','open','Prairie Highlands Golf Course','Blue','tee_api_10516_blue','2026-06-14',NULL,'front_nine',NULL,0,54,'2026-06-10T13:06:00.000Z','2026-06-10T13:06:00.000Z'),
 ('m_seed_08','user_demo_16','open','Prairie Highlands Golf Course','Black','tee_api_10516_blue','2026-06-15',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:07:00.000Z','2026-06-10T13:07:00.000Z'),
 ('m_seed_09','user_demo_12','open','Ironhorse Golf Club','Blue','tee_api_10516_blue','2026-06-11',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:08:00.000Z','2026-06-10T13:08:00.000Z'),
 ('m_seed_10','user_demo_04','open','Ironhorse Golf Club','White','tee_api_10516_blue','2026-06-12',NULL,'back_nine', NULL,0,54,'2026-06-10T13:09:00.000Z','2026-06-10T13:09:00.000Z'),
 ('m_seed_11','user_demo_09','open','Falcon Ridge Golf Club','Blue','tee_api_10516_blue','2026-06-12',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:10:00.000Z','2026-06-10T13:10:00.000Z'),
 ('m_seed_12','user_demo_13','open','Falcon Ridge Golf Club','White','tee_api_10516_blue','2026-06-14',NULL,'front_nine',NULL,0,54,'2026-06-10T13:11:00.000Z','2026-06-10T13:11:00.000Z'),
 ('m_seed_13','user_demo_05','open','Sycamore Ridge Golf Club','Blue','tee_api_10516_blue','2026-06-13',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:12:00.000Z','2026-06-10T13:12:00.000Z'),
 ('m_seed_14','user_demo_15','open','Shadow Glen Golf Club','Black','tee_api_10516_blue','2026-06-15',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:13:00.000Z','2026-06-10T13:13:00.000Z'),
 ('m_seed_15','user_demo_07','open','Deer Creek Golf Club','White','tee_api_10516_blue','2026-06-16',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:14:00.000Z','2026-06-10T13:14:00.000Z'),
 ('m_seed_16','user_demo_10','open','Tomahawk Hills Golf Course','Blue','tee_api_10516_blue','2026-06-16',NULL,'back_nine', NULL,0,54,'2026-06-10T13:15:00.000Z','2026-06-10T13:15:00.000Z'),
 ('m_seed_17','user_demo_01','open','Canyon Farms Golf Club','White','tee_api_10516_blue','2026-06-17',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:16:00.000Z','2026-06-10T13:16:00.000Z'),
 ('m_seed_18','user_demo_03','open','The National Golf Club Of Kansas City','Black','tee_api_10516_blue','2026-06-18',NULL,'eighteen',NULL,0,54,'2026-06-10T13:17:00.000Z','2026-06-10T13:17:00.000Z'),
 ('m_seed_19','user_demo_06','open','Tiffany Greens Golf Club','Blue','tee_api_10516_blue','2026-06-18',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:18:00.000Z','2026-06-10T13:18:00.000Z'),
 ('m_seed_20','user_demo_11','open','Shoal Creek Golf Course','White','tee_api_10516_blue','2026-06-19',NULL,'front_nine',NULL,0,54,'2026-06-10T13:19:00.000Z','2026-06-10T13:19:00.000Z'),
 ('m_seed_21','user_demo_14','open','Prairie Highlands Golf Course','Blue','tee_api_10516_blue','2026-06-19',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:20:00.000Z','2026-06-10T13:20:00.000Z'),
 ('m_seed_22','user_demo_02','open','Prairie Highlands Golf Course','White','tee_api_10516_blue','2026-06-20',NULL,'eighteen', NULL,0,54,'2026-06-10T13:21:00.000Z','2026-06-10T13:21:00.000Z'),
 ('m_seed_23','user_demo_08','open','Ironhorse Golf Club','Black','tee_api_10516_blue','2026-06-21',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:22:00.000Z','2026-06-10T13:22:00.000Z'),
 ('m_seed_24','user_demo_16','open','Prairie Highlands Golf Course','Blue','tee_api_10516_blue','2026-06-22',NULL,'eighteen',  NULL,0,54,'2026-06-10T13:23:00.000Z','2026-06-10T13:23:00.000Z');
