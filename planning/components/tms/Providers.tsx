"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AuthState,
  FilterState,
  AuthContext,
  FiltersContext,
  ShipmentsContext,
  ShipmentRecord
} from "@/lib/tms/stores";
import {
  loadAuthState,
  loadStoredFilters,
  loadStoredShipments,
  persistAuthState,
  persistFilters,
  persistShipments
} from "@/lib/tms/storage";
import { parseFile } from "@/lib/tms/parse";

const defaultFilters: FilterState = {
  startDate: "",
  endDate: "",
  carrier: "All",
  mode: "All",
  productType: "All",
  originRegion: "All",
  originCountry: "All",
  originState: "All",
  originCity: "All",
  destinationRegion: "All",
  destinationCountry: "All",
  destinationState: "All",
  destinationCity: "All",
  route: "All",
  status: "All",
  orderType: "All"
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>(() =>
    loadStoredFilters(defaultFilters)
  );
  const [auth, setAuth] = useState<AuthState>(() => loadAuthState());
  const [authReady, setAuthReady] = useState(false);
  const [liveSupabase, setLiveSupabase] = useState(false);

  useEffect(() => {
    const stored = loadStoredShipments();
    if (stored.length > 0) {
      setShipments(stored);
    } else {
      // Auto-load demo CSV so KPIs and drill-downs work without manual upload
      fetch("/TMS.csv")
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], "TMS.csv", { type: "text/csv" });
          return parseFile(file);
        })
        .then((records) => {
          setShipments(records);
        })
        .catch(() => {
          // silently ignore — user can still upload manually
        });
    }
    setAuth(loadAuthState());
    setFilters(loadStoredFilters(defaultFilters));
    if (typeof window !== "undefined") {
      setLiveSupabase(
        window.localStorage.getItem("tmss_live_supabase") === "true"
      );
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchShipments = async () => {
      try {
        const response = await fetch("/api/shipments");
        const payload = await response.json();
        if (response.ok && Array.isArray(payload.records)) {
          setShipments(payload.records);
        }
      } catch {
        return;
      }
    };
    if (liveSupabase) {
      fetchShipments();
      interval = setInterval(fetchShipments, 30000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [liveSupabase]);

  useEffect(() => {
    persistShipments(shipments);
  }, [shipments]);

  useEffect(() => {
    persistFilters(filters);
  }, [filters]);

  useEffect(() => {
    persistAuthState(auth.isLoggedIn);
  }, [auth]);

  const shipmentsValue = useMemo(
    () => ({ shipments, setShipments }),
    [shipments]
  );

  const filtersValue = useMemo(
    () => ({ filters, setFilters }),
    [filters]
  );

  const authValue = useMemo(
    () => ({ auth, authReady, setAuth }),
    [auth, authReady]
  );

  return (
    <ShipmentsContext.Provider value={shipmentsValue}>
      <FiltersContext.Provider value={filtersValue}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </FiltersContext.Provider>
    </ShipmentsContext.Provider>
  );
}
