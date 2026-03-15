"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Moon, Radar, Sun, TimerReset } from "lucide-react";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Executive Dashboard",
  "/data-upload": "Data Upload",
  "/kpi-inbound-velocity": "Inbound Velocity",
  "/kpi-receiving-quality": "Receiving Quality",
  "/kpi-yard-dwell-throughput": "Yard Dwell & Throughput",
  "/kpi-fulfillment-accuracy": "Fulfillment Accuracy",
  "/kpi-order-cycle-efficiency": "Order Cycle Efficiency",
  "/kpi-dispatch-backlog": "Dispatch Backlog",
  "/inbound": "Inbound",
  "/suppliers": "Suppliers",
  "/yard": "Yard",
  "/outbound": "Outbound",
  "/drift": "Drift Monitor",
  "/system-health": "System Health",
  "/copilot": "Copilot",
};

export default function Header({
  title,
  sidebarCollapsed,
  onToggleSidebar,
  darkMode,
  onToggleDark
}: {
  title: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const breadcrumb = ROUTE_LABELS[pathname] ?? title;

  const handleLogout = async () => {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut();
    }
    document.cookie = "wde_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Menu size={16} />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              WDE &rsaquo; {breadcrumb}
            </p>
            <h1 className="text-lg font-semibold text-brand-primary dark:text-slate-100">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <motion.span whileHover={{ y: -1 }} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Radar size={12} /> Sync Healthy
          </motion.span>
          <motion.span whileHover={{ y: -1 }} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <TimerReset size={12} /> Snapshot 2m
          </motion.span>
          {clock && (
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-500 tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 sm:inline-flex">
              {clock}
            </span>
          )}
          <motion.button whileHover={{ y: -1 }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Bell size={12} /> Alerts
          </motion.button>
          <button onClick={onToggleDark} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <LogOut size={13} className="mr-1 inline-block" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
