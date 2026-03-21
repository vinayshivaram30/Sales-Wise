-- RAG: vector similarity search function for embeddings
create or replace function match_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  content text,
  source_type text,
  source_id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    e.id,
    e.content,
    e.source_type,
    e.source_id,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  where e.user_id = filter_user_id
    and 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Multi-framework: add framework column to calls
alter table public.calls add column if not exists framework text default 'MEDDIC';
