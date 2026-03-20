-- Add ON DELETE CASCADE to all FK constraints referencing calls(id)
-- This allows deleting a call to automatically clean up all related rows.

-- call_plans
alter table public.call_plans drop constraint if exists call_plans_call_id_fkey;
alter table public.call_plans add constraint call_plans_call_id_fkey
  foreign key (call_id) references public.calls(id) on delete cascade;

-- transcript_chunks
alter table public.transcript_chunks drop constraint if exists transcript_chunks_call_id_fkey;
alter table public.transcript_chunks add constraint transcript_chunks_call_id_fkey
  foreign key (call_id) references public.calls(id) on delete cascade;

-- suggestions
alter table public.suggestions drop constraint if exists suggestions_call_id_fkey;
alter table public.suggestions add constraint suggestions_call_id_fkey
  foreign key (call_id) references public.calls(id) on delete cascade;

-- call_summaries
alter table public.call_summaries drop constraint if exists call_summaries_call_id_fkey;
alter table public.call_summaries add constraint call_summaries_call_id_fkey
  foreign key (call_id) references public.calls(id) on delete cascade;
