"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import DriftAlert from "@/components/DriftAlert";
import LiveApiCard from "@/components/LiveApiCard";

export default function DriftPage() {
  return (
    <ProtectedLayout title="Drift Watch">
      <section className="grid gap-4 xl:grid-cols-2">
        <LiveApiCard
          title="Drift Monitor"
          endpoint="/api/ai/drift-monitor"
          description="Live drift detection output from AI engine"
        />
        <LiveApiCard
          title="Data Coverage"
          endpoint="/api/data/status"
          description="Shows whether drift-relevant datasets are loaded"
        />
      </section>

      <section className="mt-4 space-y-3">
        <DriftAlert title="Inbound Volume Drift" detail="7-day baseline deviated by 1.8 sigma." risk="watch" />
        <DriftAlert title="Supplier Behavior Drift" detail="SUP-113 and SUP-204 changed cluster." risk="high" />
        <DriftAlert title="Dispatch Delay Drift" detail="Loading-to-dispatch exceeded threshold for 5 lanes." risk="critical" />
      </section>
    </ProtectedLayout>
  );
}
