# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sales-Wise (CloseIt) is an AI-powered sales copilot that provides real-time coaching during Google Meet calls. It uses the MEDDIC framework to guide sales reps through discovery calls, generating live question suggestions and post-call analysis.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # Dev server on :8000
```
Python 3.12. Requires: Redis (optional, falls back to in-memory), Anthropic API key, Sarvam API key (STT).

### Frontend (React + Vite + Tailwind v4)
```bash
cd frontend
npm install
npm run dev       # Dev server on :5173
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

### Tests
```bash
cd backend
python -m pytest tests/                    # All tests
python -m pytest tests/test_auth_utils.py  # Single test file
```

### Chrome Extension
Load `extension/` as unpacked extension in `chrome://extensions` (Developer mode). Set `API_BASE` and `WS_BASE` in `extension/background.js`.

### Deployment
- Frontend: Vercel (configured via `vercel.json`)
- Backend: Railway

## Architecture

### Data Flow
1. **Pre-call**: User fills call context (contact, company, goal) → backend generates MEDDIC call plan via Claude API (`POST /calls/{id}/plan`)
2. **Live call**: Chrome extension captures Google Meet tab audio → streams PCM over WebSocket (`/ws/call/{id}`) → Sarvam STT transcribes → Claude generates next-best-question suggestion → sent back to extension side panel
3. **Post-call**: Full transcript fed to Claude → generates summary, MEDDIC scorecard, objections, next steps, coaching (`POST /postcall/{id}/summary`)

### Backend Structure (`backend/`)
- `main.py` — FastAPI app with CORS, mounts 4 routers: `auth`, `calls`, `live` (WebSocket), `postcall`
- `routers/live.py` — WebSocket handler: buffers 25s audio chunks, orchestrates STT → LLM suggestion loop, tracks MEDDIC state
- `routers/calls.py` — CRUD for calls, call plans, suggestions
- `services/llm.py` — All Claude API calls (call plan, live suggestion, post-call summary). Uses `claude-sonnet-4-5`. JSON-only responses parsed with `_parse_json_response`
- `services/stt.py` — Sarvam AI speech-to-text (PCM→WAV→API)
- `services/session.py` — Redis-backed session state (MEDDIC progress, asked questions, transcript buffer). Falls back to in-memory dict
- `auth_utils.py` — JWT token validation via Supabase
- `db.py` — Supabase client singleton (service key)

### Frontend Structure (`frontend/src/`)
- `main.tsx` — Routes: `/login`, `/dashboard`, `/calls`, `/calls/:callId/precall`, `/calls/:callId/postcall`
- `pages/PreCall.tsx` — Multi-step call setup form, triggers plan generation
- `pages/PostCall.tsx` — Displays post-call analysis
- `lib/api.ts` — Backend API client
- `lib/supabase.ts` — Supabase client (auth)
- Auth: Google OAuth via `@react-oauth/google` + Supabase

### Chrome Extension (`extension/`)
- `background.js` — Service worker managing WebSocket connection to backend, audio relay
- `content.js` — Injected into Google Meet, captures tab audio via `chrome.tabCapture`
- `sidepanel.js` — Side panel UI showing live suggestions, transcript, MEDDIC progress
- `audio-processor.js` — AudioWorklet processor for PCM conversion
- `content-app.js` — Injected into the app frontend for extension↔app communication

### Database (Supabase/PostgreSQL)
Schema in `supabase/schema.sql`. Key tables: `calls`, `call_plans`, `transcript_chunks`, `suggestions`, `call_summaries`, `past_conversations`.

## Environment Variables
- Backend: see `backend/.env.example` (ANTHROPIC_API_KEY, SARVAM_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, REDIS_URL, JWT_SECRET, etc.)
- Frontend: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GOOGLE_CLIENT_ID

## gstack

**Web browsing**: Always use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

## Design System
Always read DESIGN.md before making any visual or UI decisions. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match DESIGN.md.

## Workflow Rules
- Enter plan mode for non-trivial tasks (3+ steps or architectural decisions). Re-plan if something goes sideways.
- Use subagents for research, exploration, and parallel analysis. One task per subagent.
- After user corrections: update `tasks/lessons.md` with the pattern. Review at session start.
- Never mark a task complete without proving it works.
- Plan to `tasks/todo.md` with checkable items; capture lessons in `tasks/lessons.md`.
- Autonomous bug fixing: diagnose from logs/errors/tests, resolve without hand-holding.
