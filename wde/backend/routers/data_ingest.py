from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from data_store import EXPECTED_DATASETS, get_status, save_dataset

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _read_file(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    if suffix == ".csv":
        return pd.read_csv(path)
    raise HTTPException(status_code=400, detail="Unsupported file type. Upload .xlsx, .xls, or .csv")


@router.post("/upload")
async def upload_data(dataset_key: str = Form(...), file: UploadFile = File(...)) -> dict[str, Any]:
    dataset_key = dataset_key.strip()
    if dataset_key not in EXPECTED_DATASETS:
        raise HTTPException(status_code=400, detail=f"Invalid dataset_key '{dataset_key}'")

    original_name = file.filename or "uploaded_file"
    ext = Path(original_name).suffix.lower()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    saved_name = f"{dataset_key}_{timestamp}{ext}"
    saved_path = UPLOAD_DIR / saved_name

    content = await file.read()
    saved_path.write_bytes(content)

    df = _read_file(saved_path)

    metadata = {
        "file": saved_name,
        "rows": int(df.shape[0]),
        "columns": [str(col) for col in df.columns],
        "uploaded_at": datetime.utcnow().isoformat(),
    }
    save_dataset(dataset_key, df, metadata)

    return {
        "ok": True,
        "dataset_key": dataset_key,
        "file": saved_name,
        "rows": int(df.shape[0]),
        "columns": [str(col) for col in df.columns],
        "message": "File uploaded and parsed successfully",
    }


@router.get("/status")
def upload_status() -> dict[str, Any]:
    return get_status()
