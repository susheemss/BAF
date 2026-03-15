"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  "/dashboard":     "Overview",
  "/control-tower": "Control Tower",
  "/demand":        "Demand Planning",
  "/supply":        "Supply Planning",
};

export default function Header() {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const label = LABELS[pathname] ?? "Planning Hub";

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100 sticky top-0 z-20">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-semibold text-slate-800">Planning Hub</span>
        <span className="text-slate-300">›</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
          {time}
        </span>
        <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-full">
          Demo · Sep 2024 – Feb 2025
        </span>
      </div>
    </header>
  );
}
