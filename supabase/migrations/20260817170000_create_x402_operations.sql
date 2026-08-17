create table if not exists public.x402_operations (
  operation_id uuid primary key,
  product_id text not null,
  request_fingerprint text not null,
  payment_fingerprint text not null,
  status text not null check (status in ('delivered')),
  scheme text not null,
  network text not null,
  price text not null,
  pay_to text not null,
  payer text,
  transaction_signature text,
  settlement jsonb not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz not null
);

create unique index if not exists x402_operations_transaction_signature_key
  on public.x402_operations (transaction_signature)
  where transaction_signature is not null;

create index if not exists x402_operations_payer_created_at_idx
  on public.x402_operations (payer, created_at desc);

alter table public.x402_operations enable row level security;

comment on table public.x402_operations is
  'Server-only x402 settlement receipts and paid-output delivery records. No client RLS policies by design.';
