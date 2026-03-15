"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import LiveApiCard from "@/components/LiveApiCard";

export default function SystemHealthPage() {
  return (
    <ProtectedLayout title="System Health">
      <section className="grid gap-4 xl:grid-cols-2">
        <LiveApiCard
          title="Error Correlation"
          endpoint="/api/ai/error-correlation"
          description="Pearson correlation between integration and event errors"
        />
        <LiveApiCard
          title="Error KPI Snapshot"
          endpoint="/api/kpis/all"
          description="Integration and event error counts from loaded datasets"
        />
      </section>
      <section className="mt-4">
        <LiveApiCard
          title="Upload Status"
          endpoint="/api/data/status"
          description="Backend dataset readiness for system monitoring"
        />
      </section>
    </ProtectedLayout>
  );
}
