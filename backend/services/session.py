import json
import os

_redis = None
_redis_available = True
_memory_sessions = {}  # Fallback when Redis unavailable


def _default_session():
    return {
        "meddic_state": {
            "metrics": None, "econ_buyer": None,
            "decision_criteria": None, "decision_process": None,
            "pain": None, "champion": None
        },
        "asked_questions": [],
        "chunk_buffer": [],
        "seq": 0
    }


async def get_redis():
    global _redis, _redis_available
    if not _redis_available:
        return None
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            url = os.getenv("REDIS_URL", "redis://localhost:6379")
            _redis = aioredis.from_url(url, decode_responses=True)
            await _redis.ping()
        except Exception:
            _redis_available = False
            _redis = None
    return _redis


async def get_session(call_id: str) -> dict:
    r = await get_redis()
    if r:
        try:
            raw = await r.get(f"session:{call_id}")
            if raw:
                return json.loads(raw)
        except Exception:
            # Auth error, connection refused, etc. - disable Redis and use memory
            globals()["_redis_available"] = False
            globals()["_redis"] = None
    # Fallback: in-memory (per-process)
    if call_id not in _memory_sessions:
        _memory_sessions[call_id] = _default_session()
    return _memory_sessions[call_id]


async def save_session(call_id: str, state: dict, ttl: int = 7200):
    r = await get_redis()
    if r:
        try:
            await r.setex(f"session:{call_id}", ttl, json.dumps(state))
        except Exception:
            pass
    else:
        _memory_sessions[call_id] = state


async def delete_session(call_id: str):
    r = await get_redis()
    if r:
        try:
            await r.delete(f"session:{call_id}")
            await r.delete(f"chunks:{call_id}")
        except Exception:
            pass
    _memory_sessions.pop(call_id, None)
