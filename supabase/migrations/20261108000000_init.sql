-- Oscar's Music: schema, row-level security and storage.

create table public.admins (email text primary key);
alter table public.admins enable row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

create policy "admins read admins" on public.admins for select using (public.is_admin());

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_title text generated always as (regexp_replace(lower(title), '^(the|an?) ', '')) stored,
  lyrics_by text[] not null default '{}',
  music_by text[] not null default '{}',
  note text not null default '',
  musical_key text not null default '',
  image_path text,
  audio_path text,
  lyrics text not null default '',
  chords text not null default '',
  score_path text,
  links jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_title text generated always as (regexp_replace(lower(title), '^(the|an?) ', '')) stored,
  note text not null default '',
  image_path text,
  links jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.collection_songs (
  collection_id uuid not null references public.collections on delete cascade,
  song_id uuid not null references public.songs on delete cascade,
  position int not null default 0,
  primary key (collection_id, song_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  venue text not null default '',
  city text not null default '',
  kind text not null default 'Concert',
  note text not null default '',
  link_label text not null default '',
  link_url text not null default ''
);

create table public.about_page (
  id int primary key default 1 check (id = 1),
  heading text not null default 'About Oscar Nash',
  tagline text not null default '',
  body text not null default '',
  image_path text,
  donate_url text not null default ''
);
insert into public.about_page (heading, tagline, body) values (
  'About Oscar Nash',
  'Songwriter, singer and leader of live singing sessions.',
  E'Oscar writes songs and shares them here, with lyrics, chords and scores, so that choirs, friends and fellow musicians can learn them and sing along.\n\nEdit this text from the About page when signed in as an admin.'
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reason text not null,
  name text not null default '',
  email text not null default '',
  message text not null default '',
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Row-level security: everyone reads the catalogue, only admins write.
do $$
declare t text;
begin
  foreach t in array array['songs','collections','collection_songs','sessions','about_page'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin insert" on public.%I for insert with check (public.is_admin())', t);
    execute format('create policy "admin update" on public.%I for update using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admin delete" on public.%I for delete using (public.is_admin())', t);
  end loop;
end $$;

alter table public.enquiries enable row level security;
create policy "admin read enquiries" on public.enquiries for select using (public.is_admin());
create policy "admin delete enquiries" on public.enquiries for delete using (public.is_admin());
-- Enquiries are inserted only by the contact Edge Function, using the service role.

-- Media bucket: public read (streaming), admin-only write.
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());
