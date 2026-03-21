from fastapi import APIRouter, HTTPException, Header
from db import get_user_client
from services.llm import generate_summary
from auth_utils import require_user_id

router = APIRouter()


def _get_token(authorization: str) -> str:
    return (authorization or "").replace("Bearer ", "")


@router.post("/{call_id}/summarise")
async def summarise_call(call_id: str, authorization: str = Header("")):
    await require_user_id(authorization)
    db = get_user_client(_get_token(authorization))

    chunks_res = db.table("transcript_chunks").select("*") \
        .eq("call_id", call_id).order("seq").execute()

    if not chunks_res.data:
        raise HTTPException(status_code=400, detail="No transcript found")

    full_transcript = "\n".join(
        f"[{c.get('speaker', 'unknown')}]: {c['text']}"
        for c in chunks_res.data
    )

    call_res = db.table("calls").select("*").eq("id", call_id).single().execute()
    plan_res = db.table("call_plans").select("*").eq("call_id", call_id).single().execute()

    summary = await generate_summary(
        full_transcript=full_transcript,
        call=call_res.data or {},
        call_plan=plan_res.data or {}
    )

    db.table("call_summaries").upsert({
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
async def get_summary(call_id: str, authorization: str = Header("")):
    await require_user_id(authorization)
    db = get_user_client(_get_token(authorization))
    result = db.table("call_summaries").select("*").eq("call_id", call_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Summary not found")
    return result.data
