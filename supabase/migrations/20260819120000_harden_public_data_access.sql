-- RED QUEEN production security hardening.
--
-- All application data is accessed through authenticated Next.js API routes
-- using the Supabase service role. Browser clients use Supabase only for Auth.
-- Keep every existing row, but remove legacy PostgREST access that exposed
-- profiles, conversations, invite data, and Operations-era tables publicly.

begin;

-- Some legacy policies were labelled as service-role policies but were
-- accidentally granted to the PostgreSQL PUBLIC role.
drop policy if exists "Public read access for users" on public.users;
drop policy if exists "Service role full access on users" on public.users;

drop policy if exists "Anon can count messages" on public.messages;
drop policy if exists "Public read access for messages" on public.messages;
drop policy if exists "Service role full access on messages" on public.messages;

drop policy if exists "Allow public read access to invite_codes" on public.invite_codes;
drop policy if exists "Allow service role full access on invite_codes" on public.invite_codes;

drop policy if exists "Allow insert access to invite_usage" on public.invite_usage;
drop policy if exists "Allow service role full access on invite_usage" on public.invite_usage;

drop policy if exists "Allow all access to logistics_catalog for admins" on public.logistics_catalog;
drop policy if exists "Allow public read access to logistics_catalog" on public.logistics_catalog;

drop policy if exists "Allow insert access to marketplace_items" on public.marketplace_items;
drop policy if exists "Allow public read access to marketplace_items" on public.marketplace_items;
drop policy if exists "Allow update access to marketplace_items for owners" on public.marketplace_items;

drop policy if exists "Allow public read access to system_state" on public.system_state;
drop policy if exists "Allow service role full access on system_state" on public.system_state;

-- RLS remains the database-level safety boundary for every application table.
alter table public.users enable row level security;
alter table public.messages enable row level security;
alter table public.invite_codes enable row level security;
alter table public.invite_usage enable row level security;
alter table public.tasks enable row level security;
alter table public.bounties enable row level security;
alter table public.user_quests enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.logistics_catalog enable row level security;
alter table public.system_state enable row level security;
alter table public.x402_operations enable row level security;
alter table public.guest_agent_usage enable row level security;
alter table public.onchain_achievements enable row level security;

-- No application table is queried directly from the browser. Authentication
-- continues to use Supabase Auth and is unaffected by these table grants.
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.messages from anon, authenticated;
revoke all privileges on table public.invite_codes from anon, authenticated;
revoke all privileges on table public.invite_usage from anon, authenticated;
revoke all privileges on table public.tasks from anon, authenticated;
revoke all privileges on table public.bounties from anon, authenticated;
revoke all privileges on table public.user_quests from anon, authenticated;
revoke all privileges on table public.marketplace_items from anon, authenticated;
revoke all privileges on table public.logistics_catalog from anon, authenticated;
revoke all privileges on table public.system_state from anon, authenticated;
revoke all privileges on table public.x402_operations from anon, authenticated;
revoke all privileges on table public.guest_agent_usage from anon, authenticated;
revoke all privileges on table public.onchain_achievements from anon, authenticated;

-- Make the intended server boundary explicit. The service role also carries
-- BYPASSRLS in Supabase, so profile/history updates keep working as before.
grant all privileges on table public.users to service_role;
grant all privileges on table public.messages to service_role;
grant all privileges on table public.invite_codes to service_role;
grant all privileges on table public.invite_usage to service_role;
grant all privileges on table public.tasks to service_role;
grant all privileges on table public.bounties to service_role;
grant all privileges on table public.user_quests to service_role;
grant all privileges on table public.marketplace_items to service_role;
grant all privileges on table public.logistics_catalog to service_role;
grant all privileges on table public.system_state to service_role;
grant all privileges on table public.x402_operations to service_role;
grant all privileges on table public.guest_agent_usage to service_role;
grant all privileges on table public.onchain_achievements to service_role;

commit;
