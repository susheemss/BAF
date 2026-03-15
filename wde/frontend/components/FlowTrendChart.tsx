"use client";

import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", inbound: 93, outbound: 88 },
  { day: "Tue", inbound: 95, outbound: 90 },
  { day: "Wed", inbound: 90, outbound: 86 },
  { day: "Thu", inbound: 98, outbound: 92 },
  { day: "Fri", inbound: 96, outbound: 91 },
  { day: "Sat", inbound: 89, outbound: 84 },
  { day: "Sun", inbound: 92, outbound: 87 }
];

export default function FlowTrendChart() {
  return (
    <div className="control-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Flow Reliability Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />
            <XAxis dataKey="day" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line type="monotone" dataKey="inbound" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="outbound" stroke="#0ea5e9" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
