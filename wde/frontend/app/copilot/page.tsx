"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import LiveApiCard from "@/components/LiveApiCard";

export default function CopilotPage() {
  return (
    <ProtectedLayout title="Copilot Console">
      <section className="grid gap-4">
        <div className="control-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Copilot Access</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Use the global Copilot launcher at the bottom-right corner. It is shared across all screens.
          </p>
        </div>
        <LiveApiCard
          title="Supported Data Context"
          endpoint="/api/data/status"
          description="Shows currently loaded datasets used by Copilot mapping"
        />
      </section>
    </ProtectedLayout>
  );
}
