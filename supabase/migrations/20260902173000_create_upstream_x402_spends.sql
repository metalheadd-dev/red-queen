create table if not exists public.upstream_x402_spends (
  id uuid primary key default gen_random_uuid(),
  operation_key text not null unique,
  merchant text not null,
  resource text not null,
  network text not null,
  asset text not null,
  amount_atomic bigint not null check (amount_atomic > 0),
  status text not null check (status in ('reserved', 'settled', 'released')),
  transaction_signature text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  settled_at timestamptz
);

create index if not exists upstream_x402_spends_created_at_idx
  on public.upstream_x402_spends (created_at desc);

create index if not exists upstream_x402_spends_status_expires_idx
  on public.upstream_x402_spends (status, expires_at);

alter table public.upstream_x402_spends enable row level security;

revoke all privileges on table public.upstream_x402_spends from anon, authenticated;
grant all privileges on table public.upstream_x402_spends to service_role;

create or replace function public.reserve_upstream_x402_spend(
  p_operation_key text,
  p_merchant text,
  p_resource text,
  p_network text,
  p_asset text,
  p_amount_atomic bigint,
  p_daily_limit_atomic bigint
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_amount bigint;
  existing_status text;
  committed_today bigint;
begin
  if p_amount_atomic <= 0 or p_daily_limit_atomic <= 0 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('red-queen-upstream-x402-daily-budget'));

  select amount_atomic, status
    into existing_amount, existing_status
    from public.upstream_x402_spends
   where operation_key = p_operation_key;

  if found then
    return existing_amount = p_amount_atomic and existing_status in ('reserved', 'settled');
  end if;

  update public.upstream_x402_spends
     set status = 'released'
   where status = 'reserved' and expires_at <= now();

  select coalesce(sum(amount_atomic), 0)
    into committed_today
    from public.upstream_x402_spends
   where created_at >= date_trunc('day', now())
     and (status = 'settled' or (status = 'reserved' and expires_at > now()));

  if committed_today + p_amount_atomic > p_daily_limit_atomic then
    return false;
  end if;

  insert into public.upstream_x402_spends (
    operation_key,
    merchant,
    resource,
    network,
    asset,
    amount_atomic,
    status,
    expires_at
  ) values (
    p_operation_key,
    p_merchant,
    p_resource,
    p_network,
    p_asset,
    p_amount_atomic,
    'reserved',
    now() + interval '5 minutes'
  );

  return true;
end;
$$;

revoke all on function public.reserve_upstream_x402_spend(text, text, text, text, text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.reserve_upstream_x402_spend(text, text, text, text, text, bigint, bigint) to service_role;

comment on table public.upstream_x402_spends is
  'Server-only reservations and settlement receipts for RED QUEEN buyer-wallet x402 expenditures.';
