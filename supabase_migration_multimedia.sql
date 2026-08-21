-- ERALIS: migração para até 2 imagens e 1 vídeo por produto.
alter table public.products add column if not exists image_url_2 text;
alter table public.products add column if not exists image_path_2 text;
alter table public.products add column if not exists video_url text;
alter table public.products add column if not exists video_path text;
