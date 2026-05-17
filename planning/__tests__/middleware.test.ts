/**
 * Tests for Planning Hub auth middleware logic.
 * Validates that protected routes require app_session cookie
 * and public routes are accessible without it.
 */
import { describe, it, expect } from "vitest";

// ── Replicate middleware logic for isolated testing ────────────────────────────
const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/api"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function middlewareDecision(pathname: string, hasCookie: boolean): "allow" | "redirect" {
  if (isPublic(pathname)) return "allow";
  if (hasCookie) return "allow";
  return "redirect";
}

// ── Public paths ───────────────────────────────────────────────────────────────
describe("Middleware — public paths (no cookie required)", () => {
  it("allows /login without cookie", () => {
    expect(middlewareDecision("/login", false)).toBe("allow");
  });

  it("allows /_next/* without cookie", () => {
    expect(middlewareDecision("/_next/static/chunk.js", false)).toBe("allow");
  });

  it("allows /favicon.ico without cookie", () => {
    expect(middlewareDecision("/favicon.ico", false)).toBe("allow");
  });

  it("allows /api/* without cookie", () => {
    expect(middlewareDecision("/api/planning", false)).toBe("allow");
    expect(middlewareDecision("/api/alerts/check", false)).toBe("allow");
    expect(middlewareDecision("/api/tms/shipments", false)).toBe("allow");
  });
});

// ── Protected paths without cookie ────────────────────────────────────────────
describe("Middleware — protected paths redirect without cookie", () => {
  const protectedPaths = [
    "/dashboard",
    "/control-tower",
    "/demand",
    "/supply",
    "/data",
    "/wde/dashboard",
    "/wde/kpi-inbound-velocity",
    "/tms/dashboard",
    "/tms/kpis/cost",
    "/tms/alerts",
    "/tms/live-map",
  ];

  protectedPaths.forEach((path) => {
    it(`redirects ${path} without cookie`, () => {
      expect(middlewareDecision(path, false)).toBe("redirect");
    });
  });
});

// ── Protected paths with cookie ────────────────────────────────────────────────
describe("Middleware — protected paths allow with valid cookie", () => {
  const protectedPaths = [
    "/dashboard",
    "/wde/dashboard",
    "/tms/dashboard",
    "/data",
  ];

  protectedPaths.forEach((path) => {
    it(`allows ${path} with cookie`, () => {
      expect(middlewareDecision(path, true)).toBe("allow");
    });
  });
});
