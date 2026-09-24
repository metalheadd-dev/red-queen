create table if not exists public.user_survival_profiles (
  wallet_address text primary key,
  area text not null default '',
  people smallint not null default 1 check (people between 1 and 12),
  budget text not null default '',
  constraints text not null default '',
  existing_equipment text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  constraint user_survival_profiles_area_length check (char_length(area) <= 80),
  constraint user_survival_profiles_budget_length check (char_length(budget) <= 120),
  constraint user_survival_profiles_constraints_length check (char_length(constraints) <= 320),
  constraint user_survival_profiles_equipment_count check (cardinality(existing_equipment) <= 24)
);

alter table public.user_survival_profiles enable row level security;

comment on table public.user_survival_profiles is
  'Private, user-controlled broad preparedness context. Accessed only through authenticated server routes; no public RLS policy.';
