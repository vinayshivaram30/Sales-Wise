import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from auth_utils import get_user_from_token

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


class GoogleToken(BaseModel):
    id_token: str


@router.post("/google")
async def google_auth(body: GoogleToken):
    """Exchange Google OAuth token for Supabase session via Auth REST API."""
    print(f"DEBUG: Starting Google auth exchange for token (len: {len(body.id_token)})")
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("DEBUG: Supabase config missing")
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            print(f"DEBUG: Calling Supabase URL: {SUPABASE_URL}/auth/v1/token?grant_type=id_token")
            resp = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=id_token",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                },
                json={"provider": "google", "id_token": body.id_token},
            )
            print(f"DEBUG: Supabase response status: {resp.status_code}")
        except Exception as e:
            print(f"DEBUG: Supabase request failed: {str(e)}")
            raise HTTPException(status_code=502, detail=f"Supabase request failed: {str(e)}")

    if resp.status_code != 200:
        err_text = resp.text
        print(f"DEBUG: Supabase error body: {err_text}")
        err = resp.json() if err_text else {}
        print(f"DEBUG: Supabase error: {err}")
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
