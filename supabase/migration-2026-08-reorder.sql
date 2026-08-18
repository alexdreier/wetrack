-- WETrack manual reordering — August 2026
-- Run once in the Supabase SQL Editor. Idempotent; safe to re-run.

-- 1) Fractional position column: lower = higher in the list.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION;

-- 2) Seed existing tasks in their current default order (last updated first),
--    spaced 1024 apart so drags can bisect between neighbors for a long time.
UPDATE tasks
SET position = sub.rn * 1024
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC NULLS LAST, created_at DESC) AS rn
  FROM tasks
) sub
WHERE tasks.id = sub.id AND tasks.position IS NULL;

-- 3) Index for the manual-order sort.
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);

-- 4) New tasks land at the top of the manual order unless a position is given.
CREATE OR REPLACE FUNCTION set_task_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MIN(position), 1024) - 1024 INTO NEW.position FROM tasks;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_position ON tasks;
CREATE TRIGGER tasks_set_position
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_position();
