from fastapi import APIRouter, Depends
from ai_engine import disruption_risk_scorer
from database import verify_supabase_jwt

router = APIRouter()


@router.get("/disruption-risk-score")
def disruption_risk(
    warehouse: str | None = None,
    timeframe: str | None = None,
    shift: str | None = None,
    flow: str | None = None,
    risk: str | None = None,
    team: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    _: dict = Depends(verify_supabase_jwt),
) -> dict:
    return disruption_risk_scorer.run(
        warehouse=warehouse,
        timeframe=timeframe,
        shift=shift,
        flow=flow,
        risk=risk,
        team=team,
        date_from=date_from,
        date_to=date_to,
    )
