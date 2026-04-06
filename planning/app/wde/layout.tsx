"use client";

import AppShell from "@/components/AppShell";

export default function WdeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
