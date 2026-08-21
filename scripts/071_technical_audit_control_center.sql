begin;

create table if not exists public.technical_audit_runs (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null,
  project_name text not null,
  repository text not null,
  branch text not null,
  commit_sha text not null,
  commit_url text not null,
  commit_message text,
  status text not null check (status in ('healthy', 'attention', 'critical', 'failed')),
  score_overall integer not null check (score_overall between 0 and 100),
  scores jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  engine_version text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists technical_audit_runs_project_completed_idx on public.technical_audit_runs(project_slug, completed_at desc);

create table if not exists public.technical_audit_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.technical_audit_runs(id) on delete cascade,
  project_slug text not null,
  code text not null,
  category text not null check (category in ('security', 'reliability', 'tests', 'maintainability', 'scalability')),
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  title text not null,
  description text not null,
  evidence text,
  file_path text,
  remediation text not null,
  change_type text not null check (change_type in ('FIX', 'REFACTOR', 'IMPROVEMENT')),
  created_at timestamptz not null default now()
);

create index if not exists technical_audit_findings_run_idx on public.technical_audit_findings(run_id, severity);
alter table public.technical_audit_runs enable row level security;
alter table public.technical_audit_findings enable row level security;

-- Defense in depth: le tabelle non devono essere interrogabili dal Data API.
-- Il Control Center usa esclusivamente il client server-side con service role.
revoke all on table public.technical_audit_runs from anon, authenticated;
revoke all on table public.technical_audit_findings from anon, authenticated;

-- Nessuna policy pubblica: lettura e scrittura avvengono esclusivamente dal server con service role.

commit;

