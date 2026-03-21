import logging
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from auth_utils import get_user_from_token

router = APIRouter()
log = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


class GoogleToken(BaseModel):
    id_token: str


@router.post("/google")
async def google_auth(body: GoogleToken):
    """Exchange Google OAuth token for Supabase session via Auth REST API."""
    log.info("Starting Google auth exchange", extra={"token_len": len(body.id_token)})
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        log.error("Supabase config missing")
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=id_token",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                },
                json={"provider": "google", "id_token": body.id_token},
            )
            log.info("Supabase auth response", extra={"status": resp.status_code})
        except Exception as e:
            log.exception("Supabase request failed")
            raise HTTPException(status_code=502, detail=f"Supabase request failed: {str(e)}")

    if resp.status_code != 200:
        err_text = resp.text
        try:
            err = resp.json() if err_text else {}
        except Exception:
            err = {}
        log.warning("Supabase auth failed", extra={"status": resp.status_code, "error": err.get("error_description", err.get("msg", ""))})
        raise HTTPException(status_code=401, detail=err.get("error_description", err.get("msg", "Login failed")))

    data = resp.json()
    user = data.get("user", {})
    return {
        "access_token": data.get("access_token"),
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "name": user.get("user_metadata", {}).get("full_name"),
        },
    }


@router.get("/me")
async def get_me(authorization: str = ""):
    """Validate JWT and return user info."""
    token = (authorization or "").replace("Bearer ", "")
    user = await get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": user.get("id"), "email": user.get("email", "")}
