"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../stores";
import ChatWidget from "../components/ChatWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth, authReady, setAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !auth.isLoggedIn) {
      router.replace("/");
    }
  }, [auth.isLoggedIn, authReady, router]);

  if (!authReady) {
    return null;
  }

  if (!auth.isLoggedIn) {
    return null;
  }

  return (
    <div>
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-mark" />
          <div>
            <div className="nav-title">Supply Chain Workspace</div>
            <div className="nav-subtitle">Supply Chain KPI Workspace</div>
          </div>
        </div>
        <div className="nav-links">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/kpis/cost">KPIs</Link>
          <Link href="/alerts">Alerts</Link>
          <Link href="/live-map">Live Map</Link>
          <Link href="/upload">Upload</Link>
        </div>
        <div className="nav-actions">
          <span className="nav-pill">Demo User</span>
          <button
            className="ghost"
            onClick={() => {
              setAuth({ isLoggedIn: false });
              router.replace("/");
            }}
          >
            Log out
          </button>
        </div>
      </nav>
      <ChatWidget />
      {children}
    </div>
  );
}
