-- Nexus connected-mode schema (Postgres / Supabase).
-- STATUS: written and reviewed, NOT deployed. The demo build runs entirely in the browser.
-- Design: relational tables with a generic relationship table (D-005). Row-level security on every table.

create extension if not exists pgcrypto;

-- ─── Sources: what the user has allowed Nexus to read ─────────────────────────
create table source_connection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gmail','google_calendar','upload')),
  enabled boolean not null default true,
  scopes text[] not null,                         -- read-only scopes only
  -- OAuth refresh token lives in Supabase Vault; we store only the secret id.
  token_secret_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table source_item (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references source_connection(id) on delete cascade,
  kind text not null check (kind in ('email','calendar','document')),
  external_id text not null,                      -- Gmail message id, calendar event id, upload hash
  authority text not null,                        -- sender domain / 'calendar' / 'document'
  observed_at timestamptz not null,
  enabled boolean not null default true,
  flagged_injection boolean not null default false,
  -- Minimal retention: raw bodies are NOT stored; spans live on observations.
  created_at timestamptz not null default now(),
  unique (user_id, connection_id, external_id)
);

create table subject_key (
  source_item_id uuid not null references source_item(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  key_type text not null check (key_type in ('ics_uid','thread','reference','flight','name')),
  key_value text not null,
  strength text not null check (strength in ('strong','weak')),
  primary key (source_item_id, key_type, key_value)
);

-- ─── Observations: "a source said X" (derived, recomputable) ─────────────────
create table observation (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_item_id uuid not null references source_item(id) on delete cascade,
  kind text not null check (kind in ('event_time','commitment','deadline','document_request','document_present')),
  payload jsonb not null,                         -- validated by the same Zod schema as the app
  span_text text not null check (length(span_text) <= 2000),
  highlight int4range not null,
  basis text not null check (basis in ('explicit','inferred')),
  extractor text not null,
  extractor_version text not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ─── Situations (derived) and relationships ──────────────────────────────────
create table situation (
  id text not null,                               -- stable fingerprint id (FR-16, D-014)
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('conflict','change','commitment','missing_info')),
  status text not null check (status in ('confirmed','strong','conflicting','possible','needs_confirmation')),
  system_lifecycle text not null check (system_lifecycle in ('open','resolved')),
  relevant_at timestamptz,
  evidence_fingerprint text not null,
  details jsonb not null,
  computed_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table evidence (
  user_id uuid not null references auth.users(id) on delete cascade,
  situation_id text not null,
  observation_id text references observation(id) on delete cascade,
  role text not null,
  version_group text,
  primary key (user_id, situation_id, observation_id, role),
  foreign key (user_id, situation_id) references situation(user_id, id) on delete cascade
);

create table relationship (
  user_id uuid not null references auth.users(id) on delete cascade,
  from_type text not null, from_id text not null,
  to_type text not null, to_id text not null,
  kind text not null check (kind in ('same_as','possibly_same_as','affects','fulfils','requests')),
  strength text not null check (strength in ('strong','weak')),
  primary key (user_id, from_type, from_id, to_type, to_id, kind)
);

-- ─── User intent (stored, never derived) ─────────────────────────────────────
create table user_decision (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  situation_id text not null,
  action text not null check (action in ('resolve','dismiss','snooze','reopen')),
  choice text,
  reason text check (reason in ('not_relevant','wrong','handled_elsewhere')),
  snooze_until timestamptz,
  evidence_fingerprint text not null,
  at timestamptz not null default now()
);

create table audit_entry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null check (actor in ('user','nexus')),
  action text not null,
  situation_id text,
  detail text
);

-- ─── Row-level security: every row belongs to exactly one user ───────────────
do $$
declare t text;
begin
  foreach t in array array['source_connection','source_item','subject_key','observation','situation','evidence','relationship','user_decision','audit_entry']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (user_id = auth.uid())', t || '_select', t);
  end loop;
end $$;

-- Users may write their own decisions; derived tables are written only by the server (service role).
create policy user_decision_insert on user_decision for insert with check (user_id = auth.uid());
create policy source_connection_update on source_connection for update using (user_id = auth.uid());
create policy source_item_update on source_item for update using (user_id = auth.uid());

-- Audit log is append-only for everyone, including the owner.
revoke update, delete on audit_entry from authenticated, anon;
create policy audit_insert on audit_entry for insert with check (user_id = auth.uid());

create index on situation (user_id, relevant_at);
create index on observation (user_id, source_item_id);
create index on subject_key (user_id, key_type, key_value);
create index on user_decision (user_id, situation_id, at desc);
