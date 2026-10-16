-- Run in the Supabase SQL editor before enabling production storage.
-- Only the server's service_role may access these records. No browser DB client.
create table if not exists public.between_records (
  key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.between_records enable row level security;
revoke all on public.between_records from anon, authenticated;
grant all on public.between_records to service_role;

create table if not exists public.between_leases (
  key text primary key,
  token uuid not null,
  expires_at timestamptz not null
);
alter table public.between_leases enable row level security;
revoke all on public.between_leases from anon, authenticated;
grant all on public.between_leases to service_role;

create or replace function public.between_acquire_lease(lease_key text, lease_token uuid)
returns boolean language plpgsql security invoker set search_path = public as $$
declare acquired boolean := false;
begin
  insert into public.between_leases as l (key, token, expires_at)
  values (lease_key, lease_token, now() + interval '3 minutes')
  on conflict (key) do update set token = excluded.token, expires_at = excluded.expires_at
  where l.expires_at < now()
  returning true into acquired;
  return coalesce(acquired, false);
end;
$$;
revoke all on function public.between_acquire_lease(text, uuid) from public, anon, authenticated;
grant execute on function public.between_acquire_lease(text, uuid) to service_role;

-- A private bucket: the Next.js server authorizes and proxies playback.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('between-audio', 'between-audio', false, 8000000,
 array['audio/mpeg','audio/webm','audio/webm;codecs=opus','audio/mp4','audio/ogg','audio/ogg;codecs=opus','audio/wav'])
on conflict (id) do nothing;
