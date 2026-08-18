-- WETrack subtasks — August 2026
-- Run once in the Supabase SQL Editor. Idempotent; safe to re-run.

-- A subtask is a full task pointing at its parent. Deleting a parent
-- removes its subtasks. One level of nesting is enforced in the app.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
