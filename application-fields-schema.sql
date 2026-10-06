-- Дополнительные поля заявки Владыки.
-- Не меняют механику игры: только сохраняют введённые при создании Владыки стартовые данные,
-- чтобы Мастер мог просмотреть их в полной заявке.
alter table public.lords add column if not exists world_name text default '';
alter table public.lords add column if not exists player_name text default '';
alter table public.lords add column if not exists starting_tech text default '';
alter table public.lords add column if not exists starting_magic text default '';
alter table public.lords add column if not exists starting_troops text default '';
