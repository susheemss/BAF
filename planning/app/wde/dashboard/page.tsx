"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import ProtectedLayout from "@/components/wde/ProtectedLayout";
import KPIWidget from "@/components/wde/KPIWidget";
import ExceptionActionPanel from "@/components/wde/ExceptionActionPanel";
import LoadingSkeleton from "@/components/wde/LoadingSkeleton";
import DisruptionRiskBanner from "@/components/wde/DisruptionRiskBanner";
import type { FilterConfig } from "@/components/wde/FilterBar";
import { apiClient } from "@/lib/wde/apiClient";

type TrendPoint = { date: string; value: number; total: number };
type TrendData  = { points: TrendPoint[]; target: number; has_data: boolean };

type KpiTabItem = { kpi: string; value: number | string; unit: string };
type RiskTone = "normal" | "watch" | "high" | "critical";

type KpiPayload = {
  dock_to_stock: number;
  receiving_accuracy: number;
  on_time_dispatch: number;
  order_pendency: number;
  error_counts?: { integration_errors: number; event_errors: number };
  data_coverage?: { uploaded_count: number; missing: string[] };
  kpi_tabs?: Record<string, KpiTabItem[]>;
};

const dashboardFilters: FilterConfig[] = [
  { id: "date_from", label: "From Date", type: "date", defaultValue: "" },
  { id: "date_to", label: "To Date", type: "date", defaultValue: "" },
  { id: "warehouse", label: "Warehouse", options: ["All Warehouses", "DEL", "MUM", "BLR"], defaultValue: "All Warehouses" },
  { id: "shift", label: "Shift", options: ["All Shifts", "Shift A", "Shift B", "Shift C"], defaultValue: "All Shifts" },
  { id: "flow", label: "Flow Type", options: ["All", "Inbound", "Outbound", "Cross Dock"], defaultValue: "All" },
  { id: "risk", label: "Risk Band", options: ["All", "Normal", "Watch", "High", "Critical"], defaultValue: "All" },
  { id: "team", label: "Ops Team", options: ["All Teams", "Team 1", "Team 2", "Team 3"], defaultValue: "All Teams" }
];

const fallback: KpiPayload = {
  dock_to_stock: 2.8,
  receiving_accuracy: 97.2,
  on_time_dispatch: 88.6,
  order_pendency: 126,
  error_counts: { integration_errors: 11, event_errors: 6 },
  data_coverage: { uploaded_count: 0, missing: [] },
  kpi_tabs: {
    "1-2": [
      { kpi: "Dock-to-Stock Time", value: 2.8, unit: "hours" },
      { kpi: "GRN-to-Stock", value: 3.2, unit: "hours" }
    ],
    "3-4": [
      { kpi: "Receiving Accuracy", value: 97.2, unit: "%" },
      { kpi: "Total Mismatch Qty", value: 0, unit: "qty" }
    ],
    "5-8": [],
    "9-11": [],
    "12-16": [],
    "17-18": []
  }
};

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const [kpis, setKpis] = useState<KpiPayload>(fallback);
  const [trend, setTrend] = useState<TrendData>({ points: [], target: 92, has_data: false });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Live KPI sync pending...");
  const filterParams = useMemo(
    () => ({
      date_from: new URLSearchParams(queryKey).get("date_from") || undefined,
      date_to: new URLSearchParams(queryKey).get("date_to") || undefined,
      warehouse: new URLSearchParams(queryKey).get("warehouse") || undefined,
      shift: new URLSearchParams(queryKey).get("shift") || undefined,
      flow: new URLSearchParams(queryKey).get("flow") || undefined,
      risk: new URLSearchParams(queryKey).get("risk") || undefined,
      team: new URLSearchParams(queryKey).get("team") || undefined
    }),
    [queryKey]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/api/kpis/all", { params: filterParams });
        setKpis({ ...fallback, ...data });
        setStatus(`Connected. Uploaded datasets: ${data?.data_coverage?.uploaded_count ?? 0}`);
      } catch {
        setStatus("Using fallback KPI values. Check backend/API auth.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filterParams, queryKey]);

  useEffect(() => {
    apiClient
      .get("/api/kpis/trend", { params: { warehouse: filterParams.warehouse } })
      .then(({ data }) => setTrend(data))
      .catch(() => {});
  }, [filterParams.warehouse]);

  const uploadedCount = kpis.data_coverage?.uploaded_count ?? 0;
  const missingCount = kpis.data_coverage?.missing?.length ?? 0;
  const errors = (kpis.error_counts?.integration_errors ?? 0) + (kpis.error_counts?.event_errors ?? 0);

  const cards = useMemo(
    () => [
      {
        title: "Dock-to-Stock",
        value: kpis.dock_to_stock,
        suffix: "h",
        trend: "Target <= 2.5h",
        risk: (kpis.dock_to_stock > 3 ? "high" : "watch") as RiskTone,
        tooltip: "Duration from arrival at receiving dock until put away"
      },
      {
        title: "Receiving Accuracy",
        value: kpis.receiving_accuracy,
        suffix: "%",
        trend: "Expected >= 98%",
        risk: (kpis.receiving_accuracy >= 98 ? "normal" : "watch") as RiskTone,
        tooltip: "Share of received lines matching expected quantities"
      },
      {
        title: "On-Time Dispatch",
        value: kpis.on_time_dispatch,
        suffix: "%",
        trend: "Expected >= 92%",
        risk: (kpis.on_time_dispatch >= 92 ? "normal" : "high") as RiskTone,
        tooltip: "Orders dispatched on or before planned ship date"
      },
      {
        title: "Order Pendency",
        value: kpis.order_pendency,
        trend: "Delayed shipment count",
        risk: (kpis.order_pendency > 100 ? "critical" : "watch") as RiskTone,
        tooltip: "Orders delayed beyond expected ship date"
      }
    ],
    [kpis]
  );

  return (
    <ProtectedLayout title="Executive Planning Cockpit" filters={dashboardFilters} viewLabel="All Warehouses / Executive View">
      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6 control-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Executive Summary</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">Loaded: {uploadedCount}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">Missing: {missingCount}</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">Error Signals: {errors}</span>
          </div>
        </div>
      </motion.section>

      <DisruptionRiskBanner params={filterParams} />

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <KPIWidget key={card.title} {...card} />
            ))}
          </section>

          <section className="mt-6">
            <div className="control-card p-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                On-Time Dispatch Trend — Last 30 Days
              </p>
              {!trend.has_data ? (
                <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
                  Upload shipment lifecycle data to see dispatch trend
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={trend.points} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="otdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[70, 100]}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(v: string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      formatter={(v: number) => [`${v}%`, "On-Time Dispatch"]}
                    />
                    <ReferenceLine
                      y={trend.target}
                      stroke="#f59e0b"
                      strokeDasharray="5 3"
                      label={{ value: `SLA ${trend.target}%`, position: "insideTopRight", fill: "#f59e0b", fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#otdGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#10b981" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-2 px-1">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Operations Exceptions</h2>
              <p className="text-xs text-slate-500">KPIs currently outside target thresholds, with recommended corrective actions</p>
            </div>
            <ExceptionActionPanel params={filterParams} />
          </section>

        </>
      )}
    </ProtectedLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton rows={8} /></div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
