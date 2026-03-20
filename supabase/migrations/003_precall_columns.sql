-- Replace precall_context jsonb with individual columns for filtering

-- Customer/Company Context
alter table public.calls add column if not exists company text;
alter table public.calls add column if not exists contact text;
alter table public.calls add column if not exists sales_team_size text;
alter table public.calls add column if not exists current_stack text;
alter table public.calls add column if not exists known_pain text;
alter table public.calls add column if not exists deal_stage text;
alter table public.calls add column if not exists deal_size_est text;
alter table public.calls add column if not exists decision_timeline text;
alter table public.calls add column if not exists economic_buyer text;
alter table public.calls add column if not exists champion_likelihood text;

-- Product Context
alter table public.calls add column if not exists product_name text;
alter table public.calls add column if not exists category text;
alter table public.calls add column if not exists core_value_proposition text;
alter table public.calls add column if not exists pricing text;
alter table public.calls add column if not exists key_differentiators text;
alter table public.calls add column if not exists known_objections text;
alter table public.calls add column if not exists product_tags jsonb default '[]';

-- Objectives/Goals
alter table public.calls add column if not exists primary_goal text;
alter table public.calls add column if not exists secondary_goal text;
alter table public.calls add column if not exists demo_focus text;
alter table public.calls add column if not exists objection_to_preempt text;
alter table public.calls add column if not exists exit_criteria text;

-- Past
alter table public.calls add column if not exists open_objections_from_history text;

-- Past conversations (separate table for filtering)
create table if not exists public.past_conversations (
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

alter table public.past_conversations enable row level security;

create policy "own data" on public.past_conversations for all using (
  exists (select 1 from public.calls where id = call_id and user_id = auth.uid())
);

create index if not exists idx_past_conversations_call_id on public.past_conversations(call_id);
create index if not exists idx_calls_company on public.calls(company);
create index if not exists idx_calls_contact on public.calls(contact);
create index if not exists idx_calls_deal_stage on public.calls(deal_stage);
create index if not exists idx_calls_primary_goal on public.calls(primary_goal);

-- Migrate data from precall_context if column exists
do $$
declare
  r record;
  pc jsonb;
  conv jsonb;
  col_exists boolean;
begin
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='calls' and column_name='precall_context') into col_exists;
  if not col_exists then return; end if;
  for r in select id, precall_context from public.calls where precall_context is not null and precall_context != '{}'
  loop
    pc := r.precall_context;
    update public.calls set
      company = coalesce(company, pc->>'company'),
      contact = coalesce(contact, pc->>'contact'),
      sales_team_size = coalesce(sales_team_size, pc->>'sales_team_size'),
      current_stack = coalesce(current_stack, pc->>'current_stack'),
      known_pain = coalesce(known_pain, pc->>'known_pain'),
      deal_stage = coalesce(deal_stage, pc->>'deal_stage'),
      deal_size_est = coalesce(deal_size_est, pc->>'deal_size_est'),
      decision_timeline = coalesce(decision_timeline, pc->>'decision_timeline'),
      economic_buyer = coalesce(economic_buyer, pc->>'economic_buyer'),
      champion_likelihood = coalesce(champion_likelihood, pc->>'champion_likelihood'),
      product_name = coalesce(product_name, pc->>'product_name'),
      category = coalesce(category, pc->>'category'),
      core_value_proposition = coalesce(core_value_proposition, pc->>'core_value_proposition'),
      pricing = coalesce(pricing, pc->>'pricing'),
      key_differentiators = coalesce(key_differentiators, pc->>'key_differentiators'),
      known_objections = coalesce(known_objections, pc->>'known_objections'),
      product_tags = coalesce(product_tags, pc->'product_tags'),
      primary_goal = coalesce(primary_goal, pc->>'primary_goal'),
      secondary_goal = coalesce(secondary_goal, pc->>'secondary_goal'),
      demo_focus = coalesce(demo_focus, pc->>'demo_focus'),
      objection_to_preempt = coalesce(objection_to_preempt, pc->>'objection_to_preempt'),
      exit_criteria = coalesce(exit_criteria, pc->>'exit_criteria'),
      open_objections_from_history = coalesce(open_objections_from_history, pc->>'open_objections_from_history')
    where id = r.id;
    for conv in select * from jsonb_array_elements(coalesce(pc->'past_conversations', '[]'::jsonb))
    loop
      insert into public.past_conversations (call_id, date, type, duration, channel, content, outcome)
      values (r.id, conv->>'date', conv->>'type', conv->>'duration', conv->>'channel', conv->>'content', conv->>'outcome');
    end loop;
  end loop;
end $$;

-- Drop precall_context (if it was added by migration 002)
alter table public.calls drop column if exists precall_context;
