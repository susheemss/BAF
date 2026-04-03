from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from kpi_engine import compute_all_kpis

PLAN_STORE: dict[str, dict[str, Any]] = {}
EXECUTION_STORE: list[dict[str, Any]] = []


def _severity_rank(severity: str) -> int:
    order = {"normal": 0, "watch": 1, "high": 2, "critical": 3}
    return order.get(severity, 0)


def _highest_severity(items: list[dict[str, Any]]) -> str:
    if not items:
        return "normal"
    return max(items, key=lambda i: _severity_rank(str(i.get("severity", "normal")))).get("severity", "normal")


def _new_action(action_id: str, title: str, description: str, eta_min: int, impact: str) -> dict[str, Any]:
    return {
        "action_id": action_id,
        "title": title,
        "description": description,
        "eta_min": eta_min,
        "impact": impact,
    }


def generate_exception_plan(
    warehouse: str | None = None,
    timeframe: str | None = None,
    shift: str | None = None,
    flow: str | None = None,
    risk: str | None = None,
    team: str | None = None,
) -> dict[str, Any]:
    kpis = compute_all_kpis(
        warehouse=warehouse,
        timeframe=timeframe,
        shift=shift,
        flow=flow,
        risk=risk,
        team=team,
    )

    exceptions: list[dict[str, Any]] = []

    dock_to_stock = float(kpis.get("dock_to_stock", 0))
    if dock_to_stock > 2.5:
        severity = "critical" if dock_to_stock >= 5 else "high"
        exceptions.append(
            {
                "exception_id": "dock_to_stock_breach",
                "metric": "Dock-to-Stock Time",
                "current_value": round(dock_to_stock, 2),
                "unit": "hours",
                "threshold": "<= 2.5h",
                "severity": severity,
                "reason": "Inbound putaway cycle is above target.",
                "recommended_actions": [
                    _new_action(
                        "rebalance_dock_doors",
                        "Rebalance dock door allocation",
                        "Move active receiving loads to least-congested doors and pause low-priority lanes.",
                        20,
                        "8-15% dock-to-stock reduction",
                    ),
                    _new_action(
                        "expedite_putaway_wave",
                        "Trigger expedited putaway wave",
                        "Prioritize aged receipts in nearest putaway zones for next wave.",
                        30,
                        "Backlog drain for delayed inbound SKUs",
                    ),
                ],
            }
        )

    receiving_accuracy = float(kpis.get("receiving_accuracy", 0))
    if receiving_accuracy < 98:
        severity = "critical" if receiving_accuracy < 95 else "high"
        exceptions.append(
            {
                "exception_id": "receiving_accuracy_breach",
                "metric": "Receiving Accuracy",
                "current_value": round(receiving_accuracy, 2),
                "unit": "%",
                "threshold": ">= 98%",
                "severity": severity,
                "reason": "Mismatch rate is above acceptable receiving tolerance.",
                "recommended_actions": [
                    _new_action(
                        "tighten_receipt_qc",
                        "Enable strict QC on mismatched receipts",
                        "Route all mismatch-prone suppliers to mandatory recount and QA verification.",
                        25,
                        "Mismatch reduction in next receiving cycle",
                    ),
                    _new_action(
                        "supplier_alert_batch",
                        "Send supplier discrepancy alerts",
                        "Issue discrepancy notifications with SKU-level mismatch snapshots.",
                        10,
                        "Lower recurrent mismatch by supplier",
                    ),
                ],
            }
        )

    on_time_dispatch = float(kpis.get("on_time_dispatch", 0))
    if on_time_dispatch < 92:
        severity = "critical" if on_time_dispatch < 85 else "high"
        exceptions.append(
            {
                "exception_id": "dispatch_sla_breach",
                "metric": "On-Time Dispatch",
                "current_value": round(on_time_dispatch, 2),
                "unit": "%",
                "threshold": ">= 92%",
                "severity": severity,
                "reason": "Dispatch SLA adherence is below expected target.",
                "recommended_actions": [
                    _new_action(
                        "reprioritize_waves",
                        "Reprioritize outbound waves by SLA risk",
                        "Push near-cutoff orders to top priority and defer low-risk non-urgent waves.",
                        15,
                        "Improves near-term SLA adherence",
                    ),
                    _new_action(
                        "carrier_escalation",
                        "Escalate carrier slot confirmations",
                        "Auto-escalate delayed carrier confirmations to control tower lead.",
                        12,
                        "Faster trailer readiness and dispatch sync",
                    ),
                ],
            }
        )

    order_pendency = int(kpis.get("order_pendency", 0))
    if order_pendency > 100:
        severity = "critical" if order_pendency > 300 else "high"
        exceptions.append(
            {
                "exception_id": "order_pendency_breach",
                "metric": "Order Pendency",
                "current_value": order_pendency,
                "unit": "count",
                "threshold": "<= 100",
                "severity": severity,
                "reason": "Delayed pending order queue is above acceptable threshold.",
                "recommended_actions": [
                    _new_action(
                        "release_backlog_wave",
                        "Release backlog clearance wave",
                        "Create dedicated backlog wave with top delayed orders and reserve picker capacity.",
                        20,
                        "Reduces aged pending orders quickly",
                    ),
                    _new_action(
                        "slot_staff_shift",
                        "Reallocate labor to delayed queue",
                        "Shift labor from low-risk lanes to pending dispatch lanes for one cycle.",
                        30,
                        "Improves clearance throughput",
                    ),
                ],
            }
        )

    if not exceptions:
        exceptions.append(
            {
                "exception_id": "no_breach",
                "metric": "System Baseline",
                "current_value": "Healthy",
                "unit": "",
                "threshold": "No active breaches",
                "severity": "normal",
                "reason": "No KPI exception currently requires intervention.",
                "recommended_actions": [
                    _new_action(
                        "continue_monitoring",
                        "Continue monitoring",
                        "Maintain current operation plan and monitor next KPI snapshot.",
                        0,
                        "Stable operations",
                    )
                ],
            }
        )

    plan_id = f"plan_{uuid4().hex[:10]}"
    plan = {
        "plan_id": plan_id,
        "generated_at": datetime.utcnow().isoformat(),
        "filters": {
            "warehouse": warehouse,
            "timeframe": timeframe,
            "shift": shift,
            "flow": flow,
            "risk": risk,
            "team": team,
        },
        "summary": {
            "exception_count": len([e for e in exceptions if e.get("severity") != "normal"]),
            "highest_severity": _highest_severity(exceptions),
        },
        "exceptions": exceptions,
    }
    PLAN_STORE[plan_id] = plan
    return plan


def execute_actions(plan_id: str, action_ids: list[str] | None = None, actor: str | None = None) -> dict[str, Any]:
    plan = PLAN_STORE.get(plan_id)
    if not plan:
        raise ValueError(f"Unknown plan_id '{plan_id}'")

    all_actions = []
    for exc in plan.get("exceptions", []):
        all_actions.extend(exc.get("recommended_actions", []))

    if action_ids:
        selected = [a for a in all_actions if a.get("action_id") in set(action_ids)]
    else:
        selected = all_actions

    if not selected:
        raise ValueError("No valid actions selected for execution")

    run_id = f"run_{uuid4().hex[:10]}"
    execution = {
        "run_id": run_id,
        "plan_id": plan_id,
        "requested_at": datetime.utcnow().isoformat(),
        "requested_by": actor or "ops-user",
        "status": "queued",
        "mode": "demo",
        "actions": selected,
        "message": "Action logged for operations review. Connect to your WMS orchestration system to enable live execution.",
    }
    EXECUTION_STORE.append(execution)
    return execution


def list_executions(limit: int = 10) -> list[dict[str, Any]]:
    capped = max(1, min(limit, 50))
    return list(reversed(EXECUTION_STORE[-capped:]))
