from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, calls, live, postcall
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Sales-Wise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "https://sales-wise.vercel.app",
        "http://localhost:5173",
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


@app.get("/health")
def health():
    return {"status": "ok"}
