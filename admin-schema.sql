-- VA-34: administrator role and Master appointment
-- Administrator and Master are separate statuses.
-- Administrator does NOT receive Master rights automatically.
-- Run once in Supabase SQL Editor after db-schema.sql / games-schema.sql.

alter table public.players
  add column if not exists is_admin boolean not null default false;

alter table public.players
  add column if not exists is_master boolean not null default false;

alter table public.players enable row level security;

create or replace function public.va34_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.players where id=auth.uid() and is_admin=true);
$$;

revoke all on function public.va34_is_admin() from public;
grant execute on function public.va34_is_admin() to authenticated;

-- Ordinary players may read/update their own profile, but role flags are protected
-- by the trigger below. Administrators get a separate SELECT policy.
drop policy if exists "players own row" on public.players;
create policy "players own row" on public.players
for all to authenticated
using (id=auth.uid())
with check (id=auth.uid());

drop policy if exists "administrators read players" on public.players;
create policy "administrators read players" on public.players
for select to authenticated
using (public.va34_is_admin());

-- Only an administrator may change is_master/is_admin.
create or replace function public.va34_protect_role_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin=true and new.is_master=true then
    raise exception 'Администратор не может одновременно иметь статус Мастера';
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if auth.uid() <> old.id then
    if new.is_master is distinct from old.is_master
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Изменять роли может только администратор';
    end if;
    return new;
  end if;

  if not exists (
    select 1 from public.players p
    where p.id=auth.uid() and p.is_admin=true
  ) then
    if new.is_master is distinct from old.is_master
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Изменять роли может только администратор';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists va34_protect_role_flags on public.players;
create trigger va34_protect_role_flags
before update on public.players
for each row execute function public.va34_protect_role_flags();

-- Authoritative role-management operation.
-- It intentionally changes ONLY the Master flag.
create or replace function public.va34_set_master(
  target_player_id uuid,
  grant_master boolean
)
returns public.players
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.players;
begin
  if not public.va34_is_admin() then
    raise exception 'Требуются права администратора';
  end if;

  select is_admin into target from public.players where id=target_player_id;
  if grant_master and coalesce(target.is_admin,false) then
    raise exception 'Администратор не может получить статус Мастера';
  end if;

  update public.players
    set is_master=grant_master,
        updated_at=now()
  where id=target_player_id
  returning * into target;

  if not found then
    raise exception 'Пользователь не найден';
  end if;

  return target;
end;
$$;

revoke all on function public.va34_set_master(uuid, boolean) from public;
grant execute on function public.va34_set_master(uuid, boolean) to authenticated;
