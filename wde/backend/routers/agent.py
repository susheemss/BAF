from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ai_engine import exception_action_agent
from database import verify_supabase_jwt

router = APIRouter()


class ActionExecuteRequest(BaseModel):
    plan_id: str
    action_ids: list[str] | None = None
    actor: str | None = None


@router.get("/exception-plan")
def exception_plan(
    warehouse: str | None = None,
    timeframe: str | None = None,
    shift: str | None = None,
    flow: str | None = None,
    risk: str | None = None,
    team: str | None = None,
    _: dict = Depends(verify_supabase_jwt),
) -> dict:
    return exception_action_agent.generate_exception_plan(
        warehouse=warehouse,
        timeframe=timeframe,
        shift=shift,
        flow=flow,
        risk=risk,
        team=team,
    )


@router.post("/execute")
def execute(payload: ActionExecuteRequest, _: dict = Depends(verify_supabase_jwt)) -> dict:
    try:
        return exception_action_agent.execute_actions(
            plan_id=payload.plan_id,
            action_ids=payload.action_ids,
            actor=payload.actor,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/executions")
def executions(limit: int = 10, _: dict = Depends(verify_supabase_jwt)) -> dict:
    return {"items": exception_action_agent.list_executions(limit=limit)}
