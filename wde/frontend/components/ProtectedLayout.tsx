"use client";

import { Suspense, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import FilterBar, { FilterConfig } from "@/components/FilterBar";
import VapiWidget from "@/components/VapiWidget";

const defaultFilters: FilterConfig[] = [
  { id: "timeframe", label: "Timeframe", options: ["Today", "Last 7 Days", "Last 30 Days"], defaultValue: "Today" },
  { id: "shift", label: "Shift", options: ["All Shifts", "Shift A", "Shift B", "Shift C"], defaultValue: "All Shifts" },
  { id: "zone", label: "Zone", options: ["All Zones", "Inbound", "Yard", "Dispatch"], defaultValue: "All Zones" },
  { id: "supplier", label: "Supplier", options: ["All Suppliers", "SUP-113", "SUP-204", "SUP-302"], defaultValue: "All Suppliers" },
  { id: "risk", label: "Risk Band", options: ["All", "Normal", "Watch", "High", "Critical"], defaultValue: "All" },
  { id: "lane", label: "Lane", options: ["All Lanes", "North", "South", "Ecom", "Retail"], defaultValue: "All Lanes" }
];

export default function ProtectedLayout({
  children,
  title,
  filters = defaultFilters,
  viewLabel
}: {
  children: React.ReactNode;
  title: string;
  filters?: FilterConfig[];
  viewLabel?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("wde_dark_mode");
    const enabled = saved === "1";
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("wde_dark_mode", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-brand-bg dark:bg-slate-950">
      <Sidebar collapsed={collapsed} />
      <div className="min-w-0 flex-1">
        <Header
          title={title}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />
        <Suspense fallback={<div className="border-b border-slate-200 bg-white/90 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/90" />}>
          <FilterBar filters={filters} viewLabel={viewLabel} />
        </Suspense>
        <main className="p-6">{children}</main>
      </div>
      <VapiWidget />
    </div>
  );
}
