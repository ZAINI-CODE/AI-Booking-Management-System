# FUN FARMHOUSE — AI Booking Management System

Professional farmhouse reservation manager with an AI Booking Assistant that turns customer WhatsApp / SMS messages into structured bookings.

## Features
- **AI Booking Assistant** — Paste customer text → GPT-5.2 extracts the booking → review → save.
- **Premium dark admin dashboard** with KPIs (Total, Today, Next 7 days, Revenue, Pending).
- **Full booking CRUD** with search & filters (All / Today / Upcoming / Past).
- **Slot conflict engine** — Morning (10–4), Evening (5–11), Night (1–6) plus custom double slots. Same-farm & same-day overlaps are rejected.
- **Premium hotel-style receipt** — white background, dark-green headings — one page, A4 print & PDF friendly.
- **Settings** — upload official logo, business info, farmhouse list, default receipt note.
- **Backup / Restore** — JSON export & import, clear all.
- **PWA** — installable, offline-friendly.
- **LocalStorage** — booking data lives client-side, no external DB required.
- **Currency** — PKR (Rs.).

## Tech Stack
- **Frontend:** React 19 + React Router 7 + Tailwind + Framer Motion + Lucide icons + Shadcn UI + Sonner + html2pdf.js
- **AI (preview environment):** FastAPI serverless-style endpoint (`/api/extract-booking`) using `emergentintegrations` + GPT-5.2 via Emergent Universal LLM Key.
- **AI (Vercel deployment):** `api/extract-booking.js` — Vercel serverless function calling OpenAI directly (requires `OPENAI_API_KEY`).

## Local development (preview environment)

Frontend, backend and MongoDB are already running via `supervisor`.

- Frontend: served on the preview URL — check `frontend/.env` → `REACT_APP_BACKEND_URL`.
- Backend: FastAPI at `${REACT_APP_BACKEND_URL}/api`.

```bash
# Restart services
sudo supervisorctl restart frontend
sudo supervisorctl restart backend
```

Endpoints:
- `GET  /api/health` — service health
- `POST /api/extract-booking` — body `{ "text": "customer message" }`

## Deploying to Vercel

The `frontend/` directory is the Vercel project root. It contains:
- The React app (built with CRA)
- `api/extract-booking.js` — Vercel Node.js serverless function for the AI extraction
- `vercel.json` — Vercel build config
- `.npmrc` with `legacy-peer-deps=true` — required so npm/yarn accept peer-dep warnings

Steps:
1. Push this repo to GitHub.
2. On Vercel: **Add New → Project** → import the repo.
3. Vercel will auto-detect **Root Directory = `frontend/`** and pick up `vercel.json` from there. Do NOT change Root Directory.
4. Add ONE of these Environment Variables (see below).
5. Deploy.

## Environment variables (Vercel)

Set **ONE** of these in **Vercel → Project Settings → Environment Variables**:

| Variable | Provider | Cost | Where to get it |
|---|---|---|---|
| `GEMINI_API_KEY` (recommended) | Google Gemini 2.5 Flash | **Free** — 1,500 requests/day | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card needed |
| `OPENAI_API_KEY` | OpenAI GPT-5.2 | ~$0.014 / booking | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — requires billing |

The serverless function auto-detects which key is set (Gemini takes priority if both are present). You only need one.

Preview / local development uses the FastAPI backend which is already configured with `EMERGENT_LLM_KEY` — no action needed.

## LocalStorage
All application data (bookings, settings, uploaded logo) is stored client-side under:
- `ff_bookings_v1`
- `ff_settings_v1`

Use **Backup → Export JSON** regularly.

## PWA installation
Open the app in Chrome / Safari → menu → "Add to Home Screen" (mobile) or "Install FUN FARMHOUSE" (desktop). The service worker only registers in production builds.

## Project structure
```
/app
├── api/                       # Vercel serverless function (Node.js)
│   └── extract-booking.js
├── backend/                   # FastAPI (preview env)
│   ├── server.py              # /api/extract-booking
│   └── .env
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   └── service-worker.js
│   └── src/
│       ├── components/        # BookingCard, BookingForm, Sidebar, StatCard, EmptyState
│       ├── context/           # BookingContext, SettingsContext
│       ├── hooks/
│       ├── layouts/           # AppLayout
│       ├── pages/             # Dashboard, Bookings, BookingEdit, AIBooking, Receipt, Settings, Backup
│       ├── services/          # aiService, serviceWorkerRegistration
│       └── utils/             # localStorage, currency, dateHelpers, slotEngine, backup, pdfExport
├── vercel.json
└── README.md
```

## Scripts
```bash
# in /app/frontend
yarn install
yarn start        # dev
yarn build        # production build
```

## Credits
Built with love for FUN FARMHOUSE.
