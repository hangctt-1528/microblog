-- Migration: initial_schema
-- Creates: profiles, posts, tags, post_tags, comments

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────
-- profiles (mirrors auth.users subset)
-- ──────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null unique,
  role       text not null default 'author'
               check (role in ('admin', 'author')),
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────
-- posts
-- ──────────────────────────────────────────────────
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) > 0),
  slug           text not null unique
                   check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  body_markdown  text not null default '',
  status         text not null default 'draft'
                   check (status in ('draft', 'published')),
  author_id      uuid not null references public.profiles(id)
                   on delete restrict,
  created_at     timestamptz not null default now(),
  published_at   timestamptz,
  deleted_at     timestamptz
);

create index posts_status_deleted_published_idx
  on public.posts(status, deleted_at, published_at desc);
create index posts_slug_idx
  on public.posts(slug);
create index posts_author_id_idx
  on public.posts(author_id);

-- ──────────────────────────────────────────────────
-- tags
-- ──────────────────────────────────────────────────
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique
               check (char_length(name) > 0 and char_length(name) <= 100),
  slug       text not null unique
               check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create index tags_slug_idx on public.tags(slug);
create index tags_name_idx on public.tags(name);

-- ──────────────────────────────────────────────────
-- post_tags (junction table)
-- ──────────────────────────────────────────────────
create table public.post_tags (
  post_id uuid not null references public.posts(id)  on delete cascade,
  tag_id  uuid not null references public.tags(id)   on delete restrict,
  primary key (post_id, tag_id)
);

create index post_tags_tag_id_idx on public.post_tags(tag_id);

-- ──────────────────────────────────────────────────
-- comments
-- ──────────────────────────────────────────────────
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  author_name  text not null check (char_length(author_name) > 0),
  author_email text not null
                 check (author_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  body         text not null check (char_length(body) > 0),
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

create index comments_post_id_status_idx on public.comments(post_id, status);
create index comments_status_idx on public.comments(status);
