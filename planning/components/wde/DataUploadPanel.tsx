"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/wde/apiClient";

type UploadStatus = {
  expected_datasets: string[];
  uploaded: Record<string, { file: string; rows: number | null; columns: string[]; uploaded_at: string | null }>;
  missing: string[];
};

const options = [
  "inbound_receipts",
  "receiving_accuracy",
  "yard_activity",
  "outbound_orders",
  "shipment_lifecycle",
  "integration_errors",
  "event_errors"
];

const fileGuide: Record<string, string> = {
  inbound_receipts: "WMS_Formulas.xlsx OR Dock to Stock.xlsx",
  receiving_accuracy: "Receiving Accuracy.xlsx",
  yard_activity: "Yard to Dock 1.xlsx",
  outbound_orders: "Order fill rate.xlsx OR Order Pendency 1.xlsx",
  shipment_lifecycle: "On Time Dispatch and Order Cycle Time 1.xlsx",
  integration_errors: "Integration Error Monitor.xlsx",
  event_errors: "Integration Error Monitor.xlsx"
};

export default function DataUploadPanel() {
  const [datasetKey, setDatasetKey] = useState(options[0]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  const helperText = useMemo(() => fileGuide[datasetKey], [datasetKey]);

  const checkBackend = async () => {
    try {
      await apiClient.get("/health", { timeout: 5000 });
      setBackendHealthy(true);
    } catch {
      setBackendHealthy(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const { data } = await apiClient.get("/api/data/status");
      setUploadStatus(data);
      setBackendHealthy(true);
    } catch {
      setBackendHealthy(false);
      setStatus("Could not fetch upload status. Ensure backend is running on port 8001.");
    }
  };

  useEffect(() => {
    checkBackend();
    refreshStatus();
  }, []);

  const uploadFile = async () => {
    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    setLoading(true);
    setStatus("");

    const formData = new FormData();
    formData.append("dataset_key", datasetKey);
    formData.append("file", file);

    try {
      const { data } = await apiClient.post("/api/data/upload", formData, {
        timeout: 120000
      });
      setStatus(`Uploaded ${data.dataset_key}: ${data.rows} rows parsed.`);
      await refreshStatus();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ") : detail;
      if (error?.code === "ECONNABORTED") {
        setStatus("Upload timed out. File is large or backend is busy. Please retry.");
      } else if (!error?.response) {
        setStatus("Backend unreachable. Start backend on http://127.0.0.1:8001 and retry.");
      } else {
        setStatus(msg || error?.message || "Upload failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="control-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Manual Data Upload</h3>
        <button onClick={refreshStatus} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">
          Refresh Status
        </button>
      </div>

      <p className="mt-1 text-xs text-slate-600">Temporary mode until live Supabase ingestion is wired.</p>

      <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
        Backend:{" "}
        {backendHealthy === null ? (
          "Checking..."
        ) : backendHealthy ? (
          <span className="font-semibold text-emerald-700">Connected</span>
        ) : (
          <span className="font-semibold text-rose-700">Not reachable on 127.0.0.1:8001</span>
        )}
      </div>

      <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
        Available files in your folder are all `.xlsx` currently (no `.csv` present).
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-slate-600">
          Dataset
          <select
            value={datasetKey}
            onChange={(e) => setDatasetKey(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-600 md:col-span-2">
          File ({helperText})
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      <button
        onClick={uploadFile}
        disabled={loading}
        className="mt-3 rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Upload Dataset"}
      </button>

      {status && <p className="mt-2 text-xs text-slate-700">{status}</p>}

      {uploadStatus && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Uploaded</p>
            <ul className="mt-1 space-y-1 text-xs text-slate-700">
              {Object.keys(uploadStatus.uploaded).length === 0 && <li>No dataset uploaded yet.</li>}
              {Object.entries(uploadStatus.uploaded).map(([key, val]) => (
                <li key={key}>
                  {key}: {val.rows ?? "unknown"} rows ({val.file})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Missing</p>
            <ul className="mt-1 space-y-1 text-xs text-slate-700">
              {uploadStatus.missing.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
