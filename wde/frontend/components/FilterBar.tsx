"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";

export type FilterConfig = {
  id: string;
  label: string;
  type?: "select" | "date";
  options?: string[];
  defaultValue?: string;
};

export default function FilterBar({
  filters,
  viewLabel = "Active View"
}: {
  filters: FilterConfig[];
  viewLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(() => {
    return filters.reduce<Record<string, string>>((acc, item) => {
      const q = searchParams.get(item.id);
      acc[item.id] = q || item.defaultValue || item.options?.[0] || "";
      return acc;
    }, {});
  }, [filters, searchParams]);

  const [values, setValues] = useState<Record<string, string>>(initial);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const applyQuery = (nextValues: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    filters.forEach((f) => {
      const val = nextValues[f.id];
      const empty = !val || val === (f.defaultValue ?? f.options?.[0] ?? "");
      if (empty) {
        params.delete(f.id);
      } else {
        params.set(f.id, val);
      }
    });
    const q = params.toString();
    const href = (q ? `${pathname}?${q}` : pathname) as Route;
    router.replace(href);
  };

  const setFilter = (id: string, value: string) => {
    const next = { ...values, [id]: value };
    setValues(next);
    applyQuery(next);
  };

  const reset = () => {
    const next = filters.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.defaultValue || item.options?.[0] || "";
      return acc;
    }, {});
    setValues(next);
    applyQuery(next);
  };

  return (
    <section className="border-b border-slate-200 bg-white/90 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <SlidersHorizontal size={14} /> Filters
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{viewLabel}</p>
      </div>

      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {filters.map((item) => (
          <label key={item.id} className="text-[11px] text-slate-500 dark:text-slate-400">
            {item.label}
            {item.type === "date" ? (
              <input
                type="date"
                value={values[item.id] ?? ""}
                onChange={(e) => setFilter(item.id, e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-[7px] text-xs text-slate-700 outline-none focus:border-brand-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:[color-scheme:dark]"
              />
            ) : (
              <select
                value={values[item.id]}
                onChange={(e) => setFilter(item.id, e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-brand-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {(item.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <button onClick={reset} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <RotateCcw size={12} className="mr-1 inline-block" /> Reset
        </button>
      </div>
    </section>
  );
}
