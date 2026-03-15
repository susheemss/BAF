"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import KPIWidget from "@/components/KPIWidget";
import OpsQueueTable from "@/components/OpsQueueTable";
import LineChartCard from "@/components/LineChartCard";
import DonutChartCard from "@/components/DonutChartCard";
import AlertCard from "@/components/AlertCard";
import ExceptionActionPanel from "@/components/ExceptionActionPanel";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import DisruptionRiskBanner from "@/components/DisruptionRiskBanner";
import type { FilterConfig } from "@/components/FilterBar";
import { apiClient } from "@/lib/apiClient";

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

  const uploadedCount = kpis.data_coverage?.uploaded_count ?? 0;
  const missingCount = kpis.data_coverage?.missing?.length ?? 0;
  const errors = (kpis.error_counts?.integration_errors ?? 0) + (kpis.error_counts?.event_errors ?? 0);

  const trendData = [
    { label: "Mon", inbound: 93, outbound: 88 },
    { label: "Tue", inbound: 95, outbound: 90 },
    { label: "Wed", inbound: 90, outbound: 86 },
    { label: "Thu", inbound: 98, outbound: 92 },
    { label: "Fri", inbound: 96, outbound: 91 },
    { label: "Sat", inbound: 89, outbound: 84 },
    { label: "Sun", inbound: 92, outbound: 87 }
  ];

  const riskDonut = [
    { label: "Normal", value: 17, color: "#10b981" },
    { label: "Watch", value: 8, color: "#F59E0B" },
    { label: "High", value: 6, color: "#f97316" },
    { label: "Critical", value: 3, color: "#EF4444" }
  ];

  const cards = useMemo(
    () => [
      {
        title: "Dock-to-Stock",
        value: kpis.dock_to_stock,
        suffix: "h",
        trend: "Target <= 2.5h",
        risk: (kpis.dock_to_stock > 3 ? "high" : "watch") as RiskTone,
        tooltip: "Duration from arrival at receiving dock until put away",
        sparkline: [2.6, 2.8, 3.1, 2.9, 2.7, 2.8, kpis.dock_to_stock]
      },
      {
        title: "Receiving Accuracy",
        value: kpis.receiving_accuracy,
        suffix: "%",
        trend: "Expected >= 98%",
        risk: (kpis.receiving_accuracy >= 98 ? "normal" : "watch") as RiskTone,
        tooltip: "Share of received lines matching expected quantities",
        sparkline: [95.8, 96.4, 96.7, 97.1, 97.3, 97.4, kpis.receiving_accuracy]
      },
      {
        title: "On-Time Dispatch",
        value: kpis.on_time_dispatch,
        suffix: "%",
        trend: "Expected >= 92%",
        risk: (kpis.on_time_dispatch >= 92 ? "normal" : "high") as RiskTone,
        tooltip: "Orders dispatched on or before planned ship date",
        sparkline: [89.2, 90.1, 89.6, 88.9, 89.4, 88.8, kpis.on_time_dispatch]
      },
      {
        title: "Order Pendency",
        value: kpis.order_pendency,
        trend: "Delayed shipment count",
        risk: (kpis.order_pendency > 100 ? "critical" : "watch") as RiskTone,
        tooltip: "Orders delayed beyond expected ship date",
        sparkline: [108, 112, 116, 119, 121, 124, kpis.order_pendency]
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

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <LineChartCard
                title="Inbound vs Outbound Reliability"
                data={trendData}
                lines={[
                  { key: "inbound", color: "#00B3A4", name: "Inbound" },
                  { key: "outbound", color: "#0B1F3B", name: "Outbound" }
                ]}
              />
            </div>
            <DonutChartCard title="Risk Distribution" data={riskDonut} />
          </section>

          <section className="mt-6">
            <OpsQueueTable />
          </section>

          <section className="mt-6 space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Critical Alerts</p>
            <AlertCard
              title="Supplier Cluster Drift"
              summary="SUP-113 moved from stable to volatile in the last 24h"
              detail="Review supplier slotting and dock assignment for SUP-113 and SUP-204. Volatility signal crossed cluster confidence threshold."
              tone="high"
            />
            <AlertCard
              title="Yard Congestion Pattern Shift"
              summary="Average trailer wait increased 22% after 14:00 shift window"
              detail="Dispatch sequence and gate utilization indicate elevated congestion between 14:00-18:00. Consider pre-allocation and door balancing."
              tone="critical"
            />
          </section>
          <section className="mt-6">
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
