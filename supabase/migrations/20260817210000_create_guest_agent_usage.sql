create table if not exists public.guest_agent_usage (
  identity_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.guest_agent_usage enable row level security;

comment on table public.guest_agent_usage is
  'Server-only guest AI quota metadata. Stores a salted network-identifier hash and counters; never prompts or responses.';

create or replace function public.consume_guest_agent_request(
  p_identity_hash text,
  p_limit integer default 4
)
returns table (allowed boolean, request_count integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_row public.guest_agent_usage%rowtype;
  safe_limit integer := greatest(1, least(coalesce(p_limit, 4), 20));
begin
  if p_identity_hash is null or length(p_identity_hash) < 16 then
    raise exception 'Invalid guest identity hash';
  end if;

  insert into public.guest_agent_usage as usage (
    identity_hash,
    window_started_at,
    request_count,
    updated_at
  ) values (
    p_identity_hash,
    now(),
    1,
    now()
  )
  on conflict (identity_hash) do update set
    window_started_at = case
      when usage.window_started_at <= now() - interval '24 hours' then now()
      else usage.window_started_at
    end,
    request_count = case
      when usage.window_started_at <= now() - interval '24 hours' then 1
      else usage.request_count + 1
    end,
    updated_at = now()
  returning * into usage_row;

  return query select
    usage_row.request_count <= safe_limit,
    usage_row.request_count,
    usage_row.window_started_at + interval '24 hours';
end;
$$;

revoke all on table public.guest_agent_usage from public, anon, authenticated;
revoke all on function public.consume_guest_agent_request(text, integer) from public, anon, authenticated;
grant execute on function public.consume_guest_agent_request(text, integer) to service_role;
