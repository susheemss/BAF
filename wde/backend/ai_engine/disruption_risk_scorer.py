from __future__ import annotations

from typing import Any

from kpi_engine import compute_all_kpis
from ai_engine import (
    drift_monitor,
    error_correlator,
    inbound_classifier,
    supplier_stability,
    yard_detector,
)

BAND_LABELS = {
    "critical": "Critical Disruption Risk",
    "high":     "High Disruption Risk",
    "watch":    "Elevated Watch",
    "normal":   "Operations Stable",
}


def _band(score: float) -> str:
    if score >= 75:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 25:
        return "watch"
    return "normal"


def run(
    warehouse: str | None = None,
    timeframe: str | None = None,
    shift: str | None = None,
    flow: str | None = None,
    risk: str | None = None,
    team: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict[str, Any]:
    kpis = compute_all_kpis(
        warehouse=warehouse,
        timeframe=timeframe,
        shift=shift,
        flow=flow,
        risk=risk,
        team=team,
        date_from=date_from,
        date_to=date_to,
    )

    supplier  = supplier_stability.run()
    yard      = yard_detector.run()
    inbound   = inbound_classifier.run()
    drift     = drift_monitor.run()
    errors    = error_correlator.run()

    score: float = 0.0
    factors: list[dict[str, Any]] = []

    # --- On-Time Dispatch (max 20 pts) ---
    otd = float(kpis.get("on_time_dispatch", 100))
    if otd < 80:
        score += 20
        factors.append({"severity": "critical", "contribution": 20,
                         "text": f"On-Time Dispatch at {otd}% — critically below 92% SLA"})
    elif otd < 85:
        score += 14
        factors.append({"severity": "high", "contribution": 14,
                         "text": f"On-Time Dispatch at {otd}% — below emergency 85% threshold"})
    elif otd < 92:
        score += 8
        factors.append({"severity": "high", "contribution": 8,
                         "text": f"On-Time Dispatch at {otd}% — below 92% SLA target"})

    # --- Dock-to-Stock (max 15 pts) ---
    d2s = float(kpis.get("dock_to_stock", 0))
    if d2s >= 5:
        score += 15
        factors.append({"severity": "critical", "contribution": 15,
                         "text": f"Dock-to-Stock at {d2s}h — critically above 2.5h target"})
    elif d2s >= 3:
        score += 10
        factors.append({"severity": "high", "contribution": 10,
                         "text": f"Dock-to-Stock at {d2s}h — above 2.5h target"})
    elif d2s > 2.5:
        score += 5
        factors.append({"severity": "watch", "contribution": 5,
                         "text": f"Dock-to-Stock at {d2s}h — marginally above target"})

    # --- Receiving Accuracy (max 15 pts) ---
    ra = float(kpis.get("receiving_accuracy", 100))
    if ra < 93:
        score += 15
        factors.append({"severity": "critical", "contribution": 15,
                         "text": f"Receiving Accuracy at {ra}% — critical mismatch rate"})
    elif ra < 95:
        score += 10
        factors.append({"severity": "high", "contribution": 10,
                         "text": f"Receiving Accuracy at {ra}% — below 95% threshold"})
    elif ra < 98:
        score += 5
        factors.append({"severity": "watch", "contribution": 5,
                         "text": f"Receiving Accuracy at {ra}% — below 98% target"})

    # --- Order Pendency (max 15 pts) ---
    pendency = int(kpis.get("order_pendency", 0))
    if pendency > 300:
        score += 15
        factors.append({"severity": "critical", "contribution": 15,
                         "text": f"Order Pendency at {pendency} — 3x above acceptable threshold"})
    elif pendency > 150:
        score += 10
        factors.append({"severity": "high", "contribution": 10,
                         "text": f"Order Pendency at {pendency} — 50% above threshold"})
    elif pendency > 100:
        score += 5
        factors.append({"severity": "watch", "contribution": 5,
                         "text": f"Order Pendency at {pendency} — above 100-order threshold"})

    # --- Supplier Volatility (max 15 pts) ---
    sup_band = str(supplier.get("risk_band", "normal"))
    volatile_sups = supplier.get("volatile_suppliers", [])
    if sup_band in ("critical", "high") and volatile_sups:
        score += 15
        names = ", ".join(volatile_sups[:3])
        factors.append({"severity": sup_band, "contribution": 15,
                         "text": f"Supplier cluster volatile: {names} flagged by AI"})
    elif sup_band == "watch":
        score += 7
        factors.append({"severity": "watch", "contribution": 7,
                         "text": "Supplier cluster showing early instability signals"})

    # --- Yard Congestion (max 10 pts) ---
    yard_band = str(yard.get("risk_band", "normal"))
    congested = yard.get("congested_yard_locations", [])
    if yard_band in ("critical", "high") and congested:
        score += 10
        locs = ", ".join(congested[:2])
        factors.append({"severity": yard_band, "contribution": 10,
                         "text": f"Yard congestion confirmed at {locs}"})
    elif yard_band == "watch":
        score += 4
        factors.append({"severity": "watch", "contribution": 4,
                         "text": "Yard activity showing mild congestion signals"})

    # --- Drift (max 10 pts) ---
    drift_detected = bool(drift.get("drift_detected", False))
    drift_band = str(drift.get("risk_band", "normal"))
    if drift_detected and drift_band == "critical":
        score += 10
        segs = drift.get("drift_segments", [])
        label = ", ".join(segs) if segs else "multiple segments"
        factors.append({"severity": "critical", "contribution": 10,
                         "text": f"Operational drift confirmed: {label}"})
    elif drift_detected:
        score += 5
        factors.append({"severity": "high", "contribution": 5,
                         "text": "Performance drift detected in operational patterns"})

    # --- Inbound Anomalies (max 5 pts) ---
    anomaly_receipts = inbound.get("anomaly_receipts", [])
    if anomaly_receipts:
        pts = min(len(anomaly_receipts) * 2, 5)
        score += pts
        factors.append({
            "severity": str(inbound.get("risk_band", "watch")),
            "contribution": pts,
            "text": f"Inbound scanner flagged {len(anomaly_receipts)} anomalous receipt(s)",
        })

    # --- Error Correlation (bonus up to 5 pts) ---
    coeff = float(errors.get("coefficient", 0))
    err_band = str(errors.get("risk_band", "normal"))
    if coeff >= 0.8 and err_band in ("high", "critical"):
        score += 5
        factors.append({"severity": err_band, "contribution": 5,
                         "text": f"Integration ↔ event error correlation at {coeff} — systemic risk signal"})
    elif coeff >= 0.6:
        score += 2
        factors.append({"severity": "watch", "contribution": 2,
                         "text": f"Moderate error correlation detected (r={coeff})"})

    final_score = min(round(score), 100)
    band = _band(final_score)

    factors.sort(key=lambda f: f.get("contribution", 0), reverse=True)

    return {
        "score": final_score,
        "band": band,
        "label": BAND_LABELS[band],
        "factors": [{"severity": f["severity"], "text": f["text"]} for f in factors[:5]],
        "signal_count": len(factors),
    }
