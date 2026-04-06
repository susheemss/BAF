# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This monorepo contains three interconnected supply chain applications, all living under `d:\wms1`:

| App | Path | Port | Stack |
|-----|------|------|-------|
| WDE (Warehouse Diagnosis Engine) frontend | `wde/frontend` | 3000 | Next.js 14, TypeScript, Tailwind, Supabase |
| WDE backend | `wde/backend` | 8001 | FastAPI, Python, Pandas, scikit-learn |
| Planning Tool | `planning` | 3002 | Next.js 14, TypeScript, Tailwind |
| TMS (Supply Master) | `d:\tms\supply-master` | 3001 | Next.js 14, TypeScript, plain CSS |

## Dev Commands

### WDE Frontend (port 3000)
```bash
cd wde/frontend
npm install
npm run dev       # starts on port 3000
npm run build
npm run lint
```

### WDE Backend (port 8001)
```bash
cd wde/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Planning Tool (port 3002)
```bash
cd planning
npm install
npm run dev       # starts on port 3002
npm run test      # vitest run (75 tests)
npm run test:watch
```

### TMS (port 3001)
```bash
cd d:\tms\supply-master
npm install
npm run dev       # starts on port 3001
```

## Architecture

### WDE — Two-process app
The WDE is the only app with a separate backend. The Next.js frontend calls the FastAPI backend at `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8001`).

**Auth flow:** Login sets a `wde_session` cookie (Supabase JWT). `wde/frontend/middleware.ts` protects all non-public routes by checking this cookie. `ProtectedLayout.tsx` wraps all authenticated pages and also mounts the `VapiWidget`.

**Backend structure:**
- `routers/` — FastAPI route handlers (`kpis.py`, `ai.py`, `agent.py`, `data_ingest.py`)
- `ai_engine/` — One module per AI capability (e.g. `inbound_classifier.py`, `drift_monitor.py`, `exception_action_agent.py`)
- `kpi_engine.py` — KPI computation logic
- `data_store.py` — In-memory data store; data loaded from uploaded XLSX/CSV

**Frontend structure:**
- `app/` — One folder per page/feature (Next.js App Router)
- `components/` — Shared UI components
- `lib/theme.ts` — Design tokens (primary `#0B1F3B`, accent `#00B3A4`, warning amber, critical red)
- `lib/supabaseClient.ts` — Supabase browser client
- `lib/apiClient.ts` — Axios instance pointing to WDE backend

### Planning Tool — CSV-driven, no backend
Data flows from uploaded CSVs → `lib/loadData.ts` (PapaParse, server-side in API routes) → page components. All KPI computation happens in `lib/drillDownData.ts`. The `app/api/planning/` route serves data to the frontend. Tests live in `__tests__/`.

### TMS — Self-contained Next.js app
Lives at `d:\tms\supply-master` (separate repo). Loads from `/public/TMS.csv` on startup (3,600 rows). State management via React Context in `app/stores.ts`. KPIs computed in `app/lib/kpi.ts`. Uses Leaflet via CDN for the live map.

## Shared VAPI Voice Config
All three apps share the same VAPI assistant:
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY=ee9797bb-9501-44b0-8496-ba579a5c3c5d`
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID=93522367-5973-4caf-a6fc-532398506e1d`

WDE mounts `VapiWidget` inside `ProtectedLayout`. Planning mounts it inside `AppShell`. TMS has it on the Alerts page only (triggered when red KPIs exist).

## Design Systems
- **WDE:** Tailwind + tokens from `lib/theme.ts`. Always use `primary`/`accent`/`warning`/`critical` colors.
- **Planning:** Tailwind indigo theme.
- **TMS:** Plain CSS variables defined in `globals.css` — no Tailwind.

## Environment Variables

### WDE frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=
```

### WDE backend (`.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
WAREHOUSE_ID=DEL
```

### Planning (`.env.local`)
```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=
```

### TMS (`.env.local`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_API_KEY=
LYZR_API_KEY=
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=
```
