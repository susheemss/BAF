
# Warehouse Diagnosis Engine (WDE)
## MASTER BUILD SPEC — Next.js + Supabase + FastAPI
Version: 2.0
Warehouse: DEL
Stack:
- Frontend: Next.js 14 (App Router) + TypeScript
- Database: Supabase (PostgreSQL + Auth + RLS)
- Backend: Python FastAPI
- AI Layer: scikit-learn + pandas + numpy
- Copilot: OpenAI / Anthropic API

---

# 1. SYSTEM ARCHITECTURE

Client (Browser)
   ↓
Next.js Frontend (App Router)
   ↓
FastAPI Backend (AI + KPI Engine)
   ↓
Supabase PostgreSQL (Primary Data Store)

Supabase Auth handles authentication.
FastAPI validates Supabase JWT for secured endpoints.

---

# 2. MONOREPO STRUCTURE

/wde
  /frontend (Next.js App)
  /backend  (FastAPI App)
  /data
    WMS_Formulas.xlsx
  .env.example
  README.md

---

# 3. FRONTEND SPEC (Next.js 14+)

## Install Dependencies

npm install next react react-dom typescript
npm install @supabase/supabase-js axios recharts lucide-react
npm install tailwindcss

---

## FRONTEND FOLDER STRUCTURE

/frontend
  /app
    layout.tsx
    page.tsx (redirect to dashboard)
    /login/page.tsx
    /dashboard/page.tsx
    /inbound/page.tsx
    /suppliers/page.tsx
    /yard/page.tsx
    /outbound/page.tsx
    /drift/page.tsx
    /system-health/page.tsx
    /copilot/page.tsx
  /components
    Sidebar.tsx
    Header.tsx
    KPICard.tsx
    RiskBadge.tsx
    DriftAlert.tsx
    StagePipeline.tsx
    CopilotPanel.tsx
  /lib
    supabaseClient.ts
    apiClient.ts
  middleware.ts

---

# 4. SUPABASE DATABASE SCHEMA

Run inside Supabase SQL editor:

CREATE TABLE inbound_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wh_id text,
  trknum text,
  invnum text,
  invlin int,
  supnum text,
  prtnum text,
  arrdte timestamp,
  last_rcpt_conf_dte timestamp,
  last_upd_dt timestamp
);

CREATE TABLE receiving_accuracy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trknum text,
  wh_id text,
  rcvkey text,
  expqty int,
  idnqty int,
  rcvqty int,
  rptqty int,
  prtnum text
);

CREATE TABLE yard_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trlract_id text,
  trndte timestamp,
  actcod text,
  trlr_id text,
  wh_id text,
  carcoc text,
  trlr_num text,
  trlr_stat text,
  yard_loc text
);

CREATE TABLE outbound_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ord_num text,
  ship_id text,
  host_ord_qty int,
  order_qty int,
  shipped_qty int,
  short_qty int,
  wh_id text
);

CREATE TABLE shipment_lifecycle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id text,
  alcdte timestamp,
  pckdte timestamp,
  stgdte timestamp,
  loddte timestamp,
  dispatch_dte timestamp,
  early_shpdte timestamp,
  shpsts text
);

CREATE TABLE integration_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sys_id text,
  dwnld_stat_cd text,
  last_upd_dt timestamp
);

CREATE TABLE event_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evt_id text,
  evt_dt timestamp,
  evt_stat_cd text
);

---

# 5. SUPABASE AUTH FLOW

Frontend:
- Use Supabase Auth (email/password)
- Store session automatically

Backend:
- Receive Authorization: Bearer <JWT>
- Validate JWT using Supabase public key
- Extract role claim
- Enforce role-based access

---

# 6. BACKEND STRUCTURE (FastAPI)

/backend
  main.py
  database.py
  kpi_engine.py
  /routers
    kpis.py
    ai.py
    copilot.py
  /ai_engine
    inbound_classifier.py
    supplier_stability.py
    yard_detector.py
    bottleneck_analyzer.py
    order_risk_scorer.py
    drift_monitor.py
    error_correlator.py

---

# 7. API ENDPOINTS

GET  /api/kpis/all
GET  /api/ai/inbound-intelligence
GET  /api/ai/supplier-stability
GET  /api/ai/yard-intelligence
GET  /api/ai/bottleneck-analysis
GET  /api/ai/order-risk
GET  /api/ai/drift-monitor
GET  /api/ai/error-correlation
POST /api/copilot/chat

All responses JSON.

---

# 8. KPI ENGINE (Python)

Implement exactly as defined in original PRD:
- Dock-to-Stock
- GRN-to-Stock
- Receiving Accuracy
- Yard Wait
- Stage Durations
- Fill Rate
- On-Time Dispatch
- Order Pendency
- Error Counts

All KPI calculations stored in table `kpi_snapshots`.

---

# 9. AI ENGINE

Each AI feature must exist as independent module.
Use scikit-learn for:
- Isolation Forest (Inbound)
- KMeans (Supplier, Yard)
- Linear regression slope (Bottleneck trend)
- Pearson correlation (Error correlation)

All outputs cached for 15 minutes.

---

# 10. NEXT.JS UI RULES

Layout:
- Left Sidebar (persistent)
- Top Header
- Main content area
- Floating Copilot button

Color Scheme:
Green: Normal
Yellow: Watch
Orange: High Risk
Red: Critical

Dashboard:
Top Row → KPI Cards
Middle → Risk Distribution + Stage Breakdown
Bottom → Drift Alerts

---

# 11. COPILOT CONTRACT

POST /api/copilot/chat

Input:
{
  "message": "Which suppliers are volatile?"
}

Copilot must:
- Map question to one of 7 supported intents
- Use structured data from AI modules
- Never hallucinate
- If unsupported → return fallback message

---

# 12. STARTUP SEQUENCE

On backend startup:

1. Connect to Supabase DB
2. Load Excel file from /data
3. Insert data into Supabase tables
4. Compute KPIs
5. Run AI modules
6. Cache results
7. Start FastAPI server

---

# 13. OUT OF SCOPE

Do NOT implement:
- Financial calculations
- Workforce planning
- Demand forecasting
- What-if simulator
- Multi-warehouse support

---

# 14. SUCCESS CRITERIA

System must:
- Authenticate via Supabase
- Load Excel data
- Compute KPIs correctly
- Display AI classifications
- Show risk bands
- Show drift alerts
- Show error correlation
- Copilot answers scoped questions correctly

---

END OF MASTER BUILD SPEC
