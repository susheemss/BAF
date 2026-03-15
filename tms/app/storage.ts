"use client";

import { ShipmentRecord } from "./stores";

const STORAGE_KEY = "tmss_shipments";
const AUTH_KEY = "tmss_auth";
const FILTERS_KEY = "tmss_filters";

export function loadStoredShipments(): ShipmentRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ShipmentRecord[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return [];
  }
  return [];
}

export function persistShipments(records: ShipmentRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadStoredFilters<T>(fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(FILTERS_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export function persistFilters<T>(filters: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

export function loadAuthState() {
  if (typeof window === "undefined") {
    return { isLoggedIn: false };
  }
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return { isLoggedIn: false };
  }
  try {
    const parsed = JSON.parse(raw) as { isLoggedIn?: boolean };
    return { isLoggedIn: Boolean(parsed.isLoggedIn) };
  } catch {
    return { isLoggedIn: false };
  }
}

export function persistAuthState(isLoggedIn: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn }));
}
