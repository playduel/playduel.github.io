-- Duel global leaderboard. Paste into Supabase: SQL Editor -> New query -> Run.
-- Safe to re-run (also upgrades an older version of this schema).

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  game text not null,
  name text not null check (char_length(name) between 1 and 12),
  score integer not null,
  created_at timestamptz not null default now()
);
-- Older versions limited `game` with a check; the function below validates instead.
alter table public.scores drop constraint if exists scores_game_check;
create index if not exists scores_game_score on public.scores (game, score);
create index if not exists scores_name_time on public.scores (lower(name), created_at);

-- Row level security: anyone may read; nobody may write directly.
alter table public.scores enable row level security;
drop policy if exists "anyone can read scores" on public.scores;
create policy "anyone can read scores" on public.scores for select using (true);

-- Games where a LOWER score is better (times, errors, guesses).
create or replace function public.lower_is_better(g text) returns boolean
language sql immutable as $$
  select g in ('reaction', 'targets', 'clock', 'countflash', 'pairs', 'maze', 'five')
$$;

-- One row per player per game: their best.
create or replace view public.leaderboard with (security_invoker = true) as
select game, name, score, created_at
from (
  select *, row_number() over (
    partition by game, lower(name)
    order by case when public.lower_is_better(game) then score else -score end, created_at
  ) as rn
  from public.scores
) best
where rn = 1;

-- The only way to write: rejects unknown games, impossible scores and floods.
create or replace function public.submit_score(p_game text, p_name text, p_score integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := btrim(p_name);
  lo integer;
  hi integer;
begin
  if clean_name is null or char_length(clean_name) not between 1 and 12 then
    raise exception 'bad name';
  end if;
  -- Plausible range per game: what a human can actually score.
  select r.lo, r.hi into lo, hi from (values
    ('reaction', 100, 1000),        -- average ms
    ('math', 1, 80),                -- solved
    ('targets', 2500, 45000),       -- ms
    ('anagrams', 100, 60000),       -- points
    ('memory', 1, 30),              -- sequence length
    ('clock', 0, 7000),             -- average ms off target
    ('countflash', 0, 200),         -- total dots off
    ('colorclash', 1, 120),         -- points
    ('typing', 1, 250),             -- wpm
    ('pairs', 8000, 100000),        -- ms
    ('stacker', 1, 80),             -- height
    ('maze', 5000, 200000),         -- ms
    ('five', 1000000, 7999999),     -- guesses * 1,000,000 + ms
    ('snake', 4, 324),              -- length
    ('wordgrid', 100, 60000)        -- points
  ) as r(game, lo, hi) where r.game = p_game;
  if lo is null then
    raise exception 'unknown game';
  end if;
  if p_score not between lo and hi then
    raise exception 'implausible score';
  end if;
  -- Rate limits: per name, and overall.
  if (select count(*) from scores where lower(name) = lower(clean_name) and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'slow down';
  end if;
  if (select count(*) from scores where created_at > now() - interval '1 minute') >= 300 then
    raise exception 'busy';
  end if;
  insert into scores (game, name, score) values (p_game, clean_name, p_score);
end;
$$;

revoke all on function public.submit_score(text, text, integer) from public;
grant execute on function public.submit_score(text, text, integer) to anon;
grant select on public.leaderboard to anon;
