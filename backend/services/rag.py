"""RAG service: embed call summaries at ingestion, retrieve context during live calls.

Embedding pipeline:
  Post-call summary → OpenAI ada-002 → store in embeddings table

Retrieval (live suggestions):
  Current transcript window → embed → cosine similarity search → top-5 matches → inject into prompt

Query embedding is cached per call to avoid redundant OpenAI calls when the
transcript window hasn't changed significantly.
"""
import logging
import os
from typing import Optional

import httpx

from db import supabase

log = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings"
EMBED_MODEL = "text-embedding-ada-002"
SIMILARITY_THRESHOLD = 0.3
TOP_K = 5
RAG_TIMEOUT_S = 2.0
MAX_CONTEXT_CHARS = 1500

# Per-call cache for query embeddings to avoid redundant OpenAI calls
_embedding_cache: dict[str, tuple[str, list[float]]] = {}


async def _embed_text(text: str) -> Optional[list[float]]:
    """Generate embedding via OpenAI ada-002. Returns None on failure."""
    if not OPENAI_API_KEY:
        log.warning("OPENAI_API_KEY not set — skipping embedding")
        return None

    try:
        async with httpx.AsyncClient(timeout=RAG_TIMEOUT_S) as client:
            resp = await client.post(
                OPENAI_EMBED_URL,
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={"input": text[:8000], "model": EMBED_MODEL},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["data"][0]["embedding"]
    except Exception:
        log.exception("OpenAI embedding failed")
        return None


async def store_embedding(user_id: str, call_id: str, content: str) -> bool:
    """Embed and store a call summary for future RAG retrieval.

    Called after post-call summary generation (ingestion time, not live).
    """
    embedding = await _embed_text(content)
    if not embedding:
        return False

    try:
        supabase.table("embeddings").insert({
            "user_id": user_id,
            "source_type": "call_summary",
            "source_id": call_id,
            "content": content[:4000],
            "embedding": embedding,
        }).execute()
        log.info("Stored embedding", extra={"call_id": call_id})
        return True
    except Exception:
        log.exception("Failed to store embedding")
        return False


async def get_rag_context(user_id: str, transcript_window: str, call_id: str = "") -> str:
    """Retrieve relevant past context for the current live call.

    Uses cached query embedding when the transcript window hasn't changed.
    Returns formatted context string or empty string on failure/timeout.
    """
    if not OPENAI_API_KEY or not transcript_window.strip():
        return ""

    # Check cache — reuse embedding if transcript window is the same
    cache_key = call_id or "default"
    cached = _embedding_cache.get(cache_key)
    if cached and cached[0] == transcript_window:
        query_embedding = cached[1]
    else:
        query_embedding = await _embed_text(transcript_window)
        if not query_embedding:
            return ""
        _embedding_cache[cache_key] = (transcript_window, query_embedding)

    # Query pgvector for similar past summaries
    try:
        result = supabase.rpc("match_embeddings", {
            "query_embedding": query_embedding,
            "match_threshold": SIMILARITY_THRESHOLD,
            "match_count": TOP_K,
            "filter_user_id": user_id,
        }).execute()

        if not result.data:
            return ""

        # Format as numbered list for prompt injection
        parts = []
        total_chars = 0
        for i, row in enumerate(result.data, 1):
            content = row.get("content", "")
            if total_chars + len(content) > MAX_CONTEXT_CHARS:
                content = content[:MAX_CONTEXT_CHARS - total_chars]
            parts.append(f"{i}. {content}")
            total_chars += len(content)
            if total_chars >= MAX_CONTEXT_CHARS:
                break

        return "Past context:\n" + "\n".join(parts) if parts else ""

    except Exception:
        log.exception("RAG retrieval failed")
        return ""
