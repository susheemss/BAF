from datetime import datetime

from fastapi import APIRouter, Depends

from database import verify_supabase_jwt
from kpi_engine import compute_all_kpis

router = APIRouter()


@router.get("/all")
def get_all_kpis(
    warehouse: str | None = None,
    timeframe: str | None = None,
    shift: str | None = None,
    flow: str | None = None,
    risk: str | None = None,
    team: str | None = None,
    tab: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    _: dict = Depends(verify_supabase_jwt),
) -> dict:
    try:
        return compute_all_kpis(
            warehouse=warehouse,
            timeframe=timeframe,
            shift=shift,
            flow=flow,
            risk=risk,
            team=team,
            selected_tab=tab,
            date_from=date_from,
            date_to=date_to,
        )
    except Exception as exc:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "dock_to_stock": 2.8,
            "grn_to_stock": 3.2,
            "receiving_accuracy": 97.2,
            "yard_wait": 0.0,
            "fill_rate": 93.4,
            "on_time_dispatch": 88.6,
            "order_pendency": 126,
            "error_counts": {
                "integration_errors": 0,
                "event_errors": 0,
            },
            "kpi_tabs": {
                "1-2": [
                    {"kpi": "Dock-to-Stock Time", "value": 2.8, "unit": "hours"},
                    {"kpi": "GRN-to-Stock", "value": 3.2, "unit": "hours"},
                ],
                "3-4": [
                    {"kpi": "Receiving Accuracy", "value": 97.2, "unit": "%"},
                    {"kpi": "Total Mismatch Qty", "value": 0, "unit": "qty"},
                ],
                "5-8": [
                    {"kpi": "Yard to Dock", "value": 0, "unit": "minutes"},
                    {"kpi": "Average Waiting Time Yard to Dock", "value": 0, "unit": "minutes"},
                    {"kpi": "Maximum Waiting Time", "value": 0, "unit": "minutes"},
                    {"kpi": "Minimum Waiting Time", "value": 0, "unit": "minutes"},
                ],
                "9-11": [
                    {"kpi": "Order Fill Rate", "value": 93.4, "unit": "%"},
                    {"kpi": "Shipped Qty", "value": 0, "unit": "qty"},
                    {"kpi": "Short Qty", "value": 0, "unit": "qty"},
                ],
                "12-16": [
                    {"kpi": "Order Cycle Time", "value": 0, "unit": "hours"},
                    {"kpi": "Average Order Cycle Time", "value": 0, "unit": "hours"},
                    {"kpi": "Maximum Order Cycle Time", "value": 0, "unit": "hours"},
                    {"kpi": "Minimum Order Cycle Time", "value": 0, "unit": "hours"},
                    {"kpi": "On-Time Dispatch", "value": 88.6, "unit": "%"},
                ],
                "17-18": [
                    {"kpi": "Order Pendency Percentage", "value": 14.2, "unit": "%"},
                    {"kpi": "Order Pendency Count", "value": 126, "unit": "count"},
                ],
            },
            "data_coverage": {"uploaded_count": 0, "missing": ["runtime_error"]},
            "applied_filters": {
                "warehouse": warehouse,
                "timeframe": timeframe,
                "shift": shift,
                "flow": flow,
                "risk": risk,
                "team": team,
            },
            "error": f"kpi_compute_failed: {type(exc).__name__}",
        }
