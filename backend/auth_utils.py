"""Auth utilities using Supabase REST API (avoids Python client set_auth bug)."""
import os
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


async def get_user_from_token(token: str) -> dict | None:
    """Verify JWT and return user dict via Supabase Auth REST API."""
    if not token or not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {token}",
            },
        )

    if response.status_code != 200:
        return None

    return response.json()


async def get_user_id_from_token(token: str) -> str | None:
    """Verify JWT and return user ID."""
    user = await get_user_from_token(token)
    return user.get("id") if user else None


async def require_user_id(authorization: str) -> str:
    """Extract and validate user ID from Authorization header. Raises 401 if invalid."""
    from fastapi import HTTPException
    token = (authorization or "").replace("Bearer ", "")
    user_id = await get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return str(user_id)
