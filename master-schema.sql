-- VA-34 master access migration
-- Run once in Supabase SQL Editor.
alter table public.players add column if not exists is_master boolean not null default false;

alter table public.turns enable row level security;
alter table public.turn_actions enable row level security;

drop policy if exists "masters read all turns" on public.turns;
create policy "masters read all turns" on public.turns for select using (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
);

drop policy if exists "masters update turns" on public.turns;
create policy "masters update turns" on public.turns for update using (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
) with check (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
);

drop policy if exists "masters read turn actions" on public.turn_actions;
create policy "masters read turn actions" on public.turn_actions for select using (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
);

drop policy if exists "masters update turn actions" on public.turn_actions;
create policy "masters update turn actions" on public.turn_actions for update using (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
) with check (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
);

drop policy if exists "masters read lords" on public.lords;
create policy "masters read lords" on public.lords for select using (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
);

drop policy if exists "masters read players" on public.players;
create policy "masters read players" on public.players for select using (
  exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true)
);
