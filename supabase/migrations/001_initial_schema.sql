-- ─────────────────────────────────────────────────────────
-- StepBook — Schema Supabase
-- Run: supabase db push  (or paste in SQL Editor)
-- ─────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  plan             text not null default 'free' check (plan in ('free','pro')),
  plan_expires_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── USED KEYS ────────────────────────────────────────────
create table if not exists public.used_keys (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null unique,
  user_id    uuid references public.profiles(id) on delete set null,
  used_at    timestamptz not null default now()
);

-- ── BOOKS ────────────────────────────────────────────────
create table if not exists public.books (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  author       text,
  cover_b64    text,        -- base64 JPEG (extracted from PDF page 1)
  cover_url    text,        -- public URL from storage or Google Books
  emoji        text,
  description  text,
  chapters     jsonb not null default '[]',
  questions    jsonb not null default '[]',
  reflections  jsonb not null default '[]',
  total_pages  integer not null default 0,
  progress     integer not null default 0 check (progress >= 0 and progress <= 100),
  added_at     timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists books_user_id_idx on public.books(user_id);

-- ── BOOK PAGES ───────────────────────────────────────────
create table if not exists public.book_pages (
  id        uuid primary key default uuid_generate_v4(),
  book_id   uuid not null references public.books(id) on delete cascade,
  page_num  integer not null,
  text      text not null,
  unique(book_id, page_num)
);

create index if not exists book_pages_book_id_idx on public.book_pages(book_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.books       enable row level security;
alter table public.book_pages  enable row level security;
alter table public.used_keys   enable row level security;

-- Profiles: users see only their own
create policy "profiles: own" on public.profiles
  for all using (auth.uid() = id);

-- Books: users see only their own
create policy "books: own" on public.books
  for all using (auth.uid() = user_id);

-- Book pages: users see only their own books' pages
create policy "book_pages: own" on public.book_pages
  for all using (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

-- Used keys: authenticated users can read/insert
create policy "used_keys: read" on public.used_keys
  for select using (auth.role() = 'authenticated');
create policy "used_keys: insert" on public.used_keys
  for insert with check (auth.role() = 'authenticated');

-- ── STORAGE BUCKETS ──────────────────────────────────────
-- Run these in Supabase Dashboard > Storage > New bucket
-- Or via CLI: supabase storage create pdfs --public=false
-- supabase storage create covers --public=true

insert into storage.buckets (id, name, public)
values ('pdfs',   'pdfs',   false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Storage policies: users access only their own folder
create policy "pdfs: owner" on storage.objects
  for all using (
    bucket_id = 'pdfs' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers: owner write" on storage.objects
  for insert with check (
    bucket_id = 'covers' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers: public read" on storage.objects
  for select using (bucket_id = 'covers');
