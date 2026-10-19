-- ========== TABELAS ==========
create table public.about (
  id            int primary key default 1 check (id = 1),  -- linha única
  name          text not null default 'Lucas Henrique',
  headline      text,
  bio           text,
  photo_path    text,            -- bucket 'profile'
  email         text,
  updated_at    timestamptz not null default now()
);
insert into public.about (id) values (1);

create table public.videos (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  year            int,
  video_path      text,            -- bucket 'videos' (arquivos até o limite do plano)
  external_url    text,            -- alternativa para vídeos grandes (Vimeo/YouTube/etc.)
  thumbnail_path  text,            -- bucket 'thumbnails'
  frame_paths     text[] not null default '{}', -- frames extras para a página do vídeo
  sort_order      int not null default 0,
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  check (video_path is not null or external_url is not null)
);
create index videos_order_idx on public.videos (sort_order, created_at desc);

-- ========== ADMIN ==========
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ========== RLS ==========
alter table public.about  enable row level security;
alter table public.videos enable row level security;
alter table public.admins enable row level security;  -- sem policies: invisível via API

create policy "about: leitura pública" on public.about
  for select using (true);
create policy "about: admin atualiza" on public.about
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "videos: público vê publicados" on public.videos
  for select using (published or public.is_admin());
create policy "videos: admin insere" on public.videos
  for insert to authenticated with check (public.is_admin());
create policy "videos: admin atualiza" on public.videos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "videos: admin remove" on public.videos
  for delete to authenticated using (public.is_admin());

-- ========== STORAGE ==========
insert into storage.buckets (id, name, public) values
  ('videos',     'videos',     true),
  ('thumbnails', 'thumbnails', true),
  ('profile',    'profile',    true);

create policy "storage: leitura pública" on storage.objects
  for select using (bucket_id in ('videos','thumbnails','profile'));
create policy "storage: admin escreve" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('videos','thumbnails','profile') and public.is_admin());
create policy "storage: admin atualiza" on storage.objects
  for update to authenticated
  using (bucket_id in ('videos','thumbnails','profile') and public.is_admin());
create policy "storage: admin apaga" on storage.objects
  for delete to authenticated
  using (bucket_id in ('videos','thumbnails','profile') and public.is_admin());

-- ========== DEPOIS DE CRIAR O USUÁRIO NO AUTH ==========
-- insert into public.admins (user_id) values ('<UUID_DO_LUCAS>');
-- Desative "Allow new users to sign up" em Authentication > Providers > Email.
