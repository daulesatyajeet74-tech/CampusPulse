-- CampusPulse schema. Run once in Supabase > SQL Editor.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  category text not null check (category in ('Infrastructure','Cleanliness','Water','Electrical','Equipment','Safety','Other')),
  location text not null check (char_length(location) between 2 and 120),
  description text not null check (char_length(description) between 10 and 1000),
  priority text not null default 'Medium' check (priority in ('High','Medium','Low')),
  priority_reason text not null default '' check (char_length(priority_reason) <= 200),
  status text not null default 'Submitted' check (status in ('Submitted','In Progress','Resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists issues_status_idx on public.issues (status);
create index if not exists issues_priority_idx on public.issues (priority);
create index if not exists issues_category_idx on public.issues (category);
create index if not exists issues_created_idx on public.issues (created_at desc);

alter table public.issues enable row level security;
-- Anyone may read issues and submit NEW ones (always as 'Submitted'). No direct UPDATE/DELETE policies exist.
drop policy if exists "public read" on public.issues;
drop policy if exists "public submit" on public.issues;

create policy "public read"
on public.issues
for select
to anon, authenticated
using (true);

create policy "public submit"
on public.issues
for insert
to anon, authenticated
with check (status = 'Submitted');

-- Staff passcode (stored hashed; table is unreadable from the browser: RLS on, no policies).
create table if not exists public.admin_settings (
  id int primary key default 1 check (id = 1),
  code_hash text not null
);
alter table public.admin_settings enable row level security;
-- CHANGE 'change-me-now' to your own passcode before the demo (see README).
insert into public.admin_settings (code_hash)
values (encode(extensions.digest('change-me-now', 'sha256'), 'hex')) on conflict do nothing;

create or replace function public.update_issue(p_id uuid, p_status text, p_priority text, p_code text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from admin_settings where code_hash = encode(digest(p_code, 'sha256'), 'hex')) then
    raise exception 'Invalid staff passcode';
  end if;
  update issues set status = p_status, priority = p_priority,
    priority_reason = case when p_priority <> priority then 'Staff override' else priority_reason end,
    updated_at = now()
  where id = p_id;
end $$;
revoke all on function public.update_issue(uuid, text, text, text) from public;
grant execute on function public.update_issue(uuid, text, text, text) to anon, authenticated;
