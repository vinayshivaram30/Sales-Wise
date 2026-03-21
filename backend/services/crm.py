"""Salesforce CRM write-back service.

Pushes post-call summaries to Salesforce as Activity Notes.
Behind ENABLE_CRM_WRITEBACK feature flag (default: disabled).
"""
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

from db import supabase

log = logging.getLogger(__name__)

ENABLE_CRM_WRITEBACK = os.getenv("ENABLE_CRM_WRITEBACK", "").lower() == "true"
SF_CLIENT_ID = os.getenv("SALESFORCE_CLIENT_ID", "")
SF_CLIENT_SECRET = os.getenv("SALESFORCE_CLIENT_SECRET", "")
SF_REDIRECT_URI = os.getenv("SALESFORCE_REDIRECT_URI", "")


def is_enabled() -> bool:
    return ENABLE_CRM_WRITEBACK


def get_authorize_url() -> str:
    """Generate Salesforce OAuth authorize URL."""
    return (
        f"https://login.salesforce.com/services/oauth2/authorize"
        f"?response_type=code&client_id={SF_CLIENT_ID}"
        f"&redirect_uri={SF_REDIRECT_URI}&scope=api+refresh_token"
    )


async def exchange_code(code: str, user_id: str) -> dict:
    """Exchange OAuth authorization code for tokens and store them."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://login.salesforce.com/services/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": SF_CLIENT_ID,
                "client_secret": SF_CLIENT_SECRET,
                "redirect_uri": SF_REDIRECT_URI,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    supabase.table("crm_connections").upsert({
        "user_id": user_id,
        "provider": "salesforce",
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "instance_url": data["instance_url"],
        "expires_at": expires_at,
    }, on_conflict="user_id,provider").execute()

    return {"status": "connected", "instance_url": data["instance_url"]}


async def _refresh_token(connection: dict) -> Optional[dict]:
    """Refresh an expired Salesforce access token."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://login.salesforce.com/services/oauth2/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": connection["refresh_token"],
                    "client_id": SF_CLIENT_ID,
                    "client_secret": SF_CLIENT_SECRET,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        supabase.table("crm_connections").update({
            "access_token": data["access_token"],
            "expires_at": expires_at,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", connection["id"]).execute()

        return {**connection, "access_token": data["access_token"], "expires_at": expires_at}
    except Exception:
        log.exception("Salesforce token refresh failed")
        return None


async def _sf_request(connection: dict, method: str, path: str, json_data: dict = None) -> dict:
    """Make an authenticated Salesforce API request with auto-refresh on 401."""
    url = f"{connection['instance_url']}/services/data/v59.0{path}"
    headers = {"Authorization": f"Bearer {connection['access_token']}"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.request(method, url, headers=headers, json=json_data)

        # Auto-refresh on 401
        if resp.status_code == 401:
            refreshed = await _refresh_token(connection)
            if not refreshed:
                raise httpx.HTTPStatusError("Token refresh failed", request=resp.request, response=resp)
            headers = {"Authorization": f"Bearer {refreshed['access_token']}"}
            resp = await client.request(method, url, headers=headers, json=json_data)

        resp.raise_for_status()
        return resp.json() if resp.text else {}


async def write_back_summary(user_id: str, call: dict, summary: dict) -> dict:
    """Push call summary to Salesforce as a Task/Activity Note.

    Returns status dict with success/failure details per operation.
    """
    if not ENABLE_CRM_WRITEBACK:
        return {"status": "disabled"}

    # Fetch user's CRM connection
    conn_res = supabase.table("crm_connections").select("*").eq(
        "user_id", user_id
    ).eq("provider", "salesforce").single().execute()

    if not conn_res.data:
        return {"status": "not_connected"}

    connection = conn_res.data
    results = {"status": "ok", "operations": []}

    # Create Task with summary
    try:
        task_data = {
            "Subject": f"Sales-Wise: {call.get('name', 'Call Summary')}",
            "Description": (
                f"Summary: {summary.get('summary_text', '')}\n\n"
                f"Deal Stage: {summary.get('deal_stage', 'Unknown')}\n"
                f"Deal Score: {summary.get('deal_score', 0)}%\n\n"
                f"Next Steps:\n" +
                "\n".join(f"- {ns.get('text', '')}" for ns in (summary.get("next_steps") or []))
            ),
            "Status": "Completed",
            "Priority": "Normal",
            "ActivityDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }
        await _sf_request(connection, "POST", "/sobjects/Task", task_data)
        results["operations"].append({"op": "create_task", "status": "ok"})
    except Exception as e:
        log.error("Salesforce Task creation failed", extra={"error": str(e)})
        results["operations"].append({"op": "create_task", "status": "error", "detail": str(e)})
        results["status"] = "partial"

    return results


def get_connection_status(user_id: str) -> dict:
    """Check if user has an active CRM connection."""
    conn_res = supabase.table("crm_connections").select(
        "provider,instance_url,expires_at,updated_at"
    ).eq("user_id", user_id).eq("provider", "salesforce").single().execute()

    if not conn_res.data:
        return {"connected": False, "provider": "salesforce"}

    return {
        "connected": True,
        "provider": "salesforce",
        "instance_url": conn_res.data["instance_url"],
        "last_sync": conn_res.data.get("updated_at"),
    }
