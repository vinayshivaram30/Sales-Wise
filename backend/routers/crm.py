"""CRM integration endpoints — Salesforce OAuth + connection management."""
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import RedirectResponse
from auth_utils import require_user_id
from services import crm

router = APIRouter()


def _get_token(authorization: str) -> str:
    return (authorization or "").replace("Bearer ", "")


@router.get("/salesforce/authorize")
async def salesforce_authorize():
    """Redirect to Salesforce OAuth login."""
    if not crm.SF_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Salesforce not configured")
    return RedirectResponse(crm.get_authorize_url())


@router.get("/salesforce/callback")
async def salesforce_callback(code: str, authorization: str = Header("")):
    """Handle Salesforce OAuth callback — exchange code for tokens."""
    user_id = await require_user_id(authorization)
    try:
        result = await crm.exchange_code(code, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Salesforce auth failed: {str(e)}")


@router.get("/status")
async def crm_status(authorization: str = Header("")):
    """Check user's CRM connection status."""
    user_id = await require_user_id(authorization)
    return crm.get_connection_status(user_id)


@router.delete("/salesforce/disconnect")
async def salesforce_disconnect(authorization: str = Header("")):
    """Disconnect Salesforce integration."""
    user_id = await require_user_id(authorization)
    from db import supabase
    supabase.table("crm_connections").delete().eq(
        "user_id", user_id
    ).eq("provider", "salesforce").execute()
    return {"status": "disconnected"}
