-- DOMO AI MVP - All-in-One Supabase Schema (Idempotent)
-- Safe to run multiple times. Creates/updates tables, policies, and storage buckets.
-- Notes:
-- - Video processing trigger is intentionally disabled by default (see section at bottom).
-- - This script consolidates migrations and schema into a single setup file.

-- =========================
-- Extensions
-- =========================
create extension if not exists vector;
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Optional: If you plan to use http/pg_net from DB, uncomment next line
-- create extension if not exists http;

-- =========================
-- Table: demos
-- =========================
create table if not exists public.demos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid not null,
  agent_name text default 'Demo Agent',
  agent_personality text default 'Friendly and helpful',
  agent_greeting text default 'Hello! I''m your demo agent. How can I help you today?',
  status text default 'draft',
  published_url text,
  tavus_persona_id text,
  tavus_conversation_id text,
  video_storage_path text default '',
  metadata jsonb default '{}'::jsonb,
  -- Unique upload identifier for uploads & storage scoping
  upload_id uuid
);

-- Ensure metadata column stores an object
do $$ begin
  alter table public.demos
    alter column metadata type jsonb
    using case
      when metadata is null then '{}'::jsonb
      when metadata::text = '' then '{}'::jsonb
      when jsonb_typeof(metadata::jsonb) = 'object' then metadata::jsonb
      else '{}'::jsonb
    end;
exception when others then null; end $$;

-- Ensure upload_id exists and is non-null
do $$ begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='demos' and column_name='upload_id'
  ) then
    alter table public.demos add column upload_id uuid default uuid_generate_v4();
  end if;
  alter table public.demos alter column upload_id set not null;
exception when others then null; end $$;

-- Ensure upload_id has a default even if column already existed
do $$ begin
  alter table public.demos alter column upload_id set default uuid_generate_v4();
exception when others then null; end $$;

-- Unique constraint on upload_id
do $$ begin
  if not exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid=t.oid
     where c.conname='unique_upload_id' and t.relname='demos'
  ) then
    alter table public.demos add constraint unique_upload_id unique (upload_id);
  end if;
exception when others then null; end $$;

-- GIN index on metadata
-- Use jsonb_path_ops for performance on path queries
-- Drop legacy index name if present then add desired form
drop index if exists idx_demos_metadata_gin;
create index if not exists idx_demos_metadata_gin on public.demos using gin (metadata jsonb_path_ops);

-- Upload id index (explicit, redundant with unique but fast path for lookups)
create index if not exists idx_demos_upload_id on public.demos (upload_id);

-- Valid metadata check
do $$ begin
  if exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid=t.oid
     where c.conname='valid_metadata' and t.relname='demos'
  ) then
    alter table public.demos drop constraint valid_metadata;
  end if;
  alter table public.demos add constraint valid_metadata check (jsonb_typeof(metadata) = 'object');
exception when others then null; end $$;

-- Updated_at trigger to auto-touch
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end; $$ language plpgsql;

drop trigger if exists handle_demos_updated_at on public.demos;
create trigger handle_demos_updated_at
  before update on public.demos
  for each row execute procedure public.handle_updated_at();

-- CTA columns (newer per-demo fields)
alter table public.demos
  add column if not exists cta_title text,
  add column if not exists cta_message text,
  add column if not exists cta_button_text text,
  add column if not exists cta_button_url text,
  add column if not exists cta_return_url text;

comment on column public.demos.cta_title is 'Per-demo CTA title';
comment on column public.demos.cta_message is 'Per-demo CTA message/body';
comment on column public.demos.cta_button_text is 'Per-demo CTA button label';
comment on column public.demos.cta_button_url is 'Per-demo CTA button URL';
comment on column public.demos.cta_return_url is 'URL to redirect users back to after conversation ends';

-- RLS for demos
alter table public.demos enable row level security;
drop policy if exists "Users can view their own demos" on public.demos;
create policy "Users can view their own demos" on public.demos for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own demos" on public.demos;
create policy "Users can insert their own demos" on public.demos for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own demos" on public.demos;
create policy "Users can update their own demos" on public.demos for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own demos" on public.demos;
create policy "Users can delete their own demos" on public.demos for delete using (auth.uid() = user_id);

-- Realtime publication (best effort idempotency)
do $$ begin
  begin
    alter publication supabase_realtime add table public.demos;
  exception when others then null; end;
end $$;

-- =========================
-- Table: demo_videos
-- =========================
create table if not exists public.demo_videos (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid not null references public.demos(id) on delete cascade,
  title text not null,
  storage_url text not null,
  order_index integer not null,
  duration_seconds integer,
  processing_status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  transcript text
);

-- Add processing_error column if missing
alter table public.demo_videos add column if not exists processing_error text;

-- RLS for demo_videos
alter table public.demo_videos enable row level security;
drop policy if exists "Users can select their demo videos" on public.demo_videos;
create policy "Users can select their demo videos" on public.demo_videos for select using ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "Users can insert their demo videos" on public.demo_videos;
create policy "Users can insert their demo videos" on public.demo_videos for insert with check ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "Users can update their demo videos" on public.demo_videos;
create policy "Users can update their demo videos" on public.demo_videos for update using ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "Users can delete their demo videos" on public.demo_videos;
create policy "Users can delete their demo videos" on public.demo_videos for delete using ((select user_id from public.demos where id = demo_id) = auth.uid());

-- =========================
-- Table: knowledge_chunks
-- =========================
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid not null references public.demos(id) on delete cascade,
  content text not null,
  question text,
  answer text,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Vector embedding column
alter table public.knowledge_chunks add column if not exists vector_embedding vector(1536);

-- chunk_type with validation
alter table public.knowledge_chunks add column if not exists chunk_type text;
update public.knowledge_chunks set chunk_type = coalesce(chunk_type, 'document');

do $$ begin
  if not exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid=t.oid
    where c.conname='knowledge_chunks_chunk_type_chk' and t.relname='knowledge_chunks'
  ) then
    alter table public.knowledge_chunks
      add constraint knowledge_chunks_chunk_type_chk
      check (chunk_type in ('transcript','qa','document'));
  end if;
exception when others then null; end $$;

-- Vector index for similarity search
create index if not exists knowledge_chunks_vector_embedding_idx
  on public.knowledge_chunks using ivfflat (vector_embedding vector_cosine_ops) with (lists = 100);

-- RLS for knowledge_chunks
alter table public.knowledge_chunks enable row level security;
drop policy if exists "Users can select their knowledge chunks" on public.knowledge_chunks;
create policy "Users can select their knowledge chunks" on public.knowledge_chunks for select using ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "Users can insert their knowledge chunks" on public.knowledge_chunks;
create policy "Users can insert their knowledge chunks" on public.knowledge_chunks for insert with check ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "Users can update their knowledge chunks" on public.knowledge_chunks;
create policy "Users can update their knowledge chunks" on public.knowledge_chunks for update using ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "Users can delete their knowledge chunks" on public.knowledge_chunks;
create policy "Users can delete their knowledge chunks" on public.knowledge_chunks for delete using ((select user_id from public.demos where id = demo_id) = auth.uid());

-- =========================
-- Storage: demo-videos bucket and policies
-- =========================
insert into storage.buckets (id, name, public, file_size_limit)
values ('demo-videos','demo-videos', false, 104857600)
on conflict (id) do nothing;

-- Allowed MIME types for videos
update storage.buckets
 set allowed_mime_types = array['video/mp4','video/avi','video/mov','video/wmv','video/flv','video/webm','video/mkv']
 where id='demo-videos';

-- Storage object policies (RLS)
drop policy if exists "Users can view their own videos" on storage.objects;
create policy "Users can view their own videos"
  on storage.objects for select
  using (bucket_id = 'demo-videos' and (storage.foldername(name))[1] in (
    select id::text from public.demos where user_id = auth.uid()
  ));

drop policy if exists "Users can upload their own videos" on storage.objects;
create policy "Users can upload their own videos"
  on storage.objects for insert
  with check (bucket_id = 'demo-videos' and (storage.foldername(name))[1] in (
    select id::text from public.demos where user_id = auth.uid()
  ));

drop policy if exists "Users can update their own videos" on storage.objects;
create policy "Users can update their own videos"
  on storage.objects for update
  using (bucket_id = 'demo-videos' and (storage.foldername(name))[1] in (
    select id::text from public.demos where user_id = auth.uid()
  ));

drop policy if exists "Users can delete their own videos" on storage.objects;
create policy "Users can delete their own videos"
  on storage.objects for delete
  using (bucket_id = 'demo-videos' and (storage.foldername(name))[1] in (
    select id::text from public.demos where user_id = auth.uid()
  ));

-- =========================
-- Pricing and Usage
-- =========================
create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  max_videos integer,
  max_storage_mb integer,
  max_concurrent_streams integer,
  created_at timestamptz default now()
);

create table if not exists public.user_pricing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tier_id uuid not null references public.pricing_tiers(id) on delete restrict,
  effective_at timestamptz not null default now()
);

alter table public.pricing_tiers enable row level security;
drop policy if exists "pricing_tiers read all" on public.pricing_tiers;
create policy "pricing_tiers read all" on public.pricing_tiers for select using (true);

alter table public.user_pricing enable row level security;
drop policy if exists "user_pricing self access" on public.user_pricing;
create policy "user_pricing self access" on public.user_pricing
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Usage events (for quotas/analytics)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  demo_id uuid references public.demos(id) on delete cascade,
  type text not null,
  quantity integer not null default 1,
  occurred_at timestamptz not null default now()
);

create index if not exists usage_events_user_occurred_idx on public.usage_events(user_id, occurred_at desc);

alter table public.usage_events enable row level security;
drop policy if exists "usage_events self access" on public.usage_events;
create policy "usage_events self access" on public.usage_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- Knowledge Sources (ingestion registry)
-- =========================
do $$ begin
  if not exists (select 1 from pg_type where typname='knowledge_source_type') then
    create type public.knowledge_source_type as enum ('pdf','csv','url','text');
  end if;
end $$;

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid not null references public.demos(id) on delete cascade,
  source_type public.knowledge_source_type not null,
  location text not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create index if not exists knowledge_sources_demo_idx on public.knowledge_sources(demo_id);

alter table public.knowledge_sources enable row level security;
drop policy if exists "knowledge_sources owner select" on public.knowledge_sources;
create policy "knowledge_sources owner select" on public.knowledge_sources
  for select using ((select user_id from public.demos where id = demo_id) = auth.uid());
drop policy if exists "knowledge_sources owner modify" on public.knowledge_sources;
create policy "knowledge_sources owner modify" on public.knowledge_sources
  for all using ((select user_id from public.demos where id = demo_id) = auth.uid())
  with check ((select user_id from public.demos where id = demo_id) = auth.uid());

-- =========================
-- Webhook Idempotency
-- =========================
create table if not exists public.processed_webhook_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

create index if not exists processed_webhook_events_event_id_idx on public.processed_webhook_events(event_id);
-- No RLS here; typically accessed by service role only.

-- =========================
-- Video Processing Trigger (Disabled by default)
-- =========================
-- The legacy trigger called a hard-coded Edge Function URL with a static JWT, which is unsafe.
-- We explicitly drop anything that may exist, and leave instructions to add a safe, project-specific trigger later.

drop trigger if exists on_new_video on storage.objects;
drop function if exists public.handle_new_video();

-- To enable automatic video processing for uploads into the 'demo-videos' bucket,
-- create an Edge Function in your Supabase project named 'process-video' and
-- implement secure authentication for net.http_post() calls. Then, add a safe trigger like:
--
-- create or replace function public.handle_new_video()
-- returns trigger as $$
-- begin
--   perform net.http_post(
--     url := 'https://<your-project-ref>.functions.supabase.co/process-video',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.anon_jwt', true)),
--     body := jsonb_build_object('type','INSERT','table','objects','schema','storage','record', jsonb_build_object('key', new.name, 'bucket', new.bucket_id))
--   );
--   return new;
-- end; $$ language plpgsql security definer;
--
-- create trigger on_new_video after insert on storage.objects
--   for each row when (new.bucket_id = 'demo-videos')
--   execute procedure public.handle_new_video();

-- =========================
-- End of schema
-- =========================
