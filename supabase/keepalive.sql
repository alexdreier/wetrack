-- Free-tier projects pause after 7 days without "sufficient activity".
-- A daily one-row anon SELECT does not clear that bar: the keep-alive workflow
-- ran green every day and WETrack was still scheduled for pausing on
-- 2026-08-27. Reads through PostgREST are evidently too slight to count, so the
-- heartbeat writes instead, on its own table, so it never touches real data.
create table if not exists keepalive (
  id         int primary key default 1,
  beat_at    timestamptz not null default now(),
  beats      bigint not null default 0,
  constraint keepalive_single_row check (id = 1)
);

insert into keepalive (id) values (1) on conflict (id) do nothing;

-- Service role only. No anon or authenticated access: this is infrastructure,
-- not app data.
alter table keepalive enable row level security;

-- Counts the beat and returns the new state, so the caller can VERIFY the write
-- actually landed rather than trusting a 2xx. That distinction is the whole
-- reason this table exists.
create or replace function beat() returns keepalive
language sql security definer as $$
  update keepalive set beat_at = now(), beats = beats + 1 where id = 1 returning *;
$$;

revoke all on function beat() from public, anon, authenticated;
grant execute on function beat() to service_role;
