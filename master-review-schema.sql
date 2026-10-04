-- VA-34 Master review queue
-- Выполнить ОДИН РАЗ в Supabase SQL Editor после базовой схемы.

create table if not exists public.master_reviews (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  lord_id uuid references public.lords(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  type text not null default 'special_tz',
  item_id text,
  title text not null default '',
  description text default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  master_id uuid references public.players(id) on delete set null,
  decision_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists master_reviews_game_idx on public.master_reviews(game_id,status,created_at desc);
create index if not exists master_reviews_player_idx on public.master_reviews(player_id,status,created_at desc);
create index if not exists master_reviews_lord_idx on public.master_reviews(lord_id,status,created_at desc);

alter table public.master_reviews enable row level security;

drop policy if exists "master reviews player read" on public.master_reviews;
create policy "master reviews player read" on public.master_reviews for select
using (player_id=auth.uid());

drop policy if exists "master reviews player insert" on public.master_reviews;
create policy "master reviews player insert" on public.master_reviews for insert
with check (player_id=auth.uid());

drop policy if exists "master reviews master read" on public.master_reviews;
create policy "master reviews master read" on public.master_reviews for select
using (exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true));

drop policy if exists "master reviews master update" on public.master_reviews;
create policy "master reviews master update" on public.master_reviews for update
using (exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true))
with check (exists(select 1 from public.players p where p.id=auth.uid() and p.is_master=true));
