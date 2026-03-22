# Sales-Wise — AI Sales Copilot for Google Meet

Real-time MEDDIC coaching during discovery calls. Pre-call planning, live AI suggestions, and post-call analysis — all powered by Claude.

## How It Works

1. **Pre-call** — Enter company, contact, and goal. AI generates a MEDDIC call plan with priority questions.
2. **Live call** — Chrome extension captures Google Meet audio. AI suggests the next best question every ~25 seconds.
3. **Post-call** — AI generates a summary, MEDDIC scorecard, objections handled, next steps, and coaching notes.

## Stack

| Layer | Tech | Deploy |
|-------|------|--------|
| Frontend | React 19 + Vite + Tailwind v4 | Vercel |
| Backend | FastAPI (Python 3.12) | Railway |
| Database | Supabase (PostgreSQL + Auth) | Supabase |
| Extension | Chrome MV3 Side Panel | Chrome Web Store |
| AI | Claude (Anthropic) | API |
| STT | Sarvam AI | API |

## Project Structure

```
Sales-Wise/
├── backend/              # FastAPI API server
│   ├── main.py           # App entry, CORS, routers
│   ├── routers/          # auth, calls, live (WebSocket), postcall, analytics, crm, profiles
│   ├── services/         # llm.py (Claude), stt.py (Sarvam), session.py (Redis)
│   ├── auth_utils.py     # JWT validation via Supabase
│   ├── db.py             # Supabase client (service + user)
│   └── models.py         # Pydantic models
├── frontend/             # React + Vite SPA
│   ├── src/pages/        # Login, Dashboard, Calls, PreCall, PostCall, Analytics, CrmSettings
│   ├── src/components/   # OnboardingWizard, Layout, CallProgressBar, etc.
│   └── src/lib/          # api.ts (API client), supabase.ts, constants.ts
├── extension/            # Chrome extension (MV3)
│   ├── manifest.json     # Permissions, side panel, content scripts
│   ├── background.js     # Service worker, WebSocket, audio relay
│   ├── sidepanel.*       # Side panel UI (suggestions, MEDDIC, transcript)
│   ├── content.js        # Google Meet audio capture
│   └── content-app.js    # Web app ↔ extension token bridge
├── supabase/
│   ├── schema.sql        # Full database schema + RLS policies
│   └── migrations/       # Incremental migrations
└── vercel.json           # Vercel build config + API proxy rewrites
```

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- A Supabase project
- An Anthropic API key
- A Sarvam AI API key (for speech-to-text)
- A Google Cloud OAuth 2.0 Client ID

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Run all files in `supabase/migrations/` in the SQL Editor
4. Enable Google Auth: Authentication > Providers > Google > Enable
5. Note your **Project URL**, **anon key**, and **service role key**

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your keys (see Environment Variables below)
uvicorn main:app --reload    # Runs on http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in VITE_API_URL=http://localhost:8000 and Supabase keys
npm run dev                  # Runs on http://localhost:5173
```

### 4. Chrome Extension

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `extension/` folder
4. Check that `API_BASE` and `WS_BASE` in `extension/background.js` point to your backend

### 5. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins: `http://localhost:5173`, `https://your-vercel-url.vercel.app`
4. Add the Client ID to Supabase Auth (Google provider) and to `VITE_GOOGLE_CLIENT_ID`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `SARVAM_API_KEY` | Sarvam speech-to-text API key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `REDIS_URL` | Redis connection URL | No (falls back to in-memory) |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:8000`) | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |

## Production Deployment

- **Frontend**: Deployed on Vercel. API requests proxy through `/api/*` rewrites to Railway (configured in `vercel.json`).
- **Backend**: Deployed on Railway. Auto-deploys from `main` branch.
- **Database**: Supabase managed PostgreSQL with Row Level Security.

### Vercel Environment Variables

Set these in Vercel dashboard > Settings > Environment Variables:
- `VITE_API_URL` = `https://your-backend.up.railway.app`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`

Note: In production, the frontend uses `/api` prefix (same-origin via Vercel rewrites) instead of the direct Railway URL.

## Files to Share

If someone needs to set up or contribute to this project, share these:

```
# Core source code (all in git)
backend/
frontend/
extension/
supabase/

# Config
vercel.json
CLAUDE.md
DESIGN.md

# They will need to create their own:
backend/.env          (from backend/.env.example)
frontend/.env         (from frontend/.env.example)
```

**Do NOT share:** `.env` files, Supabase service keys, API keys, or the `.vercel/` directory.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/google` | Exchange Google OAuth token for Supabase session |
| GET | `/auth/me` | Get current user info |
| POST | `/calls` | Create a new call |
| GET | `/calls` | List user's calls |
| GET | `/calls/:id/detail` | Get full call detail |
| PATCH | `/calls/:id` | Update call context |
| DELETE | `/calls/:id` | Delete a call |
| POST | `/calls/:id/plan` | Generate MEDDIC call plan |
| GET | `/calls/:id/plan` | Get existing plan |
| WS | `/ws/call/:id` | Live call WebSocket (audio streaming) |
| POST | `/postcall/:id/summarise` | Generate post-call summary |
| GET | `/postcall/:id/summary` | Get existing summary |
| GET | `/profiles/product-defaults` | Get saved product defaults |
| PUT | `/profiles/product-defaults` | Update product defaults |
| GET | `/analytics/summary` | Get analytics dashboard data |
| GET | `/crm/status` | Get CRM connection status |
| GET | `/health` | Health check |

## License

Private — not open source.
