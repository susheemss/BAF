"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import LiveApiCard from "@/components/LiveApiCard";

export default function OutboundPage() {
  return (
    <ProtectedLayout title="Outbound Flow">
      <section className="grid gap-4 xl:grid-cols-2">
        <LiveApiCard
          title="Order Risk"
          endpoint="/api/ai/order-risk"
          description="High-risk orders and outbound risk classification"
        />
        <LiveApiCard
          title="Bottleneck Analysis"
          endpoint="/api/ai/bottleneck-analysis"
          description="Dispatch flow trend and critical stage insights"
        />
      </section>
      <section className="mt-4">
        <LiveApiCard
          title="Outbound KPIs"
          endpoint="/api/kpis/all"
          description="Fill rate, on-time dispatch, and order pendency"
        />
      </section>
    </ProtectedLayout>
  );
}
