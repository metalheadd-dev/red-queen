-- Admin-curated additions to the RED QUEEN survival catalog. Existing built-in
-- picks remain in code; this table never rewrites them or Steam user data.
create table if not exists public.gaming_catalog_entries (
  app_id integer primary key check (app_id > 0),
  title text not null check (char_length(title) between 2 and 120),
  studio text not null check (char_length(studio) between 2 and 120),
  lane text not null check (lane in ('HARDCORE','CO-OP','EXPLORATION','HORROR','WASTELAND')),
  genre text not null check (char_length(genre) between 2 and 80),
  tags text[] not null default '{}',
  setting text not null default 'SURVIVAL / STEAM',
  note text not null check (char_length(note) between 10 and 400),
  signal text not null default 'SURVIVAL',
  accent text not null default '#cb4051',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gaming_catalog_tags_limit check (array_length(tags, 1) is null or array_length(tags, 1) <= 12)
);

alter table public.gaming_catalog_entries enable row level security;
revoke all on public.gaming_catalog_entries from anon, authenticated;
grant select, insert, update on public.gaming_catalog_entries to service_role;

comment on table public.gaming_catalog_entries is
  'Admin-curated survival titles. Tags and genres are RQ editorial metadata, not an automated Steam tag sync.';
