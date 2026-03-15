from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import agent, ai, copilot, data_ingest, kpis

load_dotenv()

app = FastAPI(title="WDE Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(kpis.router, prefix="/api/kpis", tags=["kpis"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(copilot.router, prefix="/api/copilot", tags=["copilot"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(data_ingest.router, prefix="/api/data", tags=["data"])
