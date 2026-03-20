-- Sales-Wise - Supabase schema
-- Run this in the Supabase SQL editor before starting

-- Enable vector extension for RAG
create extension if not exists vector;

-- Users (Supabase auth handles auth.users automatically)
create table public.profiles (
  id          uuid references auth.users(id) primary key,
  full_name   text,
  frameworks  text[] default array['MEDDIC'],
  created_at  timestamptz default now()
);

-- Calls
create table public.calls (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id),
  name          text,
  contact_name  text,
  company_name  text,
  goal          text default 'Discovery',
  product_ctx   text,
  company_ctx   text,
  past_context  text,
  status        text default 'created',
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz default now(),
  -- Customer/Company Context
  company       text,
  contact       text,
  sales_team_size text,
  current_stack text,
  known_pain    text,
  deal_stage    text,
  deal_size_est text,
  decision_timeline text,
  economic_buyer text,
  champion_likelihood text,
  -- Product Context
  product_name  text,
  category      text,
  core_value_proposition text,
  pricing       text,
  key_differentiators text,
  known_objections text,
  product_tags  jsonb default '[]',
  -- Objectives/Goals
  primary_goal  text,
  secondary_goal text,
  demo_focus    text,
  objection_to_preempt text,
  exit_criteria text,
  -- Past
  open_objections_from_history text
);

-- Past conversations (for filtering by date, type, etc.)
create table public.past_conversations (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid references public.calls(id) on delete cascade,
  date        text,
  type        text,
  duration    text,
  channel     text,
  content     text,
  outcome     text,
  created_at  timestamptz default now()
);

create index on public.past_conversations(call_id);
create index on public.calls(company);
create index on public.calls(contact);
create index on public.calls(deal_stage);
create index on public.calls(primary_goal);

-- Call plans (pre-call output)
create table public.call_plans (
  id            uuid primary key default gen_random_uuid(),
  call_id       uuid references public.calls(id) on delete cascade unique,
  questions     jsonb not null,
  meddic_gaps   jsonb not null,
  watch_for     text,
  created_at    timestamptz default now()
);

-- Transcript chunks
create table public.transcript_chunks (
  id        uuid primary key default gen_random_uuid(),
  call_id   uuid references public.calls(id) on delete cascade,
  seq       integer not null,
  speaker   text,
  text      text not null,
  start_s   float,
  end_s     float,
  created_at timestamptz default now()
);

-- Suggestions generated during live call
create table public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  call_id       uuid references public.calls(id) on delete cascade,
  seq           integer not null,
  question      text not null,
  meddic_field  text not null,
  why           text not null,
  confidence    float default 0.8,
  status        text default 'shown',
  created_at    timestamptz default now()
);

-- Call summaries (post-call output)
create table public.call_summaries (
  id            uuid primary key default gen_random_uuid(),
  call_id       uuid references public.calls(id) on delete cascade unique,
  summary_text  text not null,
  meddic_state  jsonb not null,
  objections    jsonb,
  next_steps    jsonb,
  deal_stage    text,
  deal_score    integer,
  coaching      jsonb,
  created_at    timestamptz default now()
);

-- Embeddings for RAG
create table public.embeddings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  source_type text not null,
  source_id   uuid,
  content     text not null,
  embedding   vector(1536),
  created_at  timestamptz default now()
);

create index on public.embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Row Level Security
alter table public.profiles        enable row level security;
alter table public.calls           enable row level security;
alter table public.past_conversations enable row level security;
alter table public.call_plans      enable row level security;
alter table public.transcript_chunks enable row level security;
alter table public.suggestions     enable row level security;
alter table public.call_summaries  enable row level security;
alter table public.embeddings      enable row level security;

-- RLS policies
create policy "own data" on public.profiles for all using (auth.uid() = id);

create policy "own data" on public.calls for all using (auth.uid() = user_id);

create policy "own data" on public.past_conversations for all using (
  exists (select 1 from public.calls where id = call_id and user_id = auth.uid())
);

create policy "own data" on public.call_plans for all using (
  exists (select 1 from public.calls where id = call_id and user_id = auth.uid())
);

create policy "own data" on public.transcript_chunks for all using (
  exists (select 1 from public.calls where id = call_id and user_id = auth.uid())
);

create policy "own data" on public.suggestions for all using (
  exists (select 1 from public.calls where id = call_id and user_id = auth.uid())
);

create policy "own data" on public.call_summaries for all using (
  exists (select 1 from public.calls where id = call_id and user_id = auth.uid())
);

create policy "own data" on public.embeddings for all using (auth.uid() = user_id);
