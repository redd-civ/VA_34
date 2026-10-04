-- VA-34: game scope for Lords and turns
-- Run once in Supabase SQL Editor after games-schema.sql and turns-schema.sql.

alter table public.lords add column if not exists game_id uuid references public.games(id) on delete cascade;
create index if not exists lords_game_idx on public.lords(game_id, player_id);

-- A player may have one Lord per game, while retaining legacy Lords without a game.
create unique index if not exists lords_one_per_game_idx
  on public.lords(game_id, player_id)
  where game_id is not null;

-- Replace the old owner-only Lord policy with game-aware access.
drop policy if exists "lords owned" on public.lords;
drop policy if exists "lords game members" on public.lords;
create policy "lords game members" on public.lords for all to authenticated
using (
  player_id=auth.uid()
  or exists (
    select 1 from public.games g
    where g.id=game_id and g.master_id=auth.uid()
  )
  or exists (
    select 1 from public.game_members gm
    where gm.game_id=lords.game_id and gm.player_id=auth.uid()
  )
)
with check (
  player_id=auth.uid()
  and (
    game_id is null
    or exists (
      select 1 from public.game_members gm
      where gm.game_id=lords.game_id and gm.player_id=auth.uid()
    )
  )
);

-- A master automatically becomes a member of every game they create.
create or replace function public.va34_add_game_master()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.game_members(game_id, player_id, role)
  values(new.id, new.master_id, 'master')
  on conflict (game_id, player_id) do update set role='master';
  return new;
end;
$$;

drop trigger if exists va34_game_master_member on public.games;
create trigger va34_game_master_member
after insert on public.games
for each row execute function public.va34_add_game_master();

-- Prevent a game from exceeding its player limit.
create or replace function public.va34_check_game_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap integer;
  current_count integer;
begin
  if new.role <> 'player' then return new; end if;
  select max_players into cap from public.games where id=new.game_id for update;
  select count(*) into current_count
  from public.game_members
  where game_id=new.game_id and role='player' and id <> coalesce(new.id,'00000000-0000-0000-0000-000000000000');
  if current_count >= cap then
    raise exception 'Игра уже заполнена';
  end if;
  return new;
end;
$$;

drop trigger if exists va34_game_capacity on public.game_members;
create trigger va34_game_capacity
before insert or update on public.game_members
for each row execute function public.va34_check_game_capacity();

-- Master can see all Lords in their games; players can see members' Lords.
drop policy if exists "lords game members" on public.lords;
create policy "lords game members" on public.lords for select to authenticated
using (
  player_id=auth.uid()
  or exists (select 1 from public.games g where g.id=game_id and g.master_id=auth.uid())
  or exists (select 1 from public.game_members gm where gm.game_id=lords.game_id and gm.player_id=auth.uid())
);

create policy "lords owners edit" on public.lords for insert to authenticated
with check (
  player_id=auth.uid()
  and (
    game_id is null
    or exists (select 1 from public.game_members gm where gm.game_id=lords.game_id and gm.player_id=auth.uid())
  )
);

create policy "lords owners update" on public.lords for update to authenticated
using (player_id=auth.uid())
with check (player_id=auth.uid());

create policy "lords owners delete" on public.lords for delete to authenticated
using (player_id=auth.uid());

-- Turn access is derived from the Lord's game.
drop policy if exists "turns owned" on public.turns;
create policy "turns game access" on public.turns for select to authenticated
using (
  exists (
    select 1 from public.lords l
    where l.id=lord_id
      and (
        l.player_id=auth.uid()
        or exists (select 1 from public.games g where g.id=l.game_id and g.master_id=auth.uid())
        or exists (select 1 from public.game_members gm where gm.game_id=l.game_id and gm.player_id=auth.uid())
      )
  )
);

create policy "turns player write" on public.turns for insert to authenticated
with check (
  exists (select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid())
);

create policy "turns player update" on public.turns for update to authenticated
using (exists (select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()))
with check (exists (select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

create policy "turns player delete" on public.turns for delete to authenticated
using (exists (select 1 from public.lords l where l.id=lord_id and l.player_id=auth.uid()));

-- Masters may update turn status in their games.
create policy "masters update turns" on public.turns for update to authenticated
using (
  exists (
    select 1 from public.lords l
    join public.games g on g.id=l.game_id
    where l.id=lord_id and g.master_id=auth.uid()
  )
)
with check (
  exists (
    select 1 from public.lords l
    join public.games g on g.id=l.game_id
    where l.id=lord_id and g.master_id=auth.uid()
  )
);

-- Turn actions follow turn visibility/write rules.
drop policy if exists "turn actions through own lord" on public.turn_actions;
create policy "turn actions game access" on public.turn_actions for select to authenticated
using (
  exists (
    select 1 from public.turns t
    join public.lords l on l.id=t.lord_id
    where t.id=turn_id
      and (
        l.player_id=auth.uid()
        or exists (select 1 from public.games g where g.id=l.game_id and g.master_id=auth.uid())
        or exists (select 1 from public.game_members gm where gm.game_id=l.game_id and gm.player_id=auth.uid())
      )
  )
);

create policy "turn actions player write" on public.turn_actions for insert to authenticated
with check (
  exists (
    select 1 from public.turns t join public.lords l on l.id=t.lord_id
    where t.id=turn_id and l.player_id=auth.uid()
  )
);

create policy "turn actions player update" on public.turn_actions for update to authenticated
using (
  exists (
    select 1 from public.turns t join public.lords l on l.id=t.lord_id
    where t.id=turn_id and l.player_id=auth.uid()
  )
)
with check (
  exists (
    select 1 from public.turns t join public.lords l on l.id=t.lord_id
    where t.id=turn_id and l.player_id=auth.uid()
  )
);

create policy "turn actions master update" on public.turn_actions for update to authenticated
using (
  exists (
    select 1 from public.turns t
    join public.lords l on l.id=t.lord_id
    join public.games g on g.id=l.game_id
    where t.id=turn_id and g.master_id=auth.uid()
  )
)
with check (
  exists (
    select 1 from public.turns t
    join public.lords l on l.id=t.lord_id
    join public.games g on g.id=l.game_id
    where t.id=turn_id and g.master_id=auth.uid()
  )
);
