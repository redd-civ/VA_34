-- VA-34: привязка Владык к единственной текущей игре и доступ Мастера к заявкам
-- Выполнить один раз в Supabase SQL Editor.

alter table public.lords
  add column if not exists game_id uuid references public.games(id) on delete cascade;

-- В текущей архитектуре существует одна основная игра.
-- Старых Владык привязываем к ней автоматически.
update public.lords
set game_id = (select id from public.games order by created_at asc limit 1)
where game_id is null;

alter table public.lords
  add column if not exists ancestral_name text default '',
  add column if not exists ancestral_race text default '',
  add column if not exists ancestral_terrain text default '',
  add column if not exists ancestral_income numeric default 0,
  add column if not exists ancestral_garrison numeric default 0;

create index if not exists idx_lords_game_player
  on public.lords(game_id, player_id);

-- Мастер должен видеть данные игроков и их игровых сущностей.
create or replace function public.va34_is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.players
    where id = auth.uid() and is_master = true
  );
$$;

revoke all on function public.va34_is_master() from public;
grant execute on function public.va34_is_master() to authenticated;

drop policy if exists "masters read players" on public.players;
create policy "masters read players" on public.players
for select to authenticated
using (public.va34_is_master());

drop policy if exists "masters read lords" on public.lords;
create policy "masters read lords" on public.lords
for select to authenticated
using (
  public.va34_is_master()
  or player_id = auth.uid()
);

drop policy if exists "masters read shards" on public.shards;
create policy "masters read shards" on public.shards
for select to authenticated
using (
  public.va34_is_master()
  or exists(
    select 1 from public.lords l
    where l.id = lord_id and l.player_id = auth.uid()
  )
);

drop policy if exists "masters read heroes" on public.heroes;
create policy "masters read heroes" on public.heroes
for select to authenticated
using (
  public.va34_is_master()
  or exists(
    select 1 from public.lords l
    where l.id = lord_id and l.player_id = auth.uid()
  )
);

drop policy if exists "masters read troops" on public.troops;
create policy "masters read troops" on public.troops
for select to authenticated
using (
  public.va34_is_master()
  or exists(
    select 1 from public.lords l
    where l.id = lord_id and l.player_id = auth.uid()
  )
);

drop policy if exists "masters read developments" on public.developments;
create policy "masters read developments" on public.developments
for select to authenticated
using (
  public.va34_is_master()
  or exists(
    select 1 from public.lords l
    where l.id = lord_id and l.player_id = auth.uid()
  )
);
