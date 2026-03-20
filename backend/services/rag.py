"""RAG service for pgvector retrieval. Not wired into live suggestions in v0.1."""


async def get_rag_context(user_id: str, query: str) -> str:
    """Retrieve relevant context from embeddings. Returns empty string for v0.1."""
    return ""
