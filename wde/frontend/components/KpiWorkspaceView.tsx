"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import SpeedometerKpiCard from "@/components/SpeedometerKpiCard";
import type { FilterConfig } from "@/components/FilterBar";
import { apiClient } from "@/lib/apiClient";

type KpiItem = { kpi: string; value: number | string; unit: string };
type KpiPayload = { timestamp?: string; kpi_tabs?: Record<string, KpiItem[]> };

const filters: FilterConfig[] = [
  { id: "date_from", label: "From Date", type: "date", defaultValue: "" },
  { id: "date_to", label: "To Date", type: "date", defaultValue: "" },
  { id: "warehouse", label: "Warehouse", options: ["All Warehouses", "DEL", "MUM", "BLR"], defaultValue: "All Warehouses" },
  { id: "shift", label: "Shift", options: ["All Shifts", "Shift A", "Shift B", "Shift C"], defaultValue: "All Shifts" },
  { id: "flow", label: "Flow Type", options: ["All", "Inbound", "Outbound", "Cross Dock"], defaultValue: "All" },
  { id: "risk", label: "Risk Band", options: ["All", "Normal", "Watch", "High", "Critical"], defaultValue: "All" },
  { id: "team", label: "Ops Team", options: ["All Teams", "Team 1", "Team 2", "Team 3"], defaultValue: "All Teams" }
];

const TAB_FALLBACK: Record<string, KpiItem[]> = {
  "1-2": [
    { kpi: "Dock-to-Stock Time", value: 2.8, unit: "hours" },
    { kpi: "GRN-to-Stock", value: 3.2, unit: "hours" }
  ],
  "3-4": [
    { kpi: "Receiving Accuracy", value: 97.2, unit: "%" },
    { kpi: "Total Mismatch Qty", value: "Data Not Available", unit: "qty" }
  ],
  "5-8": [
    { kpi: "Yard to Dock", value: "Data Not Available", unit: "minutes" },
    { kpi: "Average Waiting Time Yard to Dock", value: "Data Not Available", unit: "minutes" },
    { kpi: "Maximum Waiting Time", value: "Data Not Available", unit: "minutes" },
    { kpi: "Minimum Waiting Time", value: "Data Not Available", unit: "minutes" }
  ],
  "9-11": [
    { kpi: "Order Fill Rate", value: 93.4, unit: "%" },
    { kpi: "Shipped Qty", value: "Data Not Available", unit: "qty" },
    { kpi: "Short Qty", value: "Data Not Available", unit: "qty" }
  ],
  "12-16": [
    { kpi: "Order Cycle Time", value: "Data Not Available", unit: "hours" },
    { kpi: "Average Order Cycle Time", value: "Data Not Available", unit: "hours" },
    { kpi: "Maximum Order Cycle Time", value: "Data Not Available", unit: "hours" },
    { kpi: "Minimum Order Cycle Time", value: "Data Not Available", unit: "hours" },
    { kpi: "On-Time Dispatch", value: 88.6, unit: "%" }
  ],
  "17-18": [
    { kpi: "Order Pendency Percentage", value: 14.2, unit: "%" },
    { kpi: "Order Pendency Count", value: 126, unit: "count" }
  ]
};

function KpiWorkspaceViewContent({ title, tab, children }: { title: string; tab: string; children?: React.ReactNode }) {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<KpiPayload>({
    timestamp: undefined,
    kpi_tabs: { [tab]: TAB_FALLBACK[tab] || [] }
  });

  useEffect(() => {
    setPayload((prev) => ({
      timestamp: prev.timestamp,
      kpi_tabs: {
        ...(prev.kpi_tabs || {}),
        [tab]: TAB_FALLBACK[tab] || []
      }
    }));
  }, [tab]);

  useEffect(() => {
    let active = true;

    const mergeRows = (data: any) => {
      const liveRows = data?.kpi_tabs?.[tab];
      setPayload((prev) => ({
        ...(data || {}),
        kpi_tabs: {
          ...(data?.kpi_tabs || prev.kpi_tabs || {}),
          [tab]: Array.isArray(liveRows) && liveRows.length > 0 ? liveRows : (prev.kpi_tabs?.[tab] || TAB_FALLBACK[tab] || [])
        }
      }));
    };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          timeframe: searchParams.get("timeframe") || undefined,
          warehouse: searchParams.get("warehouse") || undefined,
          shift: searchParams.get("shift") || undefined,
          flow: searchParams.get("flow") || undefined,
          risk: searchParams.get("risk") || undefined,
          team: searchParams.get("team") || undefined,
          tab
        };
        const { data } = await apiClient.get("/api/kpis/all", { params, timeout: 12000 });
        if (!active) return;
        mergeRows(data);
      } catch (e: any) {
        try {
          const relaxedParams = {
            timeframe: searchParams.get("timeframe") || undefined,
            warehouse: searchParams.get("warehouse") || undefined,
            shift: searchParams.get("shift") || undefined,
            flow: searchParams.get("flow") || undefined,
            risk: searchParams.get("risk") || undefined,
            team: searchParams.get("team") || undefined
          };
          const { data } = await apiClient.get("/api/kpis/all", { params: relaxedParams, timeout: 15000 });
          if (!active) return;
          mergeRows(data);
          setError("Using fallback API mode for this workspace.");
        } catch (e2: any) {
          if (!active) return;
          setError(e2?.response?.data?.detail || e?.response?.data?.detail || "Failed to load KPI workspace data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [queryKey, tab]);

  const rows = payload.kpi_tabs?.[tab] || [];
  const unitMaxMap = useMemo(() => {
    const map: Record<string, number> = {};
    const byUnit: Record<string, number[]> = {};
    rows.forEach((row) => {
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
  }, [rows]);

  return (
    <ProtectedLayout title={title} filters={filters} viewLabel={`KPI Workspace / ${title}`}>
      <div className="space-y-4">
        {error && (
          <section className="control-card border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Warning</h3>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{error}</p>
          </section>
        )}
        <section className="control-card p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Current KPI Values</p>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                Timestamp: {payload.timestamp ? new Date(payload.timestamp).toLocaleString() : "Data Not Available"}
              </p>
              {loading && <p className="text-[11px] text-slate-400">Refreshing...</p>}
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {rows.length === 0 && <p className="text-sm text-slate-700 dark:text-slate-300">Data Not Available</p>}
            {rows.map((item) => (
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
        {children}
      </div>
    </ProtectedLayout>
  );
}

export default function KpiWorkspaceView({ title, tab, children }: { title: string; tab: string; children?: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6" />}>
      <KpiWorkspaceViewContent title={title} tab={tab}>{children}</KpiWorkspaceViewContent>
    </Suspense>
  );
}
