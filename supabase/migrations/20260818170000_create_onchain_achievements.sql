create table if not exists public.onchain_achievements (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  achievement_id text not null,
  transaction_signature text not null unique,
  protocol_xp integer not null default 0 check (protocol_xp >= 0 and protocol_xp <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (wallet_address, achievement_id)
);

create index if not exists onchain_achievements_wallet_created_at_idx
  on public.onchain_achievements (wallet_address, created_at desc);

alter table public.onchain_achievements enable row level security;

comment on table public.onchain_achievements is
  'Server-verified Solana protocol achievements. Stored separately from evidence-based readiness XP and BIO-SCORE.';
