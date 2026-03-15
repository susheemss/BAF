"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import LiveApiCard from "@/components/LiveApiCard";

export default function SuppliersPage() {
  return (
    <ProtectedLayout title="Supplier Stability">
      <section className="grid gap-4 xl:grid-cols-2">
        <LiveApiCard
          title="Supplier Cluster Stability"
          endpoint="/api/ai/supplier-stability"
          description="KMeans cluster volatility and supplier risk output"
        />
        <LiveApiCard
          title="Data Coverage"
          endpoint="/api/data/status"
          description="Uploaded/missing datasets used for supplier insights"
        />
      </section>
    </ProtectedLayout>
  );
}
