import httpx
import os
import io
import struct

SARVAM_URL = "https://api.sarvam.ai/speech-to-text"
SAMPLE_RATE = 16000
CHANNELS = 1
BITS_PER_SAMPLE = 16

# Reuse a single HTTP client across calls (connection pooling)
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=15.0)
    return _client


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


async def transcribe_chunk(audio_bytes: bytes) -> str:
    """Send raw PCM audio (16-bit mono 16kHz) to Sarvam AI, return transcript text."""
    api_key = os.getenv("SARVAM_API_KEY", "")
    if not api_key:
        return ""

    wav_data = _pcm_to_wav(audio_bytes)
    client = _get_client()

    response = await client.post(
        SARVAM_URL,
        headers={"api-subscription-key": api_key},
        files={"file": ("audio.wav", io.BytesIO(wav_data), "audio/wav")},
        data={"model": "saaras:v3", "mode": "transcribe"},
    )
    response.raise_for_status()
    data = response.json()
    return data.get("transcript", "")
