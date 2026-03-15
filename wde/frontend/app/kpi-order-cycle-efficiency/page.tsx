import KpiWorkspaceView from "@/components/KpiWorkspaceView";
import StagePipeline from "@/components/StagePipeline";

export default function Page() {
  return (
    <KpiWorkspaceView title="Order Cycle Efficiency" tab="12-16">
      <section className="control-card p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Shipment Stages</p>
        <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">Stage Cycle Breakdown</h3>
        <div className="mt-4">
          <StagePipeline
            stages={[
              { name: "Allocated",  duration: "0.9h", status: "normal"   },
              { name: "Picked",     duration: "1.6h", status: "watch"    },
              { name: "Staged",     duration: "1.8h", status: "watch"    },
              { name: "Loaded",     duration: "2.9h", status: "high"     },
              { name: "Dispatched", duration: "4.1h", status: "critical" }
            ]}
          />
        </div>
      </section>
    </KpiWorkspaceView>
  );
}

