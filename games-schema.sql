-- VA-34: игры, мастера и заявки игроков
alter table public.players add column if not exists is_master boolean not null default false;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.players(id) on delete cascade,
  name text not null,
  description text default '',
  max_players integer not null default 10,
  status text not null default 'open' check (status in ('open','running','closed','finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_applications (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  message text default '',
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id, player_id)
);

create table if not exists public.game_members (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role text not null default 'player' check (role in ('master','player')),
  joined_at timestamptz not null default now(),
  unique(game_id, player_id)
);

alter table public.games enable row level security;
alter table public.game_applications enable row level security;
alter table public.game_members enable row level security;

drop policy if exists "games visible to authenticated" on public.games;
create policy "games visible to authenticated" on public.games for select to authenticated using (status in ('open','running') or master_id=auth.uid());

drop policy if exists "masters create games" on public.games;
create policy "masters create games" on public.games for insert to authenticated
with check (master_id=auth.uid() and exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true));

drop policy if exists "masters manage games" on public.games;
create policy "masters manage games" on public.games for update to authenticated
using (master_id=auth.uid() and exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true))
with check (master_id=auth.uid());

drop policy if exists "applications own or master" on public.game_applications;
create policy "applications own or master" on public.game_applications for select to authenticated
using (player_id=auth.uid() or exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()));

drop policy if exists "players apply" on public.game_applications;
create policy "players apply" on public.game_applications for insert to authenticated
with check (player_id=auth.uid() and exists(select 1 from public.games g where g.id=game_id and g.status='open'));

drop policy if exists "applicant withdraw or master decides" on public.game_applications;
create policy "applicant withdraw or master decides" on public.game_applications for update to authenticated
using (player_id=auth.uid() or exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()))
with check (player_id=auth.uid() or exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()));

drop policy if exists "members visible to members" on public.game_members;
create policy "members visible to members" on public.game_members for select to authenticated
using (player_id=auth.uid() or exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()));

drop policy if exists "masters add members" on public.game_members;
create policy "masters add members" on public.game_members for insert to authenticated
with check (exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()));

drop policy if exists "masters manage members" on public.game_members;
create policy "masters manage members" on public.game_members for update to authenticated
using (exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()))
with check (exists(select 1 from public.games g where g.id=game_id and g.master_id=auth.uid()));

create index if not exists games_master_idx on public.games(master_id,status);
create index if not exists applications_game_idx on public.game_applications(game_id,status);
create index if not exists members_game_idx on public.game_members(game_id);

