from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from services.stt import transcribe_chunk
from services.llm import generate_suggestion
from services.session import get_session, save_session
from auth_utils import get_user_id_from_token
from db import supabase
from datetime import datetime, timezone
import json
import logging

router = APIRouter()
log = logging.getLogger(__name__)

CHUNK_DURATION_S = 25
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2
CHUNK_BYTES = CHUNK_DURATION_S * SAMPLE_RATE * BYTES_PER_SAMPLE


@router.websocket("/call/{call_id}")
async def websocket_call(websocket: WebSocket, call_id: str, token: str = Query("")):
    # Verify auth before accepting connection
    user_id = get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Verify the call belongs to this user
    call_check = supabase.table("calls").select("id").eq("id", call_id).eq("user_id", user_id).single().execute()
    if not call_check.data:
        await websocket.close(code=4004, reason="Call not found")
        return

    await websocket.accept()

    call_res = supabase.table("calls").select("*").eq("id", call_id).single().execute()
    plan_res = supabase.table("call_plans").select("*").eq("call_id", call_id).single().execute()
    call = call_res.data or {}
    call_plan = plan_res.data or {}

    supabase.table("calls").update({"status": "active", "started_at": datetime.now(timezone.utc).isoformat()}).eq("id", call_id).execute()

    session = await get_session(call_id)
    audio_buf = bytearray()
    seq = 0

    # Send pre-call plan questions to sidepanel on connect
    if call_plan.get("questions"):
        await websocket.send_json({
            "type": "call_plan",
            "payload": {
                "questions": call_plan["questions"],
                "meddic_gaps": call_plan.get("meddic_gaps", {}),
                "watch_for": call_plan.get("watch_for", "")
            }
        })
        log.info(f"Sent call plan with {len(call_plan['questions'])} questions")

    async def process_transcript(transcript_text: str):
        """Process a transcript chunk: store, generate suggestion, send to client."""
        nonlocal seq

        await websocket.send_json({"type": "transcript", "payload": {"text": transcript_text}})

        seq += 1
        supabase.table("transcript_chunks").insert({
            "call_id": call_id,
            "seq": seq,
            "speaker": "unknown",
            "text": transcript_text
        }).execute()

        session["chunk_buffer"].append(transcript_text)
        if len(session["chunk_buffer"]) > 4:
            session["chunk_buffer"].pop(0)

        transcript_window = " ".join(session["chunk_buffer"])

        try:
            suggestion = await generate_suggestion(
                transcript_window=transcript_window,
                meddic_state=session["meddic_state"],
                asked_questions=session["asked_questions"],
                call_plan=call_plan
            )
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"LLM failed: {e}"})
            return

        sug_res = supabase.table("suggestions").insert({
            "call_id": call_id,
            "seq": seq,
            "question": suggestion["question"],
            "meddic_field": suggestion["meddic_field"],
            "why": suggestion["why"],
            "confidence": suggestion.get("confidence", 0.8),
            "status": "shown"
        }).execute()

        suggestion["id"] = sug_res.data[0]["id"]

        session["asked_questions"].append(suggestion["question"])

        field = suggestion["meddic_field"]
        if field in session["meddic_state"] and session["meddic_state"][field] is None:
            session["meddic_state"][field] = "in_progress"

        await save_session(call_id, session)

        await websocket.send_json({
            "type": "suggestion",
            "payload": suggestion
        })

        await websocket.send_json({
            "type": "meddic_update",
            "payload": session["meddic_state"]
        })

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                audio_buf.extend(message["bytes"])
                if len(audio_buf) == len(message["bytes"]):
                    log.info(f"First audio chunk received ({len(message['bytes'])} bytes)")

                if len(audio_buf) >= CHUNK_BYTES:
                    chunk_bytes = bytes(audio_buf[:CHUNK_BYTES])
                    audio_buf = audio_buf[CHUNK_BYTES:]

                    try:
                        transcript_text = await transcribe_chunk(chunk_bytes)
                        log.info(f"STT result: {transcript_text[:80] if transcript_text else '(empty)'}...")
                    except Exception as e:
                        log.exception("STT failed")
                        await websocket.send_json({"type": "error", "message": f"STT failed: {e}"})
                        continue

                    if not transcript_text.strip():
                        continue

                    await process_transcript(transcript_text)

            elif "text" in message:
                msg = json.loads(message["text"])

                if msg.get("type") == "suggestion_action":
                    supabase.table("suggestions").update(
                        {"status": msg["status"]}
                    ).eq("id", msg["suggestion_id"]).execute()

                elif msg.get("type") == "manual_transcript":
                    transcript_text = msg.get("text", "").strip()
                    if transcript_text:
                        log.info(f"Manual transcript: {transcript_text[:80]}...")
                        await process_transcript(transcript_text)

                elif msg.get("type") == "stop":
                    break

    except WebSocketDisconnect:
        pass
    finally:
        supabase.table("calls").update({
            "status": "ended",
            "ended_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", call_id).execute()
        await save_session(call_id, session, ttl=300)
