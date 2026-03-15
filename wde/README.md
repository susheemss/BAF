# Warehouse Diagnosis Engine (WDE)

Monorepo scaffold generated from `WDE_MASTER_NEXTJS_SUPABASE_SPEC.md`.

## Structure
- `frontend`: Next.js 14 + TypeScript + Tailwind + Supabase client auth
- `backend`: FastAPI with KPI and AI endpoint skeletons
- `data`: Place `WMS_Formulas.xlsx` here

## Quick Start
### Frontend
```powershell
cd d:\wms1\wde\frontend
npm install
npm run dev
```

### Backend
```powershell
cd d:\wms1\wde\backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Login
- Open `http://127.0.0.1:3000/login`
- Use Supabase email/password credentials
- Successful login sets `wde_session` cookie used by middleware

## API Contract Implemented
- `GET /api/kpis/all`
- `GET /api/ai/inbound-intelligence`
- `GET /api/ai/supplier-stability`
- `GET /api/ai/yard-intelligence`
- `GET /api/ai/bottleneck-analysis`
- `GET /api/ai/order-risk`
- `GET /api/ai/drift-monitor`
- `GET /api/ai/error-correlation`
- `POST /api/copilot/chat`
