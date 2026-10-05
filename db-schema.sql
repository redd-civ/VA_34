-- VA-34 / Supabase database schema
-- Выполнять в SQL Editor проекта Supabase.
-- Схема безопасна для повторного запуска: существующие таблицы/политики не ломают миграцию.
-- Миграция существующих инсталляций: добавляет player_name без пересоздания players.
alter table public.players add column if not exists player_name text;
-- Все игровые данные принадлежат auth.users через player_id.
create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  player_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lords (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  race text default '',
  motto text default '',
  energy numeric not null default 15,
  status text not null default 'Владыка',
  ability text default '',
  traits text default '',
  items text default '',
  resources text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shards (
  id uuid primary key default gen_random_uuid(),
  lord_id uuid not null references public.lords(id) on delete cascade,
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
  description text default ''
);

create table if not exists public.heroes (
  id uuid primary key default gen_random_uuid(),
  lord_id uuid not null references public.lords(id) on delete cascade,
  name text not null default '',
  race text default '',
  level integer not null default 1,
  xp numeric not null default 0,
  skills jsonb not null default '[]'::jsonb,
  perks jsonb not null default '[]'::jsonb,
  knights jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  artifacts jsonb not null default '[]'::jsonb,
  description text default ''
);

create table if not exists public.troops (
  id uuid primary key default gen_random_uuid(),
  lord_id uuid not null references public.lords(id) on delete cascade,
  name text not null default '',
  type text default '',
  tier integer not null default 1,
  quantity numeric not null default 0,
  traits jsonb not null default '[]'::jsonb,
  description text default ''
);

create table if not exists public.developments (
  id uuid primary key default gen_random_uuid(),
  lord_id uuid not null references public.lords(id) on delete cascade,
  name text not null default '',
  kind text not null default 'technology',
  level integer not null default 0,
  cost numeric default 0,
  description text default ''
);

alter table public.players enable row level security;
alter table public.lords enable row level security;
alter table public.shards enable row level security;
alter table public.heroes enable row level security;
alter table public.troops enable row level security;
alter table public.developments enable row level security;

drop policy if exists "players own row" on public.players;
create policy "players own row" on public.players for all using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists "lords owned" on public.lords;
create policy "lords owned" on public.lords for all using (player_id=auth.uid()) with check (player_id=auth.uid());

drop policy if exists "shards through own lord" on public.shards;
create policy "shards through own lord" on public.shards for all
using (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

drop policy if exists "heroes through own lord" on public.heroes;
create policy "heroes through own lord" on public.heroes for all
using (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

drop policy if exists "troops through own lord" on public.troops;
create policy "troops through own lord" on public.troops for all
using (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

drop policy if exists "developments through own lord" on public.developments;
create policy "developments through own lord" on public.developments for all
using (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists(select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.players(id,display_name,player_name) values(new.id,coalesce(new.raw_user_meta_data ->> 'display_name',''),coalesce(new.raw_user_meta_data ->> 'player_name',new.raw_user_meta_data ->> 'display_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();