"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { FilterConfig } from "@/components/FilterBar";
import { apiClient } from "@/lib/apiClient";

type InboundIntelligence = {
  model?: string;
  risk_band?: string;
  anomaly_receipts?: string[];
} & Record<string, unknown>;

const filters: FilterConfig[] = [
  { id: "date_from", label: "From Date", type: "date", defaultValue: "" },
  { id: "date_to", label: "To Date", type: "date", defaultValue: "" },
  { id: "warehouse", label: "Warehouse", options: ["All Warehouses", "DEL", "MUM", "BLR"], defaultValue: "All Warehouses" },
  { id: "shift", label: "Shift", options: ["All Shifts", "Shift A", "Shift B", "Shift C"], defaultValue: "All Shifts" },
  { id: "flow", label: "Flow Type", options: ["All", "Inbound", "Outbound", "Cross Dock"], defaultValue: "Inbound" },
  { id: "risk", label: "Risk Band", options: ["All", "Normal", "Watch", "High", "Critical"], defaultValue: "All" },
  { id: "team", label: "Ops Team", options: ["All Teams", "Team 1", "Team 2", "Team 3"], defaultValue: "All Teams" }
];

function InboundPageContent() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intel, setIntel] = useState<InboundIntelligence | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          date_from: searchParams.get("date_from") || undefined,
          date_to: searchParams.get("date_to") || undefined,
          warehouse: searchParams.get("warehouse") || undefined,
          shift: searchParams.get("shift") || undefined,
          flow: searchParams.get("flow") || undefined,
          risk: searchParams.get("risk") || undefined,
          team: searchParams.get("team") || undefined
        };

        const intelRes = await apiClient.get("/api/ai/inbound-intelligence", { params });

        if (!active) return;
        setIntel((intelRes.data || null) as InboundIntelligence | null);
      } catch (e: any) {
        if (!active) return;
        setError(e?.response?.data?.detail || "Failed to load inbound control data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [queryKey]);

  const riskBand = String(intel?.risk_band || "Data Not Available").toLowerCase();
  const riskClass =
    riskBand === "critical"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : riskBand === "high"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : riskBand === "watch"
          ? "bg-orange-50 text-orange-700 border-orange-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <ProtectedLayout title="Inbound Control" filters={filters} viewLabel="Inbound / Control View">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-4">
          {error && (
            <section className="control-card border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Warning</h3>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{error}</p>
            </section>
          )}

          <section className="control-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Inbound Intelligence</h3>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${riskClass}`}>
                Risk Band: {intel?.risk_band ? String(intel.risk_band) : "Data Not Available"}
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-wide text-slate-400">Model</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {intel?.model ? String(intel.model) : "Data Not Available"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-wide text-slate-400">Anomaly Receipts</p>
                {Array.isArray(intel?.anomaly_receipts) && intel.anomaly_receipts.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {intel.anomaly_receipts.map((id) => (
                      <span key={id} className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {id}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Data Not Available</p>
                )}
              </div>
            </div>
          </section>

          <section className="control-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">KPI Source</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              KPI visuals are centralized in <span className="font-semibold">KPI Command Center</span> to avoid duplicate views across modules.
            </p>
          </section>
        </div>
      )}
    </ProtectedLayout>
  );
}

export default function InboundPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton rows={6} /></div>}>
      <InboundPageContent />
    </Suspense>
  );
}
