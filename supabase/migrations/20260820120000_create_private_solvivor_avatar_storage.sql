-- One private, replaceable avatar per authenticated SOLvivor.
-- Browser clients never receive direct Storage access: Next.js server routes use
-- the service role after verifying the Supabase session and issue short-lived URLs.
-- Source portraits are never uploaded to this bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'solvivor-avatars',
  'solvivor-avatars',
  false,
  4194304,
  array['image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 4194304,
    allowed_mime_types = array['image/webp'];

-- Deliberately no storage.objects policies for this bucket. RLS therefore
-- denies direct anon/authenticated access; service_role bypasses RLS only in
-- authenticated RED QUEEN API routes.
