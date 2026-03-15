"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";

const DEMO_EMAIL = "demo@wde.local";
const DEMO_PASSWORD = "demo123";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      document.cookie = "wde_session=demo-session; path=/; max-age=28800; samesite=lax";
      router.replace("/dashboard");
      return;
    }

    if (!hasSupabaseConfig || !supabase) {
      setError(
        "Supabase is not configured. Use demo credentials or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local."
      );
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    const token = data.session?.access_token;
    if (token) {
      document.cookie = `wde_session=${token}; path=/; max-age=28800; samesite=lax`;
      router.replace("/dashboard");
      return;
    }

    setError("Login succeeded but no session token was returned.");
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-8 shadow-xl shadow-slate-200/80">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">Warehouse Diagnosis Engine</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Control Tower Login</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in with Supabase Auth or use demo credentials below.</p>

        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          Demo Email: <span className="font-semibold">demo@wde.local</span>
          <br />
          Demo Password: <span className="font-semibold">demo123</span>
        </div>

        <button
          type="button"
          onClick={fillDemoCredentials}
          className="mt-3 w-full rounded-lg border border-emerald-300 bg-emerald-100 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-200"
        >
          Use Demo Credentials
        </button>

        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            required
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
