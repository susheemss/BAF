"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import LiveApiCard from "@/components/LiveApiCard";

export default function YardPage() {
  return (
    <ProtectedLayout title="Yard Orchestration">
      <section className="grid gap-4 xl:grid-cols-2">
        <LiveApiCard
          title="Yard Intelligence"
          endpoint="/api/ai/yard-intelligence"
          description="Congestion clusters and yard risk bands"
        />
        <LiveApiCard
          title="KPI Snapshot"
          endpoint="/api/kpis/all"
          description="Yard wait and related operational KPI values"
        />
      </section>
    </ProtectedLayout>
  );
}
