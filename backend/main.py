import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, calls, live, postcall, analytics

app = FastAPI(title="Sales-Wise - Sales Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/"),
        "https://sales-wise.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "chrome-extension://*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(calls.router, prefix="/calls", tags=["calls"])
app.include_router(live.router, prefix="/ws", tags=["live"])
app.include_router(postcall.router, prefix="/postcall", tags=["postcall"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
async def health():
    """Health check that verifies connectivity to Supabase and Redis."""
    checks = {"api": "ok"}

    # Check Supabase
    try:
        from db import supabase
        supabase.table("profiles").select("id").limit(1).execute()
        checks["supabase"] = "ok"
    except Exception:
        checks["supabase"] = "error"

    # Check Redis (optional)
    try:
        from services.session import get_redis
        r = await get_redis()
        if r:
            await r.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "unavailable"
    except Exception:
        checks["redis"] = "error"

    status = "ok" if checks.get("supabase") == "ok" else "degraded"
    return {"status": status, "checks": checks}
