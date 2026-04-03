"use client";

export type TableDrilldown = {
  kpi: string;
  subtitle: string;
  columns: string[];
  rows: (string | number)[][];
};

type Props = { data: TableDrilldown | null; onClose: () => void };

export default function DataDrilldownModal({ data, onClose }: Props) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Drill-Down</p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{data.kpi}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{data.subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">Close</button>
        </div>
        <div className="max-h-[60vh] overflow-auto p-5">
          {data.rows.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No records match the current filters.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 pr-3 font-semibold text-slate-400">#</th>
                  {data.columns.map((col) => (
                    <th key={col} className="pb-2 pr-4 font-semibold text-slate-700">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => {
                  const last = row.length - 1;
                  return (
                    <tr key={i} className={`border-b border-slate-100 ${i === 0 ? "bg-red-50" : ""}`}>
                      <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                      {row.map((cell, j) => (
                        <td key={j} className={`py-2 pr-4 ${j === last ? "font-semibold text-red-600" : "text-slate-700"}`}>
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
        {data.rows.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-[11px] text-slate-400">Row 1 (highlighted) is the highest contributor. Computed from your uploaded CSV data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
