# Sales-Wise — Setup Guide

AI-powered live sales coaching copilot for B2B salespeople. Real-time guidance during Google Meet calls using MEDDIC framework and Anthropic Claude AI.

---

## Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Chrome browser** (for the extension)
- **Redis** (optional — falls back to in-memory storage)

## External Accounts Required

| Service | Purpose | Sign up |
|---------|---------|---------|
| **Supabase** | Database + Auth | https://supabase.com |
| **Google Cloud** | OAuth 2.0 login | https://console.cloud.google.com |
| **Anthropic** | Claude AI for coaching | https://console.anthropic.com |
| **Sarvam AI** | Speech-to-text transcription | https://console.sarvam.ai |

---

## Step 1: Supabase (Database)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Authentication → Providers** and enable **Google**
4. Note down these values (found in **Settings → API**):
   - `Project URL` (e.g., `https://xxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key

## Step 2: Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (type: Web application)
3. Add **Authorized JavaScript Origins**:
   - `http://localhost:5173` (local dev)
   - Your production frontend URL (e.g., `https://sales-wise.vercel.app`)
4. Add **Authorized Redirect URIs**:
   - `https://xxxx.supabase.co/auth/v1/callback` (your Supabase URL)
5. Note down the **Client ID** and **Client Secret**
6. Go back to Supabase → **Authentication → Providers → Google** and paste these credentials

## Step 3: Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` with your keys:

```env
ANTHROPIC_API_KEY=sk-ant-...          # From console.anthropic.com
SARVAM_API_KEY=...                     # From console.sarvam.ai
SUPABASE_URL=https://xxxx.supabase.co  # From Step 1
SUPABASE_SERVICE_KEY=eyJ...            # service_role key from Step 1
GOOGLE_CLIENT_ID=...                   # From Step 2
GOOGLE_CLIENT_SECRET=...               # From Step 2
FRONTEND_URL=http://localhost:5173     # Your frontend URL
JWT_SECRET=any-long-random-string      # Generate a random secret
REDIS_URL=redis://localhost:6379       # Optional — omit if no Redis
```

Start the backend:

```bash
uvicorn main:app --reload
```

The API runs at **http://localhost:8000**. Verify with: `curl http://localhost:8000/health`

## Step 4: Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000             # Backend URL from Step 3
VITE_SUPABASE_URL=https://xxxx.supabase.co     # From Step 1
VITE_SUPABASE_ANON_KEY=eyJ...                  # anon key from Step 1
VITE_GOOGLE_CLIENT_ID=...                      # From Step 2
```

Start the frontend:

```bash
npm run dev
```

The app runs at **http://localhost:5173**.

## Step 5: Chrome Extension

1. Open `extension/config.js` and set the backend URL:
   ```js
   const API_BASE = "http://localhost:8000";
   ```
2. Also update `API_BASE` in `extension/background.js` to match
3. Open Chrome → navigate to `chrome://extensions`
4. Enable **Developer mode** (toggle in top-right)
5. Click **Load unpacked** → select the `extension/` folder
6. The Sales-Wise extension icon will appear in your toolbar

---

## How to Use

1. Open **http://localhost:5173** in Chrome
2. Click **Login with Google** to sign in
3. **Create a new call** — enter the contact name, company, goal, and any context
4. Click **Generate Plan** — AI creates MEDDIC-based discovery questions
5. **Join a Google Meet call** — click the Sales-Wise extension icon to open the side panel
6. **Share audio** — the extension captures audio and streams it for live transcription
7. **Get live coaching** — AI suggestions appear every ~25 seconds in the side panel
8. After the call ends — view the **post-call summary** with MEDDIC scorecard, objections, next steps, and coaching feedback

---

## Production Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (config already in vercel.json)
cd Sales-Wise
vercel
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`

### Backend → Railway

1. Create a new project at [railway.app](https://railway.app)
2. Connect your GitHub repo and point to the `backend/` directory
3. Set environment variables in Railway dashboard (same as `backend/.env`)
4. Railway will auto-deploy on push

### Chrome Extension → Chrome Web Store

1. Update `API_BASE` in `extension/config.js` and `extension/background.js` to your Railway backend URL
2. Zip the `extension/` folder
3. Upload at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

Or distribute as an unpacked extension for internal use.

---

## Project Structure

```
Sales-Wise/
├── backend/              # FastAPI (Python)
│   ├── main.py           # App entry, CORS config
│   ├── routers/          # auth, calls, live (WebSocket), postcall
│   ├── services/         # llm (Claude), stt (Sarvam), session (Redis)
│   ├── auth_utils.py     # JWT verification
│   ├── db.py             # Supabase client
│   └── .env.example
├── frontend/             # React + Vite + Tailwind
│   ├── src/pages/        # Login, Dashboard, PreCall, PostCall, Calls
│   ├── src/lib/          # api.ts, supabase.ts
│   └── .env.example
├── extension/            # Chrome MV3 Side Panel
│   ├── manifest.json
│   ├── background.js     # WebSocket + message routing
│   ├── sidepanel.js      # Coaching UI
│   ├── content.js        # Google Meet audio capture
│   └── config.js         # API_BASE config
├── supabase/
│   └── schema.sql        # Database tables + RLS policies
└── SETUP.md              # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth/google` | Exchange Google token for session |
| `POST` | `/calls` | Create a new call |
| `GET` | `/calls` | List all calls |
| `GET` | `/calls/{id}/detail` | Get call details |
| `PATCH` | `/calls/{id}` | Update a call |
| `DELETE` | `/calls/{id}` | Delete a call |
| `POST` | `/calls/{id}/plan` | Generate MEDDIC call plan |
| `GET` | `/calls/{id}/plan` | Get existing call plan |
| `WS` | `/ws/call/{id}` | Live call WebSocket (audio → suggestions) |
| `POST` | `/postcall/{id}/summarise` | Generate post-call summary |
| `GET` | `/postcall/{id}/summary` | Get stored summary |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Google login fails | Check `GOOGLE_CLIENT_ID` matches in frontend `.env`, backend `.env`, and Supabase provider config |
| CORS errors | Ensure `FRONTEND_URL` in backend `.env` matches your frontend origin exactly |
| No transcription | Verify `SARVAM_API_KEY` is valid; check Chrome extension has microphone permission |
| WebSocket won't connect | Ensure backend is running; check `API_BASE` in extension `config.js` |
| Redis connection error | Redis is optional — the app falls back to in-memory storage automatically |
| Supabase RLS blocks queries | Ensure the user is authenticated and `schema.sql` was run completely |
