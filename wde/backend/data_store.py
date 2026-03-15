from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

EXPECTED_DATASETS = {
    "inbound_receipts",
    "receiving_accuracy",
    "yard_activity",
    "outbound_orders",
    "shipment_lifecycle",
    "integration_errors",
    "event_errors",
}

DATA_REGISTRY: dict[str, dict[str, Any]] = {}
DATA_FRAMES: dict[str, pd.DataFrame] = {}
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"


def save_dataset(dataset_key: str, df: pd.DataFrame, metadata: dict[str, Any]) -> None:
    DATA_FRAMES[dataset_key] = df
    DATA_REGISTRY[dataset_key] = metadata


def get_dataset(dataset_key: str) -> pd.DataFrame | None:
    return DATA_FRAMES.get(dataset_key)


def _discover_disk_uploads() -> dict[str, dict[str, Any]]:
    discovered: dict[str, dict[str, Any]] = {}
    if not UPLOAD_DIR.exists():
        return discovered

    for key in EXPECTED_DATASETS:
        matches = sorted(UPLOAD_DIR.glob(f"{key}_*"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not matches:
            continue
        latest = matches[0]
        discovered[key] = {
            "file": latest.name,
            "rows": None,
            "columns": [],
            "uploaded_at": None,
        }

    return discovered


def get_status() -> dict[str, Any]:
    merged_uploaded = {**_discover_disk_uploads(), **DATA_REGISTRY}
    return {
        "expected_datasets": sorted(EXPECTED_DATASETS),
        "uploaded": merged_uploaded,
        "missing": sorted(list(EXPECTED_DATASETS - set(merged_uploaded.keys()))),
    }
