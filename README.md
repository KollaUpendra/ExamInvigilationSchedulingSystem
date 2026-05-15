# ExamSched — Exam Invigilation Scheduling System

An automated web application that assigns teachers as exam invigilators using a greedy constraint-satisfaction algorithm. Institutions upload a teacher timetable (`.xlsx`) and define exam slots; the system resolves teaching conflicts, balances workload across staff, and produces a downloadable invigilation roster in seconds.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Google OAuth 2.0 (`@react-oauth/google`) |
| **Backend** | Node.js 18+, Express 4 |
| **Database** | MongoDB (Mongoose 8) |
| **Excel I/O** | `@e965/xlsx` (browser + Node) |
| **Auth** | Google OAuth 2.0 implicit flow → Google userinfo API |
| **File uploads** | `multer` (memory storage) |
| **Deployment** | Railway / Render (backend), Vercel (frontend) |

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18 LTS or later |
| npm | 9+ (bundled with Node) |
| MongoDB | Atlas cluster **or** local `mongod` |
| Google OAuth credentials | See setup below |

### Google OAuth Setup

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials).
2. Create a new **OAuth 2.0 Client ID** of type **Web application**.
3. Under **Authorised JavaScript origins** add:
   - `http://localhost:5173` (dev)
   - `https://your-frontend-domain.vercel.app` (prod)
4. Copy the **Client ID** into `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`.

---

## Environment Variables

### Backend — `backend/.env`

Copy `backend/.env.example` and fill in your values:

```env
# Full MongoDB Atlas connection string (or localhost URI for dev)
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority

# HTTP server port
PORT=5000

# Exact URL of the frontend — used for CORS
FRONTEND_URL=http://localhost:5173

# 'development' | 'production'
# In production: stack traces are suppressed and only the safe message is sent to clients.
NODE_ENV=development
```

### Frontend — `frontend/.env`

Copy `frontend/.env.example` and fill in your values:

```env
# Google OAuth 2.0 Client ID (from Cloud Console)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Backend API base URL — no trailing slash
VITE_API_URL=http://localhost:5000
```

---

## Running Locally

```bash
# 1 — Clone the repository
git clone https://github.com/KollaUpendra/ExamInvigilationSchedulingSystem.git
cd ExamInvigilationSchedulingSystem

# 2 — Install backend dependencies
cd backend
npm install

# 3 — Create backend env file
cp .env.example .env
# Edit .env — fill in MONGODB_URI and FRONTEND_URL

# 4 — Start the backend dev server (nodemon, hot-reload)
npm run dev        # → http://localhost:5000

# 5 — Open a second terminal — install frontend dependencies
cd ../frontend
npm install

# 6 — Create frontend env file
cp .env.example .env
# Edit .env — fill in VITE_GOOGLE_CLIENT_ID

# 7 — Start the frontend dev server (Vite)
npm run dev        # → http://localhost:5173
```

---

## Deployment

### Backend — Railway (recommended) or Render

1. **Railway**: connect your GitHub repo, set the **root directory** to `backend/`, add the env vars from the table above, and deploy. The included `Procfile` (`web: node server.js`) tells Railway what to run.

2. **Render**: create a new **Web Service**, set **root directory** to `backend`, **build command** `npm install`, **start command** `node server.js`, and add all env vars.

Set `NODE_ENV=production` and `FRONTEND_URL` to your Vercel deployment URL.

### Frontend — Vercel

1. Import the repository on [vercel.com](https://vercel.com).
2. Set **root directory** to `frontend`.
3. Add the environment variables `VITE_GOOGLE_CLIENT_ID` and `VITE_API_URL` (pointing at your deployed backend).
4. Vercel auto-detects Vite — no build command change needed.

> **Google OAuth**: remember to add the Vercel production URL to the **Authorised JavaScript origins** in your Google Cloud Console credential.

---

## Timetable Excel Format

To generate a schedule, the institution must upload a `.xlsx` file containing the teacher timetables. The file must adhere to the following structure:

- **Sheets**: Each sheet in the workbook represents one teacher. The name of the sheet should be the teacher's name.
- **Rows (Days)**: The first column (Column A) should contain the day of the week (e.g., "Monday", "Tuesday").
- **Columns (Periods)**: The subsequent columns represent the teaching periods (1 through 8).
- **Cell Values**: The value in a period cell should indicate the class the teacher is assigned to. Crucially, the **first numeric token** in the cell is extracted as the **student year** (e.g., "4 ECE 3", "Year 2", or just "1"). If a teacher is free, the cell should be empty.

Example of a teacher's sheet:

| Day | 1 (09:00) | 2 (10:00) | 3 (11:00) | 4 (12:00) | 5 (12:40) | 6 (13:40) | 7 (14:40) | 8 (15:40) |
|---|---|---|---|---|---|---|---|---|
| Monday | 2 CSE A | 2 CSE A | | 1 IT | | 3 ECE | | |
| Tuesday | | 1 IT | 1 IT | | 4 MECH | | | 2 EEE |

---

## API Reference

All endpoints return `Content-Type: application/json`.  
Error shape: `{ success: false, code: "ERROR_CODE", message: "Human-readable message" }`

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | None | Returns `{ status: "ok", timestamp: "..." }` |

### Leads (landing-page sign-up)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/leads` | None | Save a waitlist lead |
| `GET` | `/api/leads` | None* | List all leads *(protect before production)* |

**POST `/api/leads` — request body**
```json
{ "name": "Dr. Rajesh Sharma", "email": "r.sharma@college.edu", "institution": "JNTU" }
```
**Response 201**
```json
{ "success": true, "message": "You're on the list!", "data": { "_id": "...", "name": "...", ... } }
```

### Schedule

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/schedule/generate` | None* | Generate a new schedule |
| `GET` | `/api/schedule` | None* | List up to 50 past schedules |
| `GET` | `/api/schedule/:id/download` | None* | Download output Excel (add `?type=input` for timetable) |
| `DELETE` | `/api/schedule/:id` | None* | Delete a schedule record |

> *Auth middleware is not yet enforced. Protect these routes before releasing to the public.

**POST `/api/schedule/generate` — multipart/form-data**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | `.xlsx` binary | ✅ | One sheet per teacher. Magic-byte validated server-side. |
| `examSlots` | JSON string | ✅ | Array of slot objects (see below) |

**Exam slot object**
```json
{
  "date": "15/4/25",
  "day": "Tuesday",
  "slot": "Slot1",
  "start": "09:30",
  "end": "12:30",
  "year": 2,
  "teachers_required": 3
}
```

**Response 200**
```json
{
  "success": true,
  "downloadId": "6612abcd1234ef567890",
  "summary": {
    "totalSlots": 4,
    "fullyStaffed": 3,
    "understaffedSlots": [
      { "slotName": "Slot2", "date": "16/4/25", "required": 4, "assigned": 2, "shortage": 2 }
    ],
    "warnings": ["Dr. X exceeded daily limit on 15/4/25"]
  }
}
```

**GET `/api/schedule`** — returns array of schedule records without binary data fields.

**GET `/api/schedule/:id/download`** — streams the Excel file as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

## Algorithm Overview

1. **Parse timetable** — each sheet name = teacher; rows = days; columns 1-6 = teaching periods.
2. **Validate** — time format, start < end, max 3 slots/day.
3. **Scarcity-first ordering** — slots with fewest conflict-free teachers are scheduled first.
4. **3-tier assignment** per slot:
   - **Tier 1** (strict): conflict-free + within 2 slots/day limit
   - **Tier 2** (relaxed): conflict-free, ignores daily limit — emits warning
   - **Tier 3** (last resort): no explicit different-year conflict in overlapping periods — emits warning
5. **Scoring** (lower = higher priority): `dayLoad×10 + totalLoad×1 − sameYear×2 + yesterday×3`
6. **Output** — `.xlsx` workbook: main sheet (teachers × slots, "YES" cells), summary sheet.

---

## Known Limitations & Future Improvements

- **No server-side auth**: schedule endpoints are currently public. Add JWT or session middleware to restrict access to authenticated users only.
- **In-memory rate limiting**: resets on server restart. Replace with Redis for multi-instance deployments.
- **Google OAuth is client-side only**: the backend does not independently verify the Google ID token. For sensitive data, verify the token server-side using `google-auth-library`.
- **Single timetable format**: assumes exactly 6 period columns per day. Alternative formats (5-period, block timetables) would require parser extension.
- **No user scoping**: all schedules are shared. The `userId` field is reserved in the model — adding a filter `{ userId: req.user.sub }` on all schedule queries would enable per-user history.

---

## Production-Readiness Checklist

- [x] `.env` in `.gitignore` — secrets never committed
- [x] Stack traces suppressed in `NODE_ENV=production`
- [x] Structured JSON errors with `code` field on every endpoint
- [x] Malformed JSON body → structured 400 (not 500 crash)
- [x] File upload magic-byte validation
- [x] In-memory rate limiting (5 req/IP/min)
- [x] Double-submit deduplication
- [x] MongoDB `.lean()` on read-only queries
- [x] History capped at 50 records
- [x] Frozen panes + column widths in output Excel
- [x] Frontend: loading, error, and empty states on all dynamic views
- [ ] Server-side Google token verification
- [ ] Redis-backed rate limiting (for multi-instance)
- [ ] Per-user schedule scoping (`userId` filter on all queries)
- [ ] Auth middleware on `/api/schedule` and `/api/leads GET`
