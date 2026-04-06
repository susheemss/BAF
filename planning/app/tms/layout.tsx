"use client";

import "../tms-globals.css";
import AppShell from "@/components/AppShell";
import Providers from "@/components/tms/Providers";

export default function TmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>
        <div className="tms-root">
          {children}
        </div>
      </AppShell>
    </Providers>
  );
}
