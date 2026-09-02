alter function public.reserve_upstream_x402_spend(text, text, text, text, text, bigint, bigint)
  security invoker;

revoke all on function public.reserve_upstream_x402_spend(text, text, text, text, text, bigint, bigint)
  from public, anon, authenticated;

grant execute on function public.reserve_upstream_x402_spend(text, text, text, text, text, bigint, bigint)
  to service_role;
