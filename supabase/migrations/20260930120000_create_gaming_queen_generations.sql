-- Additive, separate game conversations; existing messages and scores are untouched.
create table if not exists public.gaming_queen_generations (
  id uuid primary key,
  conversation_id uuid not null,
  user_key text not null,
  prompt text not null,
  response jsonb not null,
  context jsonb not null,
  model text not null,
  token_usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists gaming_queen_owner_conversation_idx
  on public.gaming_queen_generations (user_key, conversation_id, created_at desc, id desc);
create index if not exists gaming_queen_owner_time_idx
  on public.gaming_queen_generations (user_key, created_at desc, id desc);
alter table public.gaming_queen_generations enable row level security;
revoke all on public.gaming_queen_generations from anon, authenticated;
grant select, insert on public.gaming_queen_generations to service_role;

-- Private, user-submitted AI feedback; no direct client table access.
create table if not exists public.agent_content_reports (
  id uuid primary key,
  reporter_key text not null,
  authenticated boolean not null default false,
  generation_id uuid,
  surface text not null check (surface in ('CORE', 'GAMING')),
  reason text not null check (reason in ('UNSAFE', 'OFFENSIVE', 'INCORRECT', 'SPOILER', 'OTHER')),
  prompt text not null,
  reported_reply text not null,
  detail text not null default '',
  evidence_source text not null default 'USER_SUBMITTED',
  created_at timestamptz not null default now()
);
create index if not exists agent_content_reporter_time_idx on public.agent_content_reports (reporter_key, created_at desc);
create index if not exists agent_content_review_time_idx on public.agent_content_reports (created_at desc);
alter table public.agent_content_reports enable row level security;
revoke all on public.agent_content_reports from anon, authenticated;
grant select, insert on public.agent_content_reports to service_role;
