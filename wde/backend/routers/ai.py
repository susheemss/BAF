from fastapi import APIRouter, Depends
from ai_engine import (
    bottleneck_analyzer,
    disruption_risk_scorer,
    drift_monitor,
    error_correlator,
    inbound_classifier,
    order_risk_scorer,
    supplier_stability,
    yard_detector,
)
from database import verify_supabase_jwt

router = APIRouter()


@router.get("/inbound-intelligence")
def inbound(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return inbound_classifier.run()


@router.get("/supplier-stability")
def supplier(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return supplier_stability.run()


@router.get("/yard-intelligence")
def yard(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return yard_detector.run()


@router.get("/bottleneck-analysis")
def bottleneck(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return bottleneck_analyzer.run()


@router.get("/order-risk")
def order_risk(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return order_risk_scorer.run()


@router.get("/drift-monitor")
def drift(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return drift_monitor.run()


@router.get("/error-correlation")
def correlation(_: dict = Depends(verify_supabase_jwt)) -> dict:
    return error_correlator.run()


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
