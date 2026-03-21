"""Analytics endpoint: aggregate metrics across a user's calls."""
import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Header
from db import get_user_client
from auth_utils import require_user_id

router = APIRouter()
log = logging.getLogger(__name__)


def _get_token(authorization: str) -> str:
    return (authorization or "").replace("Bearer ", "")


@router.get("/summary")
async def analytics_summary(authorization: str = Header("")):
    await require_user_id(authorization)
    db = get_user_client(_get_token(authorization))

    # Fetch all calls for this user (RLS enforced)
    calls_res = db.table("calls").select("id,status,framework,created_at").order("created_at", desc=True).execute()
    calls = calls_res.data or []
    total_calls = len(calls)

    # Calls this week
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    calls_this_week = sum(1 for c in calls if c.get("created_at", "") >= week_ago)

    # Framework breakdown
    fw_counter = Counter(c.get("framework", "MEDDIC") for c in calls)

    # Fetch summaries for completed calls
    call_ids = [c["id"] for c in calls if c.get("status") == "ended"]
    summaries = []
    if call_ids:
        sum_res = db.table("call_summaries").select("*").in_("call_id", call_ids[:100]).execute()
        summaries = sum_res.data or []

    # Average deal score
    scores = [s["deal_score"] for s in summaries if s.get("deal_score") is not None]
    avg_deal_score = round(sum(scores) / len(scores)) if scores else 0

    # Framework coverage: count non-null fields in meddic_state / total fields
    coverage_values = []
    for s in summaries:
        state = s.get("meddic_state") or {}
        if isinstance(state, dict) and state:
            filled = sum(1 for v in state.values() if v)
            coverage_values.append(filled / len(state))
    avg_coverage = round(sum(coverage_values) / len(coverage_values), 2) if coverage_values else 0

    # Top objections (exact match on normalized lowercase)
    obj_counter: Counter = Counter()
    for s in summaries:
        for obj in (s.get("objections") or []):
            text = (obj.get("text") or "").strip().lower()
            if text:
                obj_counter[text] += 1
    top_objections = [{"text": t, "count": c} for t, c in obj_counter.most_common(10)]

    # Deal stage distribution
    stage_counter = Counter(s.get("deal_stage", "Unknown") for s in summaries if s.get("deal_stage"))

    # Weekly trend (last 8 weeks)
    trend = []
    now = datetime.now(timezone.utc)
    for weeks_ago in range(7, -1, -1):
        week_start = now - timedelta(weeks=weeks_ago)
        week_end = week_start + timedelta(weeks=1)
        iso_start = week_start.isoformat()
        iso_end = week_end.isoformat()
        week_calls = [c for c in calls if iso_start <= c.get("created_at", "") < iso_end]
        week_ids = {c["id"] for c in week_calls}
        week_scores = [s["deal_score"] for s in summaries if s.get("call_id") in week_ids and s.get("deal_score") is not None]
        trend.append({
            "week": week_start.strftime("%Y-W%W"),
            "calls": len(week_calls),
            "avg_score": round(sum(week_scores) / len(week_scores)) if week_scores else 0,
        })

    return {
        "total_calls": total_calls,
        "calls_this_week": calls_this_week,
        "avg_deal_score": avg_deal_score,
        "avg_framework_coverage": avg_coverage,
        "framework_breakdown": dict(fw_counter),
        "top_objections": top_objections,
        "deal_stage_distribution": dict(stage_counter),
        "trend": trend,
    }
