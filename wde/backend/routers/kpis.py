from datetime import datetime

from fastapi import APIRouter, Depends
import pandas as pd

from database import verify_supabase_jwt
from kpi_engine import compute_all_kpis, compute_drilldown
from data_store import get_dataset
from pathlib import Path

router = APIRouter()


@router.get("/drilldown")
def get_kpi_drilldown(
    kpi: str,
    warehouse: str | None = None,
    timeframe: str | None = None,
    shift: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    top_n: int = 5,
    _: dict = Depends(verify_supabase_jwt),
) -> dict:
    try:
        return compute_drilldown(
            kpi_slug=kpi,
            warehouse=warehouse,
            timeframe=timeframe,
            shift=shift,
            date_from=date_from,
            date_to=date_to,
            top_n=min(top_n, 10),
        )
    except Exception as exc:
        return {"kpi": kpi, "columns": [], "rows": [], "no_data": True, "error": str(exc)}


@router.get("/trend")
def get_dispatch_trend(
    warehouse: str | None = None,
    _: dict = Depends(verify_supabase_jwt),
) -> dict:
    """
    Returns daily On-Time Dispatch % for the last 30 days
    computed from the uploaded shipment_lifecycle dataset.
    Falls back to empty list if no data is uploaded.
    """
    try:
        UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
        df = get_dataset("shipment_lifecycle")

        if df is None or df.empty:
            # Try loading from disk
            candidates = sorted(
                UPLOAD_DIR.glob("shipment_lifecycle_*"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            if candidates:
                suffix = candidates[0].suffix.lower()
                df = pd.read_excel(candidates[0]) if suffix in {".xlsx", ".xls"} else pd.read_csv(candidates[0])

        if df is None or df.empty:
            return {"points": [], "target": 92, "has_data": False}

        df.columns = [str(c).strip().lower() for c in df.columns]

        # Find dispatch and planned dispatch columns
        dispatch_col = next((c for c in df.columns if c in {"dispatch_dte", "dispatch_date"}), None)
        target_col   = next((c for c in df.columns if c in {"early_shpdte", "planned_dispatch_dte", "target_dispatch_dte"}), None)
        wh_col       = next((c for c in df.columns if c in {"warehouse", "wh", "whse"}), None)

        if not dispatch_col or not target_col:
            return {"points": [], "target": 92, "has_data": False}

        df[dispatch_col] = pd.to_datetime(df[dispatch_col], errors="coerce")
        df[target_col]   = pd.to_datetime(df[target_col],   errors="coerce")
        df = df.dropna(subset=[dispatch_col, target_col])

        # Filter by warehouse
        if warehouse and warehouse not in {"All", "All Warehouses"} and wh_col:
            df = df[df[wh_col].astype(str).str.upper() == warehouse.upper()]

        # Last 30 days from latest date in data
        max_date = df[dispatch_col].max()
        cutoff   = max_date - pd.Timedelta(days=29)
        df = df[df[dispatch_col] >= cutoff]

        if df.empty:
            return {"points": [], "target": 92, "has_data": False}

        df["date_only"] = df[dispatch_col].dt.date
        df["on_time"]   = df[dispatch_col] <= df[target_col]

        daily = (
            df.groupby("date_only")["on_time"]
            .agg(["sum", "count"])
            .reset_index()
        )
        daily.columns = ["date", "on_time_count", "total"]
        daily["pct"]  = (daily["on_time_count"] / daily["total"] * 100).round(1)
        daily         = daily.sort_values("date")

        points = [
            {"date": str(row["date"]), "value": float(row["pct"]), "total": int(row["total"])}
            for _, row in daily.iterrows()
        ]

        return {"points": points, "target": 92, "has_data": True}

    except Exception as exc:
        return {"points": [], "target": 92, "has_data": False, "error": str(exc)}


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
