"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PackageOpen, Truck, ArrowRight, Zap } from "lucide-react";

const products = [
  {
    id: "wms",
    icon: PackageOpen,
    label: "WMS",
    name: "Warehouse Diagnosis Engine",
    description:
      "Real-time warehouse KPI monitoring, AI-powered disruption risk scoring, inbound/outbound analytics, and operational control tower.",
    tags: ["KPI Engine", "AI Risk Score", "Inbound · Outbound", "Yard & Dock"],
    href: "/dashboard",
    external: false,
    accent: "from-blue-600 to-indigo-700",
    ring: "ring-blue-500/30",
    glow: "rgba(99,102,241,0.15)",
  },
  {
    id: "tms",
    icon: Truck,
    label: "TMS",
    name: "Supply Master",
    description:
      "End-to-end transportation KPI analytics, carrier performance tracking, live shipment map, and AI voice executive briefings.",
    tags: ["On-Time Delivery", "Carrier Analytics", "Live Map", "AI Voice"],
    href: "http://localhost:3001",
    external: true,
    accent: "from-emerald-600 to-teal-700",
    ring: "ring-emerald-500/30",
    glow: "rgba(16,185,129,0.15)",
  },
];

export default function HubPage() {
  const router = useRouter();

  const handleClick = (product: (typeof products)[0]) => {
    if (product.external) {
      window.open(product.href, "_blank");
    } else {
      router.push(product.href);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Supply Intelligence Platform
          </span>
        </div>
        <span className="text-xs text-slate-500 tracking-widest uppercase">
          Select Product
        </span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-500">
            Command Layer
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Choose your workspace
          </h1>
          <p className="mt-4 text-base text-slate-400 max-w-md mx-auto">
            Unified supply chain intelligence — warehouse operations and
            transportation in one platform.
          </p>
        </motion.div>

        {/* Product cards */}
        <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {products.map((product, i) => {
            const Icon = product.icon;
            return (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClick(product)}
                className={`group relative flex flex-col items-start rounded-2xl border border-white/8 bg-slate-900/70 p-8 text-left backdrop-blur ring-1 ${product.ring} transition-all duration-200 hover:border-white/15`}
                style={{
                  boxShadow: `0 0 60px 0 ${product.glow}`,
                }}
              >
                {/* Icon badge */}
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${product.accent} shadow-lg`}
                >
                  <Icon size={22} className="text-white" />
                </div>

                {/* Labels */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {product.label}
                  </span>
                  {product.external && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      Port 3001
                    </span>
                  )}
                </div>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  {product.name}
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-slate-400">
                  {product.description}
                </p>

                {/* Tags */}
                <div className="mb-8 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div
                  className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${product.accent} px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all group-hover:shadow-lg`}
                >
                  Open {product.label}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600">
        Supply Intelligence Platform &mdash; WMS · TMS
      </footer>
    </div>
  );
}
