-- Rode no SQL Editor: frames extras exibidos na página do vídeo.
alter table public.videos
  add column if not exists frame_paths text[] not null default '{}';
