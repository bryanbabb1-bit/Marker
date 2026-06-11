-- 0013 — pre-Settle tension. Stamp when each player OPENS score entry so the
-- other side's match screen can show "Cort is entering scores…" while they
-- wait. Display-only; never affects settle.
ALTER TABLE matches ADD COLUMN creator_scoring_at TEXT;
ALTER TABLE matches ADD COLUMN opponent_scoring_at TEXT;
