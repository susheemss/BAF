"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, PackageOpen, Gauge, ClipboardCheck, TimerReset, Truck, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/wde/dashboard", label: "Executive Dashboard", icon: ChartNoAxesCombined },
  { href: "/wde/kpi-inbound-velocity", label: "Inbound Velocity", icon: Gauge },
  { href: "/wde/kpi-receiving-quality", label: "Receiving Quality", icon: ClipboardCheck },
  { href: "/wde/kpi-yard-dwell-throughput", label: "Yard Dwell & Throughput", icon: Truck },
  { href: "/wde/kpi-fulfillment-accuracy", label: "Fulfillment Accuracy", icon: ClipboardCheck },
  { href: "/wde/kpi-order-cycle-efficiency", label: "Order Cycle Efficiency", icon: TimerReset },
  { href: "/wde/kpi-dispatch-backlog", label: "Dispatch Backlog", icon: TimerReset }
];

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 276 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 h-screen border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-950"
    >
      <Link
        href="/"
        className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        title={collapsed ? "Back to Hub" : undefined}
      >
        <LayoutGrid size={15} className="shrink-0" />
        {!collapsed && <span className="text-xs font-medium">All Products</span>}
      </Link>

      <div className="mb-6 flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-white">
        <PackageOpen size={16} />
        {!collapsed && <span className="text-sm font-semibold">WDE Enterprise</span>}
      </div>

      <p className="mb-2 px-2 text-[11px] uppercase tracking-wide text-slate-400">Workspaces</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>


    </motion.aside>
  );
}
