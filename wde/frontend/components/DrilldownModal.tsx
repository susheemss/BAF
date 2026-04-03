"use client";

type DrilldownData = {
  kpi: string;
  unit: string;
  columns: string[];
  rows: (string | number)[][];
  no_data?: boolean;
  message?: string;
};

type Props = {
  data: DrilldownData | null;
  loading: boolean;
  onClose: () => void;
};

export default function DrilldownModal({ data, loading, onClose }: Props) {
  if (!data && !loading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Drill-Down</p>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {loading ? "Loading…" : data?.kpi ?? ""}
            </h3>
            {!loading && data && (
              <p className="mt-0.5 text-xs text-slate-500">
                Top {data.rows.length} records driving this KPI · unit: {data.unit}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <span className="text-sm text-slate-400">Fetching data…</span>
            </div>
          )}

          {!loading && data?.no_data && (
            <p className="text-sm text-slate-500">
              {data.message ?? "No data available for this KPI. Upload the relevant dataset to see drill-down details."}
            </p>
          )}

          {!loading && data && !data.no_data && data.rows.length === 0 && (
            <p className="text-sm text-slate-500">No records found for the current filters.</p>
          )}

          {!loading && data && !data.no_data && data.rows.length > 0 && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3 font-semibold text-slate-500">#</th>
                  {data.columns.map((col) => (
                    <th key={col} className="pb-2 pr-4 font-semibold text-slate-700 dark:text-slate-300">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => {
                  const lastIdx = row.length - 1;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 dark:border-slate-800 ${i === 0 ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                    >
                      <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`py-2 pr-4 ${j === lastIdx ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {typeof cell === "number" ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 }) : cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer note */}
        {!loading && data && !data.no_data && data.rows.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700">
            <p className="text-[11px] text-slate-400">
              Row 1 (highlighted) is the highest contributor. Address these records to improve the KPI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
