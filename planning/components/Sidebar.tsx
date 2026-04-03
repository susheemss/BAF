"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  TrendingUp,
  Truck,
  Warehouse,
  PackageSearch,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",      label: "Overview",            icon: LayoutDashboard },
  { href: "/control-tower",  label: "Control Tower",       icon: Radio },
  { href: "/demand",         label: "Demand Planning",     icon: TrendingUp },
  { href: "/supply",         label: "Supply Planning",     icon: PackageSearch },
];

const EXTERNAL = [
  { href: "https://baf-eight.vercel.app/dashboard", label: "WMS",  icon: Warehouse },
  { href: "https://tms-voice-one.vercel.app",        label: "TMS",  icon: Truck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-brand-primary flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">Supply Chain</p>
        <h1 className="mt-0.5 text-lg font-bold text-white leading-tight">Planning Hub</h1>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-400">Planning</p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <div className="my-4 border-t border-white/10" />
        <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-400">Jump to</p>
        {EXTERNAL.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon size={16} />
            {label}
            <span className="ml-auto text-[10px] text-slate-500">↗</span>
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-slate-500">v1.0 · Demo Mode</p>
      </div>
    </aside>
  );
}
