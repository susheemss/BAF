"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  Database,
  DollarSign,
  Gauge,
  LayoutDashboard,
  Map,
  Radio,
  TrendingUp,
  Truck,
  Warehouse,
  PackageSearch,
  ChartNoAxesCombined,
  ClipboardCheck,
  TimerReset,
  LayoutGrid,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",     label: "Overview",         icon: LayoutDashboard },
  { href: "/control-tower", label: "Control Tower",    icon: Radio },
  { href: "/demand",        label: "Demand Planning",  icon: TrendingUp },
  { href: "/supply",        label: "Supply Planning",  icon: PackageSearch },
  { href: "/data",          label: "Data Hub",         icon: Database },
];

const TMS_NAV = [
  { href: "/tms/dashboard",        label: "Dashboard",   icon: LayoutDashboard },
  { href: "/tms/kpis/cost",        label: "Cost KPIs",   icon: DollarSign },
  { href: "/tms/kpis/operations",  label: "Ops KPIs",    icon: BarChart2 },
  { href: "/tms/kpis/carriers",    label: "Carrier KPIs",icon: Gauge },
  { href: "/tms/alerts",           label: "Alerts",      icon: AlertTriangle },
  { href: "/tms/live-map",         label: "Live Map",    icon: Map },
];

const WDE_NAV = [
  { href: "/wde/dashboard",                  label: "Dashboard",        icon: ChartNoAxesCombined },
  { href: "/wde/kpi-inbound-velocity",       label: "Inbound Velocity", icon: Gauge },
  { href: "/wde/kpi-receiving-quality",      label: "Receiving Quality",icon: ClipboardCheck },
  { href: "/wde/kpi-yard-dwell-throughput",  label: "Yard Dwell",       icon: Truck },
  { href: "/wde/kpi-fulfillment-accuracy",   label: "Fulfillment",      icon: ClipboardCheck },
  { href: "/wde/kpi-order-cycle-efficiency", label: "Order Cycle",      icon: TimerReset },
  { href: "/wde/kpi-dispatch-backlog",       label: "Dispatch Backlog", icon: TimerReset },
];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const inTms = pathname.startsWith("/tms");
  const inWde = pathname.startsWith("/wde");

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-brand-primary flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">Supply Chain</p>
        <h1 className="mt-0.5 text-lg font-bold text-white leading-tight">Planning Hub</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Planning nav — always visible */}
        <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-slate-400">Planning</p>
        {NAV.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon}
            active={pathname === href || (href !== "/" && pathname.startsWith(href + "/"))} />
        ))}

        <div className="my-3 border-t border-white/10" />

        {/* WMS section */}
        <Link
          href="/wde/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            inWde ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Warehouse size={15} className="shrink-0" />
          WMS
        </Link>
        {inWde && (
          <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
            {WDE_NAV.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon}
                active={pathname === href || pathname.startsWith(href + "/")} />
            ))}
          </div>
        )}

        {/* TMS section */}
        <Link
          href="/tms/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            inTms ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Truck size={15} className="shrink-0" />
          TMS
        </Link>
        {inTms && (
          <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
            {TMS_NAV.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon}
                active={pathname === href || pathname.startsWith(href + "/")} />
            ))}
          </div>
        )}

      </nav>

      {/* Knowledge Base */}
      <div className="px-3 pb-3 border-t border-white/10 pt-3">
        <a
          href="https://notebooklm.google.com/notebook/1a241a0a-d32e-49ef-80b7-3f994fcb66a4"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <BookOpen size={15} className="shrink-0 text-teal-400" />
          <span>Knowledge Base</span>
          <span className="ml-auto text-[10px] text-slate-500">↗</span>
        </a>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-[10px] text-slate-500">v1.0 · Demo Mode</p>
      </div>
    </aside>
  );
}
