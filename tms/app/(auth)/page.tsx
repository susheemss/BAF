"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../stores";

export default function LoginPage() {
  const { auth, authReady, setAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      return;
    }
    setAuth({ isLoggedIn: true });
    router.push("/dashboard");
  };

  useEffect(() => {
    if (authReady && auth.isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [auth.isLoggedIn, authReady, router]);

  return (
    <div className="login-shell">
      <div className="login-hero">
        <div className="login-chip">Executive Demo</div>
        <h1>
          Enterprise GenAI TMS for resilient, efficient supply chains with action-ready insights.
        </h1>
        <p>
          Align OTIF, delay management, and transport cost insights in one
          executive-ready workspace. Built for rapid demos.
        </p>
        <div className="login-metrics">
          <div>
            <div className="metric-value">92.4%</div>
            <div className="metric-label">OTIF benchmark</div>
          </div>
          <div>
            <div className="metric-value">-14%</div>
            <div className="metric-label">Late lanes impact</div>
          </div>
          <div>
            <div className="metric-value">$1.9M</div>
            <div className="metric-label">Cost exposure</div>
          </div>
        </div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="nav-mark" />
          <div>
            <h2>Welcome back</h2>
            <p>Sign in to launch the executive dashboard.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="demo@logistics.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit">Launch Workspace</button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setEmail("demo@logistics.com");
              setPassword("demo1234");
            }}
          >
            Use demo credentials
          </button>
        </form>
      </div>
    </div>
  );
}
