-- VA-34 turn engine migration
-- Выполнить ОДИН РАЗ в Supabase SQL Editor после базовой db-schema.sql.

create table if not exists public.turns (
  id uuid primary key default gen_random_uuid(),
  lord_id uuid not null references public.lords(id) on delete cascade,
  turn_number integer not null default 1,
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','resolved')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.turn_actions (
  id uuid primary key default gen_random_uuid(),
  turn_id uuid not null references public.turns(id) on delete cascade,
  action_order integer not null default 1,
  action_kind text not null check (action_kind in ('main','extra')),
  title text not null default '',
  description text default '',
  energy_cost numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','resolved')),
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists turns_lord_idx on public.turns(lord_id, turn_number);
create index if not exists turn_actions_turn_idx on public.turn_actions(turn_id, action_order);

alter table public.turns enable row level security;
alter table public.turn_actions enable row level security;

drop policy if exists "turns owned" on public.turns;
create policy "turns owned" on public.turns for all
using (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

drop policy if exists "turn actions through own lord" on public.turn_actions;
create policy "turn actions through own lord" on public.turn_actions for all
using (exists(
  select 1 from public.turns t
  join public.lords l on l.id=t.lord_id
  where t.id=turn_id and l.player_id=auth.uid()
))
with check (exists(
  select 1 from public.turns t
  join public.lords l on l.id=t.lord_id
  where t.id=turn_id and l.player_id=auth.uid()
));
