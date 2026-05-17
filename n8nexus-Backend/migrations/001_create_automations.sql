-- Run in Supabase SQL editor if tables are not created via SQLAlchemy create_all.
-- Matches OpenAi-chat/db/models.py

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id varchar(128) not null,
  template_id varchar(64),
  template_title varchar(255),
  workflow_name varchar(255) not null default 'Untitled workflow',
  workflow_json jsonb not null default '{}'::jsonb,
  fields jsonb not null default '{}'::jsonb,
  status varchar(32) not null default 'generated',
  n8n_workflow_id varchar(64),
  n8n_instance_url text,
  editor_url text,
  webhook_path varchar(255),
  webhook_test_url text,
  webhook_production_url text,
  active boolean,
  deploy_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deployed_at timestamptz,
  constraint automations_user_session_unique unique (user_id, session_id)
);

create index if not exists automations_user_id_idx on public.automations (user_id);
create index if not exists automations_user_updated_idx on public.automations (user_id, updated_at desc);
