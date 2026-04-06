"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/wde/apiClient";

type Props = {
  title: string;
  endpoint: string;
  description?: string;
};

export default function LiveApiCard({ title, endpoint, description }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get(endpoint);
        setData(response.data || null);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Could not load endpoint");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [endpoint]);

  return (
    <div className="control-card p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-600">{description}</p>}

      {loading && <p className="mt-3 text-sm text-slate-600">Loading...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {!loading && !error && data && (
        <div className="mt-3 space-y-2 text-xs text-slate-800">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
              <span className="font-semibold">{key}:</span>{" "}
              <span>{Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
