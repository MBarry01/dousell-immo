create table if not exists public.visit_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  project_type text not null,
  availability text not null,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

comment on table public.visit_requests is 'Demandes de visites planifiées via la conciergerie';


