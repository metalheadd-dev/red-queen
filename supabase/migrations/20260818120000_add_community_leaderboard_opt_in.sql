alter table public.users
  add column if not exists community_visible boolean not null default false;

alter table public.users
  add column if not exists community_joined_at timestamptz;

create index if not exists users_community_visible_idx
  on public.users (community_visible)
  where community_visible = true;

comment on column public.users.community_visible is
  'Explicit opt-in for the public SOLvivor readiness board. False by default.';

comment on column public.users.community_joined_at is
  'First time the account joined the public SOLvivor readiness board.';
