-- Create table to enforce idempotency for webhook tool-call events
create table if not exists public.processed_webhook_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

-- Helpful index (redundant with PK but explicit for clarity)
create index if not exists processed_webhook_events_event_id_idx on public.processed_webhook_events (event_id);

-- RLS (optional). If RLS is enabled globally, keep this table accessible to service role only.
-- For simplicity, we do not enable RLS on this table.
-- alter table public.processed_webhook_events enable row level security;
