from fastapi import APIRouter, HTTPException, Header, Cookie
from db import supabase
from services.llm import generate_summary
from auth_utils import get_user_id_from_token

router = APIRouter()


def _extract_user_id(authorization: str = "", sw_token: str = "") -> str:
    token = sw_token or (authorization or "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return str(user_id)


@router.post("/{call_id}/summarise")
async def summarise_call(call_id: str, authorization: str = Header(""), sw_token: str = Cookie("")):
    _extract_user_id(authorization, sw_token)

    chunks_res = supabase.table("transcript_chunks").select("*") \
        .eq("call_id", call_id).order("seq").execute()

    if not chunks_res.data:
        raise HTTPException(status_code=400, detail="No transcript found")

    full_transcript = "\n".join(
        f"[{c.get('speaker', 'unknown')}]: {c['text']}"
        for c in chunks_res.data
    )

    call_res = supabase.table("calls").select("*").eq("id", call_id).single().execute()
    plan_res = supabase.table("call_plans").select("*").eq("call_id", call_id).single().execute()

    summary = await generate_summary(
        full_transcript=full_transcript,
        call=call_res.data or {},
        call_plan=plan_res.data or {}
    )

    supabase.table("call_summaries").upsert({
        "call_id": call_id,
        "summary_text": summary["summary_text"],
        "meddic_state": summary["meddic_state"],
        "objections": summary.get("objections", []),
        "next_steps": summary.get("next_steps", []),
        "deal_stage": summary["deal_stage"],
        "deal_score": summary["deal_score"],
        "coaching": summary.get("coaching", [])
    }, on_conflict="call_id").execute()

    return summary


@router.get("/{call_id}/summary")
async def get_summary(call_id: str, authorization: str = Header(""), sw_token: str = Cookie("")):
    _extract_user_id(authorization, sw_token)
    result = supabase.table("call_summaries").select("*").eq("call_id", call_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Summary not found")
    return result.data
