"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import html2canvas from "html2canvas";

const LABELS: Record<string, string> = {
  "/dashboard":     "Overview",
  "/control-tower": "Control Tower",
  "/operations-desk": "Operations Desk",
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
  const [snapping, setSnapping] = useState(false);

  const takeSnapshot = async () => {
    setSnapping(true);
    await new Promise((r) => setTimeout(r, 50));

    // Replace <select> elements with styled divs so html2canvas renders them
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>("select"));
    const placeholders = selects.map((sel) => {
      const div = document.createElement("div");
      div.textContent = sel.options[sel.selectedIndex]?.text ?? "";
      div.style.cssText = `
        display:inline-flex; align-items:center; min-width:${sel.offsetWidth}px;
        height:${sel.offsetHeight}px; padding:0 12px; font-size:14px;
        border:1px solid #e2e8f0; border-radius:8px; background:#fff;
        color:#334155; box-sizing:border-box;
      `;
      sel.parentNode!.insertBefore(div, sel);
      sel.style.display = "none";
      return { sel, div };
    });

    const canvas = await html2canvas(document.body, {
      useCORS: true,
      scale: 2,
      ignoreElements: (el) => el.getAttribute("data-snapshot-ignore") === "true",
    });

    // Restore selects
    placeholders.forEach(({ sel, div }) => {
      sel.style.display = "";
      div.remove();
    });

    const link = document.createElement("a");
    link.download = `snapshot-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setSnapping(false);
  };

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
        <button
          onClick={takeSnapshot}
          disabled={snapping}
          title="Take snapshot"
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          {snapping ? "Capturing…" : "Snapshot"}
        </button>
      </div>
    </header>
  );
}
