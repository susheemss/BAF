"use client";

import { useEffect, useState } from "react";
import { parseFile } from "../../lib/parse";
import { useShipments } from "../../stores";

export default function UploadPage() {
  const { setShipments } = useShipments();
  const [status, setStatus] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLive(window.localStorage.getItem("tmss_live_supabase") === "true");
    }
  }, []);

  const handleFile = async (file: File | null) => {
    if (!file) {
      return;
    }
    setStatus("Parsing file...");
    try {
      const records = await parseFile(file);
      setShipments(records);
      setStatus(`Loaded ${records.length} shipments.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const handleSupabaseSync = async () => {
    setSyncing(true);
    setStatus("Syncing to Supabase...");
    try {
      const raw = window.localStorage.getItem("tmss_shipments") ?? "[]";
      const records = JSON.parse(raw);
      const response = await fetch("/api/shipments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Supabase sync failed.");
      }
      setStatus(`Supabase sync complete (${payload.count}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Supabase sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const toggleLive = () => {
    const next = !live;
    setLive(next);
    window.localStorage.setItem("tmss_live_supabase", next ? "true" : "false");
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Upload Data</h1>
          <p className="page-subtitle">
            Import CSV or XLSX shipment data to power the control tower.
          </p>
        </div>
        <div className="page-actions">
          <button className="ghost">Download Template</button>
          <button onClick={handleSupabaseSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync to Supabase"}
          </button>
          <button onClick={toggleLive} className="secondary">
            {live ? "Live Sync On" : "Live Sync Off"}
          </button>
          <button onClick={() => setShipments([])}>Clear Data</button>
        </div>
      </div>

      <div className="card upload-drop">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <p className="muted" style={{ marginTop: 12 }}>
          Required columns: Shipment ID, Load ID, Date, Month, Year, Carrier
          Name, Mode of Transport, Product Type, Origin Country, Origin Region,
          Origin State, Origin City, Origin Zipcode, Origin Area, Destination
          Country, Destination Region, Destination State, Destination City,
          Destination Zipcode, Destination Area, Distance_km,
          Total_Weight_in_Shipment_kg, Transit Time (Days), Operational Status,
          Shipment Cost (USD), Shipment Planned, Equipment, Equipment Weight
          Capacity (KG), Equipment_VolumeCapacity_m3, Total Volume in
          Shipment_m3, Tendered Status, Estimated Delivery Date,
          Actual_Delivery_Date, Delays, On-Time / Delayed / In-Transit, Shipment
          Order Type
        </p>
      </div>

      {status ? (
        <div className="card" style={{ marginTop: 16 }}>
          {status}
        </div>
      ) : null}
    </div>
  );
}
