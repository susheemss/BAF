"use client";

import { useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { parseFile } from "@/lib/tms/parse";
import { apiClient } from "@/lib/wde/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────
type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  rows?: number;
  filename?: string;
};

const WMS_DATASET_OPTIONS = [
  { value: "inbound_receipts",   label: "Inbound Receipts",      hint: "WMS_Formulas.xlsx / Dock to Stock.xlsx" },
  { value: "receiving_accuracy", label: "Receiving Accuracy",    hint: "Receiving Accuracy.xlsx" },
  { value: "yard_activity",      label: "Yard Activity",         hint: "Yard to Dock 1.xlsx" },
  { value: "outbound_orders",    label: "Outbound Orders",       hint: "Order fill rate.xlsx / Order Pendency 1.xlsx" },
  { value: "shipment_lifecycle", label: "Shipment Lifecycle",    hint: "On Time Dispatch and Order Cycle Time 1.xlsx" },
  { value: "integration_errors", label: "Integration Errors",    hint: "Integration Error Monitor.xlsx" },
  { value: "event_errors",       label: "Event Errors",          hint: "Integration Error Monitor.xlsx" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ state }: { state: UploadState }) {
  if (state.status === "idle") return null;
  const colors: Record<string, string> = {
    uploading: "bg-blue-50 text-blue-700 border-blue-200",
    success:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    error:     "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${colors[state.status]}`}>
      {state.status === "uploading" && (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {state.message}
      {state.rows !== undefined && (
        <span className="ml-2 font-semibold">{state.rows.toLocaleString()} rows</span>
      )}
    </div>
  );
}

function DatasetCard({
  title,
  subtitle,
  icon,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  status: UploadState;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-4">{children}</div>
          <StatusBadge state={status} />
          {status.status === "success" && status.filename && (
            <p className="mt-1 text-xs text-slate-400">
              Last upload: <span className="font-medium">{status.filename}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WMS Section ───────────────────────────────────────────────────────────────
function WmsUpload() {
  const [datasetKey, setDatasetKey] = useState(WMS_DATASET_OPTIONS[0].value);
  const [state, setState] = useState<UploadState>({ status: "idle", message: "" });
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const checkBackend = async () => {
    try {
      await apiClient.get("/health", { timeout: 4000 });
      setBackendOk(true);
    } catch {
      setBackendOk(false);
    }
  };

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setState({ status: "error", message: "Please select a file." }); return; }
    setState({ status: "uploading", message: "Uploading to WMS backend…" });
    const formData = new FormData();
    formData.append("dataset_key", datasetKey);
    formData.append("file", file);
    try {
      const { data } = await apiClient.post("/api/data/upload", formData, { timeout: 120000 });
      setState({ status: "success", message: `Uploaded successfully —`, rows: data.rows, filename: file.name });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d: any) => d?.msg).join("; ") : detail;
      if (!err?.response) {
        setState({ status: "error", message: "Backend unreachable. Start the WMS backend on port 8001." });
      } else {
        setState({ status: "error", message: msg || err?.message || "Upload failed." });
      }
    }
  };

  const selectedOption = WMS_DATASET_OPTIONS.find((o) => o.value === datasetKey);

  return (
    <DatasetCard
      title="WMS Data"
      subtitle="Feeds the Warehouse Diagnosis Engine — KPI calculations, drift detection, and AI analysis."
      icon="🏭"
      status={state}
    >
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-slate-500">Backend status:</span>
        {backendOk === null && (
          <button onClick={checkBackend} className="rounded border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50">
            Check
          </button>
        )}
        {backendOk === true && <span className="font-semibold text-emerald-600">Connected ✓</span>}
        {backendOk === false && <span className="font-semibold text-red-600">Not reachable on port 8001</span>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Dataset</label>
          <select
            value={datasetKey}
            onChange={(e) => setDatasetKey(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {WMS_DATASET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {selectedOption && (
            <p className="mt-1 text-xs text-slate-400">{selectedOption.hint}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">File (.xlsx / .csv)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <button
        onClick={upload}
        disabled={state.status === "uploading"}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {state.status === "uploading" ? "Uploading…" : "Upload to WMS"}
      </button>
    </DatasetCard>
  );
}

// ── Planning Section ──────────────────────────────────────────────────────────
function PlanningUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", message: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setState({ status: "error", message: "Please select a file." }); return; }
    setState({ status: "uploading", message: "Saving planning data…" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/data/planning/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setState({ status: "success", message: "Planning data updated —", rows: data.rows, filename: file.name });
    } catch (err: any) {
      setState({ status: "error", message: err.message || "Upload failed." });
    }
  };

  return (
    <DatasetCard
      title="Planning Data"
      subtitle="Feeds demand planning, supply planning, and control tower pages."
      icon="📊"
      status={state}
    >
      <p className="mb-3 text-xs text-slate-400">
        Required columns: month, warehouse, sku_id, category, supplier, demand_plan, actual_demand,
        demand_variance_pct, stock_on_hand, safety_stock, reorder_point, po_number, po_qty,
        po_date, expected_receipt_date, po_status, closing_stock, days_of_cover, stockout_risk,
        unit_cost_inr, inventory_value_inr
      </p>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={upload}
          disabled={state.status === "uploading"}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {state.status === "uploading" ? "Saving…" : "Upload"}
        </button>
      </div>
    </DatasetCard>
  );
}

// ── TMS Section ───────────────────────────────────────────────────────────────
function TmsUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", message: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setState({ status: "error", message: "Please select a file." }); return; }
    setState({ status: "uploading", message: "Parsing shipment data…" });
    try {
      const records = await parseFile(file);
      // Persist to localStorage so TMS pages pick it up automatically
      localStorage.setItem("tmss_shipments", JSON.stringify(records));
      const response = await fetch("/api/data/tms/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save TMS data for chatbot.");
      setState({ status: "success", message: "TMS data loaded —", rows: records.length, filename: file.name });
    } catch (err: any) {
      setState({ status: "error", message: err.message || "Parse failed." });
    }
  };

  const clear = () => {
    localStorage.removeItem("tmss_shipments");
    setState({ status: "idle", message: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <DatasetCard
      title="TMS / Shipment Data"
      subtitle="Feeds the Transportation Management System — carrier KPIs, cost analysis, and live map."
      icon="🚚"
      status={state}
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">CSV / XLSX File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={upload}
          disabled={state.status === "uploading"}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {state.status === "uploading" ? "Parsing…" : "Upload"}
        </button>
        <button
          onClick={clear}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </DatasetCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DataPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Data Hub</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload source data for each layer. Data flows automatically to the corresponding pages.
        </p>
      </div>

      <div className="grid gap-5">
        <WmsUpload />
        <PlanningUpload />
        <TmsUpload />
      </div>
    </AppShell>
  );
}
