import httpx
import logging
import os
import io
import struct

log = logging.getLogger(__name__)
SARVAM_URL = "https://api.sarvam.ai/speech-to-text"
SAMPLE_RATE = 16000
CHANNELS = 1
BITS_PER_SAMPLE = 16


def _pcm_to_wav(pcm_bytes: bytes) -> bytes:
    """Wrap raw PCM (16-bit mono) in WAV header."""
    data_size = len(pcm_bytes)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,  # fmt chunk size
        1,   # PCM format
        CHANNELS,
        SAMPLE_RATE,
        SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE // 8,
        CHANNELS * BITS_PER_SAMPLE // 8,
        BITS_PER_SAMPLE,
        b"data",
        data_size,
    )
    return header + pcm_bytes


def estimate_speaker(text: str) -> str:
    """Estimate speaker from text content using word-count heuristic.

    Questions (sentences ending with ?) are more likely from the rep.
    Longer monologues without questions are more likely from the prospect.
    Returns 'estimated_rep' or 'estimated_prospect'.
    """
    sentences = [s.strip() for s in text.replace("!", ".").split(".") if s.strip()]
    questions = sum(1 for s in text.split("?") if s.strip()) - (0 if text.endswith("?") else 0)
    question_count = text.count("?")
    word_count = len(text.split())

    # Heuristic: high question density = rep, long monologue = prospect
    if word_count == 0:
        return "estimated_rep"
    question_ratio = question_count / max(len(sentences), 1)
    if question_ratio > 0.3 or word_count < 20:
        return "estimated_rep"
    return "estimated_prospect"


async def transcribe_chunk(audio_bytes: bytes) -> str:
    """Send raw PCM audio (16-bit mono 16kHz) to Sarvam AI, return transcript text."""
    api_key = os.getenv("SARVAM_API_KEY", "")
    if not api_key:
        return ""

    wav_data = _pcm_to_wav(audio_bytes)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            SARVAM_URL,
            headers={"api-subscription-key": api_key},
            files={"file": ("audio.wav", io.BytesIO(wav_data), "audio/wav")},
            data={"model": "saaras:v3", "mode": "transcribe"},
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            log.error("Sarvam STT request failed", extra={"status": e.response.status_code})
            return ""
        data = response.json()
        return data.get("transcript", "")
