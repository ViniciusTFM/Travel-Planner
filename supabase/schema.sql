-- Shared agenda: every authenticated user reads and edits the same JSON library.
create table if not exists public.travel_planner_shared (
  id text primary key check (id = 'default'),
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id)
);

alter table public.travel_planner_shared enable row level security;

grant select, insert, update on table public.travel_planner_shared to authenticated;
revoke all on table public.travel_planner_shared from anon;

drop policy if exists "Authenticated users can read the shared agenda" on public.travel_planner_shared;
create policy "Authenticated users can read the shared agenda"
  on public.travel_planner_shared
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create the shared agenda" on public.travel_planner_shared;
create policy "Authenticated users can create the shared agenda"
  on public.travel_planner_shared
  for insert
  to authenticated
  with check (id = 'default' and updated_by = (select auth.uid()));

drop policy if exists "Authenticated users can update the shared agenda" on public.travel_planner_shared;
create policy "Authenticated users can update the shared agenda"
  on public.travel_planner_shared
  for update
  to authenticated
  using (true)
  with check (id = 'default' and updated_by = (select auth.uid()));

comment on table public.travel_planner_shared is 'Biblioteca JSON única compartilhada por todos os usuários autenticados do Travel Planner.';
