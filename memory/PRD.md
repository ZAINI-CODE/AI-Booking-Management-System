# PRD — FUN FARMHOUSE, AI Booking Management System

## Original problem statement
Build a production-ready AI-powered farmhouse reservation management system with:
- React + Vite/Vercel + LocalStorage architecture, PWA, hotel-style receipt.
- AI Booking Assistant: paste customer message → extract booking → review → confirm → save → receipt.
- Full booking CRUD, slot conflict engine (Morning/Evening/Night + custom double slots), PDF export, print, backup/restore, Settings with logo upload, currency PKR.

## Architecture chosen (hybrid, per user)
- **Frontend:** React 19 + React Router 7 + Tailwind + Framer Motion + Lucide + Shadcn UI + Sonner + html2pdf.js. All data lives in browser LocalStorage (`ff_bookings_v1`, `ff_settings_v1`).
- **Preview AI backend:** FastAPI (`/app/backend/server.py`) — `POST /api/extract-booking` using `emergentintegrations.LlmChat` + **GPT-5.2** via Emergent Universal LLM Key. Also `GET /api/health`.
- **Vercel deployment path:** `/app/api/extract-booking.js` — Vercel Node.js serverless function calling OpenAI directly (`OPENAI_API_KEY`). `vercel.json` builds frontend + serves SPA rewrite.

## Users
- Farmhouse staff (single-role admin). No auth (single-tenant, browser-local data).

## Core requirements (static)
1. AI extraction: extract structured booking JSON from natural language customer messages.
2. Slot presets Morning 10-4, Evening 5-11, Night 1-6, plus custom double slots.
3. Same-farm + same-day + overlapping interval → reject with clear error.
4. Premium dark admin dashboard; **white** receipt with dark-green headings for print/PDF.
5. Currency: PKR (Rs.).
6. Text-only "FUN FARMHOUSE" brand placeholder until user uploads their official logo.

## Implemented (2026-02-27)
- Backend: `/api/health`, `/api/extract-booking` (GPT-5.2, robust JSON parsing).
- Frontend routes: `/` (Dashboard), `/ai-booking`, `/bookings`, `/bookings/new`, `/bookings/:id/edit`, `/receipt/:id`, `/settings`, `/backup`.
- BookingContext (CRUD + stats + conflict integration) & SettingsContext (business info, farms, logo).
- Utils: slotEngine (`findConflict`, `bookingInterval` w/ overnight-wrap handling), currency (PKR formatter), dateHelpers, backup (export/import JSON), pdfExport (html2pdf).
- Components: Sidebar (with logo/brand fallback), AppLayout (mobile drawer), StatCard, BookingCard, BookingForm, EmptyState.
- Pages: Dashboard (5 KPI cards + quick actions + today/upcoming/recent), AIBooking (large textarea, GPT-5.2 extractor, review preview, quick confirm or edit-first), Bookings (search + filters), BookingEdit, Receipt (hotel-style, white/dark-green, one page, A4-safe, print/PDF/share), Settings (logo upload, business info, farmhouse chips CRUD), Backup (export/import/clear).
- PWA: `manifest.json`, `service-worker.js`, registration in prod builds.
- Vercel: `api/extract-booking.js` serverless function + `vercel.json`.
- README with full deployment instructions.
- All interactive elements have `data-testid` attributes.
- Testing subagent: 5/5 backend tests + all critical E2E flows pass.

## Backlog (not-yet-built, P-ranked)
- **P1** Real-time slot picker (time grid) instead of text inputs for custom slots.
- **P1** Booking calendar month-view page.
- **P2** WhatsApp send: one-tap "Send confirmation to customer" via `wa.me` deep link.
- **P2** SMS/email reminder scheduler for upcoming bookings.
- **P2** Multi-language receipt (Urdu translation).
- **P3** Advance payment ledger view + partial payment history.
- **P3** Analytics dashboard (revenue by farm, event-type breakdown).
- **P3** Multi-user auth + role-based access (Emergent Google Auth).

## Deferred / decided out of scope
- No CNIC / Father Name / Address / Signature / Facilities on receipt (per spec).
- No custom logo — user provides via Settings upload.
