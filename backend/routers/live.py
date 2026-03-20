from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from services.stt import transcribe_chunk
from services.llm import generate_suggestion
from services.session import get_session, save_session
from auth_utils import get_user_id_from_token
from db import supabase
from datetime import datetime, timezone
import asyncio
import json
import logging
import time

router = APIRouter()
log = logging.getLogger(__name__)

# --- Audio buffer: 5s chunks instead of 25s for low-latency transcript ---
CHUNK_DURATION_S = 5
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2
CHUNK_BYTES = CHUNK_DURATION_S * SAMPLE_RATE * BYTES_PER_SAMPLE

# Suggestion throttle: don't fire LLM more than once per N seconds
SUGGESTION_INTERVAL_S = 12


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
    last_suggestion_time = 0.0
    pending_suggestion: asyncio.Task | None = None
    chunks_since_suggestion = 0

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

    async def _store_chunk(call_id: str, seq_num: int, text: str):
        """Fire-and-forget DB write for transcript chunk."""
        try:
            supabase.table("transcript_chunks").insert({
                "call_id": call_id,
                "seq": seq_num,
                "speaker": "unknown",
                "text": text
            }).execute()
        except Exception as e:
            log.warning(f"Failed to store transcript chunk: {e}")

    async def _generate_and_send_suggestion(transcript_window: str, current_seq: int):
        """Generate suggestion in background and send when ready."""
        try:
            suggestion = await generate_suggestion(
                transcript_window=transcript_window,
                meddic_state=session["meddic_state"],
                asked_questions=session["asked_questions"],
                call_plan=call_plan
            )
        except Exception as e:
            log.warning(f"LLM suggestion failed: {e}")
            await websocket.send_json({"type": "error", "message": f"LLM failed: {e}"})
            return

        # Store suggestion (non-blocking)
        try:
            sug_res = supabase.table("suggestions").insert({
                "call_id": call_id,
                "seq": current_seq,
                "question": suggestion["question"],
                "meddic_field": suggestion["meddic_field"],
                "why": suggestion["why"],
                "confidence": suggestion.get("confidence", 0.8),
                "status": "shown"
            }).execute()
            suggestion["id"] = sug_res.data[0]["id"]
        except Exception as e:
            log.warning(f"Failed to store suggestion: {e}")
            suggestion["id"] = None

        session["asked_questions"].append(suggestion["question"])

        field = suggestion["meddic_field"]
        if field in session["meddic_state"] and session["meddic_state"][field] is None:
            session["meddic_state"][field] = "in_progress"

        # Send suggestion + MEDDIC update together
        await websocket.send_json({"type": "suggestion", "payload": suggestion})
        await websocket.send_json({"type": "meddic_update", "payload": session["meddic_state"]})

        # Persist session (fire-and-forget)
        asyncio.create_task(save_session(call_id, session))

    async def process_transcript(transcript_text: str):
        """Process a transcript chunk: send immediately, store async, throttle suggestions."""
        nonlocal seq, last_suggestion_time, pending_suggestion, chunks_since_suggestion

        # 1) Send transcript to client IMMEDIATELY (zero delay)
        await websocket.send_json({"type": "transcript", "payload": {"text": transcript_text}})

        seq += 1
        current_seq = seq
        chunks_since_suggestion += 1

        # 2) Store in DB as fire-and-forget (don't block the pipeline)
        asyncio.create_task(_store_chunk(call_id, current_seq, transcript_text))

        # 3) Update chunk buffer for LLM context
        session["chunk_buffer"].append(transcript_text)
        if len(session["chunk_buffer"]) > 6:
            session["chunk_buffer"].pop(0)

        # 4) Throttle suggestion generation — at least SUGGESTION_INTERVAL_S apart
        #    and at least 2 transcript chunks accumulated
        now = time.monotonic()
        time_since_last = now - last_suggestion_time
        if time_since_last < SUGGESTION_INTERVAL_S or chunks_since_suggestion < 2:
            return

        # Don't stack suggestion requests — skip if one is still in-flight
        if pending_suggestion and not pending_suggestion.done():
            return

        last_suggestion_time = now
        chunks_since_suggestion = 0
        transcript_window = " ".join(session["chunk_buffer"])
        pending_suggestion = asyncio.create_task(
            _generate_and_send_suggestion(transcript_window, current_seq)
        )

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
        # Wait for any in-flight suggestion to finish
        if pending_suggestion and not pending_suggestion.done():
            try:
                await asyncio.wait_for(pending_suggestion, timeout=5.0)
            except (asyncio.TimeoutError, Exception):
                pass

        supabase.table("calls").update({
            "status": "ended",
            "ended_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", call_id).execute()
        await save_session(call_id, session, ttl=300)
