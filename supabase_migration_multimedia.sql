-- ERALIS: migração para até 2 imagens e 1 vídeo por produto.
alter table public.products add column if not exists image_url_2 text;
alter table public.products add column if not exists image_path_2 text;
alter table public.products add column if not exists video_url text;
alter table public.products add column if not exists video_path text;

-- ERALIS: flag para exibir uma imagem de Criamos ideias somente no celular.
alter table public.idea_images add column if not exists mobile_only boolean not null default false;


-- ERALIS: visibilidade da imagem em Criamos ideias: computador + celular, somente celular ou somente computador.
alter table public.idea_images add column if not exists display_target text not null default 'all';
update public.idea_images set display_target = 'mobile' where mobile_only = true;
alter table public.idea_images drop constraint if exists idea_images_display_target_check;
alter table public.idea_images add constraint idea_images_display_target_check check (display_target in ('all','mobile','desktop'));
