-- Hardening migration: CASCADE for embeddings + transcript_chunks index

-- Add CASCADE to embeddings FK (missed in 004)
alter table public.embeddings drop constraint if exists embeddings_source_id_fkey;
-- embeddings doesn't have a direct FK to calls, but add index for user_id lookups
create index if not exists idx_embeddings_user_id on public.embeddings(user_id);

-- Add missing index on transcript_chunks(call_id) for post-call query performance
create index if not exists idx_transcript_chunks_call_id on public.transcript_chunks(call_id);

-- Add index on suggestions(call_id) for cleanup queries
create index if not exists idx_suggestions_call_id on public.suggestions(call_id);
