"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const METRICS = [
  { value: "98.4%", label: "On-Time Delivery" },
  { value: "3.2x", label: "Forecast Accuracy" },
  { value: "$2.1M", label: "Cost Savings" },
  { value: "12ms", label: "AI Response Time" },
];

const FEATURES = [
  {
    icon: "🏭",
    title: "Warehouse Intelligence",
    desc: "Real-time KPI diagnostics across inbound, yard, and dispatch operations.",
  },
  {
    icon: "📊",
    title: "Demand & Supply Planning",
    desc: "AI-driven demand forecasting with stockout risk detection and PO tracking.",
  },
  {
    icon: "🚚",
    title: "Transportation Control",
    desc: "Carrier performance, cost analytics, and live shipment map.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemo() {
    setUsername("demo");
    setPassword("demo123");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (username.trim() === "demo" && password === "demo123") {
        document.cookie = "app_session=demo; path=/; max-age=86400; SameSite=Lax";
        router.replace("/dashboard");
      } else {
        setError("Invalid credentials.");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen flex bg-[#0B1F3B]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] px-16 py-14 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-teal-500/15 blur-[100px]" />
        </div>

        {/* Grid lines overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
            SC
          </div>
          <span className="text-white font-semibold tracking-wide text-sm">Supply Chain AI</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-xs font-medium tracking-wide">AI-Powered · Real-Time · Unified</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5">
            Your entire supply chain,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">
              in one workspace.
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-lg mb-10">
            Unify warehouse operations, demand planning, and transportation into a single AI-driven control tower.
          </p>

          {/* Metric chips */}
          <div className="grid grid-cols-4 gap-3 mb-12">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{m.value}</div>
                <div className="text-xs text-slate-400 mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{f.title}</div>
                  <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© 2025 Supply Chain AI · Enterprise Demo</p>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-14 bg-slate-950/60 backdrop-blur-xl relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px]" />
        </div>

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs">
              SC
            </div>
            <span className="text-white font-semibold text-sm">Supply Chain AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your workspace</p>
          </div>

          {/* Demo fill button */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full mb-5 flex items-center justify-center gap-2 border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <span className="text-base">⚡</span>
            Fill Demo Credentials
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">or enter manually</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="demo"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <span className="text-red-400 text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/25 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <p className="text-slate-600 text-xs text-center mt-6">
            Enterprise Supply Chain Intelligence Platform · Demo Mode
          </p>
        </div>
      </div>
    </div>
  );
}
