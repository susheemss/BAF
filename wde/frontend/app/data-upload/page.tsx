"use client";

import ProtectedLayout from "@/components/ProtectedLayout";
import DataUploadPanel from "@/components/DataUploadPanel";

export default function DataUploadPage() {
  return (
    <ProtectedLayout title="Data Upload">
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Upload and Refresh Source Data</h2>
        <p className="mt-1 text-xs text-slate-600">
          Use this page to upload or replace source Excel/CSV files for KPI and module calculations.
        </p>
      </section>

      <DataUploadPanel />
    </ProtectedLayout>
  );
}
