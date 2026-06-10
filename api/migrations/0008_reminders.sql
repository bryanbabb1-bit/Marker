-- Forfeit/reminder system: a player's timezone (for "7pm local" reminders) and
-- per-match stamps so the scheduled job doesn't re-send the same nudge.
ALTER TABLE users ADD COLUMN timezone TEXT;
ALTER TABLE matches ADD COLUMN score_reminder_at TEXT;
ALTER TABLE matches ADD COLUMN forfeit_warning_at TEXT;
