"use client";

import { Search, X } from "lucide-react";

export type FilterDef =
  | { type: "select";  id: string; label: string; options: string[] }
  | { type: "search";  id: string; label: string }
  | { type: "toggle";  id: string; label: string; options: string[] };

type Values = Record<string, string>;

interface Props {
  filters: FilterDef[];
  values: Values;
  onChange: (id: string, value: string) => void;
  onReset: () => void;
}

export default function FilterBar({ filters, values, onChange, onReset }: Props) {
  const isDirty = filters.some((f) => {
    if (f.type === "toggle") return values[f.id] !== f.options[0];
    return values[f.id] !== "" && values[f.id] !== "All";
  });

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white border border-slate-100 rounded-xl shadow-soft">
      {filters.map((f) => {
        if (f.type === "select") {
          return (
            <div key={f.id} className="flex flex-col gap-0.5">
              <label className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold px-1">
                {f.label}
              </label>
              <select
                value={values[f.id] ?? "All"}
                onChange={(e) => onChange(f.id, e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[130px]"
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o === "All" ? `All ${f.label}s` : o}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (f.type === "search") {
          return (
            <div key={f.id} className="flex flex-col gap-0.5">
              <label className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold px-1">
                {f.label}
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={values[f.id] ?? ""}
                  onChange={(e) => onChange(f.id, e.target.value)}
                  placeholder={`Search ${f.label}...`}
                  className="text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[180px]"
                />
              </div>
            </div>
          );
        }

        if (f.type === "toggle") {
          return (
            <div key={f.id} className="flex flex-col gap-0.5">
              <label className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold px-1">
                {f.label}
              </label>
              <div className="flex gap-1">
                {f.options.map((o) => (
                  <button
                    key={o}
                    onClick={() => onChange(f.id, o)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      values[f.id] === o
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      {isDirty && (
        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 self-end mb-0.5"
        >
          <X size={12} /> Reset
        </button>
      )}
    </div>
  );
}
