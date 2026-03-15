"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LatLng = [number, number];

type SimShipment = {
  id: string;
  name: string;
  origin: LatLng;
  destination: LatLng;
  progress: number;
  speed: number;
  carrier: string;
  mode: string;
  status: string;
  estLeadDays: number;
  predLeadDays: number;
  distanceKm: number;
  weightKg: number;
  co2Kg: number;
};

type ShipmentRecord = {
  shipmentId: string;
  carrierName: string;
  modeOfTransport: string;
  originCity: string;
  originState: string;
  originCountry: string;
  destinationCity: string;
  destinationState: string;
  destinationCountry: string;
  onTimeStatus: string;
  route: string;
  transitTimeDays: number;
  estimatedDeliveryDate: string;
  date: string;
  distanceKm: number;
  totalWeightKg: number;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolate([lat1, lng1]: LatLng, [lat2, lng2]: LatLng, t: number): LatLng {
  return [lerp(lat1, lat2, t), lerp(lng1, lng2, t)];
}

const CITY_COORDS: Record<string, LatLng> = {
  "Chicago, IL": [41.8781, -87.6298],
  "Atlanta, GA": [33.749, -84.388],
  "Dallas, TX": [32.7767, -96.797],
  "Phoenix, AZ": [33.4484, -112.074],
  "Seattle, WA": [47.6062, -122.3321],
  "Denver, CO": [39.7392, -104.9903],
  "Los Angeles, CA": [34.0522, -118.2437],
  "Salt Lake City, UT": [40.7608, -111.891],
  "Miami, FL": [25.7617, -80.1918],
  "Charlotte, NC": [35.2271, -80.8431],
  "New York, NY": [40.7128, -74.006],
  "Boston, MA": [42.3601, -71.0589],
  "Houston, TX": [29.7604, -95.3698],
  "New Orleans, LA": [29.9511, -90.0715],
  "Minneapolis, MN": [44.9778, -93.265],
  "St. Louis, MO": [38.627, -90.1994],
  "San Diego, CA": [32.7157, -117.1611],
  "Las Vegas, NV": [36.1699, -115.1398],
  "Portland, OR": [45.5152, -122.6784],
  "San Francisco, CA": [37.7749, -122.4194],
  "Detroit, MI": [42.3314, -83.0458],
  "Nashville, TN": [36.1627, -86.7816],
  "Columbus, OH": [39.9612, -82.9988],
  "Philadelphia, PA": [39.9526, -75.1652],
  "Kansas City, MO": [39.0997, -94.5786]
};

function hashToUnit(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function resolveLocation(city: string, state: string, country: string) {
  const key = `${city}, ${state}`.trim();
  if (CITY_COORDS[key]) {
    return CITY_COORDS[key];
  }
  const fallbackKey = city.trim();
  if (CITY_COORDS[fallbackKey]) {
    return CITY_COORDS[fallbackKey];
  }
  const seed = `${city}-${state}-${country}`;
  const lat = 25 + hashToUnit(seed) * 24;
  const lng = -124 + hashToUnit(`${seed}-lng`) * 57;
  return [lat, lng] as LatLng;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function estimateLeadDays(record: ShipmentRecord) {
  if (record.transitTimeDays && record.transitTimeDays > 0) {
    return record.transitTimeDays;
  }
  if (record.estimatedDeliveryDate && record.date) {
    const start = new Date(record.date);
    const end = new Date(record.estimatedDeliveryDate);
    const delta = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    if (Number.isFinite(delta) && delta > 0) {
      return delta;
    }
  }
  return 3;
}

function predictLeadDays(seed: string, estimate: number) {
  const jitter = (hashToUnit(`${seed}-lead`) - 0.5) * 2;
  return clamp(estimate + jitter * Math.max(estimate * 0.25, 1), 1, 14);
}

function emissionFactor(mode: string) {
  const normalized = mode.toLowerCase();
  if (normalized.includes("air")) {
    return 0.6;
  }
  if (normalized.includes("rail")) {
    return 0.02;
  }
  if (
    normalized.includes("ocean") ||
    normalized.includes("sea") ||
    normalized.includes("ship")
  ) {
    return 0.01;
  }
  return 0.12;
}

function buildSimShipment(record: ShipmentRecord): SimShipment {
  const origin = resolveLocation(
    record.originCity,
    record.originState,
    record.originCountry
  );
  const destination = resolveLocation(
    record.destinationCity,
    record.destinationState,
    record.destinationCountry
  );
  const seed =
    record.shipmentId ||
    record.route ||
    `${record.originCity}-${record.destinationCity}`;
  const progress = hashToUnit(seed);
  const speed = 0.006 + hashToUnit(`${seed}-speed`) * 0.018;
  const name = `${record.originCity} -> ${record.destinationCity}`;
  const estLeadDays = estimateLeadDays(record);
  const predLeadDays = predictLeadDays(seed, estLeadDays);
  const distanceKm = record.distanceKm || 0;
  const weightKg = record.totalWeightKg || 0;
  const tonKm = (weightKg / 1000) * distanceKm;
  const co2Kg = tonKm * emissionFactor(record.modeOfTransport || "Road");
  return {
    id: record.shipmentId || seed,
    name,
    origin,
    destination,
    progress,
    speed,
    carrier: record.carrierName || "Unknown",
    mode: record.modeOfTransport || "Road",
    status: record.onTimeStatus || "On-Time",
    estLeadDays,
    predLeadDays,
    distanceKm,
    weightKg,
    co2Kg
  };
}

function modeIcon(mode: string) {
  const normalized = mode.toLowerCase();
  if (normalized.includes("air")) {
    return "✈️";
  }
  if (
    normalized.includes("sea") ||
    normalized.includes("ocean") ||
    normalized.includes("ship")
  ) {
    return "🚢";
  }
  if (normalized.includes("rail")) {
    return "🚆";
  }
  return "🚚";
}

export default function LiveMapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routesRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const [liveShipments, setLiveShipments] = useState<SimShipment[]>([]);
  const [dataStatus, setDataStatus] = useState("Loading live shipments...");
  const [filters, setFilters] = useState({
    carrier: "All",
    mode: "All",
    status: "All"
  });
  const [maxLoads, setMaxLoads] = useState(50);
  const [mailMessages, setMailMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Ask me to draft a shipment delay update (e.g., 'Draft customer update')."
    }
  ]);
  const [mailInput, setMailInput] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<SimShipment | null>(
    null
  );
  const [lastDraftEmail, setLastDraftEmail] = useState("");

  const fallbackShipments = useMemo<SimShipment[]>(
    () => [
      {
        id: "FRT-001",
        name: "Chicago -> Atlanta",
        origin: [41.8781, -87.6298],
        destination: [33.749, -84.388],
        progress: 0.12,
        speed: 0.014,
        carrier: "FastLine",
        mode: "Road",
        status: "On-Time",
        estLeadDays: 3,
        predLeadDays: 3.4,
        distanceKm: 1270,
        weightKg: 1200,
        co2Kg: 183.0
      },
      {
        id: "FRT-002",
        name: "Dallas -> Phoenix",
        origin: [32.7767, -96.797],
        destination: [33.4484, -112.074],
        progress: 0.28,
        speed: 0.012,
        carrier: "BlueStar",
        mode: "Road",
        status: "Delayed",
        estLeadDays: 4,
        predLeadDays: 4.6,
        distanceKm: 1400,
        weightKg: 900,
        co2Kg: 151.2
      },
      {
        id: "FRT-003",
        name: "Seattle -> Denver",
        origin: [47.6062, -122.3321],
        destination: [39.7392, -104.9903],
        progress: 0.42,
        speed: 0.01,
        carrier: "TransGo",
        mode: "Rail",
        status: "On-Time",
        estLeadDays: 5,
        predLeadDays: 5.3,
        distanceKm: 1600,
        weightKg: 650,
        co2Kg: 20.8
      },
      {
        id: "FRT-004",
        name: "Los Angeles -> Salt Lake City",
        origin: [34.0522, -118.2437],
        destination: [40.7608, -111.891],
        progress: 0.62,
        speed: 0.013,
        carrier: "SkyBridge",
        mode: "Air",
        status: "In-Transit",
        estLeadDays: 2,
        predLeadDays: 1.8,
        distanceKm: 1200,
        weightKg: 520,
        co2Kg: 374.4
      },
      {
        id: "FRT-005",
        name: "Miami -> Charlotte",
        origin: [25.7617, -80.1918],
        destination: [35.2271, -80.8431],
        progress: 0.33,
        speed: 0.016,
        carrier: "Coastal",
        mode: "Road",
        status: "On-Time",
        estLeadDays: 3,
        predLeadDays: 3.2,
        distanceKm: 1100,
        weightKg: 780,
        co2Kg: 102.9
      },
      {
        id: "FRT-006",
        name: "New York -> Boston",
        origin: [40.7128, -74.006],
        destination: [42.3601, -71.0589],
        progress: 0.51,
        speed: 0.02,
        carrier: "MetroLine",
        mode: "Road",
        status: "On-Time",
        estLeadDays: 1,
        predLeadDays: 1.1,
        distanceKm: 350,
        weightKg: 460,
        co2Kg: 19.3
      },
      {
        id: "FRT-007",
        name: "Houston -> New Orleans",
        origin: [29.7604, -95.3698],
        destination: [29.9511, -90.0715],
        progress: 0.18,
        speed: 0.019,
        carrier: "GulfHaul",
        mode: "Road",
        status: "Delayed",
        estLeadDays: 2,
        predLeadDays: 2.6,
        distanceKm: 580,
        weightKg: 620,
        co2Kg: 43.2
      },
      {
        id: "FRT-008",
        name: "Minneapolis -> St. Louis",
        origin: [44.9778, -93.265],
        destination: [38.627, -90.1994],
        progress: 0.4,
        speed: 0.015,
        carrier: "TransGo",
        mode: "Rail",
        status: "On-Time",
        estLeadDays: 4,
        predLeadDays: 3.7,
        distanceKm: 700,
        weightKg: 680,
        co2Kg: 9.5
      },
      {
        id: "FRT-009",
        name: "San Diego -> Las Vegas",
        origin: [32.7157, -117.1611],
        destination: [36.1699, -115.1398],
        progress: 0.67,
        speed: 0.022,
        carrier: "SunWest",
        mode: "Road",
        status: "In-Transit",
        estLeadDays: 2,
        predLeadDays: 2.1,
        distanceKm: 530,
        weightKg: 540,
        co2Kg: 34.3
      },
      {
        id: "FRT-010",
        name: "Portland -> San Francisco",
        origin: [45.5152, -122.6784],
        destination: [37.7749, -122.4194],
        progress: 0.24,
        speed: 0.014,
        carrier: "Coastal",
        mode: "Ocean",
        status: "On-Time",
        estLeadDays: 5,
        predLeadDays: 4.6,
        distanceKm: 1020,
        weightKg: 820,
        co2Kg: 8.4
      }
    ],
    []
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/shipments");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Supabase fetch failed.");
        }
        const records = (payload.records ?? []) as ShipmentRecord[];
        if (records.length === 0) {
          setDataStatus("No Supabase records. Showing simulated feed.");
          setLiveShipments(fallbackShipments);
          return;
        }
        const mapped = records.map(buildSimShipment);
        if (active) {
          setLiveShipments(mapped);
          setDataStatus("Live Supabase feed");
        }
      } catch (error) {
        if (active) {
          setDataStatus(
            error instanceof Error
              ? `${error.message} Showing simulated feed.`
              : "Supabase unavailable. Showing simulated feed."
          );
          setLiveShipments(fallbackShipments);
        }
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fallbackShipments]);

  const carriers = useMemo(
    () =>
      Array.from(new Set(liveShipments.map((item) => item.carrier))).sort(),
    [liveShipments]
  );
  const modes = useMemo(
    () => Array.from(new Set(liveShipments.map((item) => item.mode))).sort(),
    [liveShipments]
  );
  const statuses = useMemo(
    () => Array.from(new Set(liveShipments.map((item) => item.status))).sort(),
    [liveShipments]
  );

  const filteredShipments = useMemo(
    () =>
      liveShipments.filter((item) => {
        if (filters.carrier !== "All" && item.carrier !== filters.carrier) {
          return false;
        }
        if (filters.mode !== "All" && item.mode !== filters.mode) {
          return false;
        }
        if (filters.status !== "All" && item.status !== filters.status) {
          return false;
        }
        return true;
      }),
    [filters, liveShipments]
  );

  const displayedShipments = useMemo(
    () => filteredShipments.slice(0, maxLoads),
    [filteredShipments, maxLoads]
  );

  const totalCo2 = useMemo(
    () => displayedShipments.reduce((sum, item) => sum + item.co2Kg, 0),
    [displayedShipments]
  );

  const delayedShipments = useMemo(
    () =>
      displayedShipments.filter((item) =>
        item.status.toLowerCase().includes("delayed")
      ),
    [displayedShipments]
  );

  const buildDraftEmailForShipment = (target: SimShipment | null) => {
    if (!target) {
      return "No shipment selected. Click a map icon and then draft the mail.";
    }
    return [
      `Subject: Update on shipment ${target.id}`,
      "",
      "Hello,",
      "",
      `We wanted to provide an update on shipment ${target.id} (${target.name}).`,
      "",
      `${target.name}`,
      `Carrier: ${target.carrier}`,
      `Status: ${target.status}`,
      `Estimated lead: ${target.estLeadDays.toFixed(1)} days`,
      `Predicted lead: ${target.predLeadDays.toFixed(1)} days`,
      `CO2: ${target.co2Kg.toFixed(1)} kg`,
      "",
      "We are actively monitoring this load and will provide another update within 24 hours.",
      "Please let us know if you need expedited alternatives.",
      "",
      "Best regards,",
      "Logistics Team"
    ].join("\n");
  };

  const buildDraftEmail = () => {
    return buildDraftEmailForShipment(selectedShipment ?? delayedShipments[0]);
  };

  const handleDraft = () => {
    const prompt = mailInput.trim() || "Draft customer update";
    const reply = buildDraftEmail();
    setLastDraftEmail(reply);
    setMailMessages((messages) => [
      ...messages,
      { role: "user", content: prompt },
      { role: "assistant", content: reply }
    ]);
    setMailInput("");
  };

  const handleSendViaGmail = () => {
    if (!lastDraftEmail) {
      return;
    }
    const lines = lastDraftEmail.split("\n");
    let subject = "Shipment Update";
    let bodyStart = 0;
    if (lines[0]?.toLowerCase().startsWith("subject:")) {
      subject = lines[0].replace(/^subject:\s*/i, "").trim() || subject;
      bodyStart = 1;
    }
    const body = lines.slice(bodyStart).join("\n").trim();
    const gmailUrl =
      "https://mail.google.com/mail/?view=cm&fs=1" +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const ensureLeaflet = async () => {
      if (typeof window === "undefined") {
        return;
      }

      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      const windowWithLeaflet = window as Window & { L?: any };

      if (!windowWithLeaflet.L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = LEAFLET_JS;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.body.appendChild(script);
        });
      }

      leafletRef.current = windowWithLeaflet.L;
      setReady(true);
    };

    ensureLeaflet();
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    const L = leafletRef.current;
    const map = L.map(mapRef.current, { zoomControl: false }).setView(
      [39.5, -98.35],
      4
    );
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !mapInstanceRef.current) {
      return;
    }

    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    routesRef.current.forEach((route) => route.remove());
    markersRef.current = [];
    routesRef.current = [];

    if (displayedShipments.length === 0) {
      return;
    }

    displayedShipments.forEach((shipment) => {
      const route = L.polyline([shipment.origin, shipment.destination], {
        color: "#1f4ed8",
        weight: 2,
        opacity: 0.35,
        dashArray: "4 6"
      }).addTo(map);
      routesRef.current.push(route);

      const position = interpolate(
        shipment.origin,
        shipment.destination,
        shipment.progress
      );
      const icon = L.divIcon({
        className: "freight-icon",
        html: `<div class="freight-badge">${modeIcon(shipment.mode)}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = L.marker(position, { icon })
        .addTo(map)
        .bindTooltip(
          `Est ${shipment.estLeadDays.toFixed(1)}d | Pred ${shipment.predLeadDays.toFixed(1)}d | CO2 ${shipment.co2Kg.toFixed(1)}kg`,
          { direction: "top", offset: [0, -6] }
        )
        .bindPopup(
          `<strong>${shipment.id}</strong><br/>${shipment.name}<br/>` +
            `Carrier: ${shipment.carrier}<br/>` +
            `Status: ${shipment.status}<br/>` +
            `Estimated lead: ${shipment.estLeadDays.toFixed(1)} days<br/>` +
            `Predicted lead: ${shipment.predLeadDays.toFixed(1)} days<br/>` +
            `CO2: ${shipment.co2Kg.toFixed(1)} kg`
        );
      marker.on("click", () => {
        setSelectedShipment(shipment);
        setMailInput(`Draft customer update for shipment ${shipment.id}`);
      });
      markersRef.current.push(marker);
    });

    const interval = setInterval(() => {
      displayedShipments.forEach((shipment, index) => {
        shipment.progress = (shipment.progress + shipment.speed) % 1;
        const next = interpolate(
          shipment.origin,
          shipment.destination,
          shipment.progress
        );
        markersRef.current[index]?.setLatLng(next);
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [ready, displayedShipments]);

  return (
    <div className="container map-shell">
      <div className="page-head">
        <div>
          <h1 className="page-title">Live Freight Map</h1>
          <p className="page-subtitle">
            Simulated real-time freight visibility across major US lanes.
          </p>
        </div>
        <div className="page-actions">
          <span className="nav-pill">{dataStatus}</span>
        </div>
      </div>

      <div className="card filters-inline" style={{ marginBottom: 20 }}>
        <div className="kpi-label">Map Filters</div>
        <div className="filters" style={{ marginTop: 12 }}>
          <div>
            <label>Carrier</label>
            <select
              value={filters.carrier}
              onChange={(event) =>
                setFilters({ ...filters, carrier: event.target.value })
              }
            >
              <option value="All">All</option>
              {carriers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Mode</label>
            <select
              value={filters.mode}
              onChange={(event) =>
                setFilters({ ...filters, mode: event.target.value })
              }
            >
              <option value="All">All</option>
              {modes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters({ ...filters, status: event.target.value })
              }
            >
              <option value="All">All</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Max Loads on Map</label>
            <select
              value={String(maxLoads)}
              onChange={(event) => setMaxLoads(Number(event.target.value))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="kpi-label">Active Loads</div>
          <div className="kpi-value">
            {displayedShipments.length} / {filteredShipments.length}
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Avg Speed (sim)</div>
          <div className="kpi-value">
            {displayedShipments.length === 0
              ? "0 mph"
              : Math.round(
                  (displayedShipments.reduce((sum, item) => sum + item.speed, 0) /
                    displayedShipments.length) *
                    120
                )}{" "}
            mph
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Total CO2</div>
          <div className="kpi-value">{totalCo2.toFixed(1)} kg</div>
        </div>
        <div className="card">
          <div className="kpi-label">Late Risk</div>
          <div className="kpi-value">
            {displayedShipments.length === 0
              ? "0 loads"
              : Math.max(1, Math.round(displayedShipments.length * 0.2))}{" "}
            loads
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="kpi-label">Customer Mail Assistant (Demo)</div>
        {selectedShipment ? (
          <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Selected shipment: {selectedShipment.id} ({selectedShipment.name})
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Click any map icon to target a specific shipment.
          </div>
        )}
        <div className="chat-body" style={{ marginTop: 12, maxHeight: 240 }}>
          {mailMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`chat-bubble ${message.role}`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <div className="chat-input" style={{ marginTop: 10 }}>
          <input
            value={mailInput}
            placeholder="Draft customer update for delayed shipment..."
            onChange={(event) => setMailInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleDraft();
              }
            }}
          />
          <button onClick={handleDraft}>Draft</button>
          <button
            className="ghost"
            onClick={handleSendViaGmail}
            disabled={!lastDraftEmail}
          >
            Send
          </button>
        </div>
      </div>

      <div className="card map-card">
        <div ref={mapRef} className="map-canvas" />
      </div>
    </div>
  );
}
