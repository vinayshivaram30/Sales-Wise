"""Auth utilities — local JWT verification (no per-request Supabase call)."""
import os
from jose import jwt, JWTError

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", os.getenv("JWT_SECRET", ""))


def verify_token(token: str) -> dict | None:
    """Verify a Supabase JWT locally and return the decoded payload."""
    if not token or not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> str | None:
    """Verify JWT locally and return the user's sub (id)."""
    payload = verify_token(token)
    return payload.get("sub") if payload else None
