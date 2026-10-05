-- VA-34 / player tools extension
-- Выполнять ПОСЛЕ db-schema.sql, games-schema.sql и game-scope-schema.sql.
-- Добавляет бухгалтерию игрока и банк свободных осколков Мастера.

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  lord_id uuid not null references public.lords(id) on delete cascade,
  turn_number integer not null default 1,
  kind text not null default 'adjustment' check (kind in ('income','expense','adjustment')),
  amount numeric not null default 0,
  category text not null default 'Прочее',
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ledger_lord_turn_idx on public.ledger_entries(lord_id,turn_number,created_at);

alter table public.ledger_entries enable row level security;

drop policy if exists "ledger own rows" on public.ledger_entries;
create policy "ledger own rows" on public.ledger_entries for all to authenticated
using (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

drop policy if exists "masters read ledger" on public.ledger_entries;
create policy "masters read ledger" on public.ledger_entries for select to authenticated
using (exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true));

create table if not exists public.free_shards (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  created_by uuid not null references public.players(id) on delete cascade,
  name text not null default '',
  type text not null default 'ordinary',
  size numeric not null default 1,
  income numeric not null default 0,
  race text default '',
  population text default '',
  mood text not null default 'Спокойное',
  garrison numeric not null default 0,
  supply numeric not null default 0,
  defense numeric not null default 0,
  terrain text default '',
  buildings jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  trophies jsonb not null default '[]'::jsonb,
  description text default '',
  assigned_lord_id uuid references public.lords(id) on delete set null,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists free_shards_game_idx on public.free_shards(game_id,assigned_lord_id);

alter table public.free_shards enable row level security;

drop policy if exists "masters manage free shards" on public.free_shards;
create policy "masters manage free shards" on public.free_shards for all to authenticated
using (exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true))
with check (exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true));

drop policy if exists "players see assigned free shards" on public.free_shards;
create policy "players see assigned free shards" on public.free_shards for select to authenticated
using (exists(select 1 from public.lords l where l.id=assigned_lord_id and l.player_id=auth.uid()));

-- Рекомендуется: назначение осколка игроку выполняется Мастером через кабинет,
-- который создаёт обычную запись shards, связанную с выбранным Владыкой.
