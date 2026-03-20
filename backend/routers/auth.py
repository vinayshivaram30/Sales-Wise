import os
from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel
import httpx
from auth_utils import verify_token

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
IS_PRODUCTION = os.getenv("RAILWAY_ENVIRONMENT", "") == "production" or "vercel" in os.getenv("FRONTEND_URL", "")

COOKIE_NAME = "sw_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


class GoogleToken(BaseModel):
    id_token: str


@router.post("/google")
async def google_auth(body: GoogleToken, response: Response):
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
    access_token = data.get("access_token", "")

    # Set httpOnly cookie for browser clients
    _set_auth_cookie(response, access_token)

    # Also return token in body for Chrome extension (can't read httpOnly cookies)
    return {
        "access_token": access_token,
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "name": user.get("user_metadata", {}).get("full_name"),
        },
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
async def get_me(authorization: str = "", sw_token: str = Cookie("")):
    """Validate JWT and return user info. Checks cookie first, then Authorization header."""
    token = sw_token or (authorization or "").replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": payload.get("sub"), "email": payload.get("email", "")}
