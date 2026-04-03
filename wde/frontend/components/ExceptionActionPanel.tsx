"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { apiClient } from "@/lib/apiClient";

type ActionItem = {
  action_id: string;
  title: string;
  description: string;
  eta_min: number;
  impact: string;
};

type ExceptionItem = {
  exception_id: string;
  metric: string;
  current_value: string | number;
  unit: string;
  threshold: string;
  severity: "normal" | "watch" | "high" | "critical";
  reason: string;
  recommended_actions: ActionItem[];
};

type ExceptionPlan = {
  plan_id: string;
  generated_at: string;
  summary: { exception_count: number; highest_severity: string };
  exceptions: ExceptionItem[];
};

function severityClass(sev: string): string {
  if (sev === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (sev === "high") return "border-amber-200 bg-amber-50 text-amber-700";
  if (sev === "watch") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function ExceptionActionPanel({
  params
}: {
  params: Record<string, string | undefined>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<ExceptionPlan | null>(null);
  const [executionMsg, setExecutionMsg] = useState("");
  const [executingId, setExecutingId] = useState("");

  const depKey = useMemo(() => JSON.stringify(params), [params]);

  const refreshPlan = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/api/agent/exception-plan", { params, timeout: 15000 });
      setPlan(data || null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load exception action plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPlan();
  }, [depKey]);

  const executeActions = async (actionIds: string[]) => {
    if (!plan) return;
    setExecutingId(actionIds.join("|"));
    setExecutionMsg("");
    try {
      const { data } = await apiClient.post(
        "/api/agent/execute",
        {
          plan_id: plan.plan_id,
          action_ids: actionIds,
          actor: "demo-operator"
        },
        { timeout: 15000 }
      );
      setExecutionMsg(`Action logged for ops review · Ref: ${data.run_id}`);
    } catch (e: any) {
      setExecutionMsg(e?.response?.data?.detail || "Action execution failed.");
    } finally {
      setExecutingId("");
    }
  };

  return (
    <section className="control-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Operations Exceptions</p>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">KPI Exception Monitor</h3>
          <p className="mt-0.5 text-xs text-slate-400">Auto-detects KPI breaches and surfaces standard corrective actions</p>
        </div>
        <button onClick={refreshPlan} className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700">
          Refresh
        </button>
      </div>

      {loading && <LoadingSkeleton rows={3} />}
      {error && <p className="text-sm text-rose-700">{error}</p>}

      {!loading && !error && plan && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
              Exceptions: {plan.summary.exception_count}
            </span>
            <span className={`rounded-full border px-2 py-1 ${severityClass(plan.summary.highest_severity)}`}>
              Highest Severity: {plan.summary.highest_severity}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
              Snapshot: {plan.plan_id}
            </span>
          </div>

          {plan.exceptions.map((item) => (
            <div key={item.exception_id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.metric}: {item.current_value}
                  {item.unit ? ` ${item.unit}` : ""}
                </p>
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${severityClass(item.severity)}`}>
                  {item.severity.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Target: {item.threshold} &nbsp;·&nbsp; {item.reason}
              </p>

              <div className="mt-2 space-y-2">
                {item.recommended_actions.map((action) => (
                  <div key={action.action_id} className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{action.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{action.description}</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Expected outcome: {action.impact}
                    </p>
                    <button
                      onClick={() => executeActions([action.action_id])}
                      disabled={executingId.length > 0}
                      className="mt-2 rounded-lg bg-brand-primary px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {executingId === action.action_id ? "Logging..." : "Log Action for Review"}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => executeActions(item.recommended_actions.map((a) => a.action_id))}
                disabled={executingId.length > 0}
                className="mt-3 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
              >
                Log All Actions for This Exception
              </button>
            </div>
          ))}

          {executionMsg && <p className="text-sm text-emerald-700">{executionMsg}</p>}
        </div>
      )}
    </section>
  );
}
