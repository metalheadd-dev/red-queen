-- Steam identity is private account data. Only server-side service-role routes
-- can read or change it after validating the Red Queen session.
create table if not exists public.gaming_steam_links (
  user_key text primary key check (user_key ~ '^[0-9a-f]{64}$'),
  steam_id text not null unique check (steam_id ~ '^[0-9]{17}$'),
  connected_at timestamptz not null default now()
);

alter table public.gaming_steam_links enable row level security;
revoke all on public.gaming_steam_links from anon, authenticated;
grant select, insert, delete on public.gaming_steam_links to service_role;

comment on table public.gaming_steam_links is
  'Private Steam OpenID account links. No public read or write policy.';
