"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LineChartCard from "@/components/LineChartCard";
import SpeedometerKpiCard from "@/components/SpeedometerKpiCard";
import type { FilterConfig } from "@/components/FilterBar";
import { apiClient } from "@/lib/apiClient";

type KpiItem = { kpi: string; value: number | string; unit: string };

type KpiPayload = {
  timestamp?: string;
  kpi_tabs?: Record<string, KpiItem[]>;
  applied_filters?: Record<string, string | null | undefined>;
  data_coverage?: { uploaded_count?: number; missing?: string[] };
  historical?: Array<Record<string, string | number>>;
  stage_breakdown?: Array<Record<string, string | number>>;
  previous_period?: Record<string, string | number>;
  error?: string;
};

const FALLBACK_PAYLOAD: KpiPayload = {
  timestamp: undefined,
  kpi_tabs: {
    "1-2": [
      { kpi: "Dock-to-Stock Time", value: 2.8, unit: "hours" },
      { kpi: "GRN-to-Stock", value: 3.2, unit: "hours" }
    ],
    "3-4": [
      { kpi: "Receiving Accuracy", value: 97.2, unit: "%" },
      { kpi: "Total Mismatch Qty", value: 0, unit: "qty" }
    ],
    "5-8": [
      { kpi: "Yard to Dock", value: 0, unit: "minutes" },
      { kpi: "Average Waiting Time Yard to Dock", value: 0, unit: "minutes" },
      { kpi: "Maximum Waiting Time", value: 0, unit: "minutes" },
      { kpi: "Minimum Waiting Time", value: 0, unit: "minutes" }
    ],
    "9-11": [
      { kpi: "Order Fill Rate", value: 93.4, unit: "%" },
      { kpi: "Shipped Qty", value: 0, unit: "qty" },
      { kpi: "Short Qty", value: 0, unit: "qty" }
    ],
    "12-16": [
      { kpi: "Order Cycle Time", value: 0, unit: "hours" },
      { kpi: "Average Order Cycle Time", value: 0, unit: "hours" },
      { kpi: "Maximum Order Cycle Time", value: 0, unit: "hours" },
      { kpi: "Minimum Order Cycle Time", value: 0, unit: "hours" },
      { kpi: "On-Time Dispatch", value: 88.6, unit: "%" }
    ],
    "17-18": [
      { kpi: "Order Pendency Percentage", value: 14.2, unit: "%" },
      { kpi: "Order Pendency Count", value: 126, unit: "count" }
    ]
  }
};

const filters: FilterConfig[] = [
  { id: "date_from", label: "From Date", type: "date", defaultValue: "" },
  { id: "date_to", label: "To Date", type: "date", defaultValue: "" },
  { id: "warehouse", label: "Warehouse", options: ["All Warehouses", "DEL", "MUM", "BLR"], defaultValue: "All Warehouses" },
  { id: "shift", label: "Shift", options: ["All Shifts", "Shift A", "Shift B", "Shift C"], defaultValue: "All Shifts" },
  { id: "flow", label: "Flow Type", options: ["All", "Inbound", "Outbound", "Cross Dock"], defaultValue: "All" },
  { id: "risk", label: "Risk Band", options: ["All", "Normal", "Watch", "High", "Critical"], defaultValue: "All" },
  { id: "team", label: "Ops Team", options: ["All Teams", "Team 1", "Team 2", "Team 3"], defaultValue: "All Teams" }
];

const TAB_ORDER = ["1-2", "3-4", "5-8", "9-11", "12-16", "17-18"];
const TAB_LABELS: Record<string, string> = {
  "1-2": "Inbound Velocity",
  "3-4": "Receiving Quality",
  "5-8": "Yard Dwell & Throughput",
  "9-11": "Fulfillment Accuracy",
  "12-16": "Order Cycle Efficiency",
  "17-18": "Dispatch Backlog"
};

function formatValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "Data Not Available";
  return String(v);
}

function safePctChange(current: number, previous: number): string {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return "Data Not Available";
  return `${(((current - previous) / previous) * 100).toFixed(2)}%`;
}

function KpiCommandCenterPageContent() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<KpiPayload>({});
  const [activeTab, setActiveTab] = useState("1-2");

  useEffect(() => {
    let active = true;

    const fetchWithRetry = async (params: Record<string, string | undefined>) => {
      const attempts = 2;
      let lastError: any = null;

      for (let i = 0; i < attempts; i += 1) {
        try {
          const response = await apiClient.get("/api/kpis/all", { params, timeout: 45000 });
          return response.data;
        } catch (e: any) {
          lastError = e;
          const status = e?.response?.status;
          const isTimeout = e?.code === "ECONNABORTED";
          const isNetwork = !status;
          const isRetriable = isTimeout || isNetwork || status >= 500;
          if (!isRetriable || i === attempts - 1) break;
        }
      }

      throw lastError;
    };

    const load = async () => {
      if (active && !hasLoaded) setLoading(true);
      if (active) setError("");
      try {
        const params = {
          date_from: searchParams.get("date_from") || undefined,
          date_to: searchParams.get("date_to") || undefined,
          warehouse: searchParams.get("warehouse") || undefined,
          shift: searchParams.get("shift") || undefined,
          flow: searchParams.get("flow") || undefined,
          risk: searchParams.get("risk") || undefined,
          team: searchParams.get("team") || undefined,
          tab: activeTab
        };

        const data = await fetchWithRetry(params);
        if (!active) return;
        setPayload(data || {});
        setHasLoaded(true);
      } catch (e: any) {
        if (!active) return;
        setPayload((prev) => {
          if (prev?.kpi_tabs && Object.keys(prev.kpi_tabs).length > 0) return prev;
          return FALLBACK_PAYLOAD;
        });
        setError(e?.response?.data?.detail || "Failed to load KPI command center data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [activeTab, queryKey]);

  const tabRows = payload.kpi_tabs?.[activeTab] || [];
  const historical = payload.historical || [];

  const historicalAvailable = Array.isArray(payload.historical) && payload.historical.length > 1;
  const stageBreakdownAvailable = Array.isArray(payload.stage_breakdown) && payload.stage_breakdown.length > 0;
  const comparisonAvailable = !!payload.previous_period;

  const trendConfig = useMemo(() => {
    if (!historicalAvailable || historical.length === 0) return null;
    const sample = historical[0];
    const keys = Object.keys(sample);
    const xKey = keys.find((k) => /time|date|timestamp|label/i.test(k)) || keys[0];
    const numericKeys = keys.filter((k) => k !== xKey && typeof sample[k] === "number");
    if (numericKeys.length === 0) return null;
    return {
      data: historical.map((row) => ({ ...row, label: String(row[xKey]) })),
      lines: numericKeys.slice(0, 3).map((k, idx) => ({
        key: k,
        name: k,
        color: ["#0B1F3B", "#00B3A4", "#F59E0B"][idx] || "#0B1F3B"
      }))
    };
  }, [historical, historicalAvailable]);

  const deterministicInsights = useMemo(() => {
    if (!comparisonAvailable || !payload.previous_period || !payload.kpi_tabs) return [];
    const currentFlat = Object.values(payload.kpi_tabs).flat();
    const prev = payload.previous_period;
    return currentFlat
      .map((item) => {
        const prevVal = prev[item.kpi];
        const currNum = typeof item.value === "number" ? item.value : Number(item.value);
        const prevNum = typeof prevVal === "number" ? prevVal : Number(prevVal);
        if (!Number.isFinite(currNum) || !Number.isFinite(prevNum)) return null;
        return {
          kpi: item.kpi,
          current: currNum,
          previous: prevNum,
          delta: safePctChange(currNum, prevNum)
        };
      })
      .filter((x): x is { kpi: string; current: number; previous: number; delta: string } => !!x);
  }, [comparisonAvailable, payload.kpi_tabs, payload.previous_period]);

  const unitMaxMap = useMemo(() => {
    const map: Record<string, number> = {};
    const byUnit: Record<string, number[]> = {};
    tabRows.forEach((row) => {
      const n = typeof row.value === "number" ? row.value : Number(row.value);
      if (Number.isFinite(n)) {
        const u = row.unit || "unknown";
        if (!byUnit[u]) byUnit[u] = [];
        byUnit[u].push(n);
      }
    });
    Object.keys(byUnit).forEach((u) => {
      if (u === "%") map[u] = 100;
      else map[u] = Math.max(...byUnit[u]);
    });
    return map;
  }, [tabRows]);

  return (
    <ProtectedLayout title="KPI Command Center" filters={filters} viewLabel="KPI / Data-Integrity Mode">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-6">
          {error && (
            <section className="control-card border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Warning</h3>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{error}</p>
            </section>
          )}
          <section className="control-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">KPI Hero (Current Values)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                Timestamp: {payload.timestamp ? new Date(payload.timestamp).toLocaleString() : "Data Not Available"}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAB_ORDER.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg border px-3 py-1 text-xs ${
                    activeTab === tab
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  {TAB_LABELS[tab] || tab}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {tabRows.length === 0 && <p className="text-sm text-slate-700 dark:text-slate-300">Data Not Available</p>}
              {tabRows.map((item) => (
                <SpeedometerKpiCard
                  key={item.kpi}
                  title={item.kpi}
                  value={item.value}
                  unit={item.unit}
                  maxValue={unitMaxMap[item.unit || "unknown"]}
                />
              ))}
            </div>
          </section>

          <section className="control-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Trend</p>
            {trendConfig ? (
              <div className="mt-3">
                <LineChartCard title="Historical KPI Trend" data={trendConfig.data} lines={trendConfig.lines} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Historical trend data not available.</p>
            )}
          </section>

          {stageBreakdownAvailable && (
            <section className="control-card p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Driver Breakdown</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {Object.keys((payload.stage_breakdown || [])[0] || {}).map((k) => (
                        <th key={k} className="py-2 pr-4">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(payload.stage_breakdown || []).map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                        {Object.keys((payload.stage_breakdown || [])[0] || {}).map((k) => (
                          <td key={k} className="py-2 pr-4">{formatValue(row[k] as string | number)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {comparisonAvailable && deterministicInsights.length > 0 && (
            <section className="control-card p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Deterministic Insights</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="py-2 pr-4">KPI</th>
                      <th className="py-2 pr-4">Current</th>
                      <th className="py-2 pr-4">Previous</th>
                      <th className="py-2">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deterministicInsights.map((row) => (
                      <tr key={row.kpi} className="border-b border-slate-100 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                        <td className="py-2 pr-4">{row.kpi}</td>
                        <td className="py-2 pr-4">{row.current}</td>
                        <td className="py-2 pr-4">{row.previous}</td>
                        <td className="py-2">{row.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </ProtectedLayout>
  );
}

export default function KpiCommandCenterPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton rows={6} /></div>}>
      <KpiCommandCenterPageContent />
    </Suspense>
  );
}
