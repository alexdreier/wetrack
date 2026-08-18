-- WETrack modernization migration — August 2026
-- Run once in the Supabase SQL Editor. Every statement is idempotent:
-- re-running it, or running it against a database that already has some
-- of these changes (as production does), is safe.

-- 1) Priority enum: the app uses 'urgent' | 'normal' | 'rainy_day'.
--    Older installs have 'next_week' where 'normal' should be.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'priority_level' AND e.enumlabel = 'normal'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'priority_level' AND e.enumlabel = 'next_week'
    ) THEN
      ALTER TYPE priority_level RENAME VALUE 'next_week' TO 'normal';
    ELSE
      ALTER TYPE priority_level ADD VALUE 'normal';
    END IF;
  END IF;
END $$;

-- 2) Profile columns the app reads/writes but the original schema lacked
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS things_integration BOOLEAN DEFAULT false;

-- 3) Indexes matching the queries the app actually runs
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_task_created ON comments(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_task_created ON activity_log(task_id, created_at DESC);

-- 4) Realtime for attachments: the app has always subscribed to this
--    table, but it was never added to the publication, so uploads and
--    deletes never appeared live for the other user.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE attachments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
