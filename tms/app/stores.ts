"use client";

import { createContext, useContext } from "react";

export type ShipmentRecord = {
  shipmentId: string;
  loadId: string;
  date: string;
  month: string;
  year: string;
  carrierName: string;
  modeOfTransport: string;
  productType: string;
  originCountry: string;
  originRegion: string;
  originState: string;
  originCity: string;
  originZipcode: string;
  originArea: string;
  destinationCountry: string;
  destinationRegion: string;
  destinationState: string;
  destinationCity: string;
  destinationZipcode: string;
  destinationArea: string;
  distanceKm: number;
  totalWeightKg: number;
  transitTimeDays: number;
  operationalStatus: string;
  shipmentCostUsd: number;
  shipmentPlanned: string;
  equipment: string;
  equipmentWeightCapacityKg: number;
  equipmentVolumeCapacityM3: number;
  totalVolumeShipmentM3: number;
  tenderedStatus: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate: string;
  delays: number;
  onTimeStatus: string;
  shipmentOrderType: string;
  route: string;
};

export type FilterState = {
  startDate: string;
  endDate: string;
  carrier: string;
  mode: string;
  productType: string;
  originRegion: string;
  originCountry: string;
  originState: string;
  originCity: string;
  destinationRegion: string;
  destinationCountry: string;
  destinationState: string;
  destinationCity: string;
  route: string;
  status: string;
  orderType: string;
};

export type AuthState = {
  isLoggedIn: boolean;
};

export const ShipmentsContext = createContext<{
  shipments: ShipmentRecord[];
  setShipments: (records: ShipmentRecord[]) => void;
} | null>(null);

export const FiltersContext = createContext<{
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
} | null>(null);

export const AuthContext = createContext<{
  auth: AuthState;
  authReady: boolean;
  setAuth: (auth: AuthState) => void;
} | null>(null);

export function useShipments() {
  const ctx = useContext(ShipmentsContext);
  if (!ctx) {
    throw new Error("useShipments must be used within Providers");
  }
  return ctx;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters must be used within Providers");
  }
  return ctx;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within Providers");
  }
  return ctx;
}
