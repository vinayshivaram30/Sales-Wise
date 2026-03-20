# CloseIt — Sales Copilot

AI-powered live call guidance to help sales people close deals 10x faster. Built with FastAPI, React, Supabase, and a Chrome Extension for Google Meet.

## Stack

- **Backend:** FastAPI (deploy to Railway)
- **Frontend:** React + Vite (deploy to Vercel)
- **Database:** Supabase (PostgreSQL + Auth)
- **Extension:** Chrome MV3 Side Panel for Google Meet

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Enable Google Auth in Authentication → Providers
4. Copy your project URL and keys

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys (ANTHROPIC_API_KEY, SUPABASE_*, REDIS_URL, etc.)
uvicorn main:app --reload
```

Requires: Redis (for session state), Anthropic API key, Sarvam API key (for STT).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL, VITE_SUPABASE_*, VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

### 4. Chrome Extension

1. Update `extension/background.js` — set `API_BASE` and `WS_BASE` to your backend URL
2. Go to `chrome://extensions` → Enable Developer mode → Load unpacked
3. Select the `extension/` folder
4. Add your app URL to `content_scripts` matches in `manifest.json` if using a custom domain

### 5. Google OAuth

1. Create OAuth 2.0 Client ID at [console.cloud.google.com](https://console.cloud.google.com)
2. Add authorized origins: `http://localhost:5173`, your Vercel URL
3. Add to Supabase Auth → Google provider
4. Set `VITE_GOOGLE_CLIENT_ID` in frontend

## Flow

1. **Login** — Google OAuth via Supabase
2. **Pre-call** — Enter contact, company, goal; generate MEDDIC call plan
3. **Live** — Open Google Meet, click extension, share tab with audio; get AI suggestions every ~25s
4. **Post-call** — View summary, MEDDIC scorecard, objections, next steps, coaching

## Project Structure

```
CloseIt/
├── backend/          # FastAPI
├── frontend/         # React + Vite
├── extension/        # Chrome extension
└── supabase/         # SQL schema
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required variables.
