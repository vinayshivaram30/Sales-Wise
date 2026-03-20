from fastapi import APIRouter, HTTPException, Header
from models import CallCreate, CallUpdate
from db import supabase
from services.llm import generate_call_plan
from auth_utils import get_user_id_from_token

router = APIRouter()


async def get_user_id(authorization: str) -> str:
    token = (authorization or "").replace("Bearer ", "")
    user_id = await get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return str(user_id)


@router.post("")
async def create_call(body: CallCreate, authorization: str = Header("")):
    user_id = await get_user_id(authorization)
    result = supabase.table("calls").insert({
        "user_id": user_id,
        "name": body.name,
        "contact_name": body.contact_name or "",
        "company_name": body.company_name or "",
        "goal": body.goal or "Discovery",
        "product_ctx": body.product_ctx,
        "company_ctx": body.company_ctx,
        "past_context": body.past_context,
        "status": "created"
    }).execute()
    return result.data[0]


@router.patch("/{call_id}")
async def update_call(call_id: str, body: CallUpdate, authorization: str = Header("")):
    user_id = await get_user_id(authorization)
    call_res = supabase.table("calls").select("id").eq("id", call_id).eq("user_id", user_id).single().execute()
    if not call_res.data:
        raise HTTPException(status_code=404, detail="Call not found")
    data = body.model_dump()
    past_conversations = data.pop("past_conversations", None)
    updates = {k: v for k, v in data.items() if v is not None}
    if past_conversations is not None:
        supabase.table("past_conversations").delete().eq("call_id", call_id).execute()
        if past_conversations:
            rows = [{"call_id": call_id, "date": c.get("date"), "type": c.get("type"), "duration": c.get("duration"), "channel": c.get("channel"), "content": c.get("content"), "outcome": c.get("outcome")} for c in past_conversations if isinstance(c, dict)]
            if rows:
                supabase.table("past_conversations").insert(rows).execute()
    if updates:
        supabase.table("calls").update(updates).eq("id", call_id).execute()
    return supabase.table("calls").select("*").eq("id", call_id).single().execute().data


@router.post("/{call_id}/plan")
async def create_call_plan(call_id: str, authorization: str = Header("")):
    user_id = await get_user_id(authorization)

    call_res = supabase.table("calls").select("*").eq("id", call_id).eq("user_id", user_id).single().execute()
    if not call_res.data:
        raise HTTPException(status_code=404, detail="Call not found")

    call = call_res.data
    try:
        plan = await generate_call_plan(call)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to generate plan: {str(e)}")

    supabase.table("call_plans").upsert({
        "call_id": call_id,
        "questions": plan["questions"],
        "meddic_gaps": plan["meddic_gaps"],
        "watch_for": plan.get("watch_for")
    }, on_conflict="call_id").execute()

    return {"call_id": call_id, **plan}


@router.get("/{call_id}/plan")
async def get_call_plan(call_id: str, authorization: str = Header("")):
    await get_user_id(authorization)
    result = supabase.table("call_plans").select("*").eq("call_id", call_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    return result.data


@router.get("/{call_id}/detail")
async def get_call_detail(call_id: str, authorization: str = Header("")):
    await get_user_id(authorization)
    call_res = supabase.table("calls").select("*").eq("id", call_id).single().execute()
    if not call_res.data:
        raise HTTPException(status_code=404, detail="Call not found")
    call = call_res.data
    chunks = supabase.table("transcript_chunks").select("*").eq("call_id", call_id).order("seq").execute()
    summary = supabase.table("call_summaries").select("*").eq("call_id", call_id).single().execute()
    past = supabase.table("past_conversations").select("*").eq("call_id", call_id).order("created_at").execute()
    call["transcript_chunks"] = chunks.data or []
    call["summary"] = summary.data
    call["past_conversations"] = past.data or []
    return call


@router.delete("/{call_id}")
async def delete_call(call_id: str, authorization: str = Header("")):
    user_id = await get_user_id(authorization)
    call_res = supabase.table("calls").select("id").eq("id", call_id).eq("user_id", user_id).single().execute()
    if not call_res.data:
        raise HTTPException(status_code=404, detail="Call not found")
    for table in ("call_summaries", "suggestions", "transcript_chunks", "call_plans", "past_conversations"):
        supabase.table(table).delete().eq("call_id", call_id).execute()
    supabase.table("calls").delete().eq("id", call_id).execute()
    return {"ok": True}


@router.get("")
async def list_calls(authorization: str = Header(""), with_plan_only: bool = False):
    user_id = await get_user_id(authorization)
    result = supabase.table("calls").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
    calls = result.data or []
    if with_plan_only:
        call_ids = [c["id"] for c in calls]
        plan_res = supabase.table("call_plans").select("call_id").in_("call_id", call_ids).execute()
        plan_call_ids = {p["call_id"] for p in (plan_res.data or [])}
        calls = [c for c in calls if c["id"] in plan_call_ids]
    return calls


@router.post("/{call_id}/suggestions/{suggestion_id}/action")
async def update_suggestion(call_id: str, suggestion_id: str, body: dict, authorization: str = Header("")):
    await get_user_id(authorization)
    supabase.table("suggestions").update({"status": body["status"]}).eq("id", suggestion_id).execute()
    return {"ok": True}
